/**
 * NextAuth.js API Route Handler
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G7 - Authentication
 *
 * Handles all NextAuth.js authentication requests
 * Route: /api/auth/*
 *
 * Supported routes:
 * - /api/auth/signin - Sign in page
 * - /api/auth/signout - Sign out
 * - /api/auth/callback/google - Google OAuth callback
 * - /api/auth/session - Get current session
 * - /api/auth/csrf - Get CSRF token
 */

import { GET, POST } from "@/auth";

export { GET, POST };
