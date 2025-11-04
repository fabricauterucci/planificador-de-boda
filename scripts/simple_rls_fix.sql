-- Script para corregir un problema de RLS en Supabase
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Solución simple: Deshabilitar RLS temporalmente
-- Esta es la solución más rápida si solo estás probando la aplicación
ALTER TABLE public.rsvp DISABLE ROW LEVEL SECURITY;

-- O alternativamente, permitir que todos los usuarios autenticados tengan acceso completo
-- ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Permitir acceso completo a usuarios autenticados" ON public.rsvp;
-- CREATE POLICY "Permitir acceso completo a usuarios autenticados" 
--   ON public.rsvp 
--   FOR ALL 
--   USING (auth.role() = 'authenticated');

-- 2. Verificar que los cambios se aplicaron correctamente
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'rsvp' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
