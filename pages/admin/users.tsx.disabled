import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { actualizarRol } from '../../lib/roleUtils';
import Navbar from '../../components/Navbar';

export default function UsersPage() {
  const { role, authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        
        // Intentamos con la consulta directa primero
        let { data, error } = await supabase
          .from('users')
          .select('*');
          
        if (error) {
          console.error("Error al cargar usuarios:", error);
          setError(error.message);
          setUsers([]); // Establecemos un array vacío en caso de error
        } else {
          setUsers(data || []);
        }
      } catch (err: any) {
        console.error("Error al cargar usuarios:", err);
        setError(err.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  async function updateUserRole(userId: string, newRole: string) {
    try {
      // Usar la nueva función de utilidad
      const { success, error } = await actualizarRol(userId, newRole);
      
      if (!success) {
        throw new Error(error);
      }
      
      // Actualizar la lista de usuarios
      setUsers(users.map(user => 
        user.id === userId ? { ...user, rol: newRole } : user
      ));
      
      alert(`Rol actualizado para el usuario ${userId}`);
    } catch (err: any) {
      console.error("Error al actualizar rol:", err);
      alert(`Error al actualizar rol: ${err.message}. Usa la herramienta "Arreglar Políticas de Seguridad" para resolver este problema.`);
    }
  }
  
  if (authLoading) return <div>Cargando...</div>;
  
  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Gestión de Usuarios</h1>
        
        {/* Botón para arreglar políticas */}
        <div className="mb-6">
          <a href="/admin/fix-policies" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-block">
            Arreglar Políticas de Seguridad
          </a>
          <p className="mt-2 text-sm text-gray-600">Si ves errores de "infinite recursion" en políticas, usa esta herramienta para corregirlos.</p>
        </div>
        
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-dusk text-white">
                  <th className="p-2">ID</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Rol</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2">{user.id}</td>
                    <td className="p-2">{user.nombre || '-'}</td>
                    <td className="p-2">{user.rol || '-'}</td>
                    <td className="p-2">
                      <select 
                        value={user.rol || 'invitado'}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="p-1 border rounded mr-2"
                      >
                        <option value="invitado">Invitado</option>
                        <option value="admin">Admin</option>
                        <option value="prometidos">Prometidos</option>
                      </select>
                      <button 
                        onClick={() => updateUserRole(user.id, user.rol === 'admin' ? 'invitado' : 'admin')}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                      >
                        {user.rol === 'admin' ? 'Quitar Admin' : 'Hacer Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center">No hay usuarios registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
