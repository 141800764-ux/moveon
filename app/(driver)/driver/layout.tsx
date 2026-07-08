import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DriverNav from "@/components/driver/DriverNav";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/driver" className="flex items-center gap-2">
          <Image
            src="/images/MoveOnLogo.png"
            alt="MoveOn"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-bold text-lg" style={{ color: "var(--gold)" }}>
            MoveOn Driver
          </span>
        </Link>
        <DriverNav user={session.user} />
      </nav>
      <main className="pt-20 px-6 pb-12 max-w-2xl mx-auto">
        {children}
      </main>
    </div>
  );
}