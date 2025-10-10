// Prueba simple para verificar la service role key
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export default async function handler(req, res) {
  try {
    // Prueba simple: obtener información del proyecto
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1)
    
    if (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Service role key funciona correctamente',
      hasAccess: true
    })
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
