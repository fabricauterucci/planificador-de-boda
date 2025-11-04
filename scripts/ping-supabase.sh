#!/bin/bash

# Script para mantener activo Supabase
# Uso: ./scripts/ping-supabase.sh

# Cargar variables de entorno
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

echo "🔄 Manteniendo activo Supabase..."
echo "📅 Fecha: $(date)"

# Hacer ping al endpoint REST API
echo "📡 Pinging REST API endpoint..."
response=$(curl -s -w "%{http_code}" -X GET \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY")

http_code="${response: -3}"

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 401 ]; then
    echo "✅ REST API está activo (código: $http_code)"
else
    echo "❌ Error al conectar con REST API (código: $http_code)"
fi

# Hacer ping al health endpoint
echo "🏥 Pinging health endpoint..."
health_response=$(curl -s -w "%{http_code}" -X GET \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/health" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" 2>/dev/null || echo "000")

health_code="${health_response: -3}"

if [ "$health_code" = "000" ]; then
    echo "ℹ️  Health endpoint no disponible (esto es normal)"
else
    echo "✅ Health endpoint respondió (código: $health_code)"
fi

echo "🏁 Ping completado exitosamente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"