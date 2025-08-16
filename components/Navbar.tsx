import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

import { useEffect, useState } from 'react';
export default function Navbar() {
  const { token, role, authLoading, logout } = useAuth();
  const [userName, setUserName] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('name') || '');
      // Escuchar cambios en localStorage (por ejemplo, desde otra pestaña)
      const handler = () => setUserName(localStorage.getItem('name') || '');
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  }, []);
  useEffect(() => {
    // Actualizar si cambia el token (por login/logout)
    if (typeof window !== 'undefined') {
      setUserName(localStorage.getItem('name') || '');
    }
  }, [token]);
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="mx-auto max-w-6xl flex items-center justify-between p-4 md:p-6">
        <Link href="/" className="font-display text-xl md:text-2xl">
          Sofía & Franco
        </Link>
        <div className="flex flex-row gap-2 md:gap-4 items-center min-w-[140px] w-auto flex-nowrap">
          {/* Mostrar los botones de RSVP y Menú solo para usuarios que NO son admin */}
          {!authLoading && role !== 'admin' && (
            <>
              <Link href="/rsvp" className="px-3 py-2 md:px-4 md:py-2 rounded-full bg-dusk text-white hover:opacity-90 text-sm md:text-base text-center">Confirmar asistencia</Link>
              <Link href="/menu" className="px-3 py-2 md:px-4 md:py-2 rounded-full bg-gold text-dusk hover:opacity-90 text-sm md:text-base text-center">Menú</Link>
            </>
          )}
          {/* Botón Panel de control para admin y cualquier usuario con email admin@boda.com */}
          {!authLoading && (role === 'admin' || (typeof window !== 'undefined' && localStorage.getItem('email') === 'admin@boda.com')) && (
            <Link href="/admin/dashboard" className="px-3 py-2 md:px-4 md:py-2 rounded-full bg-blue-700 text-white hover:opacity-90 text-sm md:text-base text-center">Panel de control</Link>
          )}
          {/* Mostrar usuario y logout si está autenticado */}
          {!authLoading && token ? (
            <div className="flex items-center gap-2">
              <span className="text-dusk text-sm font-semibold truncate max-w-[100px]" title={userName || role || 'Usuario'}>
                {userName || role || 'Usuario'}
              </span>
              <button
                onClick={logout}
                className="px-2 py-1 rounded-full bg-blush text-dusk border border-dusk/20 text-xs hover:bg-dusk hover:text-white transition"
              >
                Cerrar sesión
              </button>
              {/* Botón de diagnóstico - solo visible para admin y prometidos */}
              {(role === 'admin' || role === 'prometidos' || role === 'prometido') && (
                <Link href="/debug" className="px-2 py-1 rounded-full bg-gray-200 text-dusk border border-dusk/20 text-xs hover:bg-dusk hover:text-white transition">
                  Debug
                </Link>
              )}
            </div>
          ) : (
            <Link href="/login" className="px-3 py-2 md:px-4 md:py-2 rounded-full bg-white border border-dusk/20 hover:bg-blush text-sm md:text-base text-center">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
