import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Utilizamos las credenciales de servicio para eludir las restricciones de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Revisar si es GET o POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Modo GET: Obtener información de diagnóstico
    if (req.method === 'GET') {
      // 1. Contar usuarios por rol (usando un enfoque más compatible)
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('rol');
        
      // Agrupar manualmente
      const roleCounts = allUsers ? 
        Array.from(allUsers.reduce((acc, user) => {
          const count = acc.get(user.rol) || 0;
          acc.set(user.rol, count + 1);
          return acc;
        }, new Map())).map(([rol, count]) => ({ rol, count })) : [];

      if (usersError) {
        return res.status(500).json({ error: 'Error obteniendo usuarios', details: usersError });
      }

      // 2. Listar usuarios admin
      const { data: adminUsers, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id, nombre, rol')
        .eq('rol', 'admin');

      if (adminError) {
        return res.status(500).json({ error: 'Error obteniendo admins', details: adminError });
      }

      // 3. Verificar políticas RLS
      const rlsPolicies = await checkRLSPolicies();

      return res.status(200).json({
        roleCounts,
        adminUsers,
        rlsPolicies
      });
    }
    
    // Modo POST: Corregir problemas específicos
    if (req.method === 'POST') {
      const { action, userId, role } = req.body;
      
      // Acción: Forzar actualización de rol
      if (action === 'update_role' && userId && role) {
        const { data, error } = await supabaseAdmin
          .from('users')
          .update({ rol: role })
          .eq('id', userId);
          
        if (error) {
          return res.status(500).json({ success: false, error });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: `Usuario ${userId} actualizado a rol ${role}` 
        });
      }
      
      // Acción: Verificar y corregir RLS
      if (action === 'fix_rls') {
        try {
          // Deshabilitar RLS temporalmente
          await supabaseAdmin.rpc('disable_rls_for_table', { table_name: 'users' });
          
          // Recrear políticas
          await recreateRLSPolicies();
          
          // Habilitar RLS nuevamente
          await supabaseAdmin.rpc('enable_rls_for_table', { table_name: 'users' });
          
          return res.status(200).json({ 
            success: true, 
            message: 'Políticas RLS recreadas correctamente' 
          });
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            error: 'Error al corregir RLS',
            details: error
          });
        }
      }
      
      return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error en API de diagnóstico:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error });
  }
}

// Función para verificar políticas RLS
async function checkRLSPolicies() {
  try {
    // Consultar políticas RLS activas para la tabla users
    const { data, error } = await supabaseAdmin.rpc('get_policies_for_table', {
      table_name: 'users'
    });
    
    return {
      success: true,
      policies: data
    };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

// Función para recrear políticas RLS correctamente
async function recreateRLSPolicies() {
  // Eliminar políticas existentes
  await supabaseAdmin.rpc('drop_all_policies_for_table', { table_name: 'users' });
  
  // Crear nuevas políticas sin recursión
  const policies = [
    {
      name: "Users can view own data",
      action: "SELECT",
      definition: "auth.uid() = id"
    },
    {
      name: "Admins can view all data",
      action: "SELECT",
      definition: "(SELECT rol FROM users WHERE id = auth.uid()) = 'admin'"
    },
    {
      name: "Users can insert own data",
      action: "INSERT",
      definition: "auth.uid() = id"
    },
    {
      name: "Users can update own data",
      action: "UPDATE",
      definition: "auth.uid() = id"
    },
    {
      name: "Admins can update all data",
      action: "UPDATE",
      definition: "(SELECT rol FROM users WHERE id = auth.uid()) = 'admin'"
    }
  ];
  
  // Crear cada política
  for (const policy of policies) {
    await supabaseAdmin.rpc('create_policy_for_table', {
      table_name: 'users',
      policy_name: policy.name,
      action: policy.action,
      definition: policy.definition
    });
  }
  
  return true;
}

// Nota: Las funciones get_policies_for_table, drop_all_policies_for_table y create_policy_for_table
// son ficticias y deberían ser implementadas como funciones SQL en Supabase si son necesarias.
