import { createServerClient } from "@supabase/ssr";

async function test() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [] } }
  );

  console.log("Fetching...");
  try {
    const { data, error } = await supabase.from('projects').select('*').limit(1);
    console.log("Projects:", data);
    console.log("Error:", error);
  } catch (err) {
    console.error("Exception:", err);
  }
}

test();
