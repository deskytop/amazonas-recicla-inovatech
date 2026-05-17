"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export function LoginForm() {
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
    <>
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
    </>
  );
}
