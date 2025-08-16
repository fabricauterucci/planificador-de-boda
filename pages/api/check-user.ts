import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir solicitudes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', allowedMethod: 'GET' });
  }

  try {
    // 1. Buscar usuario específico por email
    const email = req.query.email as string || 'boda@boda.com';
    
    // 2. Buscar en auth por email
    let authUser = null;
    let authError = null;
    
    try {
      // Intentar buscar por email (esto no funciona directamente con la API cliente)
      // Esto es solo un ejemplo, en producción se debe usar la API de Admin de Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'invalid-password-just-for-check' // Esto fallará, pero es solo para demostración
      });
      
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // Si el error es de credenciales inválidas, significa que el usuario existe
        const { data, error } = await supabase.auth.getUser();
        authUser = data?.user;
        authError = error;
      } else {
        authError = { message: 'No se pudo verificar si el usuario existe' };
      }
    } catch (err: any) {
      authError = { message: err.message };
    }
    
    // 3. Buscar en tabla users
    const { data: appUser, error: appError } = await supabase
      .from('users')
      .select('*')
      .ilike('nombre', `%${email.split('@')[0]}%`)
      .maybeSingle();
      
    // 4. Buscar en RSVP si hay un usuario
    let rsvpData = null;
    let rsvpError = null;
    
    if (authUser?.id) {
      const rsvpResult = await supabase
        .from('rsvp')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
        
      rsvpData = rsvpResult.data;
      rsvpError = rsvpResult.error;
    }
    
    // 5. Retornar toda la información para diagnóstico
    return res.status(200).json({
      email,
      authUser: {
        data: authUser || null,
        error: authError ? { message: authError.message } : null
      },
      appUser: {
        data: appUser,
        error: appError ? { message: appError.message } : null
      },
      rsvp: {
        data: rsvpData,
        error: rsvpError ? { message: rsvpError.message } : null
      },
      dashboard: {
        issue: "El dashboard busca usuarios con rol='invitado' en la tabla users y los une con la tabla rsvp por user_id",
        possibleFix: "Asegúrate que el usuario existe en la tabla users con rol='invitado'"
      }
    });
    
  } catch (error: any) {
    console.error('Error en API de diagnóstico:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
