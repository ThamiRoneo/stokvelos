"use client";

import { useState, useId, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { MESSAGES } from "@/lib/messages";

export type LogInValues = { email: string; password: string };

/** S3 — Log In. Matches visual design in docs/designs/S3.png exactly. */
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
  const [showPassword, setShowPassword] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const passwordId = useId();

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
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center px-4 py-10">
      {/* Banners */}
      {offline && (
        <div className="w-full max-w-sm mb-3">
          <Banner variant="alert">{MESSAGES.noConnection}</Banner>
        </div>
      )}
      {error && (
        <div className="w-full max-w-sm mb-3">
          <Banner variant="error">{error}</Banner>
        </div>
      )}
      {successBanner && (
        <div className="w-full max-w-sm mb-3">
          <Banner variant="success">{successBanner}</Banner>
        </div>
      )}

      {/* Logo + wordmark above card */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c8e6c9]">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="3" y="6" width="22" height="3" rx="1.5" fill="#1b5e20" />
            <rect x="3" y="12.5" width="22" height="3" rx="1.5" fill="#1b5e20" />
            <rect x="3" y="19" width="22" height="3" rx="1.5" fill="#1b5e20" />
            <rect x="18" y="4" width="5" height="20" rx="2.5" fill="#f9a825" opacity="0.9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          <span className="text-text">Stokvel</span>
          <span className="text-primary">OS</span>
        </h1>
        <p className="text-xs tracking-[0.15em] uppercase text-text-secondary">
          Collective Wealth Protocol
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text">Welcome back</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Access your collective savings and ledger
        </p>

        {/* Google button — FIRST, light blue tint */}
        <button
          type="button"
          disabled={loading || offline}
          onClick={onGoogle}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-text hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-5 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="mx-3 text-[11px] font-semibold tracking-widest text-text-secondary uppercase">
            Or continue with email
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Email — no leading icon */}
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="thabo@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password — label row has Forgot password? inline right */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor={passwordId}
                className="text-sm font-semibold text-text"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowReset((v) => !v)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-transparent bg-[#f3f4f6]/60 px-3.5 py-2.5 pr-11 text-sm text-text transition-colors placeholder:text-[#9ca3af] focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 cursor-pointer text-text-secondary hover:text-text"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* Inline forgot-password form */}
          {showReset && (
            <div className="space-y-3 rounded-xl border border-border bg-gray-50 p-3.5">
              <TextInput
                label="Email"
                type="email"
                placeholder="thabo@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={submitReset}
                disabled={!resetEmail}
              >
                Send reset link
              </Button>
              {resetSent && (
                <p role="status" className="text-xs font-medium text-success">
                  {MESSAGES.resetSent}
                </p>
              )}
            </div>
          )}

          {/* Log in CTA */}
          <Button
            type="submit"
            disabled={!email || !password || loading || offline}
            loading={loading}
            className="w-full"
          >
            Log in
          </Button>
        </form>

        {/* Footer link */}
        <p className="mt-5 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Trust footer below card */}
      <p className="mt-6 flex items-center gap-1.5 text-xs text-text-secondary">
        <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
        256-bit Rotational Ledger Encryption · PoS Protected
      </p>
    </div>
  );
}
