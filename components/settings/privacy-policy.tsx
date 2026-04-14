// T049: 隱私政策卡片 — 展示資料使用政策
import { Card, CardContent } from '@/components/ui/card';

export function PrivacyPolicy() {
  const policyContent = `
## 資料使用政策

我們致力於保護您的隱私。以下說明我們如何使用您的資料：

### 郵件資料
您的 Gmail 郵件內容僅用於生成平靜指數和對話摘要。郵件內容不會被儲存或分享給第三方。

### 對話歷史
對話記錄用於改進 AI 回應品質。您可以隨時刪除對話歷史，不會影響已計算的平靜指數。

### 平靜指數資料
平靜指數計算結果會被保留，用於長期情緒趨勢分析。您可以選擇刪除所有平靜指數資料。

### 使用分析
我們收集匿名的使用統計（例如：功能使用次數、登入頻率），用於改進產品。個人身份資訊不會被包含在分析中。

### 您的權利
您可以隨時：
- 下載您的所有資料
- 刪除特定類型的資料（郵件、對話、平靜指數、分析）
- 停用特定功能

有任何問題，請聯繫 privacy@moltos.app
  `.trim();

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-6 px-4">
        <div className="prose prose-sm max-w-none text-gray-700 space-y-3">
          {policyContent.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('##')) {
              return (
                <h3 key={idx} className="text-gray-900 font-semibold text-sm mt-4 mb-2">
                  {paragraph.replace('## ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('###')) {
              return (
                <h4 key={idx} className="text-gray-800 font-medium text-xs mt-3 mb-1">
                  {paragraph.replace('### ', '')}
                </h4>
              );
            }
            return (
              <p key={idx} className="text-gray-600 text-xs leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
