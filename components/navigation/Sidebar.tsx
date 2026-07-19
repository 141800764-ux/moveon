"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Car,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Route,
  ClipboardCheck,
  Menu,
  X,
  DollarSign,
  Map,
  MessageSquare,
} from "lucide-react";

const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER"];

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/dashboard/shipments", label: "Shipments", icon: Truck },
  { href: "/dashboard/drivers", label: "Drivers", icon: Users },
  { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
  { href: "/dashboard/routes", label: "Routes", icon: Route },
  { href: "/dashboard/hubs", label: "Hubs", icon: MapPin },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/payouts", label: "Payouts", icon: DollarSign },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/map", label: "Live Map", icon: Map },
  { href: "/dashboard/chat", label: "Customer Chat", icon: MessageSquare },
];

const adminNavItems = [
  {
    href: "/dashboard/admin/drivers",
    label: "Driver Applications",
    icon: ClipboardCheck,
  },
];

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const userRoles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
  const isAdmin = ADMIN_ROLES.some((r) => userRoles.includes(r));

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 lg:hidden"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/MoveOnLogo.png"
            alt="MoveOn"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span
            className="text-lg font-bold"
            style={{ color: "var(--gold)" }}
          >
            MoveOn
          </span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl transition hover:bg-white/5"
          style={{ color: "var(--foreground)" }}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "rgba(200,146,42,0.15)" }}
          >
            <Image
              src="/images/MoveOnLogo.png"
              alt="MoveOn"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xl font-black tracking-tight"
              style={{ color: "var(--gold)" }}
            >
              MoveOn
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              Logistics Platform
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/5 transition"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active
                    ? "rgba(200,146,42,0.15)"
                    : "transparent",
                  color: active ? "var(--gold)" : "var(--muted-foreground)",
                  border: active
                    ? "1px solid rgba(200,146,42,0.3)"
                    : "1px solid transparent",
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div
                className="pt-3 mt-2 px-3 text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: "var(--muted-foreground)",
                  borderTop: "1px solid var(--border)",
                }}
              >
                Admin
              </div>
              {adminNavItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: active
                        ? "rgba(200,146,42,0.15)"
                        : "transparent",
                      color: active
                        ? "var(--gold)"
                        : "var(--muted-foreground)",
                      border: active
                        ? "1px solid rgba(200,146,42,0.3)"
                        : "1px solid transparent",
                    }}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={34}
                height={34}
                className="rounded-full shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--gold)", color: "white" }}
              >
                {user?.name?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <p
                className="text-xs truncate capitalize"
                style={{ color: "var(--muted-foreground)" }}
              >
                {user?.role?.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-red-500/10"
            style={{ color: "var(--muted-foreground)" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}