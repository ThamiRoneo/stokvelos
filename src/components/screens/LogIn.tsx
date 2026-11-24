"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/TextInput";
import { TopAppBar } from "@/components/TopAppBar";
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8fafc]">
      <TopAppBar title="Log In" onBack={onBack} showUser={false} />

      <main className="flex-1 px-4 py-4 sm:px-6">
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

        <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          {/* Header pill & icon */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-[#1b5e20]">
              <span className="font-bold text-lg">≡</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-[#5f6368]">
              <span>STOKVELOS • SECURITY</span>
              <span className="flex items-center gap-1 text-[#1b5e20]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1b5e20]" />
                PWA Ledger
              </span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#1a1a1a]">Welcome back</h2>
          <p className="mt-1 text-xs text-[#5f6368]">
            Sign in to access your communal ledger & pools
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="thabo@example.com"
              leadingIcon={<Mail size={18} />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <div>
              <TextInput
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="stokvelSecure2024!"
                leadingIcon={<Lock size={18} />}
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowReset((current) => !current)}
                  className="text-xs font-medium text-[#1b5e20] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {showReset && (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                />
                <Button variant="secondary" onClick={submitReset} className="w-full">
                  Send reset link
                </Button>
                {resetSent && (
                  <p role="status" className="text-xs font-medium text-[#2e7d32]">
                    {MESSAGES.resetSent}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={!email || !password || loading || offline}
              loading={loading}
              className="w-full bg-[#1b5e20] hover:bg-[#2e7d32]"
            >
              Log in
            </Button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-[#5f6368]">
                or
              </span>
            </div>

            <Button
              variant="secondary"
              className="w-full border border-gray-200 bg-white font-medium text-[#1a1a1a] hover:bg-gray-50"
              disabled={loading || offline}
              onClick={onGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="pt-2 text-center text-xs text-[#5f6368]">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-semibold text-[#1b5e20] hover:underline">
                Sign up
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-[#5f6368]">
              <ShieldCheck size={14} className="text-[#1b5e20]" />
              <span>End-to-end encrypted rotational ledger audit</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
