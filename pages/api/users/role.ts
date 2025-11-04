import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, newRole } = req.body;

  if (!userId || !newRole) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Verificar el token de autenticación
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Verificar si el usuario es admin
    const { data: roleData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Requires admin role' });
    }

    // Actualizar el rol del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating user role', error: updateError.message });
    }

    return res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
}
