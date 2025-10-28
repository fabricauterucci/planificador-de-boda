
import { useAuth } from "../lib/AuthContext";
import { FormEvent, useState, useEffect } from "react";
import GuestOnlyPage from "../components/GuestOnlyPage";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from 'next/router';

export default function RSVP() {
  const { token, role } = useAuth();
  const router = useRouter();
  let welcome = null;
  let userEmail = '';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      userEmail = payload.email || '';
      welcome = (
        <div className="mb-6 text-center text-lg text-dusk font-semibold">
          ¡Bienvenido{userEmail ? `, ${userEmail}` : ''}! Gracias por confirmar tu asistencia.
        </div>
      );
    } catch {}
  }
  const [status, setStatus] = useState<string>("");
  const [attending, setAttending] = useState<'asistire' | 'no_puedo_ir'>('asistire');
  const [menu, setMenu] = useState('');
  const [menus, setMenus] = useState<{ id: number, nombre: string, descripcion: string }[]>([]);
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(true);
  const [editAllowed, setEditAllowed] = useState(true);
  const [hasRSVP, setHasRSVP] = useState(false);

  // Cargar RSVP y fecha del evento
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Verificar que el usuario esté autenticado
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error("No hay sesión activa");
          setLoading(false);
          return;
        }
        
        // Cargar menús
        const { data: menusData } = await supabase
          .from('menus')
          .select('id, nombre, descripcion')
          .eq('activo', true);
        setMenus(menusData || []);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("No se pudo obtener el usuario");
          setLoading(false);
          return;
        }
        
        console.log("Buscando Reserva para usuario:", user.id);
        
        // Buscar RSVP del usuario
        const { data, error } = await supabase
          .from('rsvp')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error("Error buscando Reserva:", error);
        }
        
        if (data && data.length > 0) {
          // El usuario ya tiene un Reserva
          console.log("Reserva encontrada:", data[0]);
          setAttending(data[0].asistencia);
          setMenu(data[0].menu || (menusData && menusData[0]?.nombre) || '');
          setAllergies(data[0].comentario || '');
          setHasRSVP(true);
        } else {
          console.log("No se encontró Reserva para este usuario");
          // El usuario no tiene un Reserva
          setMenu((menusData && menusData[0]?.nombre) || '');
          setHasRSVP(false);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);


  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    setLoading(true); // Activar indicador de carga
    
    try {
      // 1. Verificamos que el usuario esté autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error obteniendo usuario:", userError);
        setStatus(`Error de autenticación: ${userError.message}`);
        setLoading(false);
        return;
      }
      
      if (!user) {
        setStatus('No estás logueado');
        setLoading(false);
        return;
      }
      
      console.log("Enviando RSVP para usuario:", user.id);
      console.log("Estado:", hasRSVP ? "Actualizando existente" : "Creando nuevo");
      console.log("Datos:", {
        asistencia: attending,
        menu: attending === 'asistire' ? (menu || (menus[0]?.nombre || 'Clasico Argentino')) : '',
        comentario: allergies
      });
      
      // 2. Preparamos los datos para enviar
      const rsvpData = {
        user_id: user.id,
        asistencia: attending,
        menu: attending === 'asistire' ? (menu || (menus[0]?.nombre || 'Clasico Argentino')) : '',
        comentario: allergies
      };
      
      let result;
      
      // 3. Insertar o actualizar según corresponda
      if (!hasRSVP) {
        // Insertar nuevo RSVP
        result = await supabase
          .from('rsvp')
          .insert(rsvpData);
      } else {
        // Actualizar RSVP existente - primero obtenemos el ID del registro
        const { data: existingRsvp, error: findError } = await supabase
          .from('rsvp')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (findError || !existingRsvp || existingRsvp.length === 0) {
          console.error("Error buscando Reserva existente:", findError);
          result = await supabase.from('rsvp').insert(rsvpData);
        } else {
          // Actualizar el registro más reciente
          result = await supabase
            .from('rsvp')
            .update(rsvpData)
            .eq('id', existingRsvp[0].id);
        }
      }
      
      // 4. Procesamos el resultado
      if (result.error) {
        console.error("Error Supabase:", result.error);
        setStatus(`Error al enviar Reserva: ${result.error.message}`);
      } else {
        console.log("Reserva guardado con éxito:", result.data);
        setStatus('Reserva realizada con éxito');
        setHasRSVP(true);
        
        // 5. Verificamos que se guardó correctamente
        const { data: verificacion, error: errorVerificacion } = await supabase
          .from('rsvp')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (errorVerificacion) {
          console.error("Error al verificar Reserva:", errorVerificacion);
        } else {
          console.log("Verificación exitosa:", verificacion);
        }
        
        // 6. Redireccionamos después de un breve retraso
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error inesperado:", err);
      setStatus(`Error inesperado: ${err.message}`);
    } finally {
      setLoading(false); // Desactivar indicador de carga independientemente del resultado
    }
  }

  return (
    <GuestOnlyPage>
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="w-full max-w-xl">
          {welcome}
          <form onSubmit={submit} className="w-full p-6 rounded-2xl bg-white shadow space-y-4">
            <h1 className="font-display text-2xl">Confirmá tu asistencia</h1>
            
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="asistire"
                  checked={attending === 'asistire'}
                  onChange={() => setAttending('asistire')}
                  disabled={!editAllowed}
                /> Asistiré
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="attending"
                  value="no_puedo_ir"
                  checked={attending === 'no_puedo_ir'}
                  onChange={() => setAttending('no_puedo_ir')}
                  disabled={!editAllowed}
                /> No puedo ir
              </label>
              {attending === 'asistire' && (
                <a
                  href="/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto px-4 py-2 rounded-full bg-gold text-dusk font-semibold text-sm shadow hover:bg-dusk hover:text-white transition"
                  style={{ marginLeft: 'auto' }}
                >
                  Ver menú
                </a>
              )}
            </div>
            {attending === 'asistire' && (
              <>
                <select
                  name="menu"
                  className="w-full border rounded-lg p-2"
                  required
                  value={menu}
                  onChange={e => setMenu(e.target.value)}
                  disabled={!editAllowed}
                >
                  {menus.map((m) => (
                    <option key={m.id} value={m.nombre}>{m.nombre}</option>
                  ))}
                </select>
                <input
                  className="w-full border rounded-lg p-2"
                  name="allergies"
                  placeholder="Alergias o comentarios (opcional)"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  disabled={!editAllowed}
                />
              </>
            )}
            <button 
              className="w-full py-2 rounded-lg bg-dusk text-white flex items-center justify-center" 
              disabled={!editAllowed || loading}
              type="submit"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                editAllowed ? (hasRSVP ? 'Modificar asistencia' : 'Confirmar asistencia') : 'Edición cerrada'
              )}
            </button>
            {status && (
              <p className={`text-sm ${status.includes('Error') ? 'text-red-600' : 'text-green-600'} font-medium`}>
                {status}
              </p>
            )}
            {!editAllowed && (
              <p className="text-xs text-red-600 mt-2">La edición de asistencia y menú está cerrada (solo hasta una semana antes del evento).</p>
            )}
          </form>
        </div>
      </div>
    </GuestOnlyPage>
  );
}
