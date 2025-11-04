# App de Bodas Demo (Netlify Ready)

Demo de **Next.js + TypeScript + Tailwind + Framer Motion + Leaflet** con **API Routes** mockeadas (serverless) y **login por roles**.
Pensado para deploy en **Netlify**.

## Scripts
- `npm install`
- `npm run dev`

## Variables de entorno (opcional)
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

# Force redeploy jue 09 oct 2025 22:33:15 -03
