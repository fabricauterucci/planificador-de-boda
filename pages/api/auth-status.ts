import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar estado de autenticación
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return res.status(500).json({ 
        error: 'Error obteniendo sesión', 
        details: sessionError 
      });
    }

    if (!session) {
      return res.status(200).json({
        authenticated: false,
        message: 'No hay sesión activa',
        authSessionType: 'missing'
      });
    }

    // Obtener información del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(200).json({
        authenticated: false,
        message: 'No se pudo obtener información del usuario',
        session: session ? { exists: true } : null,
        error: userError
      });
    }

    // Verificar rol en tabla users
    const { data: userInfo, error: userInfoError } = await supabase
      .from('users')
      .select('id, nombre, rol')
      .eq('id', user.id)
      .single();

    // Verificar RSVP existente
    const { data: rsvpInfo, error: rsvpError } = await supabase
      .from('rsvp')
      .select('id, asistencia, menu')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata,
      },
      appUser: userInfo || null,
      userError: userInfoError ? userInfoError.message : null,
      rsvp: rsvpInfo && rsvpInfo.length > 0 ? rsvpInfo[0] : null,
      rsvpError: rsvpError ? rsvpError.message : null,
      authSessionType: 'valid'
    });
  } catch (error: any) {
    console.error('Error en API de verificación de sesión:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
