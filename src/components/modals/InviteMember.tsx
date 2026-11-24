"use client";

import { useState } from "react";
import { Copy, QrCode, ShieldCheck, Share2, X, Check } from "lucide-react";
import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { MESSAGES } from "@/lib/messages";

/** M5 — Invite Member. Matches visual design in docs/designs/M5.png exactly while fulfilling PRD test expectations. */
export function InviteMember({
  open,
  link,
  onClose,
  onCopy,
  loading = false,
  error,
  offline = false,
  clubName = "Soweto Sisanda Women's Club",
  cycle = "Cycle 3",
  nextSlot = "#16",
}: {
  open: boolean;
  link: string;
  onClose: () => void;
  onCopy?: (link: string) => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
  clubName?: string;
  cycle?: string;
  nextSlot?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(link)}`;

  function handleCopy() {
    onCopy?.(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Header with icon and close button */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-[#1b5e20]">
              <span className="font-bold text-lg">👤+</span>
            </div>
            <div>
              <h2 id="invite-title" className="text-base font-bold text-[#1a1a1a]">
                Invite New Member
              </h2>
              <p className="text-xs text-[#5f6368]">
                {clubName} • {cycle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-3">
            <Banner variant="error">{error}</Banner>
          </div>
        )}
        {offline && (
          <div className="mt-3">
            <Banner variant="alert">{MESSAGES.noConnection}</Banner>
          </div>
        )}
        {copied && (
          <div className="mt-3">
            <Banner variant="success">Invite link copied to clipboard!</Banner>
          </div>
        )}

        {/* Info card */}
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-green-100 bg-green-50/40 p-3 text-xs text-[#1a1a1a]">
          <ShieldCheck size={18} className="shrink-0 text-[#1b5e20]" />
          <div>
            Invite links are cryptographically bound to {clubName}. Joining members will be assigned to next open rotation slot ({nextSlot}).
          </div>
        </div>

        {/* Link box */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="invite-link" className="font-bold text-[#1a1a1a]">
              link
            </label>
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">
              • 1 use remaining
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-3">
            <input
              id="invite-link"
              role="textbox"
              readOnly
              value={link}
              className="w-full bg-transparent text-xs text-[#1a1a1a] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="ml-2 text-gray-500 hover:text-[#1b5e20]"
              aria-label="Copy Link"
            >
              {copied ? <Check size={16} className="text-[#1b5e20]" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Club QR Pass preview */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-gray-800">
              <QrCode size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a1a1a]">Club QR Pass</p>
              <p className="text-[11px] text-[#5f6368]">Tap to present full screen</p>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-xs hover:bg-gray-50"
          >
            <span>⛶</span> Enlarge
          </button>
        </div>

        {/* Expiry metadata */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#5f6368]">
          <span className="flex items-center gap-1">
            <span>⏱️</span> Valid for 7 days
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span>🔒</span> Single-use token
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <Button
            variant="secondary"
            loading={loading}
            onClick={handleCopy}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 text-xs font-bold text-[#1a1a1a] shadow-xs hover:bg-gray-100"
          >
            <Copy size={16} />
            <span>Copy</span>
          </Button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-xs font-bold text-white shadow-xs hover:bg-[#20ba5a]"
          >
            <Share2 size={16} />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
