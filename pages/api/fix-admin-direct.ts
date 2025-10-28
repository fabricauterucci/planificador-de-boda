import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase con la Service Role Key (SOLO PARA USO EN BACKEND)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // 1. Buscar el usuario por email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return res.status(500).json({ error: 'Error al listar usuarios', details: userError.message });
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // 2. Actualizar el rol en la tabla de users
    const { error: updateUserError } = await supabaseAdmin
      .from('users')
      .upsert({ 
        id: user.id,
        nombre: email.split('@')[0],
        rol: 'admin'
      }, { 
        onConflict: 'id'
      });
      
    if (updateUserError) {
      return res.status(500).json({ 
        error: 'Error al actualizar rol en la tabla users',
        details: updateUserError.message
      });
    }
    
    // 3. Actualizar el rol en la metadata del usuario
    const { error: updateMetaError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        app_metadata: { role: 'admin' },
        user_metadata: { role: 'admin' }
      }
    );
    
    if (updateMetaError) {
      return res.status(500).json({ 
        error: 'Error al actualizar metadatos',
        details: updateMetaError.message
      });
    }

    // Responder con éxito
    return res.status(200).json({ 
      success: true, 
      message: 'Rol admin actualizado correctamente para ' + email,
      userId: user.id
    });
  } catch (error: any) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ 
      error: 'Error inesperado', 
      details: error.message 
    });
  }
}
