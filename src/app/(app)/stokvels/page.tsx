"use client";

import { useEffect, useState } from "react";
import { MyStokvels } from "@/components/screens/MyStokvels";
import { createClient } from "@/lib/supabase/client";
import { listMyStokvels } from "@/lib/api/stokvels";
import type { Stokvel } from "@/lib/api/types";


export default function MyStokvelsPage() {
  const [stokvels, setStokvels] = useState<Stokvel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await listMyStokvels(createClient());
      if (!active) return;
      if (result.ok) setStokvels(result.data);
      else setError(result.message);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <MyStokvels stokvels={stokvels} loading={loading} error={error} offline={offline} />
  );
}
