import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Route prefixes and who's allowed to see them.
// Anything not matched here is left completely untouched.
const ADMIN_ROLES = ["SUPER_ADMIN", "CARRIER_ADMIN", "DISPATCHER", "WAREHOUSE_MANAGER"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isDriverRoute = pathname.startsWith("/dashboard/driver");
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  if (!isDriverRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute) {
    const roles = (token.roles as string[]) ?? [];
    const hasAdminRole = roles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (isDriverRoute) {
    const isActingAsDriver = token.role === "DRIVER";
    const isApproved = token.driverStatus === "APPROVED";
    if (!isActingAsDriver || !isApproved) {
      return NextResponse.redirect(new URL("/dashboard/become-driver", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/driver/:path*", "/dashboard/admin/:path*"],
};