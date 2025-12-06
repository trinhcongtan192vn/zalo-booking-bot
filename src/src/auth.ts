/**
 * NextAuth.js Configuration
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G7 - Authentication
 *
 * Handles user authentication with Google OAuth and Drizzle ORM adapter
 */

import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";

/**
 * Module augmentation for NextAuth types
 * Adds custom fields to Session
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * NextAuth configuration
 *
 * NOTE: @auth/drizzle-adapter requires additional tables in the database:
 * - users (already exists)
 * - accounts (for OAuth provider accounts)
 * - sessions (for session management)
 * - verification_tokens (for email verification)
 *
 * Run: npx drizzle-kit generate to create migration for these tables
 * Or manually add them to schema.ts
 */
export const authOptions = {
  // Database adapter
  adapter: DrizzleAdapter(db),

  // Authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  // Callbacks
  callbacks: {
    /**
     * Session callback - Add user ID to session
     * Called whenever session is checked
     */
    async session({ session, user }: any) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },

    /**
     * JWT callback - Add user ID to token
     * Called whenever JWT is created or updated
     */
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },

  // Pages
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Session strategy
  session: {
    strategy: "database" as const,
  },

  // Secret for JWT signing
  secret: process.env.AUTH_SECRET,

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};

/**
 * NextAuth instance
 * Export handlers for App Router
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);

/**
 * Export auth function for middleware and server components
 */
export { auth as getServerSession };
