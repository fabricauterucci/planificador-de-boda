const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function pingSupabase() {
  console.log('🔄 Manteniendo activo Supabase...');
  console.log('📅 Fecha:', new Date().toISOString());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Hacer una consulta simple - intenta obtener información de la base de datos
    const { data, error } = await supabase
      .from('_supabase_migrations') // Esta tabla existe por defecto
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla no encontrada (normal)
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Supabase está activo y respondiendo');
    }

    // También hacer ping al endpoint de salud
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    console.log('🌐 Status HTTP:', response.status);
    console.log('🏁 Ping completado exitosamente');

  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  pingSupabase();
}

module.exports = { pingSupabase };