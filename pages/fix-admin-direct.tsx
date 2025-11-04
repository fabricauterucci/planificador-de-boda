import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';

export default function FixAdminDirect() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function fixAdminDirectly() {
    setStatus('loading');
    setMessage('Verificando usuario actual...');
    
    try {
      // Verificar el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        setStatus('error');
        setMessage('No hay usuario autenticado o falta email. Por favor, inicie sesión primero.');
        return;
      }
      
      setMessage(`Usuario encontrado: ${user.email}. Actualizando rol a 'admin' directamente...`);
      
      // Llamar a nuestro nuevo endpoint simplificado
      const response = await fetch('/api/fix-admin-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Error desconocido');
      }
      
      // Actualizar también el rol en localStorage para uso inmediato
      localStorage.setItem('role', 'admin');
      
      setStatus('success');
      setMessage('¡Usuario configurado correctamente como admin! Para que todos los cambios surtan efecto completamente, debes cerrar sesión y volver a iniciar sesión.');
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
        <h1 className="font-display text-2xl mb-6">Solución Directa para Permisos Admin</h1>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <p className="mb-4">Esta herramienta actualizará directamente tu usuario para tener permisos de administrador, solucionando el problema "No autorizado".</p>
          
          {status === 'idle' && (
            <button 
              onClick={fixAdminDirectly}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Solucionar Permisos Admin
            </button>
          )}
          
          {status === 'loading' && (
            <div>
              <p className="mb-2">Procesando...</p>
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-green-600">
              <p className="font-bold mb-2">¡Éxito!</p>
              <p>{message}</p>
              <div className="mt-4 flex gap-4">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Ir al Dashboard
                </button>
                <button 
                  onClick={() => {
                    // Cerrar sesión y redireccionar a login
                    supabase.auth.signOut().then(() => {
                      router.push('/login');
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cerrar sesión
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
        </div>
      </main>
    </>
  );
}
