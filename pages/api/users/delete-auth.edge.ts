import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  runtime: 'edge'
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const authHeader = req.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'Se requiere userId' }, { status: 400 })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar que el solicitante es un admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Error de autenticación', details: authError },
        { status: 401 }
      )
    }

    // Verificar que el solicitante es admin en la tabla users
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (adminError || adminData?.rol !== 'admin') {
      return NextResponse.json(
        { error: 'Se requieren privilegios de administrador' },
        { status: 403 }
      )
    }

    // Eliminar el usuario de auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Error al eliminar usuario', details: deleteError },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}
