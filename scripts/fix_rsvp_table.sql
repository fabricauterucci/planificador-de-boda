-- Script para corregir la estructura de la tabla RSVP
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Hacer copia de seguridad de los datos existentes
CREATE TABLE IF NOT EXISTS rsvp_backup AS SELECT * FROM rsvp;

-- 2. Convertir asistencia de boolean a text
ALTER TABLE public.rsvp
ALTER COLUMN asistencia TYPE text USING 
  CASE 
    WHEN asistencia IS NULL THEN 'no_puedo_ir'
    WHEN asistencia::text = 'true' THEN 'asistire' 
    WHEN asistencia::text = 'false' THEN 'no_puedo_ir'
    ELSE asistencia::text
  END;

-- 3. Añadir restricción de valores para asistencia
ALTER TABLE public.rsvp
DROP CONSTRAINT IF EXISTS rsvp_asistencia_check;

ALTER TABLE public.rsvp
ADD CONSTRAINT rsvp_asistencia_check 
CHECK (asistencia IN ('asistire', 'no_puedo_ir'));

-- 4. Convertir menu a tipo text (si es necesario)
ALTER TABLE public.rsvp
ALTER COLUMN menu TYPE text;

-- 5. Establecer valores predeterminados para menu
UPDATE public.rsvp
SET menu = 'Clasico Argentino'
WHERE asistencia = 'asistire' AND (menu IS NULL OR menu = '');

-- 6. Verificar que los cambios se aplicaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rsvp' AND table_schema = 'public';

-- 7. Mostrar algunos registros de muestra para verificar
SELECT * FROM public.rsvp LIMIT 10;
