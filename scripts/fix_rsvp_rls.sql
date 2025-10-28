-- Script para configurar políticas de seguridad RLS para la tabla RSVP
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Habilitar RLS en la tabla si no está habilitado
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para permitir a los usuarios leer solo sus propios RSVPs
DROP POLICY IF EXISTS "Usuarios pueden leer sus propios RSVPs" ON public.rsvp;
CREATE POLICY "Usuarios pueden leer sus propios RSVPs" 
ON public.rsvp 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Crear política para permitir a los usuarios insertar sus propios RSVPs
DROP POLICY IF EXISTS "Usuarios pueden crear sus propios RSVPs" ON public.rsvp;
CREATE POLICY "Usuarios pueden crear sus propios RSVPs" 
ON public.rsvp 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Crear política para permitir a los usuarios actualizar sus propios RSVPs
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios RSVPs" ON public.rsvp;
CREATE POLICY "Usuarios pueden actualizar sus propios RSVPs" 
ON public.rsvp 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Política para permitir a todos los usuarios autenticados crear RSVPs (solución temporal)
DROP POLICY IF EXISTS "Autenticados pueden crear RSVPs" ON public.rsvp;
CREATE POLICY "Autenticados pueden crear RSVPs" 
ON public.rsvp 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 6. Política para bypass RLS para operaciones administrativas
DROP POLICY IF EXISTS "Bypass RLS" ON public.rsvp;
CREATE POLICY "Bypass RLS" 
ON public.rsvp 
FOR ALL 
TO postgres
USING (true);

-- 7. Verificar que las políticas se hayan creado correctamente
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public' AND tablename = 'rsvp';
