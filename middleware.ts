import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check access verification - FIRST PRIORITY
  const accessVerified = request.cookies.get("access_verified")?.value === "true";

  // Always allow access to these routes (no restrictions)
  const publicRoutes = [
    "/access",
    "/api/verify-access",
    "/_next/",
    "/api/trpc/",
    "/favicon.ico"
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 🔐 STEP 1: Check Access Code First (for entire website)
  if (!accessVerified) {
    // If trying to access any page without access code, redirect to access gate
    const accessUrl = new URL("/access", request.url);
    return NextResponse.redirect(accessUrl);
  }

  // 🔑 STEP 2: After access code is verified, check authentication for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Allow access to auth pages after access code verification
  if (
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Public booking pages (/{username} and /{username}/{slug})
  const publicBookingPattern = /^\/[^\/]+(\/.+)?$/;
  if (publicBookingPattern.test(pathname) && !pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Protect dashboard and other routes - require login
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)",
  ],
};
