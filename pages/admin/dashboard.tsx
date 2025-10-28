import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const { role, authLoading } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    confirmados: 0,
    no_confirmados: 0,
    porcentaje: 0,
    menuStats: [] as { menu: string, cantidad: number }[],
  });
  const [invitados, setInvitados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ asistencia: boolean; menu: string }>({ asistencia: false, menu: '' });

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingUser(userId);
    try {
      // 1. Verificar que el usuario actual es admin
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No hay sesión activa');
      }

      // 2. Solicitar la eliminación del usuario al endpoint
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let error;
        
        if (contentType && contentType.includes('application/json')) {
          error = await response.json();
        } else {
          const text = await response.text();
          console.error('Respuesta no JSON:', text);
          error = { message: `Error del servidor (${response.status}): ${text.substring(0, 100)}...` };
        }
        
        throw new Error(error.message || 'Error al eliminar usuario');
      }

      console.log('Usuario eliminado correctamente');

      // Actualizar la lista de invitados inmediatamente
      setInvitados(prevInvitados => prevInvitados.filter(inv => inv.id !== userId));
      
      // Actualizar las estadísticas
      setStats(prevStats => ({
        ...prevStats,
        total: prevStats.total - 1,
        no_confirmados: prevStats.no_confirmados - 1,
        porcentaje: prevStats.total > 1 ? Math.round((prevStats.confirmados / (prevStats.total - 1)) * 100) : 0
      }));
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setDeletingUser(null);
    }
  };

  // Función para iniciar edición
  const handleEditStart = (invitado: any) => {
    setEditingId(invitado.id);
    setEditForm({
      asistencia: invitado.asistencia === 'asistire',
      menu: invitado.menu || '',
    });
  };

  // Función para guardar cambios usando la API /api/guests
  const handleEditSave = async (invitado: any) => {
    try {
      // Intentar obtener token JWT de la API /api/auth/login
      let token = localStorage.getItem('auth_token');
      
      // Si no hay token JWT, necesitamos generarlo
      if (!token) {
        const session = await supabase.auth.getSession();
        const userEmail = session.data.session?.user?.email;
        
        if (!userEmail) {
          alert('No se pudo obtener el email del usuario. Por favor inicia sesión nuevamente.');
          return;
        }

        // Generar token JWT usando la API de login
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            password: userEmail, // En tu mock, la password no se valida
            role: role || 'admin'
          })
        });

        if (!loginResponse.ok) {
          alert('Error al generar token de autenticación');
          return;
        }

        const { token: newToken } = await loginResponse.json();
        token = newToken;
        if (token) {
          localStorage.setItem('auth_token', token);
        }
      }

      const response = await fetch('/api/guests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: invitado.id, // El ID es el email en esta implementación
          asistencia: editForm.asistencia,
          menu: editForm.menu,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar');
      }

      // Actualizar estado local
      setInvitados(prev => prev.map(i =>
        i.id === invitado.id
          ? { ...i, asistencia: editForm.asistencia ? 'asistire' : 'no_asistire', menu: editForm.menu }
          : i
      ));

      setEditingId(null);
      alert('✅ Invitado actualizado correctamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Función para cancelar edición
  const handleEditCancel = () => {
    setEditingId(null);
  };


  // Consulta y suscripción en tiempo real
  useEffect(() => {
    if (role !== 'admin' && role !== 'prometido') return;
    let channel: any;
    async function fetchData() {
      if (role !== 'admin') return; // Solo los admin pueden ver la lista completa
      setLoading(true);
      setError(null);
      try {
        // Total de invitados
        const { count: total } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('rol', 'invitado');
        // Confirmados y no confirmados
        const { data: rsvps } = await supabase
          .from('rsvp')
          .select('user_id, asistencia, menu, comentario');
        const { data: users } = await supabase
          .from('users')
          .select('id, nombre, rol');
        // Unir RSVP y users
        const invitados = (users || []).filter(u => u.rol === 'invitado').map(u => {
          const rsvp = (rsvps || []).find(r => r.user_id === u.id);
          return {
            ...u,
            asistencia: rsvp?.asistencia || 'no_confirmado',
            menu: rsvp?.menu || '',
            comentario: rsvp?.comentario || '',
          };
        });
        const confirmados = invitados.filter(i => i.asistencia === 'asistire').length;
        const no_confirmados = invitados.length - confirmados;
        // Menú stats
        const menuStats: { [key: string]: number } = {};
        invitados.forEach(i => {
          if (i.asistencia === 'asistire') {
            // Si el menú está vacío, contarlo como "Sin menú"
            const menuName = i.menu ? i.menu.trim() : 'Sin menú seleccionado';
            menuStats[menuName] = (menuStats[menuName] || 0) + 1;
          }
        });
        setStats({
          total: total || 0,
          confirmados,
          no_confirmados,
          porcentaje: total ? Math.round((confirmados / total) * 100) : 0,
          menuStats: Object.entries(menuStats).map(([menu, cantidad]) => ({ menu, cantidad })),
        });
        setInvitados(invitados);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // Suscripción en tiempo real para ambas tablas
    channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rsvp' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [role]);

  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (role !== 'admin' && role !== 'prometido')) {
      router.replace('/');
    }
  }, [role, authLoading, router]);

  if (authLoading) return <div>Cargando...</div>;

  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Dashboard de Invitados</h1>
        
        {loading && <div>Cargando datos...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}
        {!loading && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm">Total invitados</div>
              </div>
              <div className="bg-green-100 rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold">{stats.confirmados}</div>
                <div className="text-sm">Confirmados</div>
              </div>
              <div className="bg-red-100 rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold">{stats.no_confirmados}</div>
                <div className="text-sm">No confirmados</div>
              </div>
              <div className="bg-blue-100 rounded-xl shadow p-4 text-center">
                <div className="text-3xl font-bold">{stats.porcentaje}%</div>
                <div className="text-sm">% Asistencia</div>
              </div>
            </div>
            <div className="mb-8">
              <h2 className="font-bold mb-2">Menús elegidos</h2>
              <ul>
                {stats.menuStats.map(m => (
                  <li key={m.menu || 'sin-menu'}>{m.menu || 'Sin menú seleccionado'}: <b>{m.cantidad}</b></li>
                ))}
                {stats.menuStats.length === 0 && stats.confirmados > 0 ? (
                  <li>Hay {stats.confirmados} confirmados pero sin menú seleccionado.</li>
                ) : stats.menuStats.length === 0 && (
                  <li>No hay confirmados aún.</li>
                )}
              </ul>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border mt-4">
                <thead>
                  <tr className="bg-dusk text-white">
                    <th className="p-2">Nombre</th>
                    <th className="p-2">Email/ID</th>
                    <th className="p-2">Rol</th>
                    <th className="p-2">Asistencia</th>
                    <th className="p-2">Menú</th>
                    <th className="p-2">Comentario</th>
                    <th className="p-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invitados.map(i => (
                    <tr key={i.id} className="border-b">
                      <td className="p-2">{i.nombre}</td>
                      <td className="p-2">{i.id}</td>
                      <td className="p-2">{i.rol}</td>
                      <td className="p-2">
                        {editingId === i.id ? (
                          <select
                            value={editForm.asistencia ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, asistencia: e.target.value === 'true' })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="true">✔️ Asistirá</option>
                            <option value="false">❌ No asistirá</option>
                          </select>
                        ) : (
                          i.asistencia === 'asistire' ? '✔️' : '❌'
                        )}
                      </td>
                      <td className="p-2">
                        {editingId === i.id ? (
                          <select
                            value={editForm.menu}
                            onChange={(e) => setEditForm({ ...editForm, menu: e.target.value })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="">Seleccionar menú</option>
                            <option value="Clasico Argentino">Clásico Argentino</option>
                            <option value="Vegano">Vegano</option>
                            <option value="Sin TACC">Sin TACC</option>
                          </select>
                        ) : (
                          i.menu || '-'
                        )}
                      </td>
                      <td className="p-2">{i.comentario}</td>
                      <td className="p-2">
                        {editingId === i.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditSave(i)}
                              className="px-3 py-1 rounded text-sm bg-green-500 text-white hover:bg-green-600"
                            >
                              💾 Guardar
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-1 rounded text-sm bg-gray-500 text-white hover:bg-gray-600"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditStart(i)}
                              disabled={i.rol === 'admin'}
                              className={`px-3 py-1 rounded text-sm ${
                                i.rol === 'admin'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDeleteUser(i.id)}
                              disabled={deletingUser === i.id || i.rol === 'admin' || i.rol === 'prometido'}
                              className={`px-3 py-1 rounded text-sm ${
                                i.rol === 'admin' || i.rol === 'prometido'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : deletingUser === i.id
                                  ? 'bg-red-300 text-white cursor-wait'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                              title={i.rol === 'admin' || i.rol === 'prometido' ? 'No se pueden eliminar usuarios admin o prometidos' : ''}
                            >
                              {deletingUser === i.id ? 'Eliminando...' : '🗑️ Eliminar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
