import { supabase } from './supabaseClient';

/**
 * Actualiza el rol de un usuario tanto en auth como en la tabla users
 * Utiliza un endpoint API seguro para realizar la operación
 * 
 * @param userId ID del usuario a actualizar
 * @param nuevoRol Nuevo rol ('admin', 'invitado', etc)
 * @param forceLogout Si es true, fuerza el logout del usuario actual después de la actualización
 * @returns Resultado de la operación
 */
export async function actualizarRol(userId: string, nuevoRol: string, forceLogout = false) {
  try {
    // Obtener el token de autenticación del usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      throw new Error('No hay sesión activa');
    }
    
    // Llamar al endpoint API con el token de autenticación
    const response = await fetch('/api/update-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId, nuevoRol })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error al actualizar rol');
    }
    
    console.log('Rol actualizado correctamente:', result);
    
    // Si el usuario actualizado es el usuario actual, debemos hacer logout
    const { data: { user } } = await supabase.auth.getUser();
    const isCurrentUser = user?.id === userId;
    
    if (isCurrentUser || forceLogout) {
      // Mostrar mensaje al usuario
      alert('Tu rol ha sido actualizado. Debes cerrar sesión e iniciarla nuevamente para que los cambios surtan efecto.');
      
      // Opcional: forzar logout automáticamente
      if (forceLogout) {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error al actualizar rol:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el rol del usuario actual
 * Útil para promover a un usuario a admin
 * 
 * @param nuevoRol Nuevo rol ('admin', 'invitado', etc)
 * @param autoLogout Si es true, hace logout automáticamente y redirecciona a login
 * @returns Resultado de la operación
 */
export async function actualizarRolPropio(nuevoRol: string, autoLogout = false) {
  try {
    // Obtener el ID del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }
    
    // Usar la función de actualización estándar
    const { success, error } = await actualizarRol(user.id, nuevoRol, autoLogout);
    
    if (!success) {
      throw new Error(error);
    }
    
    // Si no hacemos logout automáticamente, solo actualizamos localStorage
    if (!autoLogout) {
      localStorage.setItem('role', nuevoRol);
      
      // Mostrar mensaje para manual logout/login
      alert('Tu rol ha sido actualizado en la base de datos. Para aplicar todos los cambios, cierra sesión e inicia sesión nuevamente.');
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error al actualizar rol propio:', error.message);
    return { success: false, error: error.message };
  }
}
