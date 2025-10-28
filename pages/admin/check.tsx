import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function AdminCheck() {
  const { token, role, authLoading } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [adminFixScript, setAdminFixScript] = useState('');
  
  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;
      
      setLoading(true);
      try {
        // Verificar sesión y usuario
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!session || !user) {
          setUserInfo({ error: "No hay sesión activa" });
          setLoading(false);
          return;
        }
        
        // Consultar tabla users
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        // Recopilar toda la información
        setUserInfo({
          session: {
            exists: true,
            accessToken: session.access_token ? "✅ Presente" : "❌ Ausente",
            expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
          },
          user: {
            id: user.id,
            email: user.email,
            metadata: user.user_metadata,
          },
          dbUser: userRecord || null,
          contextRole: role,
          dbError: userError ? userError.message : null
        });
        
        // Generar script SQL para arreglar admin
        if (user && user.id) {
          const sql = `
-- Ejecuta este script en Supabase SQL Editor para hacer admin a este usuario
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Intentar actualizar el usuario existente
UPDATE users 
SET rol = 'admin' 
WHERE id = '${user.id}';

-- Si no existe, crear el usuario
INSERT INTO users (id, nombre, rol)
SELECT 
  '${user.id}'::uuid,
  '${user.email?.split('@')[0] || 'Admin'}',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE id = '${user.id}'::uuid
);

-- Habilitar RLS nuevamente
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;

-- Verificar que se aplicó el cambio
SELECT * FROM users WHERE id = '${user.id}'::uuid;
          `;
          
          setAdminFixScript(sql);
        }
      } catch (error: any) {
        setUserInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    checkAdmin();
  }, [authLoading, role]);
  
  async function makeAdmin() {
    if (!userInfo?.user?.id) {
      alert('No hay usuario autenticado');
      return;
    }
    
    setFixing(true);
    try {
      // Primero, probar usando servicio API directo para saltar RLS
      try {
        const response = await fetch('/api/make-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userInfo.user.id }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('¡Rol actualizado a admin con éxito a través de la API! Por favor, recarga la página.');
          window.location.reload();
          return;
        }
      } catch (apiError) {
        console.error('Error con la API, intentando directamente con Supabase:', apiError);
      }
      
      // Intentar directamente con Supabase (puede fallar por RLS)
      const { error: updateError } = await supabase
        .from('users')
        .update({ rol: 'admin' })
        .eq('id', userInfo.user.id);
        
      if (updateError) {
        alert(`Error actualizando rol: ${updateError.message}\n\nPrueba usando el script SQL mostrado en la página.`);
      } else {
        alert('¡Rol actualizado a admin con éxito! Por favor, recarga la página.');
        window.location.reload();
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setFixing(false);
    }
  }
  
  // Función para copiar el script SQL al portapapeles
  function copyScript() {
    navigator.clipboard.writeText(adminFixScript)
      .then(() => alert('Script SQL copiado al portapapeles'))
      .catch(err => alert('Error al copiar: ' + err));
  }
  
  if (loading || authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 p-6 flex items-center justify-center">
          <div className="w-full max-w-2xl p-4 bg-white shadow rounded-xl">
            <h1 className="text-2xl font-bold mb-4">Verificando permisos...</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dusk"></div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl p-4 bg-white shadow rounded-xl">
          <h1 className="text-2xl font-bold mb-4">Verificación de Permisos Admin</h1>
          
          {userInfo?.error ? (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">
              <p className="font-bold">Error:</p>
              <p>{userInfo.error}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                <h2 className="font-bold mb-2">Estado de Autenticación:</h2>
                <p>Rol en Contexto: <span className="font-mono">{role || 'ninguno'}</span></p>
                <p>Token: {token ? '✅ Presente' : '❌ Ausente'}</p>
                {userInfo?.session && (
                  <div className="mt-2">
                    <p>Sesión: {userInfo.session.exists ? '✅ Activa' : '❌ Inactiva'}</p>
                    <p>Access Token: {userInfo.session.accessToken}</p>
                    <p>Expira: {userInfo.session.expiresAt}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <h2 className="font-bold mb-2">Usuario en Auth:</h2>
                  {userInfo?.user ? (
                    <>
                      <p>Email: {userInfo.user.email}</p>
                      <p>ID: <span className="font-mono text-xs">{userInfo.user.id}</span></p>
                      <p className="mt-2">Metadata:</p>
                      <pre className="bg-white p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(userInfo.user.metadata, null, 2)}
                      </pre>
                    </>
                  ) : (
                    <p>No hay información de usuario</p>
                  )}
                </div>
                
                <div className="p-4 bg-green-100 rounded-lg">
                  <h2 className="font-bold mb-2">Usuario en Base de Datos:</h2>
                  {userInfo?.dbUser ? (
                    <>
                      <p>Nombre: {userInfo.dbUser.nombre}</p>
                      <p>Rol: <span className="font-bold">{userInfo.dbUser.rol}</span></p>
                      <p>ID: <span className="font-mono text-xs">{userInfo.dbUser.id}</span></p>
                      <pre className="bg-white p-2 rounded text-xs overflow-auto mt-2">
                        {JSON.stringify(userInfo.dbUser, null, 2)}
                      </pre>
                    </>
                  ) : (
                    <div>
                      <p className="text-red-600">⚠️ Usuario no encontrado en la base de datos</p>
                      {userInfo?.dbError && (
                        <p className="text-sm text-red-600 mt-1">{userInfo.dbError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Instrucciones para arreglar admin */}
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h2 className="font-bold mb-2">¿Cómo arreglar permisos de Admin?</h2>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Intenta primero el botón "Hacer Admin" a continuación</li>
                  <li>Si no funciona, copia el script SQL y ejecútalo en Supabase</li>
                  <li>Para acceder a Supabase SQL Editor: Database → SQL Editor</li>
                  <li>Pega el script y haz clic en "Run"</li>
                  <li>Regresa a esta página y recárgala para verificar</li>
                </ol>
              </div>
              
              {/* Script SQL para arreglar admin */}
              {adminFixScript && (
                <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold">Script SQL para hacer admin:</h2>
                    <button 
                      onClick={copyScript}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
                    >
                      Copiar Script
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto">
                    {adminFixScript}
                  </pre>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={makeAdmin}
                  disabled={fixing}
                  className="px-4 py-2 bg-dusk text-white rounded hover:bg-dusk/80 disabled:bg-gray-400"
                >
                  {fixing ? 'Aplicando cambios...' : 'Hacer Admin'}
                </button>
                
                <Link href="/admin/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Dashboard Admin
                </Link>
                
                <Link href="/auth-check" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Verificar Auth
                </Link>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Recargar Página
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
