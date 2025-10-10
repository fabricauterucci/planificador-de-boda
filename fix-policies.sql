-- Función para ejecutar consultas SQL directamente (útil para arreglar políticas)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Función para obtener todos los usuarios sin restricciones de RLS
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users;
$$;

-- Función para actualizar el rol de un usuario sin restricciones de RLS
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE users SET rol = new_role WHERE id = user_id;
$$;

-- Corrección de políticas para la tabla users
DO $$
BEGIN
  -- Eliminar políticas existentes que puedan causar recursión
  DROP POLICY IF EXISTS "Users are viewable by everyone." ON "public"."users";
  DROP POLICY IF EXISTS "Users are editable by themselves." ON "public"."users";
  DROP POLICY IF EXISTS "Users are editable by admins." ON "public"."users";
  DROP POLICY IF EXISTS "Users are insertable by admins." ON "public"."users";
  DROP POLICY IF EXISTS "Users are deletable by admins." ON "public"."users";
  
  -- Crear políticas seguras que no causan recursión
  CREATE POLICY "Allow all users to view" 
  ON "public"."users" 
  FOR SELECT 
  USING (true);
  
  CREATE POLICY "Allow users to update own record" 
  ON "public"."users" 
  FOR UPDATE 
  USING (auth.uid() = id);
  
  CREATE POLICY "Allow admin@boda.com to update any record" 
  ON "public"."users" 
  FOR UPDATE 
  USING (auth.jwt() ->> 'email' = 'admin@boda.com');
  
  CREATE POLICY "Allow insert for everyone" 
  ON "public"."users" 
  FOR INSERT 
  WITH CHECK (true);
  
  CREATE POLICY "Allow admin@boda.com to delete any record" 
  ON "public"."users" 
  FOR DELETE 
  USING (auth.jwt() ->> 'email' = 'admin@boda.com');
  
  -- Asegurarse de que RLS está habilitado
  ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
END
$$;
