import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DebugPage() {
  const router = useRouter();
  const { token, role, authLoading } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<{[key: string]: string}>({});
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Verificar acceso basado en rol
  useEffect(() => {
    // Esperar a que la autenticación esté completa
    if (!authLoading) {
      // Verificar si el usuario tiene permiso (admin o prometidos)
      const hasAccess = role === 'admin' || role === 'prometidos' || role === 'prometido';
      
      if (!token || !hasAccess) {
        // Redirigir a la página principal si no tiene acceso
        router.push('/');
      }
    }
  }, [authLoading, token, role, router]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Obtener datos de localStorage
    const lsData: {[key: string]: string} = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        lsData[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(lsData);
    
    // Obtener datos de Supabase
    async function fetchUserData() {
      try {
        const { data } = await supabase.auth.getUser();
        setSupabaseUser(data.user);
        
        if (data.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, []);
  
  async function forceRoleUpdate() {
    if (!supabaseUser) return;
    
    try {
      // Obtener rol actual de la tabla users
      const { data: profile } = await supabase
        .from('users')
        .select('rol')
        .eq('id', supabaseUser.id)
        .single();
        
      if (profile && profile.rol) {
        // Actualizar en AuthContext
        localStorage.setItem('role', profile.rol);
        alert(`Rol actualizado a: ${profile.rol}. Refresca la página para ver los cambios.`);
        window.location.reload();
      } else {
        alert('No se encontró un perfil con un rol definido');
      }
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      alert('Error al actualizar rol');
    }
  }
  
  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Depuración de Usuario</h1>
        
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Datos de Autenticación</h2>
          <div className="p-4 bg-white rounded-lg shadow">
            <p><strong>Token:</strong> {token ? 'Presente' : 'No disponible'}</p>
            <p><strong>Rol (AuthContext):</strong> {role || 'No definido'}</p>
            <p><strong>Estado de carga:</strong> {authLoading ? 'Cargando' : 'Completado'}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Datos de localStorage</h2>
          <div className="p-4 bg-white rounded-lg shadow">
            <div className="max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(localStorageData, null, 2)}</pre>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Usuario de Supabase</h2>
          <div className="p-4 bg-white rounded-lg shadow">
            {loading ? (
              <p>Cargando datos de usuario...</p>
            ) : supabaseUser ? (
              <div>
                <p><strong>ID:</strong> {supabaseUser.id}</p>
                <p><strong>Email:</strong> {supabaseUser.email}</p>
                <p><strong>Metadata:</strong></p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(supabaseUser.user_metadata, null, 2)}</pre>
              </div>
            ) : (
              <p>No hay sesión activa en Supabase</p>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Perfil en tabla 'users'</h2>
          <div className="p-4 bg-white rounded-lg shadow">
            {loading ? (
              <p>Cargando perfil...</p>
            ) : userProfile ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(userProfile, null, 2)}</pre>
            ) : (
              <p>No se encontró perfil en la tabla 'users'</p>
            )}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="font-bold text-xl mb-4">Acciones</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={forceRoleUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!supabaseUser}
            >
              Forzar actualización de rol
            </button>
            
            <Link href="/fix-admin" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center">
              Arreglar Rol Admin
            </Link>
            
            <Link href="/admin/fix-policies" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-center">
              Arreglar Políticas DB
            </Link>
            
            <Link href="/admin/create-admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center">
              Crear Admin
            </Link>
            
            <Link href="/actualizar-rol" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-center">
              API Roles
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
