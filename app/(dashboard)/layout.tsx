import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/sign-in");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar user={session.user} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}