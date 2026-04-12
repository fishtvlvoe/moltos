import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// 載入 IBM Plex Sans 字體，作為 Moltos 設計稿字體規範
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MOLTOS Care",
  description: "職場心理健康 AI 陪伴",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOLTOS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // T012: 根 layout — mobile-first 居中容器，背景 cream (#FAF8F4)
    <html lang="zh-Hant" className={cn("h-full", "antialiased", ibmPlexSans.variable, "font-sans", geist.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#C67A52" />
      </head>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#FAF8F4' }}>
        {/* Providers 包含 SessionProvider，保持 body 為 server component */}
        <Providers>
          <div className="max-w-md mx-auto w-full flex flex-col flex-1">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
