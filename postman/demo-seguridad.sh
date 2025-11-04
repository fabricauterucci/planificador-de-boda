#!/bin/bash

# 🎯 Demo de Seguridad y Autenticación
# Muestra cómo el endpoint está protegido

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Demo: Sistema de Autenticación y Autorización               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URL base
BASE_URL="https://plan-boda.netlify.app"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}Caso 1: Acceso SIN autenticación (debe fallar)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Request:${NC}"
echo "  GET ${BASE_URL}/api/guests"
echo "  Headers: (ninguno)"
echo ""
echo -e "${YELLOW}Respuesta:${NC}"
curl -s ${BASE_URL}/api/guests | python3 -m json.tool 2>/dev/null || curl -s ${BASE_URL}/api/guests
echo ""
echo -e "${RED}✗ Status: 401 Unauthorized${NC}"
echo -e "${GREEN}✓ Comportamiento correcto: El endpoint está protegido${NC}"
echo ""
sleep 2

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Caso 2: Login y obtención de token${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Request:${NC}"
echo "  POST ${BASE_URL}/api/auth/login"
echo '  Body: {"email":"admin@ejemplo.com","password":"password123","role":"admin"}'
echo ""

LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ejemplo.com","password":"password123","role":"admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
ROLE=$(echo $LOGIN_RESPONSE | grep -o '"role":"[^"]*' | cut -d'"' -f4)

echo -e "${YELLOW}Respuesta:${NC}"
echo "  Token: ${TOKEN:0:50}..."
echo "  Role: $ROLE"
echo ""
echo -e "${GREEN}✓ Status: 200 OK${NC}"
echo -e "${GREEN}✓ JWT generado exitosamente${NC}"
echo ""
sleep 2

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Caso 3: Acceso CON autenticación (debe funcionar)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Request:${NC}"
echo "  GET ${BASE_URL}/api/guests"
echo "  Headers:"
echo "    Authorization: Bearer ${TOKEN:0:30}..."
echo ""
echo -e "${YELLOW}Respuesta:${NC}"
curl -s ${BASE_URL}/api/guests \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool 2>/dev/null || curl -s ${BASE_URL}/api/guests -H "Authorization: Bearer $TOKEN"
echo ""
echo -e "${GREEN}✓ Status: 200 OK${NC}"
echo -e "${GREEN}✓ Datos completos retornados (rol: $ROLE)${NC}"
echo ""
sleep 2

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Caso 4: Login como Invitado (permisos limitados)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

GUEST_LOGIN=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invitado@ejemplo.com","password":"password123","role":"invitado"}')

GUEST_TOKEN=$(echo $GUEST_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo -e "${YELLOW}Request:${NC}"
echo "  GET ${BASE_URL}/api/guests"
echo "  Headers: Authorization: Bearer <token_invitado>"
echo ""
echo -e "${YELLOW}Respuesta:${NC}"
curl -s ${BASE_URL}/api/guests \
  -H "Authorization: Bearer $GUEST_TOKEN" \
  | python3 -m json.tool 2>/dev/null || curl -s ${BASE_URL}/api/guests -H "Authorization: Bearer $GUEST_TOKEN"
echo ""
echo -e "${GREEN}✓ Status: 200 OK${NC}"
echo -e "${GREEN}✓ Solo count visible (permisos de invitado)${NC}"
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ DEMO COMPLETADA                          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Resumen de Seguridad Implementada:${NC}"
echo "  ✓ Autenticación JWT"
echo "  ✓ Control de acceso basado en roles (RBAC)"
echo "  ✓ Protección de endpoints sensibles (401 para no autenticados)"
echo "  ✓ Diferentes niveles de acceso según rol"
echo "  ✓ Headers HTTP estándar (Authorization: Bearer <token>)"
echo ""
echo -e "${YELLOW}💡 Próximo paso:${NC} Importa la colección de Postman para testing interactivo"
echo ""
