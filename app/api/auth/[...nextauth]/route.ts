// T011: NextAuth catch-all route — 處理所有 /api/auth/* 請求
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
