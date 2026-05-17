import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Se ja autenticado, vai direto pro app
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/app");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold text-primary">
            Entre na sua conta
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesse com sua conta Google em um clique
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
