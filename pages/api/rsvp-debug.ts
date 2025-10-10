import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir solicitudes POST para debug
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethod: 'POST' });
  }

  try {
    // 1. Obtenemos los datos de la solicitud
    const { token, rsvpData } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token de autenticación requerido' });
    }
    
    // 2. Verificamos la autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ 
        error: 'Error de autenticación', 
        details: authError?.message || 'Usuario no encontrado',
        authError
      });
    }
    
    // 3. Verificamos la tabla RSVP
    const { data: tableInfo, error: tableError } = await supabase
      .from('rsvp')
      .select('*')
      .limit(1);
    
    const tableStatus = tableError 
      ? { exists: false, error: tableError.message } 
      : { exists: true, sampleData: tableInfo };
      
    // 4. Realizamos la operación de inserción/actualización de prueba
    let operationResult = null;
    let operationError = null;
    
    if (rsvpData) {
      const dataWithUserId = {
        ...rsvpData,
        user_id: user.id
      };
      
      // Verificamos si ya existe un RSVP para este usuario
      const { data: existingRsvp, error: checkError } = await supabase
        .from('rsvp')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        operationError = {
          stage: 'check_existing',
          error: checkError
        };
      } else {
        // Si existe, actualizamos; si no, insertamos
        if (existingRsvp) {
          const { data, error } = await supabase
            .from('rsvp')
            .update(dataWithUserId)
            .eq('user_id', user.id);
            
          operationResult = data;
          operationError = error;
        } else {
          const { data, error } = await supabase
            .from('rsvp')
            .insert(dataWithUserId);
            
          operationResult = data;
          operationError = error;
        }
      }
    }
    
    // 5. Devolvemos el resultado completo para diagnóstico
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role
      },
      tableStatus,
      operation: rsvpData ? {
        type: 'test_rsvp',
        data: rsvpData,
        result: operationResult,
        error: operationError
      } : null,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error: any) {
    console.error('Error en API de debug RSVP:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
