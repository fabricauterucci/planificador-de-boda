import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

// Cliente de Supabase con permisos de servicio para operaciones admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Validar método HTTP
    if (req.method !== 'DELETE') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // 2. Validar datos de entrada
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // 3. Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    // 4. Validar token y obtener usuario
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // 5. Verificar rol de admin
    const { data: roleData, error: roleError } = await supabase
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (roleError || !roleData || roleData.rol !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Requires admin role' });
    }

    // 6. Verificar que el usuario a eliminar no sea admin ni prometido
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('rol')
      .eq('id', userId)
      .single();

    if (targetUserError) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (targetUser.rol === 'admin' || targetUser.rol === 'prometido') {
      return res.status(403).json({ message: 'No se pueden eliminar usuarios admin o prometidos' });
    }

    // 6. Eliminar RSVP primero
    const { error: rsvpError } = await supabase
      .from('rsvp')
      .delete()
      .eq('user_id', userId);

    if (rsvpError) {
      console.error('Error deleting RSVP:', rsvpError);
      // Continuamos aunque falle el RSVP
    }

    // 7. Eliminar usuario de la tabla users
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userDeleteError) {
      console.error('Error deleting user from database:', userDeleteError);
      return res.status(500).json({ 
        message: 'Error deleting user from database', 
        error: userDeleteError.message 
      });
    }

    // 8. OPCIONAL: Eliminar usuario de auth (requiere service role)
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error('Error deleting user from auth (no crítico):', authDeleteError);
        // No fallar si esto no funciona, ya eliminamos de la tabla users
      } else {
        console.log('Usuario también eliminado de auth');
      }
    } catch (authError) {
      console.error('Error al intentar eliminar de auth (no crítico):', authError);
      // No fallar, el usuario ya está eliminado funcionalmente
    }

    // 9. Responder éxito
    return res.status(200).json({ 
      message: 'User deleted successfully',
      userId
    });

  } catch (error: any) {
    // 10. Manejo general de errores
    console.error('Unexpected error in delete user API:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message || 'Unknown error'
    });
  }
}
