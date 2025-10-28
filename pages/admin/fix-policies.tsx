import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../../components/Navbar';

export default function FixDatabasePolicy() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sqlCode, setSqlCode] = useState('');

  async function generateFixScript() {
    setStatus('loading');
    setMessage('Generando script SQL para corregir las políticas...');
    
    try {
      // Generamos el SQL necesario para arreglar las políticas
      const sqlScript = `-- Este script corrige el error "infinite recursion detected in policy for relation users"
-- eliminando todas las políticas actuales y creando nuevas que no causan recursión

-- 1. Primero, desactivamos RLS temporalmente para poder trabajar sin restricciones
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos todas las políticas existentes para la tabla users
DROP POLICY IF EXISTS "Users are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users are editable by themselves." ON public.users;
DROP POLICY IF EXISTS "Users are editable by admins." ON public.users;
DROP POLICY IF EXISTS "Users are insertable by admins." ON public.users;
DROP POLICY IF EXISTS "Users are deletable by admins." ON public.users;
DROP POLICY IF EXISTS "Allow all users to view" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.users;
DROP POLICY IF EXISTS "Allow admin@boda.com to update any record" ON public.users;
DROP POLICY IF EXISTS "Allow insert for everyone" ON public.users;
DROP POLICY IF EXISTS "Allow admin@boda.com to delete any record" ON public.users;

-- 3. Creamos nuevas políticas que no causan recursión
-- IMPORTANTE: Estas políticas evitan el uso de subconsultas a la misma tabla

-- Política para permitir a todos ver todos los usuarios
CREATE POLICY "users_select_policy" 
ON public.users 
FOR SELECT 
USING (true);

-- Política para permitir a los usuarios editar sus propios datos
CREATE POLICY "users_update_self_policy" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Política para permitir a los administradores editar cualquier registro basado en email
CREATE POLICY "users_update_admin_policy" 
ON public.users 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'admin@boda.com');

-- Política para permitir a cualquiera insertar (necesario para el registro)
CREATE POLICY "users_insert_policy" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir a los administradores eliminar cualquier registro
CREATE POLICY "users_delete_admin_policy" 
ON public.users 
FOR DELETE 
USING (auth.jwt() ->> 'email' = 'admin@boda.com');

-- 4. Volvemos a activar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Nos aseguramos de que la tabla tenga los campos correctos
DO $$
BEGIN
  -- Verificar si existe la columna 'rol' y si no, crearla
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'rol'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rol text DEFAULT 'invitado';
  END IF;
  
  -- Verificar si existe la columna 'nombre' y si no, crearla
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'nombre'
  ) THEN
    ALTER TABLE public.users ADD COLUMN nombre text;
  END IF;
  
  -- Asegurarnos de que el ID sea la clave primaria
  IF NOT EXISTS (
    SELECT FROM pg_constraint
    WHERE conname = 'users_pkey'
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD PRIMARY KEY (id);
  END IF;
END
$$;`;
      
      setSqlCode(sqlScript);
      setStatus('success');
      setMessage('Script SQL generado exitosamente. Sigue las instrucciones a continuación para aplicarlo.');
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
      console.error('Error completo:', error);
    }
  }
  
  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Arreglar Políticas de Base de Datos</h1>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <h2 className="font-bold text-lg text-red-700 mb-2">Error detectado: Recursión infinita</h2>
            <p className="text-red-700">Se ha detectado un error de recursión infinita en las políticas de seguridad de la tabla "users". Este error ocurre cuando las políticas se referencian a sí mismas de manera circular.</p>
          </div>
          
          <p className="mb-4">Esta herramienta te ayudará a corregir el problema generando un script SQL que puedes ejecutar en Supabase.</p>
          
          {status === 'idle' && (
            <button 
              onClick={generateFixScript}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generar Script de Corrección
            </button>
          )}
          
          {status === 'loading' && (
            <div>
              <p className="mb-2">Procesando...</p>
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <p className="font-bold mb-2 text-green-600">¡Script generado correctamente!</p>
              <p className="mb-4">{message}</p>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">Instrucciones:</h3>
                <ol className="list-decimal ml-6 space-y-2">
                  <li>Copia el código SQL a continuación</li>
                  <li>Abre el <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Panel de Supabase</a> y ve a tu proyecto</li>
                  <li>Haz clic en "SQL Editor" en el menú lateral</li>
                  <li>Crea un nuevo query, pega el código y ejecútalo</li>
                  <li>Vuelve a esta aplicación y prueba la página de usuarios nuevamente</li>
                </ol>
              </div>
              
              <div className="mt-4">
                <h3 className="font-bold mb-2">Código SQL:</h3>
                <div className="relative">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(sqlCode);
                      alert('Código copiado al portapapeles');
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-gray-200 text-sm rounded hover:bg-gray-300"
                  >
                    Copiar
                  </button>
                  <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto text-xs max-h-80 overflow-y-auto">
                    {sqlCode}
                  </pre>
                </div>
              </div>
              
              <div className="mt-6">
                <a 
                  href="/admin/users"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block mr-4"
                >
                  Volver a Gestión de Usuarios
                </a>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 inline-block"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-600">
              <p className="font-bold mb-2">Error</p>
              <p>{message}</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold mb-2">Explicación detallada del error:</h3>
            <p className="mb-2">El error "infinite recursion detected in policy for relation 'users'" ocurre cuando una política de seguridad en Supabase hace referencia a sí misma de manera circular. Específicamente:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Cuando una política que controla el acceso a la tabla "users" incluye una condición que necesita consultar la misma tabla "users"</li>
              <li>Por ejemplo, si tienes una política que dice "un usuario puede editar registros si su rol es admin", pero para verificar el rol necesitas consultar la tabla users</li>
              <li>Esto crea un bucle infinito: para verificar si puede acceder a users, necesita acceder a users, lo que requiere verificar si puede acceder a users, y así sucesivamente</li>
            </ul>
            <p className="mt-2">La solución implementada evita esta recursión utilizando directamente atributos del token JWT (como el email) en lugar de consultar la tabla para verificar roles. De esta manera, la verificación de permisos no necesita consultar la tabla "users" y se rompe el ciclo.</p>
          </div>
        </div>
      </main>
    </>
  );
}
