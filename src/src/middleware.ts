/**
 * Next.js Middleware - Route Protection
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G7 - Authentication
 *
 * Protects authenticated routes and redirects unauthorized users
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

/**
 * Middleware function
 * Runs on every request matching the config.matcher
 */
export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get session from auth()
  const session = await auth();

  // Public routes (no authentication required)
  const publicRoutes = [
    "/",
    "/api/auth",
    "/api/webhook/zalo",
    "/auth/signin",
    "/auth/error",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  const protectedRoutes = [
    "/dashboard",
    "/api/shops",
    "/api/bookings",
    "/api/chatlogs",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // No session - redirect to signin
    if (!session) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Has session - allow access
    return NextResponse.next();
  }

  // Default: allow all other routes
  return NextResponse.next();
});

/**
 * Matcher configuration
 * Specifies which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
