import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Creamos un cliente de Supabase con los permisos de servicio para saltarse RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Solo aceptamos peticiones POST con un userId
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  try {
    // Verificar que el usuario existe en auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found in auth system',
        details: authError
      });
    }
    
    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: queryError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    let result;
    
    if (!existingUser) {
      // Si no existe, crearlo con rol admin
      result = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          nombre: authUser.user.email?.split('@')[0] || 'Admin',
          rol: 'admin'
        });
    } else {
      // Si existe, actualizarlo a rol admin
      result = await supabaseAdmin
        .from('users')
        .update({ rol: 'admin' })
        .eq('id', userId);
    }
    
    if (result.error) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update user role',
        details: result.error
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'User role updated to admin successfully'
    });
  } catch (error: any) {
    console.error('Error making user admin:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
}
