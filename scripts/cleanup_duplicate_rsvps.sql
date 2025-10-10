-- Script para limpiar registros duplicados de RSVP
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Ver cuántos registros hay por usuario
SELECT 
  user_id, 
  COUNT(*) as num_registros,
  array_agg(id) as ids,
  array_agg(asistencia) as asistencias,
  array_agg(menu) as menus,
  array_agg(created_at) as fechas
FROM 
  public.rsvp
GROUP BY 
  user_id
HAVING 
  COUNT(*) > 1
ORDER BY 
  COUNT(*) DESC;

-- 2. Crear tabla temporal con los registros más recientes para cada usuario
CREATE TEMP TABLE latest_rsvps AS
WITH ranked_rsvps AS (
  SELECT 
    id, 
    user_id,
    asistencia,
    menu,
    comentario,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM 
    public.rsvp
)
SELECT id, user_id, asistencia, menu, comentario, created_at
FROM ranked_rsvps
WHERE rn = 1;

-- 3. Eliminar todos los registros actuales (opcional - comentar para verificar primero)
-- DELETE FROM public.rsvp;

-- 4. Insertar solo los registros más recientes (opcional - comentar para verificar primero)
-- INSERT INTO public.rsvp (id, user_id, asistencia, menu, comentario, created_at)
-- SELECT id, user_id, asistencia, menu, comentario, created_at
-- FROM latest_rsvps;

-- 5. Alternativa más segura: eliminar solo los duplicados
DELETE FROM public.rsvp
WHERE id IN (
  WITH ranked_rsvps AS (
    SELECT 
      id, 
      user_id,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM 
      public.rsvp
  )
  SELECT id
  FROM ranked_rsvps
  WHERE rn > 1
);

-- 6. Verificar el resultado final
SELECT 
  user_id, 
  COUNT(*) as num_registros
FROM 
  public.rsvp
GROUP BY 
  user_id
HAVING 
  COUNT(*) > 1;
