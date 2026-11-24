"use client";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { MESSAGES } from "@/lib/messages";

/** M5 — Invite Member. Link + WhatsApp share + copy (PRD §11, Stitch M5). */
export function InviteMember({
  open,
  link,
  onClose,
  onCopy,
  loading = false,
  error,
  offline = false,
}: {
  open: boolean;
  link: string;
  onClose: () => void;
  onCopy?: (link: string) => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
}) {
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(link)}`;

  return (
    <Modal open={open} title="Invite Member" onClose={onClose}>
      <div className="space-y-3">
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}

        <label htmlFor="invite-link" className="block">link</label>
        <input
          id="invite-link"
          role="textbox"
          readOnly
          value={link}
          className="min-h-touch w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text"
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={loading} onClick={() => onCopy?.(link)}>
            Copy
          </Button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-touch items-center justify-center rounded-lg border border-primary bg-surface px-4 py-2 text-sm font-medium text-primary"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  );
}
