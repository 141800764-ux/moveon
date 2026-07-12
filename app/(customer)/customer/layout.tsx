import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CustomerNav from "@/components/customer/CustomerNav";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/customer" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/MoveOnLogo.png"
            alt="MoveOn"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-lg" style={{ color: "var(--gold)" }}>
            MoveOn
          </span>
        </Link>
        <CustomerNav user={session.user} />
      </nav>

      {/* pb-24 on mobile for bottom nav, pb-12 on desktop */}
      <main className="pt-20 px-4 sm:px-6 pb-24 sm:pb-12 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}