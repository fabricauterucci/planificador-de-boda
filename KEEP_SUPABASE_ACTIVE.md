# Mantener Supabase Activo

Para evitar que tu proyecto de Supabase sea pausado por inactividad, este proyecto incluye varias opciones:

## Opciones disponibles:

### 1. 🚀 GitHub Actions (Recomendado)
- **Archivo**: `.github/workflows/keep-supabase-active.yml`
- **Frecuencia**: Cada domingo a las 10:00 AM UTC
- **Configuración**:
  1. Sube tu código a GitHub
  2. En tu repositorio, ve a Settings > Secrets and variables > Actions
  3. Agrega estos secrets:
     - `NEXT_PUBLIC_SUPABASE_URL`: https://dgqgvnqzxkkhcooqcjax.supabase.co
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [tu clave anónima]

### 2. 💻 Scripts locales
```bash
# Ping con Node.js
npm run ping-supabase

# Ping con Bash
npm run ping-supabase-bash
```

### 3. ⏰ Cron job local
Para automatizar en tu sistema local:
```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecutar cada domingo a las 10:00 AM):
0 10 * * 0 cd /home/fkut/Escritorio/planificador-de-boda-main && npm run ping-supabase

# O con path absoluto:
0 10 * * 0 /usr/bin/node /home/fkut/Escritorio/planificador-de-boda-main/scripts/ping-supabase.js
```

### 4. 🌐 Servicio online
También puedes usar servicios como:
- **Uptime Robot** (gratuito)
- **Better Uptime** 
- **Pingdom**

Configurar para hacer ping a: `https://dgqgvnqzxkkhcooqcjax.supabase.co/rest/v1/`

## Frecuencias recomendadas:
- **Mínimo**: Cada 7 días
- **Recomendado**: Cada 3-4 días
- **Conservador**: Diario

## Verificar que funciona:
```bash
# Probar manualmente
npm run ping-supabase

# Deberías ver:
# ✅ Supabase está activo y respondiendo
# 🌐 Status HTTP: 200
```