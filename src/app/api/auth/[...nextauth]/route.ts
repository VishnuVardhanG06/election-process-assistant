import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { config } from "@/constants/config";
import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

/** Extended session type that includes the Google OAuth access token. */
export interface ExtendedSession extends Session {
  accessToken?: string;
  refreshToken?: string;
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: config.nextAuthSecret,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }): Promise<JWT> {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }): Promise<ExtendedSession> {
      const extendedSession = session as ExtendedSession;
      extendedSession.accessToken = token.accessToken as string | undefined;
      extendedSession.refreshToken = token.refreshToken as string | undefined;
      return extendedSession;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

// Export the auth handler and helpers
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
