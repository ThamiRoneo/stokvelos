import { redirect } from "next/navigation";
import { Welcome } from "@/components/screens/Welcome";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/stokvels");
  return <Welcome />;
}
