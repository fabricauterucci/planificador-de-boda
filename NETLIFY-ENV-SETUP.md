# 🔧 Configurar Variables de Entorno en Netlify

## ⚠️ Problema Actual
La API retorna **404 "Page not found"** porque faltan las variables de entorno de Supabase.

---

## 📝 Variables Requeridas

Necesitas configurar estas 3 variables en Netlify:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🎯 Paso a Paso

### 1. Ve al Dashboard de Netlify
```
https://app.netlify.com/sites/plan-boda/configuration/env
```

### 2. Click en "Environment Variables" (en el menú lateral)

### 3. Agregar cada variable:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Tu URL de Supabase (ejemplo: `https://xxxxx.supabase.co`)
- Scopes: ✅ All scopes

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Tu anon/public key de Supabase
- Scopes: ✅ All scopes

**Variable 3:**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Tu service role key de Supabase
- Scopes: ✅ All scopes

### 4. Trigger Redeploy

Después de agregar las variables:
1. Ve a: https://app.netlify.com/sites/plan-boda/deploys
2. Click en **"Trigger deploy"** → **"Deploy site"**
3. Espera 2-5 minutos

---

## 🔍 Dónde Encontrar las Keys de Supabase

### Opción 1: Dashboard de Supabase
1. Ve a: https://supabase.com/dashboard/project/YOUR_PROJECT
2. Click en **Settings** (⚙️) → **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Secret!)

### Opción 2: Archivo .env.local
Si ya tienes el proyecto corriendo localmente:

```bash
cat .env.local
```

Copia los valores de ahí.

---

## ✅ Verificar que Funcionó

Después del redeploy, prueba:

```bash
# Test endpoint público
curl https://plan-boda.netlify.app/api/event

# Debería retornar JSON con info del evento, NO un HTML 404
```

---

## 🚨 Alternativa: Usar Mock Data (Sin Supabase)

Si NO tienes Supabase configurado, la API usa el store in-memory (`/api/_store.ts`).

En ese caso, simplemente configura variables dummy:

```
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
SUPABASE_SERVICE_ROLE_KEY=dummy-service-key
```

La API seguirá funcionando con datos en memoria.

---

## 📱 Probar en Postman (Después de Configurar)

### 1. Importa la colección
```
postman/Wedding-App-API.postman_collection.json
```

### 2. Importa el entorno
```
postman/Wedding-App-Production.postman_environment.json
```

### 3. Activa el entorno "Wedding App - Production"

### 4. Ejecuta "Login - Admin"
```json
POST https://plan-boda.netlify.app/api/auth/login

Body:
{
  "email": "admin@ejemplo.com",
  "password": "admin@ejemplo.com",
  "role": "admin"
}
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

El token se guardará automáticamente en `{{auth_token}}`.

---

## 🎯 Checklist

- [ ] Variables de entorno configuradas en Netlify
- [ ] Redeploy triggered
- [ ] Deploy completado exitosamente
- [ ] Endpoint `/api/event` responde JSON (no 404)
- [ ] Login retorna token JWT
- [ ] Postman collection importada
- [ ] Token se guarda automáticamente

---

## 🆘 Si Sigue Sin Funcionar

1. **Verifica logs del deploy:**
   ```
   https://app.netlify.com/sites/plan-boda/deploys
   ```

2. **Revisa que el build pasó:**
   - Debe decir "Published" en verde
   - No debe haber errores rojos

3. **Verifica las variables:**
   - Ve a Environment Variables
   - Asegúrate que las 3 están configuradas
   - No deben tener espacios al inicio/final

4. **Prueba con cURL:**
   ```bash
   curl -v https://plan-boda.netlify.app/api/event
   ```
   - Si retorna HTML → Variables mal configuradas o falta redeploy
   - Si retorna JSON → ✅ Funciona!

---

## 💡 Nota sobre Passwords

En tu API mock (`/api/auth/login.ts`), la password NO se valida.
Solo sirve para generar el token JWT.

Puedes usar cualquier password en Postman, ejemplo:
```json
{
  "email": "admin@ejemplo.com",
  "password": "cualquier-cosa",
  "role": "admin"
}
```

Lo importante es el **email** y el **role**.
