// T016: 根路由 — 依登入狀態導向 dashboard 或 onboarding
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;

  // demo 模式直接進 dashboard
  if (params.demo === 'true') {
    redirect('/dashboard?demo=true');
  }

  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  redirect('/onboarding');
}
