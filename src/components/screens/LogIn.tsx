"use client";

import { useState, type FormEvent } from "react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";

export type LogInValues = { email: string; password: string };

/** S3 — Log In, including the inline password reset form (§18 C5). */
export function LogIn({
  onSubmit,
  onGoogle,
  onReset,
  onBack,
  loading = false,
  error,
  offline = false,
  successBanner,
}: {
  onSubmit: (values: LogInValues) => void;
  onGoogle: () => void;
  onReset: (email: string) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  successBanner?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password || loading || offline) return;
    onSubmit({ email, password });
  }

  function submitReset(event: FormEvent) {
    event.preventDefault();
    if (!resetEmail) return;
    onReset(resetEmail);
    setResetSent(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <TopAppBar title="Log In" onBack={onBack} />
      <main className="flex-1 p-4">
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {error && (
          <div className="mt-3">
            <Banner variant="error">{error}</Banner>
          </div>
        )}
        {successBanner && (
          <div className="mt-3">
            <Banner variant="success">{successBanner}</Banner>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-border bg-surface p-5">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowReset((current) => !current)}
            className="min-h-touch text-sm font-medium text-primary underline underline-offset-2"
          >
            Forgot password?
          </button>

          {showReset && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <TextInput
                label="Email"
                type="email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
              />
              <Button variant="secondary" onClick={submitReset} className="w-full">
                Send reset link
              </Button>
              {resetSent && (
                <p role="status" className="text-sm text-success">
                  {MESSAGES.resetSent}
                </p>
              )}
            </div>
          )}

          <Button type="submit" disabled={!email || !password || loading || offline} loading={loading} className="w-full">
            Log in
          </Button>

          <div className="flex items-center gap-3 text-xs text-text-secondary" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="secondary" className="w-full" disabled={loading || offline} onClick={onGoogle}>
            Continue with Google
          </Button>
        </form>
      </main>
    </div>
  );
}
