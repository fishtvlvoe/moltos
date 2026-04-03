// 回顧頁面 — 平靜指數歷史趨勢（需 Supabase 資料庫，目前為 placeholder）
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReviewPage() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-xl font-semibold text-[#2D2D2D]">回顧</h1>

      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2D2D2D]">平靜指數趨勢</CardTitle>
          <p className="text-xs text-[#8A8A8A]">追蹤你的長期變化</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">📊</span>
            <p className="text-sm text-[#8A8A8A]">
              趨勢圖表即將推出
            </p>
            <p className="text-xs text-[#B0B0B0] mt-1">
              串接資料庫後，這裡會顯示你每天的平靜指數變化
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2D2D2D]">對話紀錄</CardTitle>
          <p className="text-xs text-[#8A8A8A]">回顧過去的對話</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-sm text-[#8A8A8A]">
              歷史對話即將推出
            </p>
            <p className="text-xs text-[#B0B0B0] mt-1">
              串接資料庫後，這裡會保存你和小默的對話紀錄
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
