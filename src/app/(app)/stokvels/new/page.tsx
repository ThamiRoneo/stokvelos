"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateStokvel } from "@/components/screens/CreateStokvel";
import { createClient } from "@/lib/supabase/client";
import { createStokvel } from "@/lib/api/stokvels";

export default function NewStokvelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <CreateStokvel
      loading={loading}
      error={error}
      offline={offline}
      onBack={() => router.push("/stokvels")}
      onSubmit={async (values) => {
        setError(undefined);
        setLoading(true);
        const result = await createStokvel(createClient(), values);
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push(`/stokvels/${result.data.id}`);
      }}
    />
  );
}
