"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StokvelSettings } from "@/components/screens/StokvelSettings";
import { createClient } from "@/lib/supabase/client";
import { deleteStokvel, getStokvel, listMembers, setRotationOrder, updateStokvel } from "@/lib/api/stokvels";
import type { Member, Stokvel } from "@/lib/api/types";
import { MESSAGES } from "@/lib/messages";

export default function SettingsPage() {
  const params = useParams<{ id: string }>();
  const stokvelId = params.id;
  const router = useRouter();
  const [stokvel, setStokvel] = useState<Stokvel>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    let active = true;
    (async () => {
      const client = createClient();
      const [stokvelResult, memberResult] = await Promise.all([
        getStokvel(client, stokvelId),
        listMembers(client, stokvelId),
      ]);
      if (!active) return;
      if (stokvelResult.ok) setStokvel(stokvelResult.data);
      else setError(stokvelResult.message);
      if (memberResult.ok) setMembers(memberResult.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [stokvelId]);

  if (loading || !stokvel) {
    return (
      <div className="p-4 text-sm text-text-secondary">{loading ? "Loading…" : error ?? MESSAGES.couldNotLoad}</div>
    );
  }

  return (
    <StokvelSettings
      stokvel={stokvel}
      members={members}
      loading={saving}
      error={error}
      offline={offline}
      successBanner={success}
      onBack={() => router.push(`/stokvels/${stokvelId}`)}
      onSave={async (values) => {
        setError(undefined);
        setSuccess(undefined);
        setSaving(true);
        const client = createClient();
        const updated = await updateStokvel(client, stokvelId, values);
        if (!updated.ok) {
          setSaving(false);
          setError(updated.message);
          return;
        }
        const order = await setRotationOrder(client, stokvelId, values.rotationOrder);
        setSaving(false);
        if (!order.ok) {
          setError(order.message);
          return;
        }
        setStokvel({ ...updated.data, rotationOrder: values.rotationOrder });
        setSuccess(MESSAGES.saved);
      }}
      onDelete={async () => {
        setError(undefined);
        setSaving(true);
        const result = await deleteStokvel(createClient(), stokvelId);
        setSaving(false);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.push("/stokvels");
      }}
    />
  );
}
