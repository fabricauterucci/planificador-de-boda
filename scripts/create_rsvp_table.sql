-- Script para crear la tabla rsvp si no existe
CREATE TABLE IF NOT EXISTS public.rsvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asistencia TEXT NOT NULL CHECK (asistencia IN ('asistire', 'no_puedo_ir')),
  menu TEXT,
  comentario TEXT,
  
  UNIQUE(user_id)
);

-- Asegurar que la tabla tenga permisos de Row Level Security (RLS)
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla rsvp
-- 1. Los usuarios autenticados pueden ver sus propios RSVPs
CREATE POLICY "Usuario puede ver su propio RSVP" ON public.rsvp
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 2. Los usuarios autenticados pueden insertar sus propios RSVPs
CREATE POLICY "Usuario puede crear su propio RSVP" ON public.rsvp
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- 3. Los usuarios autenticados pueden actualizar sus propios RSVPs
CREATE POLICY "Usuario puede actualizar su propio RSVP" ON public.rsvp
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- 4. Los administradores pueden ver todos los RSVPs
CREATE POLICY "Admins pueden ver todos los RSVPs" ON public.rsvp
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'prometidos'
  );
