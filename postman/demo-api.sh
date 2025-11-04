#!/bin/bash

# 🎯 Script de Demostración de API - Wedding App
# Uso: ./demo-api.sh [URL]
# Ejemplo: ./demo-api.sh https://plan-boda.netlify.app
# Ejemplo: ./demo-api.sh http://localhost:3000

# Configuración
BASE_URL=${1:-https://plan-boda.netlify.app}
DELAY=1.5

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir headers de sección
print_section() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

# Función para hacer requests con formato bonito
make_request() {
    local method=$1
    local endpoint=$2
    local description=$3
    shift 3
    
    echo -e "${YELLOW}→${NC} ${description}"
    echo -e "${GREEN}${method}${NC} ${BASE_URL}${endpoint}"
    
    if command -v jq &> /dev/null; then
        curl -s -X "$method" "${BASE_URL}${endpoint}" "$@" | jq 2>/dev/null || echo "(Sin respuesta JSON)"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}" "$@" | python -m json.tool 2>/dev/null || echo "(Sin respuesta JSON)"
    fi
    
    sleep $DELAY
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╦ ╦┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ╔═╗┌─┐┌─┐  ╔╦╗┌─┐┌┬┐┌─┐
║║║├┤  ││ ││││││ ┬  ╠═╣├─┘│    ║║├┤ ││││ │
╚╩╝└─┘─┴┘─┴┘┴┘└┘└─┘  ╩ ╩┴  └─┘  ═╩╝└─┘┴ ┴└─┘
EOF
echo -e "${NC}"
echo -e "API Base URL: ${GREEN}${BASE_URL}${NC}\n"

# ============================================================================
# 1. ENDPOINT PÚBLICO
# ============================================================================
print_section "1️⃣  ENDPOINT PÚBLICO - Información del Evento"
make_request GET "/api/event" "Obtener datos del evento (sin autenticación)"

# ============================================================================
# 2. INTENTAR ACCESO SIN AUTENTICACIÓN
# ============================================================================
print_section "2️⃣  SEGURIDAD - Acceso sin Autenticación"
echo -e "${YELLOW}→${NC} Intentando acceder a invitados sin token..."
echo -e "${GREEN}GET${NC} ${BASE_URL}/api/guests"
RESPONSE=$(curl -s ${BASE_URL}/api/guests)
if echo "$RESPONSE" | grep -q "Unauthorized\|error"; then
    echo -e "${RED}✗ Acceso denegado (esperado)${NC}"
    echo "$RESPONSE" | (command -v jq &> /dev/null && jq || python -m json.tool)
else
    echo -e "${GREEN}✓ Respuesta recibida${NC}"
    echo "$RESPONSE"
fi
sleep $DELAY

# ============================================================================
# 3. AUTENTICACIÓN - ROL INVITADO
# ============================================================================
print_section "3️⃣  AUTENTICACIÓN - Login como Invitado"
echo -e "${YELLOW}→${NC} Realizando login como invitado..."
echo -e "${GREEN}POST${NC} ${BASE_URL}/api/auth/login"
echo -e 'Body: {"email":"invitado@ejemplo.com","password":"password123","role":"invitado"}'

TOKEN_INVITADO=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invitado@ejemplo.com","password":"password123","role":"invitado"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$TOKEN_INVITADO" ]; then
    echo -e "${GREEN}✓ Token obtenido:${NC} ${TOKEN_INVITADO:0:50}..."
else
    echo -e "${RED}✗ Error al obtener token${NC}"
    exit 1
fi
sleep $DELAY

# ============================================================================
# 4. AUTORIZACIÓN POR ROLES - INVITADO
# ============================================================================
print_section "4️⃣  CONTROL DE ACCESO - Invitado (solo count)"
echo -e "${YELLOW}→${NC} Accediendo a invitados con rol 'invitado'"
echo -e "${GREEN}GET${NC} ${BASE_URL}/api/guests"
echo -e "Header: ${BLUE}Authorization: Bearer [token]${NC}"
curl -s ${BASE_URL}/api/guests \
  -H "Authorization: Bearer ${TOKEN_INVITADO}" \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 5. AUTENTICACIÓN - ROL ADMIN
# ============================================================================
print_section "5️⃣  AUTENTICACIÓN - Login como Admin"
echo -e "${YELLOW}→${NC} Realizando login como admin..."
echo -e "${GREEN}POST${NC} ${BASE_URL}/api/auth/login"

