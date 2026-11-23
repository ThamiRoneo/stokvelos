export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">StokvelOS</h1>
      <p className="max-w-md text-muted-foreground">
        A shared, tamper-evident ledger and payout scheduler for stokvels.
      </p>
    </main>
  );
}
