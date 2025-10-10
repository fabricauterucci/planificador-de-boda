#!/bin/bash

# Script para mantener activo Supabase
# Uso: ./scripts/ping-supabase.sh

# Cargar variables de entorno
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

echo "🔄 Manteniendo activo Supabase..."
echo "📅 Fecha: $(date)"

# Hacer consulta a Supabase
response=$(curl -s -w "%{http_code}" -X GET \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
    -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY")

http_code="${response: -3}"

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 401 ]; then
    echo "✅ Supabase está activo (código: $http_code)"
else
    echo "❌ Error al conectar con Supabase (código: $http_code)"
fi

echo "🏁 Ping completado"