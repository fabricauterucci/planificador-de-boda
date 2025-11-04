import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function QuickFix() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fixing, setFixing] = useState(false);
  
  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        // Verificar sesión
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!session || !user) {
          setLoading(false);
          return;
        }
        
        // Obtener datos de usuario
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        setUser({
          id: user.id,
          email: user.email,
          inDatabase: !!userData,
          role: userData?.rol || null
        });
      } catch (error) {
        console.error("Error verificando usuario:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  async function fixAdmin() {
    if (!user?.id) return;
    
    setFixing(true);
    try {
      // Intentar método 1: Directo con el cliente de Supabase del navegador
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ rol: 'admin' })
          .eq('id', user.id);
          
        if (!updateError) {
          localStorage.setItem('role', 'admin');
          alert("¡Rol actualizado con éxito! Refrescando...");
          router.reload();
          return;
        }
      } catch (err) {
        console.error("Error con método 1:", err);
      }
      
      // Intentar método 2: Usando la API con privilegios de servicio
      try {
        const response = await fetch('/api/make-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('role', 'admin');
          alert("¡Rol actualizado con éxito vía API! Refrescando...");
          router.reload();
          return;
        }
      } catch (err) {
        console.error("Error con método 2:", err);
      }
      
      // Si llegamos aquí, ambos métodos fallaron
      alert(`No se pudo actualizar el rol. Por favor, usa el script SQL en la página /admin/check`);
      
    } catch (error) {
      console.error("Error general:", error);
      alert("Error actualizando rol. Consulta la consola para más detalles.");
    } finally {
      setFixing(false);
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">No has iniciado sesión</h1>
        <p className="mb-4">Debes iniciar sesión para usar esta herramienta.</p>
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Ir al Login
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Solución Rápida de Permisos</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-bold mb-2">Información de Usuario:</h2>
          <p>Email: <span className="font-semibold">{user.email}</span></p>
          <p>ID: <span className="text-xs font-mono">{user.id}</span></p>
          <p>En Base de Datos: {user.inDatabase ? '✅' : '❌'}</p>
          <p>Rol Actual: <span className="font-semibold">{user.role || 'No definido'}</span></p>
        </div>
        
        <div className="mb-6">
          <h2 className="font-bold mb-2">Problema:</h2>
          <p>Si tienes problemas para acceder al panel de administración aunque ya tienes el rol "admin", puede haber una desincronización entre la base de datos y tu sesión local.</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={fixAdmin}
            disabled={fixing}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {fixing ? 'Aplicando solución...' : 'Solucionar Permisos Admin'}
          </button>
          
          <Link href="/role-debug" className="block w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center">
            Depuración Avanzada
          </Link>
          
          <Link href="/admin/dashboard" className="block w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center">
            Ir al Dashboard
          </Link>
          
          <button
            onClick={() => {
              localStorage.clear();
              supabase.auth.signOut();
              alert("Sesión cerrada y datos locales eliminados. Serás redirigido al login.");
              router.push('/login');
            }}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cerrar Sesión y Limpiar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
