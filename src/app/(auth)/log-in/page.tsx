"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "@/components/screens/LogIn";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset, signIn, signInWithGoogle } from "@/lib/api/auth";
import { MESSAGES } from "@/lib/messages";

function LogInContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  const created = params.get("created") === "1";
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/stokvels";

  return (
    <LogIn
      loading={loading}
      error={error}
      offline={offline}
      successBanner={created ? MESSAGES.accountCreated : undefined}
      onBack={() => router.push("/")}
      onGoogle={async () => {
        setError(undefined);
        setLoading(true);
        const result = await signInWithGoogle(createClient(), {
          acceptedAge: true,
          acceptedPrivacy: true,
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        });
        setLoading(false);
        if (!result.ok) setError(result.message);
      }}
      onReset={async (email) => {
        await requestPasswordReset(createClient(), email);
      }}
      onSubmit={async (values) => {
        setError(undefined);
        setLoading(true);
        const result = await signIn(createClient(), values);
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push(next);
      }}
    />
  );
}

export default function LogInPage() {
  return (
    <Suspense>
      <LogInContent />
    </Suspense>
  );
}
