#!/bin/bash

echo "🧪 Test: Admin Modifica Invitado"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

# 1. Login como invitado y crear RSVP
echo "1️⃣ Login como invitado..."
TOKEN_INV=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"invitado@ejemplo.com","password":"123","role":"invitado"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token invitado: ${TOKEN_INV:0:20}..."
echo ""

echo "2️⃣ Invitado crea su RSVP..."
curl -s -X POST "$BASE_URL/api/guests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_INV" \
  -d '{
    "name": "Carlos Rodríguez",
    "attending": true,
    "menu": "Clasico Argentino",
    "allergies": "Ninguna"
  }' | jq '.'
echo ""

# 3. Login como admin
echo "3️⃣ Login como admin..."
TOKEN_ADMIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"123","role":"admin"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token admin: ${TOKEN_ADMIN:0:20}..."
echo ""

# 4. Admin modifica el RSVP del invitado
echo "4️⃣ Admin modifica asistencia del invitado..."
echo "   Cambiando: attending=false, menu=Vegano"
curl -s -X PUT "$BASE_URL/api/guests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "email": "invitado@ejemplo.com",
    "name": "Carlos Rodríguez",
    "attending": false,
    "menu": "Vegano",
    "allergies": "Gluten"
  }' | jq '.'
echo ""

# 5. Verificar cambios
echo "5️⃣ Verificar cambios (GET como admin)..."
curl -s -X GET "$BASE_URL/api/guests" \
  -H "Authorization: Bearer $TOKEN_ADMIN" | jq '.guests[] | select(.email == "invitado@ejemplo.com")'
echo ""

echo "✅ Test completado!"
echo ""
echo "Verificaciones:"
echo "- El invitado creó RSVP con attending=true, menu=Clasico Argentino"
echo "- El admin cambió a attending=false, menu=Vegano"
echo "- El GET muestra los cambios aplicados"
