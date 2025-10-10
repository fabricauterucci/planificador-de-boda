
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';

type Guest = { name: string; attending: boolean; menu: string };

function AdminDashboard({ guests }: { guests: Guest[] }) {
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string; name?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres hacer administrador a este usuario?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, newRole: 'admin' }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar el rol del usuario');
      }

      // Actualizar la lista de usuarios
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Error al cambiar el rol del usuario');
    } finally {
      setLoading(false);
    }
  };

  const totals = guests.reduce((acc, g) => {
    acc.total += 1;
    if (g.attending) acc.confirmed += 1;
    acc[g.menu] = (acc[g.menu] || 0) + 1;
    return acc;
  }, { total: 0, confirmed: 0 } as any);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar usuarios');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      // Actualizar la lista de usuarios
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Dashboard — admin</h1>
      <p className="opacity-80 mb-6">Estadísticas rápidas de RSVP y menú.</p>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-sm opacity-70">Invitados</div>
          <div className="text-3xl font-bold">{totals.total}</div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-sm opacity-70">Confirmados</div>
          <div className="text-3xl font-bold">{totals.confirmed}</div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-sm opacity-70">Menú (resumen)</div>
          <div className="text-sm mt-1">
            Clásico: {totals["Clasico Argentino"] || 0} · Veggie: {totals["Vegetariano"] || 0} · Vegano: {totals["Vegano"] || 0}
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Rol</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-mono text-sm text-gray-500">{user.id}</td>
                  <td className="py-2 px-4">
                    {user.role === 'prometido' ? 'Prometido/a' : 
                     user.role === 'invitado' ? 'Invitado/a' : 
                     user.role === 'admin' ? 'Administrador/a' : user.name}
                  </td>
                  <td className="py-2 px-4 capitalize">{user.role}</td>
                  <td className="py-2 px-4 space-x-2">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleMakeAdmin(user.id)}
                        disabled={loading}
                        className="px-3 py-1 rounded text-sm bg-gold text-white hover:bg-gold/90 transition-colors"
                      >
                        {loading ? 'Procesando...' : 'Hacer Admin'}
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading}
                        className="px-3 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        {loading ? 'Borrando...' : 'Borrar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PrometidoDashboard() {
  return (
    <div>
      <h1 className="font-display text-3xl mb-2">Panel de Prometido</h1>
      <p className="opacity-80 mb-6">Aquí puedes ver detalles del evento y confirmar cosas importantes.</p>
      {/* Agrega aquí funcionalidades específicas para prometido */}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { token, role, authLoading } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    
    // Redirigir a todos al nuevo dashboard en /admin/dashboard
    if (role === 'admin' || role === 'prometido') {
      router.replace('/admin/dashboard');
      return;
    }
    
    // Si no es admin ni prometido, redirigir a RSVP
    router.replace('/rsvp');
    return;
  }, [token, role, router, authLoading]);

  if (authLoading || !token) return <p>Cargando...</p>;

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <p>Redirigiendo al panel de control...</p>
    </div>
  );
}
