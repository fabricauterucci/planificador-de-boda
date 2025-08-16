import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autorización - solo admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'prometidos');
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Intentar obtener las políticas RLS de la tabla rsvp
    // Nota: esto solo funciona con permisos admin en Supabase
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_info', {
      table_name: 'rsvp'
    });

    if (policiesError) {
      // Alternativa sin permisos admin
      return res.status(200).json({
        message: 'No se pudieron obtener las políticas RLS directamente',
        error: policiesError,
        manual_check: true,
        instructions: `
          Para verificar las políticas RLS manualmente:
          1. Ve al dashboard de Supabase
          2. Navega a la tabla rsvp en el Editor de bases de datos
          3. Haz clic en "Políticas RLS" para ver las políticas actuales
        `
      });
    }

    // Obtener algunos registros de prueba para diagnóstico
    const { data: testRecords, error: recordsError } = await supabase
      .from('rsvp')
      .select('*')
      .limit(5);

    return res.status(200).json({
      policies,
      testRecords,
      hasRlsEnabled: true,
      userInfo: {
        id: user.id,
        email: user.email,
        roles: userRoles?.map(r => r.role) || []
      }
    });
  } catch (error: any) {
    console.error('Error en API de políticas RLS:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
