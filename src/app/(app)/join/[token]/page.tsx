"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { JoinViaInvite } from "@/components/screens/JoinViaInvite";
import { createClient } from "@/lib/supabase/client";
import { joinInvite, previewInvite } from "@/lib/api/invites";
import type { InvitePreview } from "@/lib/api/types";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [preview, setPreview] = useState<InvitePreview>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await previewInvite(createClient(), token);
      if (!active) return;
      if (result.ok) setPreview(result.data);
      else setError(result.message);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <JoinViaInvite
      preview={preview}
      loading={loading}
      error={error}
      offline={offline}
      onBack={() => router.push("/stokvels")}
      onJoin={async () => {
        setLoading(true);
        const result = await joinInvite(createClient(), token);
        setLoading(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push(`/stokvels/${result.data}`);
      }}
    />
  );
}
