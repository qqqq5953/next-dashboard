import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  /*
    The negative lookahead ensures that the path does not start with "api", "_next/static", "_next/image" or end with ".png".
  */
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};