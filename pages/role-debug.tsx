import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function RoleDebug() {
  const [loading, setLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [roleFromStorage, setRoleFromStorage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // 1. Obtener datos de localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        setRoleFromStorage(role);
        
        // 2. Obtener sesión actual de Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        // 3. Si hay usuario, verificar su rol en la base de datos
        let dbUser = null;
        let dbRole = null;
        
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          dbUser = userData;
          dbRole = userData?.rol;
        }
        
        // 4. Compilar toda la información
        setAuthInfo({
          localStorage: {
            token: token ? "Presente" : "Ausente",
            role
          },
          session: session,
          user: user,
          dbUser: dbUser,
          dbRole: dbRole
        });
      } catch (error) {
        console.error("Error obteniendo información:", error);
        setAuthInfo({ error });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [refreshing]);
  
  // Forzar sincronización del rol
  async function syncRole() {
    if (!authInfo?.user?.id) {
      alert("No hay usuario autenticado");
      return;
    }
    
    setRefreshing(true);
    try {
      // 1. Obtener rol de la base de datos
      const { data: dbUser } = await supabase
        .from('users')
        .select('rol')
        .eq('id', authInfo.user.id)
        .single();
      
      if (!dbUser) {
        alert("No se encontró el usuario en la base de datos");
        return;
      }
      
      // 2. Actualizar localStorage
      localStorage.setItem('role', dbUser.rol);
      alert(`Rol sincronizado: ${dbUser.rol}`);
      
      // 3. Recargar la página para actualizar contexto
      window.location.reload();
    } catch (error) {
      console.error("Error sincronizando rol:", error);
      alert("Error sincronizando rol");
    } finally {
      setRefreshing(false);
    }
  }
  
  // Reiniciar AuthContext
  function resetAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    alert("Datos de autenticación borrados de localStorage. Recomendamos cerrar sesión y volver a iniciar.");
    window.location.reload();
  }
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen p-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 pt-24 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Depuración de Roles y Permisos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Estado Local</h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>Token:</strong> {authInfo?.localStorage?.token}
              </p>
              <p>
                <strong>Rol en localStorage:</strong>{' '}
                <span className="font-mono bg-yellow-100 px-1">
                  {roleFromStorage || 'null'}
                </span>
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2">Rol en Base de Datos</h2>
            <div className="text-sm space-y-1">
              <p>
                <strong>Usuario ID:</strong>{' '}
                <span className="font-mono text-xs">
                  {authInfo?.user?.id || 'No autenticado'}
                </span>
              </p>
              <p>
                <strong>Rol en DB:</strong>{' '}
                <span className="font-mono bg-blue-100 px-1">
                  {authInfo?.dbRole || 'No encontrado'}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Usuario DB completo */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-2">Datos de Usuario en DB</h2>
          {authInfo?.dbUser ? (
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(authInfo.dbUser, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">No se encontró el usuario en la base de datos</p>
          )}
        </div>
        
        {/* Diagnóstico */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-2">Diagnóstico</h2>
          {roleFromStorage !== authInfo?.dbRole ? (
            <div className="bg-red-100 p-3 rounded text-sm">
              <p className="font-bold text-red-700">⚠️ Desincronización de Roles</p>
              <p>El rol en localStorage ({roleFromStorage || 'null'}) no coincide con el rol en la base de datos ({authInfo?.dbRole || 'null'}).</p>
              <p className="mt-2">Esto puede causar problemas de autorización. Usa el botón "Sincronizar Rol" para corregirlo.</p>
            </div>
          ) : (
            <div className="bg-green-100 p-3 rounded text-sm">
              <p className="font-bold text-green-700">✅ Roles Sincronizados</p>
              <p>El rol en localStorage coincide con el rol en la base de datos.</p>
            </div>
          )}
        </div>
        
        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={syncRole}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {refreshing ? 'Sincronizando...' : 'Sincronizar Rol'}
          </button>
          
          <button
            onClick={resetAuth}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reiniciar Autenticación
          </button>
          
          <Link 
            href="/admin/dashboard" 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Probar Dashboard
          </Link>
          
          <Link 
            href="/admin/check" 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Check Admin
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Refrescar Página
          </button>
        </div>
      </div>
    </>
  );
}
