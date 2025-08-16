-- Script para crear la tabla RSVP si no existe
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear la tabla RSVP si no existe
CREATE TABLE IF NOT EXISTS public.rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asistencia TEXT NOT NULL,
  menu TEXT,
  comentario TEXT,
  UNIQUE(user_id)
);

-- 2. Agregar restricción de validación a la columna asistencia
DO $$
BEGIN
  -- Verificar si la columna asistencia es de tipo TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rsvp' 
    AND column_name = 'asistencia'
    AND data_type != 'text'
  ) THEN
    -- Convertir a TEXT si no lo es
    ALTER TABLE public.rsvp 
    ALTER COLUMN asistencia TYPE text;
    
    RAISE NOTICE 'Columna asistencia convertida a tipo TEXT';
  END IF;
  
  -- Asegurar que el menú sea de tipo TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'rsvp' 
    AND column_name = 'menu'
    AND data_type != 'text'
  ) THEN
    -- Convertir a TEXT si no lo es
    ALTER TABLE public.rsvp 
    ALTER COLUMN menu TYPE text;
    
    RAISE NOTICE 'Columna menu convertida a tipo TEXT';
  END IF;
  
  -- Agregar restricción si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rsvp_asistencia_check'
  ) THEN
    ALTER TABLE public.rsvp
    ADD CONSTRAINT rsvp_asistencia_check 
    CHECK (asistencia IN ('asistire', 'no_puedo_ir'));
    
    RAISE NOTICE 'Restricción de validación agregada a columna asistencia';
  END IF;
END $$;

-- 3. Configurar políticas de Row Level Security
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Usuario puede ver su propio RSVP" ON public.rsvp;
DROP POLICY IF EXISTS "Usuario puede crear su propio RSVP" ON public.rsvp;
DROP POLICY IF EXISTS "Usuario puede actualizar su propio RSVP" ON public.rsvp;
DROP POLICY IF EXISTS "Admins pueden ver todos los RSVPs" ON public.rsvp;

-- Crear políticas para limitar acceso
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

-- 4. Corregir datos existentes si hay valores problemáticos
UPDATE public.rsvp 
SET asistencia = 'asistire' 
WHERE asistencia = 'true' OR asistencia IS NULL;

UPDATE public.rsvp 
SET asistencia = 'no_puedo_ir' 
WHERE asistencia = 'false';

-- 5. Información final
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND table_name = 'rsvp'
ORDER BY 
  ordinal_position;

-- Muestra los registros existentes para verificar
SELECT * FROM public.rsvp LIMIT 10;
