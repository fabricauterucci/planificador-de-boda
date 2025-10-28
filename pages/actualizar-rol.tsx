import { useState } from 'react';
import { actualizarRol } from '../lib/roleUtils';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';

export default function ActualizarRolPage() {
  const [userId, setUserId] = useState('');
  const [nuevoRol, setNuevoRol] = useState('admin');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Verificar el usuario actual
  async function checkCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setUserId(user.id); // Pre-llenar con el ID del usuario actual
      }
    } catch (error) {
      console.error("Error al obtener usuario actual:", error);
    }
  }

  const [autoLogout, setAutoLogout] = useState(false);

  // Actualizar el rol del usuario
  async function handleActualizarRol() {
    setStatus('loading');
    setMessage('Actualizando rol...');
    
    try {
      const { success, error, data } = await actualizarRol(userId, nuevoRol, autoLogout);
      
      if (!success) {
        throw new Error(error);
      }
      
      setStatus('success');
      setMessage(`Rol actualizado correctamente a "${nuevoRol}". ${autoLogout ? 'Serás redirigido a login...' : 'Recuerda hacer logout y login nuevamente para que los cambios surtan efecto.'}`);
      console.log("Datos de respuesta:", data);
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
      console.error("Error completo:", error);
    }
  }

  // Verificar usuario al cargar la página
  useState(() => {
    checkCurrentUser();
  });

  return (
    <>
      <Navbar />
      <main className="pt-24 max-w-4xl mx-auto p-4">
        <h1 className="font-display text-2xl mb-6">Actualizar Rol de Usuario</h1>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4">Ejemplo de Uso de la API</h2>
          
          <pre className="bg-gray-100 p-3 rounded mb-4 overflow-x-auto text-xs">
{`// Importar la utilidad
import { actualizarRol } from '../lib/roleUtils';

// Actualizar el rol de un usuario
async function cambiarRol() {
  const { success, error } = await actualizarRol(
    '8b865535-13b6-46ae-9963-70c65d15c003', 
    'admin',
    true // Opcional: forzar logout después de la actualización
  );
  
  if (success) {
    console.log('Rol actualizado correctamente');
  } else {
    console.error('Error:', error);
  }
}`}
          </pre>
          
          {currentUser && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Usuario actual:</h3>
              <p>ID: {currentUser.id}</p>
              <p>Email: {currentUser.email}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID de Usuario:</label>
              <input 
                type="text" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full p-2 border rounded" 
                placeholder="Ej: 8b865535-13b6-46ae-9963-70c65d15c003"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nuevo Rol:</label>
              <select 
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="admin">Admin</option>
                <option value="invitado">Invitado</option>
                <option value="prometidos">Prometidos</option>
              </select>
            </div>
            
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="autoLogout"
                checked={autoLogout}
                onChange={(e) => setAutoLogout(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoLogout" className="text-sm">
                Cerrar sesión automáticamente después de actualizar
              </label>
            </div>
            
            <button 
              onClick={handleActualizarRol}
              disabled={status === 'loading' || !userId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Actualizando...' : 'Actualizar Rol'}
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
          </div>
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-bold text-xl mb-4">Notas Importantes</h2>
          
          <ul className="list-disc ml-6 space-y-2">
            <li>Esta función actualiza el rol tanto en los metadatos de Auth como en la tabla 'users'.</li>
            <li>Utiliza un endpoint API seguro para la función administrativa.</li>
            <li>Solo los administradores pueden actualizar roles de otros usuarios.</li>
            <li>Si recibes errores, asegúrate de que estás autenticado como administrador.</li>
          </ul>
        </div>
      </main>
    </>
  );
}
