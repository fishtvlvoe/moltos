import GoogleProvider from 'next-auth/providers/google';
import type { AuthOptions } from 'next-auth';

// T010: NextAuth 設定 — Google OAuth 含 Gmail / YouTube readonly 權限
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // 要求離線存取以取得 refresh token
          scope:
            'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/youtube.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    // 首次登入時將 access_token / refresh_token 寫入 JWT
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    // 將 JWT 內的 token 掛載到 session，讓 client 端可讀取
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
  },
  pages: {
    // 未登入時導向 onboarding 頁面
    signIn: '/onboarding',
  },
};
