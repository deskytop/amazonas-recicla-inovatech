import { createClient } from "@/lib/supabase/server";
import { PublicHeaderNav } from "./public-header-nav";

export async function PublicHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <PublicHeaderNav isAuthenticated={!!user} />;
}
