import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import Link from 'next/link';
import Navbar from '../components/Navbar';

interface DirectCheck {
  sessionExists: boolean;
  userExists: boolean;
  userId?: string;
  userEmail?: string;
}

interface AppUser {
  id: string;
  nombre: string;
  rol: string;
}

interface RSVP {
  asistencia?: string;
  menu?: string;
  comentario?: string;
}

interface AuthStatus {
  authenticated?: boolean;
  authSessionType?: string;
  user?: any;
  appUser?: AppUser | null;
  rsvp?: RSVP | null;
  error?: string;
  directCheck?: DirectCheck;
}

export default function AuthCheck() {
  const { token, role, authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        // Verificar sesión y usuario directamente desde Supabase
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user || null;

        // Actualizar estado con información básica
        setStatus({
          authenticated: !!user,
          authSessionType: sessionData?.session ? 'active' : 'missing',
          user: user || null,
          directCheck: {
            sessionExists: !!sessionData?.session,
            userExists: !!user,
            userId: user?.id,
            userEmail: user?.email,
          },
        });

        // Si hay sesión, intentar obtener datos de la tabla users y RSVP
        if (user) {
          try {
            const { data: appUser, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            
            // Mostrar error de debugging si es necesario
            if (userError) {
              console.error('Error al buscar usuario en tabla users:', userError);
            }

            // Buscar RSVP del usuario
            const { data: rsvpData, error: rsvpError } = await supabase
              .from('rsvp')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (rsvpError) {
              console.error('Error al buscar RSVP:', rsvpError);
            }

            // Actualizar el estado con la información obtenida
            setStatus(prev => ({
              ...prev!,
              appUser: appUser || null,
              rsvp: (rsvpData && rsvpData.length > 0) ? rsvpData[0] : null
            }));
          } catch (dbError: any) {
            console.error('Error al consultar la base de datos:', dbError);
            setStatus(prev => ({
              ...prev!,
              error: `Error de base de datos: ${dbError.message}`
            }));
          }
        }
      } catch (error: any) {
        console.error('Error verificando autenticación:', error);
        setStatus({ error: error.message });
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function sincronizarAuth() {
    if (!status?.directCheck?.userExists) {
      alert('No hay sesión activa. Debes iniciar sesión primero.');
      return;
    }

    setFixing(true);
    try {
      const userId = status.directCheck.userId!;
      const userEmail = status.directCheck.userEmail!;
      
      // Primero verificamos si el usuario ya existe
      const { data: userRecord, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (findError && findError.code !== 'PGRST116') {
        // Si hay un error distinto a "no se encontró registro"
        console.error('Error al buscar usuario:', findError);
        alert(`Error al buscar usuario: ${findError.message}`);
        setFixing(false);
        return;
      }

      if (!userRecord) {
        // El usuario no existe, lo creamos
        const nombre = status.user?.user_metadata?.name || 
                      status.user?.user_metadata?.full_name || 
                      userEmail.split('@')[0];
                      
        const { data: insertResult, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            nombre: nombre,
            rol: 'invitado',
          })
          .select();

        if (insertError) {
          console.error('Error creando usuario:', insertError);
          alert(`Error creando usuario: ${insertError.message}`);
        } else {
          alert('Usuario creado en la tabla users con éxito');
          // Actualizar estado local sin recargar
          setStatus(prev => prev ? {
            ...prev,
            appUser: insertResult && insertResult.length > 0 ? insertResult[0] : {
              id: userId,
              nombre: nombre,
              rol: 'invitado'
            }
          } : null);
        }
      } else {
        alert('El usuario ya existe en la tabla users');
        setStatus(prev => prev ? { ...prev, appUser: userRecord } : null);
      }
      
      // Volvemos a verificar el estado de autenticación para actualizar todo
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        // Buscar RSVP del usuario
        const { data: rsvpData } = await supabase
          .from('rsvp')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        // Actualizar el estado con la información más reciente de RSVP
        setStatus(prev => prev ? {
          ...prev,
          rsvp: (rsvpData && rsvpData.length > 0) ? rsvpData[0] : null
        } : null);
      }
    } catch (error: any) {
      console.error('Error sincronizando:', error);
      alert(`Error sincronizando: ${error.message}`);
    } finally {
      setFixing(false);
    }
  }
  
  if (loading || authLoading) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Verificando autenticación...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dusk"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-6 flex flex-col items-center justify-center pt-20">
        <div className="w-full max-w-4xl p-6 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Estado de Autenticación</h1>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Contexto de Auth</h2>
              <div className="text-sm">
                <p>Token: {token ? '✅ Presente' : '❌ No hay token'}</p>
                <p>Rol: {role || 'No definido'}</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Sesión en Supabase</h2>
              <div className="text-sm">
                <p>Autenticado: {status?.authenticated ? '✅ Sí' : '❌ No'}</p>
                <p>Tipo de sesión: {status?.authSessionType || 'Desconocido'}</p>
                {status?.directCheck && (
                  <>
                    <p>Sesión directa: {status.directCheck.sessionExists ? '✅ Existe' : '❌ No existe'}</p>
                    <p>Usuario directo: {status.directCheck.userExists ? '✅ Existe' : '❌ No existe'}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {status?.user && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Usuario en Auth</h2>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(status.user, null, 2)}
                </pre>
              </div>
            )}
            {status?.appUser && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Usuario en App</h2>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(status.appUser, null, 2)}
                </pre>
              </div>
            )}
            {status?.rsvp && (
              <div className="p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-2">RSVP Actual</h2>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(status.rsvp, null, 2)}
                </pre>
              </div>
            )}
            {status?.error && (
              <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-red-700">Error</h2>
                <pre className="bg-red-100 p-3 rounded text-xs overflow-auto text-red-800">
                  {JSON.stringify(status.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={sincronizarAuth}
              disabled={fixing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {fixing ? 'Sincronizando...' : 'Sincronizar Auth'}
            </button>

            <Link href="/login" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Ir al Login
            </Link>

            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                alert('Sesión cerrada');
                setStatus(null);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cerrar Sesión
            </button>

            <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
