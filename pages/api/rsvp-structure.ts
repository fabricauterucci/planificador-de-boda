import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir solicitudes POST para crear pruebas o GET para verificar
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      // Intentar obtener un registro para verificar la estructura
      const { data: rsvpRecords, error: rsvpError } = await supabase
        .from('rsvp')
        .select('*')
        .limit(10);
      
      if (rsvpError) {
        return res.status(500).json({ 
          error: 'Error accediendo a la tabla RSVP', 
          details: rsvpError,
          suggestion: 'Es posible que la tabla no exista o no tengas permisos para acceder'
        });
      }
      
      // Analizar la estructura basada en los datos obtenidos
      let tableStructure: ColumnInfo[] = [];
      if (rsvpRecords && rsvpRecords.length > 0) {
        const firstRecord = rsvpRecords[0];
        tableStructure = Object.keys(firstRecord).map(key => {
          const value = firstRecord[key];
          let dataType = typeof value;
          let pgType = 'text'; // Tipo PostgreSQL por defecto
          
          // Mapear tipo de datos JavaScript a PostgreSQL
          if (dataType === 'boolean') pgType = 'boolean';
          else if (dataType === 'number') pgType = 'numeric';
          else if (dataType === 'string') {
            if (key === 'id' && value.includes('-')) pgType = 'uuid';
            else if (value.includes('T') && value.includes('Z')) pgType = 'timestamp';
            else pgType = 'text';
          }
          else if (value === null) pgType = 'unknown (null)';
          
          return {
            column_name: key,
            data_type: pgType,
            is_nullable: 'unknown',
            column_default: null
          };
        });
      }
      
      return res.status(200).json({
        tableExists: true,
        tableStructure,
        sampleRecords: rsvpRecords,
        apiNote: 'Los tipos de datos son una aproximación basada en los valores de los registros'
      });
    } else if (req.method === 'POST') {
      // Crear un registro de prueba
      const testData = req.body.data || {
        asistencia: 'asistire',
        menu: 'Menú Test API',
        comentario: 'Creado por API de debug ' + new Date().toISOString()
      };
      
      // Obtener el usuario actual o usar un ID proporcionado
      const userId = req.body.userId || (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'Se requiere ID de usuario' });
      }

      // Para propósitos de diagnóstico, verificamos las políticas RLS
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'rsvp')
        .limit(10);

      const hasRlsPolicies = policies && policies.length > 0;
      
      // Comprobar si ya existe un RSVP para este usuario
      const { data: existingRsvp, error: checkError } = await supabase
        .from('rsvp')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      let result;
      
      try {
        if (existingRsvp) {
          // Actualizar RSVP existente
          result = await supabase
            .from('rsvp')
            .update({
              ...testData,
              user_id: userId
            })
            .eq('user_id', userId);
        } else {
          // Insertar nuevo RSVP
          result = await supabase
            .from('rsvp')
            .insert({
              ...testData,
              user_id: userId
            });
        }
        
        if (result.error) {
          // Si hay un error RLS, intentamos con función RPC que bypass RLS
          if (result.error.code === '42501' || result.error.message?.includes('violates row-level security')) {
            // Intentar bypass de RLS con función RPC si está disponible
            return res.status(500).json({ 
              error: 'Error de seguridad RLS', 
              details: result.error,
              message: 'El test falló debido a políticas de seguridad de fila (RLS). Necesitas ajustar las políticas RLS para la tabla o añadir una política que permita insertar registros de prueba.',
              rlsInfo: {
                hasPolicies: hasRlsPolicies,
                policies: policies || []
              },
              requestData: { ...testData, user_id: userId }
            });
          }
          
          return res.status(500).json({ 
            error: 'Error guardando RSVP', 
            details: result.error,
            requestData: { ...testData, user_id: userId }
          });
        }
      } catch (insertError: any) {
        return res.status(500).json({
          error: 'Error inesperado al guardar RSVP',
          details: insertError,
          message: insertError.message,
          requestData: { ...testData, user_id: userId }
        });
      }
      
      // Verificar que se guardó correctamente
      const { data: verification, error: verificationError } = await supabase
        .from('rsvp')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      return res.status(200).json({
        success: true,
        operation: existingRsvp ? 'update' : 'insert',
        result: result.data,
        verification: verification ? verification[0] : null,
        verificationError,
        message: 'RSVP guardado correctamente. Hay múltiples registros para este usuario.',
        allRecords: (await supabase.from('rsvp').select('*').eq('user_id', userId)).data
      });
    }
  } catch (error: any) {
    console.error('Error en API de RSVP Debug:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
