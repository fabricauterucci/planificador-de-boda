import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase con la Service Role Key (SOLO PARA USO EN BACKEND)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cliente normal para verificaciones
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener token de autenticación del encabezado
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Verificar que el usuario que hace la solicitud es administrador
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Verificar si el usuario es admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.rol === 'admin' || user.email === 'admin@boda.com';
    if (!isAdmin) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }

    // Obtener datos del cuerpo de la solicitud
    const { userId, nuevoRol } = req.body;
    if (!userId || !nuevoRol) {
      return res.status(400).json({ error: 'Faltan datos requeridos (userId, nuevoRol)' });
    }

    // 1. Actualizar metadatos del usuario en auth usando el cliente admin
    try {
      const { data: authUpdateData, error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId, 
        { user_metadata: { role: nuevoRol } }
      );

      if (authUpdateError) {
        console.error('Error al actualizar metadata:', authUpdateError);
        return res.status(500).json({ 
          error: 'Error al actualizar metadatos del usuario',
          details: authUpdateError.message
        });
      }
      
      console.log('Metadata actualizada correctamente');
    } catch (adminError: any) {
      console.error('Error con API admin:', adminError);
      return res.status(500).json({ 
        error: 'Error al usar la API de administrador',
        details: adminError.message
      });
    }

    // 2. Actualizar rol en la tabla users usando el cliente admin
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ rol: nuevoRol })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ 
        error: 'Error al actualizar rol en la tabla users',
        details: updateError.message
      });
    }

    // Responder con éxito
    return res.status(200).json({ 
      success: true, 
      message: 'Rol actualizado correctamente',
      userId,
      nuevoRol
    });
  } catch (error: any) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ 
      error: 'Error inesperado', 
      details: error.message 
    });
  }
}
