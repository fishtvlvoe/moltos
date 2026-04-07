import type { NextConfig } from "next";

// 自動偵測網址：Vercel 上用 Vercel 給的網址，本機用 localhost
function detectNextAuthUrl(): string {
  // Vercel 部署時會自動提供 VERCEL_URL（不需要手動設定）
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 本機開發
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

const nextConfig: NextConfig = {
  env: {
    // 覆蓋 NEXTAUTH_URL，讓登入系統知道自己的正確網址
    NEXTAUTH_URL: detectNextAuthUrl(),
  },
};

export default nextConfig;
