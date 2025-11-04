# 🎯 Guía de Postman para Entrevista Técnica

## 📦 Contenido de la Carpeta

Esta carpeta contiene todo lo necesario para demostrar las APIs de tu proyecto:

- **`Wedding-App-API.postman_collection.json`** - Colección completa con todos los endpoints
- **`Wedding-App-Local.postman_environment.json`** - Variables para desarrollo local
- **`Wedding-App-Production.postman_environment.json`** - Variables para producción (Netlify)

---

## 🚀 Configuración Rápida

### 1. Importar en Postman

#### Opción A: Interfaz Gráfica
1. Abre Postman
2. Clic en **Import** (esquina superior izquierda)
3. Arrastra los 3 archivos JSON o selecciónalos
4. Clic en **Import**

#### Opción B: Desde la Línea de Comandos (Postman CLI)
```bash
# Si tienes Postman CLI instalado
postman collection import Wedding-App-API.postman_collection.json
```

### 2. Seleccionar Entorno

En Postman:
1. En la esquina superior derecha, selecciona el dropdown de entornos
2. Elige **"Wedding App - Local"** para desarrollo
3. O **"Wedding App - Production"** si ya está desplegado en Netlify

---

## 🎬 Demo para la Entrevista - Flujo Recomendado

## 🎬 Demo para la Entrevista - Flujo Recomendado

### **Paso 1: URL de la API** ⚡

La aplicación está desplegada en producción:

```
https://plan-boda.netlify.app
```

**Nota:** Para desarrollo local, ejecuta `npm run dev` y la app estará en `http://localhost:3000`. Puedes cambiar la URL base en las variables de entorno de Postman.

---

### **Paso 2: Demostrar CRUD Completo** 📝

La API ahora tiene **operaciones CRUD completas**:

| Operación | Método | Endpoint | Requiere Auth |
|-----------|--------|----------|---------------|
| **C**reate | POST | `/api/guests` | ❌ No |
| **R**ead | GET | `/api/guests` | ✅ Sí |
| **U**pdate | PUT | `/api/guests` | ✅ Sí (Admin/Prometido) |
| **D**elete | DELETE | `/api/guests` | ✅ Sí (Admin/Prometido) |

---

### **Paso 2: Demostrar Endpoint Público** 🌍

**Request:** `GET Event Info`
- **Endpoint:** `/api/event`
- **Qué mostrar:** Este endpoint es público, no requiere autenticación
- **Explicar:** Retorna información del evento (nombre, fecha, lugar, coordenadas)

```json
// Respuesta esperada:
{
  "name": "Sofía & Martín — Boda",
  "date": "2025-10-18T18:00:00-03:00",
  "venue": "Salón \"Luz de Luna\" — Av. Libertador 2540, Buenos Aires",
  "coords": {
    "lat": -34.5711,
    "lng": -58.4233
  }
}
```

---

### **Paso 3: Demostrar Autenticación** 🔐

**Request:** `Login - Invitado`
- **Endpoint:** `POST /api/auth/login`
- **Qué mostrar:**
  - El sistema de roles (invitado, prometido, admin)
  - JWT token generado automáticamente
  - Script automático que guarda el token en variables de entorno

**Explicar:**
> "Implementé un sistema de autenticación basado en JWT con 3 roles diferentes. El script de Postman automáticamente extrae el token de la respuesta y lo guarda para usarlo en las siguientes peticiones."

```json
// Body de ejemplo:
{
  "email": "invitado@ejemplo.com",
  "password": "password123",
  "role": "invitado"
}

// Respuesta:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "invitado"
}
```

---

### **Paso 4: Demostrar Autorización** 🛡️

**A) Sin Autenticación (Error 401):**

**Request:** `Get Guests (Sin Auth - 401)`
- **Qué mostrar:** La API protege endpoints sensibles
- **Resultado esperado:** `401 Unauthorized`

**B) Con Autenticación:**

**Request:** `Get Guests (Authenticated)`
- **Qué mostrar:**
  - El header `Authorization: Bearer {{auth_token}}` se agrega automáticamente
  - Diferentes respuestas según el rol

**Explicar:**
> "Los invitados solo ven el conteo de confirmaciones, mientras que prometidos y admin ven la lista completa. Esto demuestra control de acceso basado en roles (RBAC)."

```json
// Respuesta como INVITADO:
{
  "role": "invitado",
  "count": 2
}

// Respuesta como PROMETIDO/ADMIN:
{
  "role": "prometido",
  "guests": [
    {
      "name": "Ana López",
      "attending": true,
      "menu": "Vegetariano"
    },
    {
      "name": "Diego Pérez",
      "attending": false,
      "menu": "Clasico Argentino"
    }
  ]
}
```

---

### **Paso 5: Demostrar Validación de Datos** ✅

**A) Request Válido:**

**Request:** `Add Guest (RSVP)`
```json
{
  "name": "Carlos Rodríguez",
  "attending": true,
  "menu": "Clasico Argentino",
  "allergies": "Ninguna"
}
```

**Respuesta:** `{ "ok": true }`

**B) Request Inválido:**

**Request:** `Add Guest - Validation Error`
```json
{
  "name": "Test User"
  // Faltan campos requeridos
}
```

**Respuesta:** `400 Bad Request` con mensaje de error

**Explicar:**
> "Implementé validación server-side que verifica que todos los campos requeridos estén presentes antes de procesar la solicitud."

---

### **Paso 6: Operaciones CRUD Completas** 📝

**Demostración de CREATE, READ, UPDATE, DELETE:**

#### GET - Read (Listar)
**Request:** `Get Guests (Authenticated)`
- **Método:** GET
- **Qué mostrar:** Lista actual de invitados

