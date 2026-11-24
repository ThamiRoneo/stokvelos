"use client";

import { Banner } from "@/components/Banner";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { MESSAGES } from "@/lib/messages";

/** M7 — Remove Member confirm. BR7 block message comes from the API/DB. */
export function RemoveMember({
  open,
  memberName,
  onConfirm,
  onCancel,
  loading = false,
  error,
  offline = false,
}: {
  open: boolean;
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  offline?: boolean;
}) {
  return (
    <Modal open={open} title="Remove Member" onClose={onCancel}>
      <div className="space-y-3">
        <p className="text-sm">Remove {memberName}?</p>
        {error && <Banner variant="error">{error}</Banner>}
        {offline && <Banner variant="alert">{MESSAGES.noConnection}</Banner>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {MESSAGES.cancelButton}
          </Button>
          <Button variant="destructive" disabled={Boolean(error)} loading={loading} onClick={onConfirm}>
            Remove
          </Button>
        </div>
      </div>
    </Modal>
  );
}
