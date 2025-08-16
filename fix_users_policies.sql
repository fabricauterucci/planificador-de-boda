-- Este script corrige el error "infinite recursion detected in policy for relation users"
-- eliminando todas las políticas actuales y creando nuevas que no causan recursión

-- 1. Primero, desactivamos RLS temporalmente para poder trabajar sin restricciones
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos todas las políticas existentes para la tabla users
DROP POLICY IF EXISTS "Users are viewable by everyone." ON public.users;
DROP POLICY IF EXISTS "Users are editable by themselves." ON public.users;
DROP POLICY IF EXISTS "Users are editable by admins." ON public.users;
DROP POLICY IF EXISTS "Users are insertable by admins." ON public.users;
DROP POLICY IF EXISTS "Users are deletable by admins." ON public.users;
DROP POLICY IF EXISTS "Allow all users to view" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.users;
DROP POLICY IF EXISTS "Allow admin@boda.com to update any record" ON public.users;
DROP POLICY IF EXISTS "Allow insert for everyone" ON public.users;
DROP POLICY IF EXISTS "Allow admin@boda.com to delete any record" ON public.users;

-- 3. Creamos nuevas políticas que no causan recursión
-- IMPORTANTE: Estas políticas evitan el uso de subconsultas a la misma tabla

-- Política para permitir a todos ver todos los usuarios
CREATE POLICY "users_select_policy" 
ON public.users 
FOR SELECT 
USING (true);

-- Política para permitir a los usuarios editar sus propios datos
CREATE POLICY "users_update_self_policy" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Política para permitir a los administradores editar cualquier registro basado en email
CREATE POLICY "users_update_admin_policy" 
ON public.users 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'admin@boda.com');

-- Política para permitir a cualquiera insertar (necesario para el registro)
CREATE POLICY "users_insert_policy" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir a los administradores eliminar cualquier registro
CREATE POLICY "users_delete_admin_policy" 
ON public.users 
FOR DELETE 
USING (auth.jwt() ->> 'email' = 'admin@boda.com');

-- 4. Volvemos a activar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Nos aseguramos de que la tabla tenga los campos correctos
DO $$
BEGIN
  -- Verificar si existe la columna 'rol' y si no, crearla
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'rol'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rol text DEFAULT 'invitado';
  END IF;
  
  -- Verificar si existe la columna 'nombre' y si no, crearla
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'nombre'
  ) THEN
    ALTER TABLE public.users ADD COLUMN nombre text;
  END IF;
  
  -- Asegurarnos de que el ID sea la clave primaria
  IF NOT EXISTS (
    SELECT FROM pg_constraint
    WHERE conname = 'users_pkey'
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD PRIMARY KEY (id);
  END IF;
END
$$;

-- 6. Verificar si el usuario 'admin@boda.com' existe en la tabla users
-- y si no, intentar crearlo
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Obtener ID del usuario admin@boda.com desde auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@boda.com';
  
  -- Si existe el usuario en auth pero no en public.users, crearlo
  IF admin_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = admin_id
  ) THEN
    INSERT INTO public.users (id, nombre, rol) 
    VALUES (admin_id, 'admin', 'admin');
    RAISE NOTICE 'Usuario admin creado en la tabla users';
  END IF;
END
$$;