TOKEN_ADMIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"password123","role":"admin"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -n "$TOKEN_ADMIN" ]; then
    echo -e "${GREEN}✓ Token admin obtenido:${NC} ${TOKEN_ADMIN:0:50}..."
else
    echo -e "${RED}✗ Error al obtener token${NC}"
    exit 1
fi
sleep $DELAY

# ============================================================================
# 6. AUTORIZACIÓN POR ROLES - ADMIN
# ============================================================================
print_section "6️⃣  CONTROL DE ACCESO - Admin (lista completa)"
echo -e "${YELLOW}→${NC} Accediendo a invitados con rol 'admin'"
echo -e "${GREEN}GET${NC} ${BASE_URL}/api/guests"
curl -s ${BASE_URL}/api/guests \
  -H "Authorization: Bearer ${TOKEN_ADMIN}" \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 7. VALIDACIÓN DE DATOS - ERROR
# ============================================================================
print_section "7️⃣  VALIDACIÓN - Datos Incompletos (400)"
echo -e "${YELLOW}→${NC} Intentando agregar invitado con datos inválidos..."
echo -e "${GREEN}POST${NC} ${BASE_URL}/api/guests"
echo -e 'Body: {"name":"Test User"} ${RED}(faltan campos)${NC}'
curl -s -X POST ${BASE_URL}/api/guests \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}' \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 8. OPERACIÓN EXITOSA - POST
# ============================================================================
print_section "8️⃣  OPERACIÓN EXITOSA - Agregar Invitado"
echo -e "${YELLOW}→${NC} Agregando invitado con datos completos..."
echo -e "${GREEN}POST${NC} ${BASE_URL}/api/guests"
echo -e 'Body: {"name":"María González","attending":true,"menu":"Vegetariano","allergies":"Lactosa"}'
curl -s -X POST ${BASE_URL}/api/guests \
  -H "Content-Type: application/json" \
  -d '{"name":"María González","attending":true,"menu":"Vegetariano","allergies":"Lactosa"}' \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 9. VERIFICAR CAMBIOS
# ============================================================================
print_section "9️⃣  VERIFICACIÓN - Confirmar que se agregó"
echo -e "${YELLOW}→${NC} Obteniendo lista actualizada de invitados..."
curl -s ${BASE_URL}/api/guests \
  -H "Authorization: Bearer ${TOKEN_ADMIN}" \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 10. MENÚ - GET
# ============================================================================
print_section "🔟  MENÚ - Obtener Opciones"
make_request GET "/api/menu" "Listando opciones de menú disponibles"

# ============================================================================
# 11. MENÚ - POST
# ============================================================================
print_section "1️⃣1️⃣  MENÚ - Agregar Opción"
echo -e "${YELLOW}→${NC} Agregando nueva opción de menú..."
echo -e "${GREEN}POST${NC} ${BASE_URL}/api/menu"
echo -e 'Body: {"value":"Sin Gluten"}'
curl -s -X POST ${BASE_URL}/api/menu \
  -H "Content-Type: application/json" \
  -d '{"value":"Sin Gluten"}' \
  | (command -v jq &> /dev/null && jq || python -m json.tool)
sleep $DELAY

# ============================================================================
# 12. VERIFICAR MENÚ ACTUALIZADO
# ============================================================================
print_section "1️⃣2️⃣  VERIFICACIÓN - Menú Actualizado"
make_request GET "/api/menu" "Verificando que se agregó la nueva opción"

# ============================================================================
# RESUMEN
# ============================================================================
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}                    ✅ DEMO COMPLETADA                           ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Endpoints probados:${NC}"
echo "  ✓ GET  /api/event - Información pública"
echo "  ✓ POST /api/auth/login - Autenticación con roles"
echo "  ✓ GET  /api/guests - Autorización basada en roles"
echo "  ✓ POST /api/guests - Validación y CRUD"
echo "  ✓ GET  /api/menu - Operaciones de lectura"
echo "  ✓ POST /api/menu - Operaciones de escritura"

echo -e "\n${BLUE}Características demostradas:${NC}"
echo "  ✓ API Routes serverless (Next.js)"
echo "  ✓ Autenticación JWT"
echo "  ✓ Control de acceso basado en roles (RBAC)"
echo "  ✓ Validación de datos"
echo "  ✓ Códigos HTTP apropiados (200, 400, 401, 405)"
echo "  ✓ Operaciones CRUD"

echo -e "\n${YELLOW}💡 Tip:${NC} Importa la colección de Postman para testing interactivo"
echo -e "   Ubicación: ${BLUE}./postman/Wedding-App-API.postman_collection.json${NC}\n"
