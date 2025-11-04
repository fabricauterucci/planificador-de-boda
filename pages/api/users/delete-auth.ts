import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'

// Create a single supabase client for the admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Método recibido:', req.method);
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' })
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Se requiere un userId válido' })
  }

  try {
    // Verificar que el solicitante es un admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('Error de autenticación:', authError)
      return res.status(401).json({ error: 'Error de autenticación', details: authError })
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado en la verificación' })
    }

    // Verificar que el solicitante es admin en la tabla users
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (adminError) {
      console.error('Error al verificar rol de admin:', adminError)
      return res.status(500).json({ error: 'Error al verificar permisos de administrador', details: adminError })
    }

    if (adminData?.rol !== 'admin') {
      return res.status(403).json({ error: 'Se requieren privilegios de administrador' })
    }

    // Verificar que el usuario a eliminar existe
    const { data: userToDelete, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userCheckError) {
      console.error('Error al verificar usuario a eliminar:', userCheckError)
      return res.status(404).json({ error: 'Usuario a eliminar no encontrado', details: userCheckError })
    }

    // Eliminar el usuario de la autenticación
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error al eliminar usuario:', deleteError)
      return res.status(500).json({ error: 'Error al eliminar usuario', details: deleteError })
    }

    return res.status(200).json({ message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return res.status(500).json({ error: error.message })
  }
}
