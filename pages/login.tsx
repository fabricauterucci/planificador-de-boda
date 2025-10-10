
import { FormEvent, useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const { login: saveAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Verificar estado de autenticación al cargar
  useEffect(() => {
    // Removed auth check
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatus("");
    
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    
    try {
      // 1. Intentar iniciar sesión con Supabase Auth
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (loginError || !data.session) {
        setError(`Error de autenticación: ${loginError?.message || "Credenciales inválidas"}`);
        setLoading(false);
        return;
      }
      
      setStatus("Autenticación exitosa, obteniendo perfil...");
      console.log("Sesión creada:", data.session.access_token.substring(0, 10) + "...");
      
      // 2. Guardar la sesión en localStorage para Supabase
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: data.session
      }));
      
      // 3. Buscar o crear perfil de usuario
      let userRole = data.session.user.user_metadata?.role || 'invitado';
      let name = data.session.user.user_metadata?.name || '';
      
      // Buscar en tabla users
      const { data: perfil, error: perfilError } = await supabase
        .from('users')
        .select('rol, nombre')
        .eq('id', data.session.user.id)
        .single();
      
      if (perfilError && perfilError.code !== 'PGRST116') {
        console.error("Error buscando perfil:", perfilError);
      }
      
      if (perfil) {
        userRole = perfil.rol || userRole;
        name = perfil.nombre || name;
        console.log("Perfil encontrado:", { rol: userRole, nombre: name });
      } else {
        console.log("Creando perfil de usuario...");
        
        // Crear perfil si no existe
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: data.session.user.id,
            nombre: name || email.split('@')[0] || 'Usuario',
            rol: userRole
          });
        
        if (createError) {
          console.error("Error creando perfil:", createError);
        } else {
          console.log("Perfil creado exitosamente");
        }
      }
      
      // 4. Guardar en AuthContext
      saveAuth(data.session.access_token, userRole);
      
      // 5. Guardar datos en localStorage
      if (name) {
        localStorage.setItem('name', name);
      }
      if (data.session.user.email) {
        localStorage.setItem('email', data.session.user.email);
      }
      
      setStatus("Login exitoso, redirigiendo...");
      
      // 6. Verificar que la sesión se guardó correctamente
      const { data: { session: checkSession } } = await supabase.auth.getSession();
      console.log("Verificación de sesión:", checkSession ? "✅ Existe" : "❌ No existe");
      
      // 7. Redirigir a la página principal
      setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (err: any) {
      console.error("Error en proceso de login:", err);
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Eliminamos el useEffect de redirección automática

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Sofía & Franco</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-6 bg-blush/10 bg-[url('/texture.svg')] bg-repeat">
        <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
          <div className="bg-dusk text-white py-6 px-8">
            <h1 className="font-display text-3xl text-center">Iniciar Sesión</h1>
            <p className="text-center text-sm text-white/70 mt-2">Boda de Sofía & Franco</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input 
                  id="email"
                  name="email" 
                  type="email" 
                  placeholder="email@example.com" 
                  required 
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required 
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-gold text-dusk font-medium hover:bg-gold/90 transition-colors duration-200 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-dusk" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : 'Iniciar Sesión'}
            </button>
            
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {status && (
              <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                {status}
              </div>
            )}
            
            <div className="flex justify-end items-center">
              <a href="/register" className="text-sm text-gold hover:text-dusk transition-colors duration-200">
                ¿No tienes cuenta? Regístrate aquí
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
