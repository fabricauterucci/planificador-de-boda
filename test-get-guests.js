// Script para probar el GET de guests
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Leer .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testGetGuests() {
  console.log('\n📋 Probando GET guests con diferentes queries...\n');
  
  // 1. Query simple sin JOIN
  console.log('1️⃣ Query simple (sin JOIN):');
  const { data: simple, error: simpleError } = await supabaseAdmin
    .from('rsvp')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('  Resultado:', simple?.length || 0, 'registros');
  if (simpleError) console.error('  Error:', simpleError);
  
  // 2. Query con INNER JOIN
  console.log('\n2️⃣ Query con !inner JOIN:');
  const { data: inner, error: innerError } = await supabaseAdmin
    .from('rsvp')
    .select('*, users!inner(nombre, rol)')
    .order('created_at', { ascending: false });
  
  console.log('  Resultado:', inner?.length || 0, 'registros');
  if (innerError) console.error('  Error:', innerError);
  if (inner && inner.length > 0) {
    console.log('  Primer registro:', JSON.stringify(inner[0], null, 2));
  }
  
  // 3. Query con notación anidada
  console.log('\n3️⃣ Query con notación anidada:');
  const { data: nested, error: nestedError } = await supabaseAdmin
    .from('rsvp')
    .select(`
      id,
      user_id,
      asistencia,
      menu,
      comentario,
      created_at,
      users (
        nombre,
        rol
      )
    `)
    .order('created_at', { ascending: false });
  
  console.log('  Resultado:', nested?.length || 0, 'registros');
  if (nestedError) console.error('  Error:', nestedError);
  if (nested && nested.length > 0) {
    console.log('  Primer registro:', JSON.stringify(nested[0], null, 2));
  }
}

testGetGuests().then(() => process.exit(0));
