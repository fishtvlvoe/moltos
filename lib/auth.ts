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
    // 首次登入時將 access_token / refresh_token 寫入 JWT，並記錄到期時間。
    // 後續每次 JWT 驗證時自動刷新過期的 access token，避免用戶每小時被踢出。
    async jwt({ token, account }) {
      if (account) {
        // 首次登入：記錄 token + 到期時間（Google 預設 3600 秒）
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + ((account.expires_in as number) ?? 3600),
        };
      }
      // 舊格式 JWT（沒有 expiresAt）→ 直接回傳，避免每次都觸發刷新
      if (!token.expiresAt) return token;
      // access token 未過期 → 直接回傳
      if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token;
      }
      // access token 已過期 → 用 refresh token 向 Google 換新的
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        });
        const refreshed = await res.json();
        if (!res.ok) throw refreshed;
        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
        };
      } catch (err) {
        console.error('[auth] refresh token 失敗：', err);
        // 刷新失敗 → 標記 error，讓 session callback 傳給 client
        return { ...token, error: 'RefreshAccessTokenError' };
      }
    },
    // 將 JWT 內的 token 掛載到 session，讓 client 端可讀取
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  pages: {
    // 未登入時導向 onboarding 頁面
    signIn: '/onboarding',
  },
};
