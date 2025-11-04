// Script para verificar datos en Supabase
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

async function checkData() {
  console.log('\n📊 Verificando datos en Supabase...\n');
  
  // 1. Verificar usuarios
  const { data: users, error: usersError } = await supabaseAdmin
    .from('users')
    .select('*');
  
  if (usersError) {
    console.error('❌ Error al consultar users:', usersError);
  } else {
    console.log(`✅ Total usuarios: ${users?.length || 0}`);
    console.log('Usuarios:', users);
  }
  
  // 2. Verificar RSVPs
  const { data: rsvps, error: rsvpsError } = await supabaseAdmin
    .from('rsvp')
    .select('*');
  
  if (rsvpsError) {
    console.error('❌ Error al consultar rsvp:', rsvpsError);
  } else {
    console.log(`\n✅ Total RSVPs: ${rsvps?.length || 0}`);
    console.log('RSVPs:', rsvps);
  }
}

checkData().then(() => process.exit(0));
