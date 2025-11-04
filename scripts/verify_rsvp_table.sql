--
-- Script para verificar y asegurar que la tabla RSVP existe con la configuración correcta
--

-- Primero verificamos si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rsvp'
    ) THEN
        -- Si no existe, creamos la tabla RSVP
        CREATE TABLE public.rsvp (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            asistencia TEXT NOT NULL CHECK (asistencia IN ('asistire', 'no_puedo_ir')),
            menu TEXT,
            comentario TEXT,
            UNIQUE(user_id)
        );
        
        -- Habilitamos Row Level Security
        ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
        
        -- Políticas para permitir a los usuarios gestionar sus propios RSVPs
        CREATE POLICY "Usuario puede ver su propio RSVP" 
            ON public.rsvp FOR SELECT 
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Usuario puede crear su propio RSVP" 
            ON public.rsvp FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Usuario puede actualizar su propio RSVP" 
            ON public.rsvp FOR UPDATE 
            USING (auth.uid() = user_id);
            
        -- Política para que los admin/prometidos vean todos los RSVPs
        CREATE POLICY "Admins pueden ver todos los RSVPs" 
            ON public.rsvp FOR SELECT 
            USING (
                auth.jwt() ->> 'role' = 'admin' OR 
                auth.jwt() ->> 'role' = 'prometidos'
            );
            
        RAISE NOTICE 'Tabla RSVP creada con éxito';
    ELSE
        -- Si ya existe, nos aseguramos que tenga las políticas correctas
        -- Primero eliminamos las políticas existentes
        DROP POLICY IF EXISTS "Usuario puede ver su propio RSVP" ON public.rsvp;
        DROP POLICY IF EXISTS "Usuario puede crear su propio RSVP" ON public.rsvp;
        DROP POLICY IF EXISTS "Usuario puede actualizar su propio RSVP" ON public.rsvp;
        DROP POLICY IF EXISTS "Admins pueden ver todos los RSVPs" ON public.rsvp;
        
        -- Creamos nuevamente las políticas
        CREATE POLICY "Usuario puede ver su propio RSVP" 
            ON public.rsvp FOR SELECT 
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Usuario puede crear su propio RSVP" 
            ON public.rsvp FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Usuario puede actualizar su propio RSVP" 
            ON public.rsvp FOR UPDATE 
            USING (auth.uid() = user_id);
            
        CREATE POLICY "Admins pueden ver todos los RSVPs" 
            ON public.rsvp FOR SELECT 
            USING (
                auth.jwt() ->> 'role' = 'admin' OR 
                auth.jwt() ->> 'role' = 'prometidos'
            );
            
        -- Nos aseguramos que RLS esté habilitado
        ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Tabla RSVP ya existe. Políticas actualizadas.';
    END IF;
END
$$;

-- Verificar que la tabla tiene la estructura correcta
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'rsvp';
    
    IF column_count < 6 THEN
        RAISE NOTICE 'La tabla RSVP parece tener una estructura incompleta. Se recomienda revisar sus columnas.';
    ELSE
        RAISE NOTICE 'La estructura de la tabla RSVP parece correcta.';
    END IF;
END
$$;

-- Verificar las políticas existentes
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
    schemaname = 'public' AND tablename = 'rsvp'
ORDER BY
    policyname;
