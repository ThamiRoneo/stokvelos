import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/log-in");

  // Derive display name and initials from user metadata or email
  const fullName: string =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "User";
  const parts = fullName.trim().split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-background">
      <AppNav
        userName={parts[0] ?? fullName}
        userInitials={initials}
        userRole="Pool Treasurer"
      />
      {/* pb-14 md:pb-0 reserves space for the fixed bottom nav on mobile */}
      <div className="flex flex-1 flex-col min-w-0 pb-14 md:pb-0">
        {children}
      </div>
    </div>
  );
}
