import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function CheckUserPage() {
  const { role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('boda@boda.com');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<string | null>(null);
  
  // Redirigir si no es admin
  useEffect(() => {
    if (role !== 'admin' && role !== 'prometidos') {
      router.push('/login');
    }
  }, [role, router]);

  async function checkUser() {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/check-user?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar usuario');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function fixUserRecord() {
    setLoading(true);
    setFixResult(null);
    setError(null);
    
    try {
      // 1. Verificar si el usuario existe en auth
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .single();
        
      if (usersError) {
        if (usersError.code === 'PGRST116') {
          throw new Error(`No existe usuario en auth con email ${email}`);
        }
        throw usersError;
      }
      
      const userId = users.id;
      
      // 2. Verificar si existe en la tabla users
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // 3. Si no existe, crearlo
      if (!appUser) {
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            nombre: email.split('@')[0],
            rol: 'invitado'
          });
          
        if (insertError) throw insertError;
        
        setFixResult(`Usuario creado en tabla users con id ${userId} y rol 'invitado'`);
      } else {
        // 4. Si existe pero no tiene rol 'invitado', actualizarlo
        if (appUser.rol !== 'invitado') {
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ rol: 'invitado' })
            .eq('id', userId);
            
          if (updateError) throw updateError;
          
          setFixResult(`Usuario actualizado en tabla users con rol 'invitado'`);
        } else {
          setFixResult('El usuario ya existe en la tabla users con rol correcto');
        }
      }
      
      // 5. Recargar la información
      checkUser();
      
    } catch (err: any) {
      console.error('Error al corregir usuario:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (role !== 'admin' && role !== 'prometidos') {
    return <div className="p-8">Redirigiendo...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verificar Usuario</h1>
      
      <div className="mb-6">
        <Link href="/admin/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Volver al Dashboard
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="email"
            className="border rounded p-2 flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={checkUser}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {fixResult && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {fixResult}
          </div>
        )}
        
        {result && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Resultado:</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold">Usuario en Auth:</h3>
                {result.authUser.data ? (
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(result.authUser.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-600">No encontrado: {result.authUser.error?.message}</p>
                )}
              </div>
              
              <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold">Usuario en App:</h3>
                {result.appUser.data ? (
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(result.appUser.data, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-600">No encontrado: {result.appUser.error?.message}</p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded mb-4">
              <h3 className="font-bold">RSVP:</h3>
              {result.rsvp.data ? (
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result.rsvp.data, null, 2)}
                </pre>
              ) : (
                <p className="text-red-600">No encontrado: {result.rsvp.error?.message}</p>
              )}
            </div>
            
            <div className="bg-yellow-100 p-4 rounded border border-yellow-400">
              <h3 className="font-bold">Diagnóstico:</h3>
              <p>{result.dashboard.issue}</p>
              <p className="mt-2">{result.dashboard.possibleFix}</p>
              
              {!result.appUser.data || result.appUser.data.rol !== 'invitado' ? (
                <button
                  onClick={fixUserRecord}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Corrigiendo...' : 'Crear/Corregir registro de usuario'}
                </button>
              ) : (
                <p className="mt-2 text-green-600 font-semibold">
                  ✅ El usuario está configurado correctamente.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
