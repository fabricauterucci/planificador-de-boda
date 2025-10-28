import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function CreateAdmin() {
  const { role, authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [existingUsers, setExistingUsers] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;
        
        // Si la API admin está disponible
        setExistingUsers(data.users || []);
      } catch (adminError) {
        console.log("No se pudo usar admin API, intentando consulta normal");
        try {
          // Intentar obtener usuarios de la tabla users
          const { data, error } = await supabase
            .from('users')
            .select('*');
          
          if (error) throw error;
          setExistingUsers(data || []);
        } catch (queryError: any) {
          console.error("Error al cargar usuarios:", queryError);
        }
      }
    }
    
    loadUsers();
  }, []);

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('Creando cuenta de administrador...');
    
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'admin' // Este rol va en los metadatos
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }
      
      // 2. Crear registro en la tabla users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nombre: name,
          rol: 'admin',
          email: email
        });
      
      if (insertError) {
        console.warn("Error al insertar en tabla users:", insertError);
        setMessage('Usuario creado en Auth pero hubo un problema al insertar en la tabla users. Puedes arreglar esto después.');
      }
      
      setStatus('success');
      setMessage(`¡Usuario administrador creado exitosamente! ID: ${authData.user.id}`);
      
      // Limpiar formulario
      setEmail('');
      setPassword('');
      setName('');
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
        <h1 className="font-display text-2xl mb-6">Crear Usuario Administrador</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="font-bold text-xl mb-4">Crear nuevo administrador</h2>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre:</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email:</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña:</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded" 
                  required
                />
              </div>
              
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {status === 'loading' ? 'Creando...' : 'Crear Administrador'}
              </button>
              
              {status === 'success' && (
                <div className="p-2 bg-green-100 border border-green-300 rounded text-green-700">
                  {message}
                </div>
              )}
              
              {status === 'error' && (
                <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700">
                  {message}
                </div>
              )}
            </form>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="font-bold text-xl mb-4">Usuarios Existentes</h2>
            
            {existingUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Nombre/Email</th>
                      <th className="p-2 text-left">Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingUsers.map((user: any) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">
                          {user.user_metadata?.name || user.nombre || 'Sin nombre'}<br/>
                          <span className="text-xs text-gray-500">{user.email}</span>
                        </td>
                        <td className="p-2">
                          {user.user_metadata?.role || user.rol || 'Sin rol'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No se encontraron usuarios</p>
            )}
            
            <div className="mt-4">
              <Link href="/admin/fix-policies" className="text-blue-600 underline">
                Arreglar políticas de seguridad
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4">Información adicional</h2>
          
          <div className="space-y-4">
            <p>Para resolver el problema de la recursión infinita en las políticas de seguridad:</p>
            
            <ol className="list-decimal ml-6 space-y-2">
              <li>Ve a la página <Link href="/admin/fix-policies" className="text-blue-600 underline">Arreglar Políticas</Link></li>
              <li>Sigue las instrucciones para aplicar el script SQL</li>
              <li>Una vez aplicado, podrás gestionar usuarios sin problemas</li>
            </ol>
            
            <p>Si necesitas configurar tu usuario actual como administrador:</p>
            
            <ol className="list-decimal ml-6 space-y-2">
              <li>Ve a la página <Link href="/fix-admin" className="text-blue-600 underline">Arreglar Rol Admin</Link></li>
              <li>Haz clic en "Configurar como Admin"</li>
              <li>Cierra sesión y vuelve a iniciarla</li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}
