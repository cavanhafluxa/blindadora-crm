const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('../.env.local')) {
  dotenv.config({ path: '../.env.local' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAccess() {
  console.log("Testing access to Supabase project:", supabaseUrl);
  
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  
  if (error) {
    console.error("Error accessing 'organizations' table:", error.message);
  } else {
    console.log("SUCCESS! Successfully connected to 'organizations' table.");
    console.log("Data exists:", data.length > 0);
  }
}

testAccess();
