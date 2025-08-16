# Wedding App Demo (Netlify Ready)

Demo de **Next.js + TypeScript + Tailwind + Framer Motion + Leaflet** con **API Routes** mockeadas (serverless) y **login por roles**.
Pensado para deploy en **Netlify**.

## Scripts
- `npm install`
- `npm run dev`
- Conectar repo a Netlify y desplegar.

## Variables de entorno (opcional)
- `JWT_SECRET` (si no se setea, usa un default inseguro para demo).
- `NEXT_PUBLIC_EVENT_DATE` para cambiar la fecha del contador.

## Rutas
- `/` Landing con parallax, contador, mapa y CTAs.
- `/login` Login de prueba por rol (`prometidos`, `invitado`, `admin`).
- `/rsvp` Confirmación de asistencia + elección de menú.
- `/menu` Ver menú.
- `/dashboard` Panel para prometidos/admin (mock).

## API (mock)
- `POST /api/auth/login` { email, password, role }
- `GET/POST /api/guests`
- `GET/POST /api/menu`
- `GET /api/event`

> Nota: para demo los datos viven en memoria (se reinician en cada deploy). Cambiar fácil a DB real.


## 🔗 Conexión con Supabase

1. Crear proyecto en [https://supabase.com](https://supabase.com)
2. Configurar variables de entorno en Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional, solo para funciones de servidor)
3. Actualizar los endpoints de API para usar el cliente de Supabase desde `lib/supabaseClient.ts`.
