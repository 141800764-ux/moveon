import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CARRIER_ADMIN",
  "DISPATCHER",
  "WAREHOUSE_MANAGER",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as any)?.role;
  const isLoggedIn = !!req.auth;

  // Public routes — always allow
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/track") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Not logged in — redirect to sign in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Root redirect
  if (pathname === "/") {
    if (role === "DRIVER") return NextResponse.redirect(new URL("/driver", req.url));
    if (role === "CUSTOMER") return NextResponse.redirect(new URL("/customer", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect admin portal
  if (pathname.startsWith("/dashboard") && !ADMIN_ROLES.includes(role)) {
    if (role === "DRIVER") return NextResponse.redirect(new URL("/driver", req.url));
    return NextResponse.redirect(new URL("/customer", req.url));
  }

  // Protect driver portal
  if (pathname.startsWith("/driver") && role !== "DRIVER") {
    if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/customer", req.url));
  }

  // Protect customer portal
  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    if (role === "DRIVER") return NextResponse.redirect(new URL("/driver", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};