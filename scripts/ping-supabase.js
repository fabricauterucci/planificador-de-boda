const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function pingSupabase() {
  console.log('🔄 Manteniendo activo Supabase...');
  console.log('📅 Fecha:', new Date().toISOString());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Hacer una consulta simple - intenta obtener información de la base de datos
    console.log('📡 Pinging REST API endpoint...');
    const { data, error } = await supabase
      .from('_supabase_migrations') // Esta tabla existe por defecto
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no encontrada (normal)
      console.log('ℹ️  Info:', error.message);
    } else {
      console.log('✅ REST API está activo y respondiendo');
    }

    // También hacer ping al endpoint de salud
    console.log('🏥 Pinging health endpoint...');
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    console.log('🌐 HTTP Status:', response.status);
    
    if (response.ok || response.status === 200) {
      console.log('✅ Supabase está completamente activo');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 Ping completado exitosamente');

  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  pingSupabase();
}

module.exports = { pingSupabase };