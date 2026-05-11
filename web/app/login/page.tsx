"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
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

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full font-mono uppercase tracking-wider"
          size="lg"
        >
          {loading ? "Conectando..." : "Continuar com Google"}
        </Button>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
      </div>
    </main>
  );
}
