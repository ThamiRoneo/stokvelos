"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { TopAppBar } from "@/components/TopAppBar";
import { MESSAGES } from "@/lib/messages";
import { isValidEmail, isValidPassword } from "@/lib/password";

export type SignUpValues = {
  email: string;
  password: string;
  acceptedAge: boolean;
  acceptedPrivacy: boolean;
};

/** S2 — Sign Up. All copy comes from PRD §5 and the Stitch prompt. */
export function SignUp({
  onSubmit,
  onGoogle,
  onBack,
  loading = false,
  error,
  offline = false,
}: {
  onSubmit: (values: SignUpValues) => void;
  onGoogle: (consent: { acceptedAge: boolean; acceptedPrivacy: boolean }) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedAge, setAcceptedAge] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const consent = acceptedAge && acceptedPrivacy;
  const canSubmit =
    consent && isValidEmail(email) && isValidPassword(password) && !loading && !offline;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ email, password, acceptedAge, acceptedPrivacy });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <TopAppBar title="Sign Up" onBack={onBack} />
      <main className="flex-1 p-4">
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        {error && (
          <div className="mt-3">
            <Banner variant="error">{error}</Banner>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint={MESSAGES.passwordRule}
            error={password && !isValidPassword(password) ? MESSAGES.passwordRule : undefined}
          />

          <label className="flex min-h-touch items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-primary"
              checked={acceptedAge}
              onChange={(event) => setAcceptedAge(event.target.checked)}
            />
            <span>{MESSAGES.ageCheckbox}</span>
          </label>

          <label className="flex min-h-touch items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 accent-primary"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            <span>
              {MESSAGES.privacyPrefix}
              <Link href={MESSAGES.privacyLink} className="text-primary underline underline-offset-2">
                {MESSAGES.privacyLinkText}
              </Link>
            </span>
          </label>

          <Button type="submit" disabled={!canSubmit} loading={loading} className="w-full">
            Register
          </Button>

          <div className="flex items-center gap-3 text-xs text-text-secondary" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            disabled={!consent || loading || offline}
            onClick={() => onGoogle({ acceptedAge, acceptedPrivacy })}
          >
            Continue with Google
          </Button>
        </form>
      </main>
    </div>
  );
}
