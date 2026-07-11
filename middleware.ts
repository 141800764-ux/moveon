import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "CARRIER_ADMIN",
  "DISPATCHER",
  "WAREHOUSE_MANAGER",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always allow
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/track") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Try secure cookie first (production), fall back to regular (development)
  let token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName: "__Secure-authjs.session-token",
  });

  if (!token) {
    token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: "authjs.session-token",
    });
  }

  const isLoggedIn = !!token;
  const role = (token?.role as string) ?? "";

  // Not logged in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Root redirect
  if (pathname === "/") {
    if (role === "DRIVER")
      return NextResponse.redirect(new URL("/driver", req.url));
    if (role === "CUSTOMER")
      return NextResponse.redirect(new URL("/customer", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect admin portal
  if (pathname.startsWith("/dashboard") && !ADMIN_ROLES.includes(role)) {
    if (role === "DRIVER")
      return NextResponse.redirect(new URL("/driver", req.url));
    return NextResponse.redirect(new URL("/customer", req.url));
  }

  // Protect driver portal
  if (pathname.startsWith("/driver") && role !== "DRIVER") {
    if (ADMIN_ROLES.includes(role))
      return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/customer", req.url));
  }

  // Protect customer portal
  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    if (role === "DRIVER")
      return NextResponse.redirect(new URL("/driver", req.url));
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};