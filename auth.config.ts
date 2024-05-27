import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true; // Allow Access to dashboard
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl)); // Redirect authenticated users to dashboard page when trying to access login page
      }

      return true; // Allow Access to Other Pages:
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;