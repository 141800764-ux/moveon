"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User, LogOut, Home, MessageSquare } from "lucide-react";

const navItems = [
  { href: "/customer", label: "Home", icon: Home },
  { href: "/customer/orders", label: "My Orders", icon: Package },
  { href: "/customer/chat", label: "Support", icon: MessageSquare },
  { href: "/customer/profile", label: "Profile", icon: User },
];

export default function CustomerNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 text-sm font-medium transition"
            style={{ color: pathname === item.href ? "var(--gold)" : "var(--muted-foreground)" }}
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

      {/* Mobile bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 sm:hidden"
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition"
              style={{ color: active ? "var(--gold)" : "var(--muted-foreground)", background: active ? "rgba(200,146,42,0.1)" : "transparent" }}
            >
              <item.icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition hover:bg-red-500/10"
          style={{ color: "var(--muted-foreground)" }}
        >
          <LogOut size={20} />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );
}