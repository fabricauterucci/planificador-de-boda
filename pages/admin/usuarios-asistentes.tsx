import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import Navbar from '../../components/Navbar';

export default function UsuariosAsistentes() {
  const { token, role, authLoading } = useAuth();
  const [asistentes, setAsistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAsistentes() {
      setLoading(true);
      setError(null);
      try {
        // Solo admin/prometidos pueden ver todos los RSVP
        const { data, error } = await supabase
          .from('rsvp')
          .select('user_id, asistencia, menu, comentario, created_at')
          .eq('asistencia', 'asistire');
        if (error) throw error;
        // Obtener nombres y roles de la tabla users
        const userIds = data.map((r: any) => r.user_id);
        let perfiles: any[] = [];
        if (userIds.length > 0) {
          const { data: perfilesData } = await supabase
            .from('users')
            .select('id, nombre, rol')
            .in('id', userIds);
          perfiles = perfilesData || [];
        }
        // Unir RSVP y perfiles
        const asistentesConPerfil = data.map((r: any) => {
          const perfil = perfiles.find((p: any) => p.id === r.user_id);
          return {
            ...r,
            nombre: perfil?.nombre || r.user_id,
            rol: perfil?.rol || '',
          };
        });
        setAsistentes(asistentesConPerfil);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (role === 'admin' && !authLoading) fetchAsistentes();
  }, [role, authLoading]);

  if (authLoading) return <div>Cargando...</div>;
  if (role !== 'admin') return <div>No autorizado</div>;

  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-2xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Usuarios que van a asistir</h1>
        {loading && <div>Cargando asistentes...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}
        {!loading && asistentes.length === 0 && <div>No hay asistentes confirmados.</div>}
        {!loading && asistentes.length > 0 && (
          <table className="w-full border mt-4">
            <thead>
              <tr className="bg-dusk text-white">
                <th className="p-2">Nombre</th>
                <th className="p-2">Rol</th>
                <th className="p-2">Menú</th>
                <th className="p-2">Comentario</th>
                <th className="p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {asistentes.map(a => (
                <tr key={a.user_id} className="border-b">
                  <td className="p-2">{a.nombre}</td>
                  <td className="p-2">{a.rol}</td>
                  <td className="p-2">{a.menu}</td>
                  <td className="p-2">{a.comentario}</td>
                  <td className="p-2">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
