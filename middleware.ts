import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isDriverRoute = pathname.startsWith("/dashboard/driver");
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  if (!isDriverRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = req.auth;

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute) {
    const roles = (token.user?.roles as string[]) ?? [];
    const hasAdminRole = roles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isDriverRoute) {
    const isActingAsDriver = token.user?.role === "DRIVER";
    const isApproved = token.user?.driverStatus === "APPROVED";
    if (!isActingAsDriver || !isApproved) {
      return NextResponse.redirect(new URL("/dashboard/become-driver", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/driver/:path*", "/dashboard/admin/:path*"],
};