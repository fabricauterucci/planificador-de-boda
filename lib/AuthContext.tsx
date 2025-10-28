import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface AuthContextType {
  token: string | null;
  role: string | null;
  authLoading: boolean;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  authLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Función para sincronizar el estado de autenticación con Supabase
  async function syncAuthState() {
    try {
      // 1. Intentar obtener la sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // Si no hay sesión o hay error, limpiar estado
      if (!session) {
        setToken(null);
        setRole(null);
        localStorage.clear();
        return;
      }
      
      // 2. Verificar que el usuario existe en la tabla users
      const { data: userExists, error: userExistsError } = await supabase
        .from('users')
        .select('rol')
        .eq('id', session.user.id)
        .single();
      
      // Si el usuario no existe en la tabla users (fue eliminado), cerrar sesión
      if (userExistsError || !userExists) {
        await supabase.auth.signOut();
        setToken(null);
        setRole(null);
        localStorage.clear();
        return;
      }
      
      // Tenemos sesión y usuario válido, actualizar token
      setToken(session.access_token);
      
      // Obtener rol del localStorage primero
      const storedRole = localStorage.getItem('role');
      if (storedRole && storedRole === userExists.rol) {
        setRole(storedRole);
        return;
      }
      
      // Usar el rol de la base de datos como fuente de verdad
      const userRole = userExists.rol || 'invitado';
      setRole(userRole);
      localStorage.setItem('role', userRole);
      
    } catch (error) {
      console.error('Error en syncAuthState:', error);
      await supabase.auth.signOut();
      setToken(null);
      setRole(null);
      localStorage.clear();
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    
    // Al cargar, sincronizar con Supabase
    syncAuthState();
    
    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setToken(session.access_token);
            
            // Actualizar rol solo si es necesario
            const currentRole = localStorage.getItem('role');
            if (!currentRole) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                let userRole = user.user_metadata?.role || 'invitado';
                setRole(userRole);
                localStorage.setItem('role', userRole);
              }
            }
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setToken(null);
          setRole(null);
          localStorage.clear();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = (token: string, role: string) => {
    setToken(token);
    setRole(role);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    console.log("Login: Token y rol establecidos", { token: token ? "existe" : "no existe", role });
  };

  const logout = async () => {
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    // Limpiar estado local
    setToken(null);
    setRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    console.log("Logout: Token y rol eliminados");
  };

  return (
    <AuthContext.Provider value={{ token, role, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
