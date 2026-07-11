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
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <Sidebar user={session.user} />

      {/* Main content — offset for sidebar on desktop, top bar on mobile */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}