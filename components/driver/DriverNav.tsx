"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Route, User, LogOut } from "lucide-react";

const navItems = [
  { href: "/driver", label: "My Route", icon: Route },
  { href: "/driver/profile", label: "Profile", icon: User },
];

export default function DriverNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-1.5 text-sm font-medium transition"
          style={{
            color: pathname === item.href
              ? "var(--gold)"
              : "var(--muted-foreground)",
          }}
        >
          <item.icon size={16} />
          {item.label}
        </Link>
      ))}
      <button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        className="flex items-center gap-1.5 text-sm font-medium transition hover:text-red-400"
        style={{ color: "var(--muted-foreground)" }}
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}