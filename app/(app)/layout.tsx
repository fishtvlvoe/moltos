// T017: App route group layout — 有底部 TabBar 的頁面共用 layout
import { TabBar } from '@/components/layout/tab-bar';
import { NotificationBadge } from '@/components/notification-badge';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 主內容區，底部留出 TabBar 高度（h-16 = 4rem，pb-20 多留緩衝） */}
      <main className="flex-1 pb-20 px-4 pt-4">
        {children}
      </main>
      <NotificationBadge />
      <TabBar />
    </>
  );
}
