-- Verificar si la tabla users existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'users'
);

-- Primero, desactivar RLS temporalmente para evitar problemas durante la migración
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para evitar recursiones infinitas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can update all data" ON users;

-- Crear la tabla users si no existe
CREATE TABLE IF NOT EXISTS users (
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
   nombre TEXT NOT NULL,
   rol TEXT NOT NULL DEFAULT 'invitado',
   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Primero, insertemos o actualicemos el usuario administrador
-- IMPORTANTE: Reemplaza 'tu-email@example.com' con tu correo real
DO $$
DECLARE
  admin_email TEXT := 'tu-email@example.com'; -- REEMPLAZA CON TU EMAIL
  admin_id UUID;
BEGIN
  -- Buscar el ID del usuario admin en auth
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  IF admin_id IS NULL THEN
    RAISE NOTICE 'No se encontró usuario con email % en auth.users', admin_email;
  ELSE
    -- Intentar actualizar el admin si ya existe
    UPDATE users SET rol = 'admin' WHERE id = admin_id;
    
    -- Si no existe, insertarlo
    IF NOT FOUND THEN
      INSERT INTO users (id, nombre, rol)
      VALUES (admin_id, SPLIT_PART(admin_email, '@', 1), 'admin');
      RAISE NOTICE 'Se creó el usuario admin con ID %', admin_id;
    ELSE
      RAISE NOTICE 'Se actualizó el usuario a admin con ID %', admin_id;
    END IF;
  END IF;
END $$;

-- IMPORTANTE: Ejecutar esta consulta para crear registros en users para todos los usuarios de auth
INSERT INTO users (id, nombre, rol)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)),
  'invitado'
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- Ahora crear las políticas RLS correctas sin recursión
-- Permitir a los administradores ver todos los datos (sin usar EXISTS para evitar recursión)
CREATE POLICY "Admins can view all data" ON users
  FOR SELECT USING (
    (SELECT rol FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Permitir a los usuarios ver sus propios datos
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Permitir a los usuarios insertar sus propios datos
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Permitir a los usuarios actualizar sus propios datos
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Permitir a los administradores actualizar todos los datos (sin usar EXISTS para evitar recursión)
CREATE POLICY "Admins can update all data" ON users
  FOR UPDATE USING (
    (SELECT rol FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Permitir a los administradores eliminar todos los datos (sin usar EXISTS para evitar recursión)
CREATE POLICY "Admins can delete all data" ON users
  FOR DELETE USING (
    (SELECT rol FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear un bypass para la tabla users - permitir a la función service_role acceder sin RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;

-- Verificar los índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

-- Verificar que los datos se insertaron correctamente
SELECT * FROM users;

-- Mostrar todos los usuarios admin
SELECT u.id, u.nombre, u.rol, au.email 
FROM users u 
JOIN auth.users au ON u.id = au.id 
WHERE u.rol = 'admin';
