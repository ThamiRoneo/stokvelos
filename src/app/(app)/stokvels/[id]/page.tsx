import Link from "next/link";
import { TopAppBar } from "@/components/TopAppBar";

export default async function StokvelHomePlaceholder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <TopAppBar title="Stokvel" />
      <main className="space-y-3 p-4">
        <p className="text-sm text-text-secondary">Stokvel home is delivered in Phase 3.</p>
        <Link className="text-primary underline" href={`/stokvels/${id}/members`}>
          Members
        </Link>
        <br />
        <Link className="text-primary underline" href={`/stokvels/${id}/settings`}>
          Settings
        </Link>
      </main>
    </div>
  );
}
