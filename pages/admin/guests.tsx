import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';

interface Guest {
  email: string;
  name: string;
  attending: boolean;
  menu: string;
  allergies?: string;
}

export default function GuestsDashboard() {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Guest | null>(null);
  
  // Cargar invitados
  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener token del localStorage
      // Para usar este panel, primero debes hacer login en Postman o guardar el token:
      // localStorage.setItem('auth_token', 'tu_token_jwt_aqui')
      let token = localStorage.getItem('auth_token');
      
      // Si no hay token, intentar obtener de la sesión de Supabase
      if (!token) {
        const supabaseToken = localStorage.getItem('supabase.auth.token');
        if (supabaseToken) {
          try {
            const parsed = JSON.parse(supabaseToken);
            token = parsed.access_token || parsed.currentSession?.access_token;
          } catch (e) {
            console.error('Error parsing Supabase token', e);
          }
        }
      }
      
      if (!token) {
        setError('No hay token de autenticación. Por favor, haz login o ejecuta en la consola: localStorage.setItem("auth_token", "tu_token")');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/guests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar invitados');
      }

      const data = await response.json();
      setGuests(data.guests || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest.email);
    setEditForm({ ...guest });
  };

  const handleCancelEdit = () => {
    setEditingGuest(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar invitado');
      }

      // Actualizar la lista local
      setGuests(prev => 
        prev.map(g => g.email === editForm.email ? editForm : g)
      );
      
      setEditingGuest(null);
      setEditForm(null);
      alert('Invitado actualizado correctamente');
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`¿Eliminar al invitado con email ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/guests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar invitado');
      }

      // Actualizar lista local
      setGuests(prev => prev.filter(g => g.email !== email));
      alert('Invitado eliminado correctamente');
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.attending).length,
    notAttending: guests.filter(g => !g.attending).length,
    menuCounts: guests.reduce((acc, g) => {
      acc[g.menu] = (acc[g.menu] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-6xl mx-auto p-4">
        <h1 className="font-display text-3xl mb-6">Panel de Control - Invitados</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}

        {/* Estadísticas */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.attending}</div>
              <div className="text-sm text-gray-600">Asistirán</div>
            </div>
            <div className="bg-red-50 rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{stats.notAttending}</div>
              <div className="text-sm text-gray-600">No asistirán</div>
            </div>
            <div className="bg-purple-50 rounded-xl shadow p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.total > 0 ? Math.round((stats.attending / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Confirmación</div>
            </div>
          </div>
        )}

        {/* Estadísticas de menús */}
        {!loading && stats.attending > 0 && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Menús Seleccionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(stats.menuCounts).map(([menu, count]) => (
                <div key={menu} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{menu}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla de invitados */}
        {loading ? (
          <div className="text-center py-8">Cargando invitados...</div>
        ) : guests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded">
            No hay invitados registrados aún.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-center">Asistencia</th>
                  <th className="p-3 text-left">Menú</th>
                  <th className="p-3 text-left">Alergias</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.email} className="border-b hover:bg-gray-50">
                    {editingGuest === guest.email && editForm ? (
                      // Modo edición
                      <>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="p-3 text-gray-500 text-sm">{guest.email}</td>
                        <td className="p-3 text-center">
                          <select
                            value={editForm.attending ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, attending: e.target.value === 'true' })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="true">✅ Sí</option>
                            <option value="false">❌ No</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={editForm.menu}
                            onChange={(e) => setEditForm({ ...editForm, menu: e.target.value })}
                            className="border rounded px-2 py-1 w-full"
                          >
                            <option value="Clasico Argentino">Clásico Argentino</option>
                            <option value="Vegano">Vegano</option>
                            <option value="Sin TACC">Sin TACC</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editForm.allergies || ''}
                            onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                            className="border rounded px-2 py-1 w-full"
                            placeholder="Ninguna"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Modo vista
                      <>
                        <td className="p-3 font-medium">{guest.name}</td>
                        <td className="p-3 text-gray-600 text-sm">{guest.email}</td>
                        <td className="p-3 text-center">
                          {guest.attending ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                              ✅ Sí
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                              ❌ No
                            </span>
                          )}
                        </td>
                        <td className="p-3">{guest.menu}</td>
                        <td className="p-3 text-gray-600 text-sm">{guest.allergies || 'Ninguna'}</td>
                        <td className="p-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(guest)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(guest.email)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
