import { useState } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    
    try {
      // 1. Registro en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'invitado',
            name,
          },
        },
      });
      
      if (signUpError || !data.user) {
        setError(signUpError?.message || "Error al registrar usuario");
        setLoading(false);
        return;
      }
      
      // 2. También crear el registro en la tabla users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          nombre: name || email.split('@')[0],
          rol: 'invitado'
        });
      
      if (insertError) {
        console.error("Error creando perfil en users:", insertError);
        // No bloqueamos por este error
      }
      
      // 3. Iniciar sesión inmediatamente
      if (data.session) {
        // Guardar sesión en localStorage para Supabase
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          currentSession: data.session
        }));
        
        console.log("Sesión creada automáticamente");
      }
      
      setSuccess(true);
      
      // 4. Redirigir a la página principal
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Registro - Sofía & Franco</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center p-6 bg-blush/10 bg-[url('/texture.svg')] bg-repeat">
        <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
          <div className="bg-dusk text-white py-6 px-8">
            <h1 className="font-display text-3xl text-center">Registro</h1>
            <p className="text-center text-sm text-white/70 mt-2">Boda de Sofía & Franco</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 bg-white space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  name="name"
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  name="password"
                  type="password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">La contraseña debe tener al menos 6 caracteres</p>
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
                  Registrando...
                </>
              ) : 'Crear Cuenta'}
            </button>
            
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                Registro exitoso. Redirigiendo...
              </div>
            )}
            
            <div className="flex justify-center items-center">
              <a href="/login" className="text-sm text-gold hover:text-dusk transition-colors duration-200">
                ¿Ya tienes cuenta? Inicia sesión aquí
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
