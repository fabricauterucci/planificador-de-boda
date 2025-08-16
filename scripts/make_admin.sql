-- Este script crea o actualiza un usuario como administrador
-- Reemplaza el email con tu dirección de correo electrónico

-- Variables - REEMPLAZA ESTOS VALORES
\set admin_email '\'tu_email@example.com\''

-- Función para actualizar o crear un administrador
DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT := :admin_email;
BEGIN
  -- Buscar el ID del usuario en auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario con el email %', admin_email;
  END IF;
  
  -- Intentar actualizar primero
  UPDATE users 
  SET rol = 'admin' 
  WHERE id = admin_id;
  
  -- Si no existe, insertarlo
  IF NOT FOUND THEN
    INSERT INTO users (id, nombre, rol)
    VALUES (
      admin_id, 
      COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = admin_id), 
               SPLIT_PART(admin_email, '@', 1)), 
      'admin'
    );
    RAISE NOTICE 'Usuario administrador creado con ID %', admin_id;
  ELSE
    RAISE NOTICE 'Usuario actualizado a administrador con ID %', admin_id;
  END IF;
  
  -- Verificar que se aplicó el cambio
  PERFORM * FROM users WHERE id = admin_id AND rol = 'admin';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error al establecer el usuario como administrador';
  END IF;
END $$;

-- Verificar los usuarios administradores
SELECT id, nombre, rol, email
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE u.rol = 'admin';
