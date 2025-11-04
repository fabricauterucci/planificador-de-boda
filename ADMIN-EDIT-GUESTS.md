# 🔧 Admin: Editar Asistencia y Menú de Invitados

## ✨ Nueva Funcionalidad

Ahora el **admin puede modificar la asistencia y menú de cualquier invitado** usando el endpoint PUT `/api/guests`.

---

## 🎯 Cómo Funciona

### Usuario Normal (Invitado/Prometido)
- Solo puede modificar **su propio RSVP**
- El email se toma del token JWT
- **NO** necesita enviar `email` en el body

### Admin
- Puede modificar **cualquier RSVP**
- **Debe enviar** el `email` del invitado a modificar en el body
- Tiene permisos especiales

---

## 📝 Ejemplo: Admin Modifica Invitado

### 1. Login como Admin

```bash
POST /api/auth/login

Body:
{
  "email": "admin@ejemplo.com",
  "password": "admin@ejemplo.com",
  "role": "admin"
}

Respuesta:
{
  "token": "eyJhbGc...",
  "role": "admin"
}
```

### 2. Modificar Asistencia de un Invitado

```bash
PUT /api/guests
Authorization: Bearer {token_admin}

Body:
{
  "email": "invitado@ejemplo.com",    ← Email del invitado a modificar
  "name": "Carlos Rodríguez",
  "attending": false,                  ← Cambiar asistencia
  "menu": "Vegano",                    ← Cambiar menú
  "allergies": "Gluten"
}

Respuesta:
{
  "ok": true,
  "guest": {
    "email": "invitado@ejemplo.com",
    "name": "Carlos Rodríguez",
    "attending": false,
    "menu": "Vegano",
    "allergies": "Gluten"
  }
}
```

---

## 🧪 Pruebas en Postman

### Request: Admin Modifica Invitado

**Método:** PUT  
**URL:** `{{base_url}}/api/guests`

**Headers:**
```
Authorization: Bearer {{auth_token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "prometido@ejemplo.com",
  "name": "Ana López",
  "attending": true,
  "menu": "Clasico Argentino",
  "allergies": "Ninguna"
}
```

**Pre-requisito:**
- Ejecutar primero "Login - Admin" para obtener el token

---

## 📊 Casos de Uso

### Caso 1: Invitado confirma pero no puede asistir
```json
{
  "email": "invitado@ejemplo.com",
  "name": "Pedro García",
  "attending": false,           ← Admin marca como no asistente
  "menu": "Clasico Argentino",
  "allergies": "Ninguna"
}
```

### Caso 2: Cambiar preferencia de menú
```json
{
  "email": "prometido@ejemplo.com",
  "name": "María Fernández",
  "attending": true,
  "menu": "Vegano",            ← Admin cambia de Clásico a Vegano
  "allergies": "Lactosa"
}
```

### Caso 3: Actualizar alergias
```json
{
  "email": "invitado2@ejemplo.com",
  "name": "Juan Pérez",
  "attending": true,
  "menu": "Clasico Argentino",
  "allergies": "Mariscos, Frutos secos"  ← Admin agrega alergias
}
```

---

## 🔐 Seguridad

### Validaciones Implementadas:

✅ **Solo admin puede modificar otros usuarios**
- Si no eres admin, solo puedes modificar tu propio RSVP
- El campo `email` en el body solo funciona para admin

✅ **Requiere autenticación**
- Necesitas token JWT válido

✅ **Validación de datos**
- `name`: requerido (string)
- `attending`: requerido (boolean)
- `menu`: requerido (string)
- `allergies`: opcional (string)
- `email`: requerido solo para admin

---

## 🧩 Comparación: Usuario vs Admin

### Usuario Normal (PUT)
```json
// NO incluye email - usa el del JWT
{
  "name": "Carlos Rodríguez",
  "attending": true,
  "menu": "Vegano",
  "allergies": "Gluten"
}
```
→ Modifica solo su propio RSVP

### Admin (PUT)
```json
// Incluye email del invitado a modificar
{
  "email": "invitado@ejemplo.com",  ← Campo adicional
  "name": "Carlos Rodríguez",
  "attending": false,
  "menu": "Clasico Argentino",
  "allergies": "Ninguna"
}
```
→ Modifica el RSVP de cualquier usuario

---

## 🎯 Flujo Completo en Postman

### Paso 1: Preparar
1. Importa `Wedding-App-API.postman_collection.json`
2. Importa `Wedding-App-Production.postman_environment.json`
3. Activa el entorno "Production"

### Paso 2: Crear Invitados
```
1. Login - Invitado (invitado@ejemplo.com)
2. Add Guest (RSVP) - crea su RSVP
3. Login - Prometido (prometido@ejemplo.com)
4. Add Guest (RSVP) - crea su RSVP
```

### Paso 3: Admin Modifica
```
5. Login - Admin
6. Update RSVP - incluye email del invitado a modificar
7. Get Guests - verificar que cambió
```

---

## ⚡ Respuestas de la API

### Éxito (200)
```json
{
  "ok": true,
  "guest": {
    "email": "invitado@ejemplo.com",
    "name": "Carlos Rodríguez",
    "attending": false,
    "menu": "Vegano",
    "allergies": "Gluten"
  }
}
```

### Error: RSVP no existe (404)
```json
{
  "error": "No existe RSVP para este usuario"
}
```

### Error: Datos inválidos (400)
```json
{
  "error": "Datos inválidos"
}
```

### Error: Sin autenticación (401)
```json
{
  "error": "Token inválido o expirado"
}
```

---

## 📚 Endpoints Relacionados

| Método | Endpoint | Admin | Usuario | Descripción |
|--------|----------|-------|---------|-------------|
| GET | `/api/guests` | Ve todos | Ve su RSVP | Listar invitados |
| POST | `/api/guests` | ✅ | ✅ | Crear RSVP |
| PUT | `/api/guests` | Modifica cualquiera* | Modifica propio | Actualizar RSVP |
| DELETE | `/api/guests` | ✅ | ❌ | Eliminar invitado |

*Admin debe incluir `email` en el body

---

## 🚀 Listo para Producción

Esta funcionalidad está lista para:
- ✅ Localhost (`http://localhost:3000`)
- ✅ Producción (`https://plan-boda.netlify.app`)

Solo asegúrate de hacer login como admin primero! 🎉