#### POST - Create (Crear)
**Request:** `Add Guest (RSVP)`
- **Método:** POST
- **Qué mostrar:** Agregar nuevo invitado
- **Luego:** GET para verificar que se agregó

#### PUT - Update (Actualizar)
**Request:** `Update Guest (PUT)`
- **Método:** PUT
- **Qué mostrar:** Cambiar menú de "Vegetariano" a "Vegano"
- **Explicar:** Usa índice para identificar invitado (0 = primero)
- **Luego:** GET para verificar el cambio

#### DELETE - Delete (Eliminar)
**Request:** `Delete Guest`
- **Método:** DELETE
- **Requiere:** Autenticación Admin/Prometido
- **Qué mostrar:** Eliminar un invitado
- **Luego:** GET para verificar eliminación

**Request:** `Delete Guest - Forbidden (Invitado)`
- **Qué mostrar:** Error 403 si un invitado intenta eliminar
- **Explicar:** Control de acceso granular por roles

**Explicar:**
> "Implementé CRUD completo con validación en cada endpoint. PUT y DELETE están protegidos no solo con autenticación sino también con autorización por roles. Los invitados no pueden modificar o eliminar datos."

---

### **Paso 7: Más Operaciones** 🍽️

---

## 🎤 Puntos Clave para Mencionar en la Entrevista

### 1. **Arquitectura de API Routes**
- "Usé Next.js API Routes en lugar de un servidor Express separado"
- "Cada archivo en `/pages/api` se convierte automáticamente en un endpoint"
- "Esto reduce la complejidad y aprovecha el deployment serverless de Netlify"

### 2. **Seguridad**
- "JWT para autenticación stateless"
- "Sistema de roles (RBAC) para control de acceso"
- "Validación de datos en server-side"
- "Headers de autorización estándar"

### 3. **Mejores Prácticas**
- "Manejo apropiado de métodos HTTP (GET, POST)"
- "Códigos de estado HTTP correctos (200, 400, 401, 405)"
- "Validación de entrada de datos"
- "Respuestas JSON consistentes"

### 4. **Testing con Postman**
- "Scripts automáticos para extracción de tokens"
- "Variables de entorno para facilitar testing en múltiples ambientes"
- "Casos de prueba tanto de éxito como de error"

---

## 🔄 Cambiar Entre Roles Durante la Demo

Para mostrar diferentes niveles de acceso:

1. **Como Invitado:** Ejecuta `Login - Invitado` → `Get Guests` (solo count)
2. **Como Prometido:** Ejecuta `Login - Prometido` → `Get Guests` (lista completa)
3. **Como Admin:** Ejecuta `Login - Admin` → `Get Guests` (lista completa)

Cada login actualiza automáticamente el token en las variables de entorno.

---

## 📊 Orden Sugerido de Demostración

1. ✅ **Event Info** (público)
2. 🔐 **Login** (mostrar autenticación)
3. ❌ **Get Guests sin auth** (mostrar error 401)
4. ✅ **Get Guests con auth** (mostrar autorización por roles)
5. ➕ **Add Guest** (mostrar validación)
6. 📋 **Menu Operations** (mostrar CRUD)

**Tiempo estimado:** 5-7 minutos

---

## 🌐 Entornos Disponibles

**Producción (por defecto):**
- URL: `https://plan-boda.netlify.app`
- Entorno: "Wedding App - Local" (ya configurado con URL de producción)
- Entorno: "Wedding App - Production" (idéntico, para claridad)

**Desarrollo Local (opcional):**
1. Ejecuta `npm run dev` en la raíz del proyecto
2. Edita la variable `base_url` en Postman a `http://localhost:3000`
3. ¡Prueba contra tu servidor local!

---

## 💡 Tips Adicionales

### Mostrar Profesionalismo

- **Organización:** Las carpetas en Postman (Auth, Event, Guests, Menu) muestran estructura
- **Documentación:** Cada request tiene una descripción clara
- **Automatización:** Scripts que manejan tokens automáticamente
- **Coverage:** Incluye casos de éxito y error

### Si te Preguntan por Supabase

> "En esta demo uso un store en memoria para simplicidad, pero la arquitectura está diseñada para conectarse fácilmente a Supabase. Solo necesitaría reemplazar el store con llamadas al cliente de Supabase en cada endpoint."

### Bonus: Exportar Resultados

Después de la demo puedes:
```bash
# Correr todos los tests desde CLI
postman collection run Wedding-App-API.postman_collection.json \
  -e Wedding-App-Local.postman_environment.json
```

---

## 🐛 Troubleshooting

**Error: ECONNREFUSED**
- Asegúrate de que `npm run dev` esté corriendo
- Verifica que el puerto sea 3000

**Error: 401 Unauthorized**
- Ejecuta primero un request de Login
- Verifica que el token se haya guardado en las variables de entorno

**Token no se guarda automáticamente**
- Ve a la pestaña "Tests" del request de login
- Verifica que el script esté presente

---

## 📞 Preguntas Frecuentes de Entrevistadores

**P: ¿Por qué Next.js API Routes y no Express?**
> "Next.js API Routes son ideales para aplicaciones serverless. Se despliegan como funciones Lambda en Netlify, lo que reduce costos y mejora la escalabilidad. Además, mantiene todo el stack en un solo framework."

**P: ¿Cómo manejarías la autenticación en producción?**
> "En producción usaría Supabase Auth que provee JWT, refresh tokens, y manejo de sesiones robusto. También implementaría rate limiting y CORS apropiado."

**P: ¿Qué mejoras harías?**
> "Agregaría: validación con Zod/Yup, rate limiting, logging estructurado, tests automatizados con Jest, OpenAPI/Swagger para documentación, y migración del store en memoria a Supabase PostgreSQL."

---

¡Buena suerte en tu entrevista! 🚀
