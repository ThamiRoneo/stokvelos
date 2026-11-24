"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignUp } from "@/components/screens/SignUp";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle, signUp } from "@/lib/api/auth";


export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <SignUp
      loading={loading}
      error={error}
      offline={offline}
      onBack={() => router.push("/")}
      onGoogle={async (consent) => {
        setError(undefined);
        setLoading(true);
        const result = await signInWithGoogle(createClient(), {
          ...consent,
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        setLoading(false);
        if (!result.ok) setError(result.message);
      }}
      onSubmit={async (values) => {
        setError(undefined);
        setLoading(true);
        const result = await signUp(createClient(), values);
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push("/log-in?created=1");
      }}
    />
  );
}
