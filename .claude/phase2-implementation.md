# Phase 2：AI Provider Cleanup 實作

## 背景
- TDD 紅燈測試已建檔 3 個（全紅燈）
- groq-sdk 已安裝（v1.1.2）
- 目標：讓所有測試轉綠燈

## Task 1：移除 YouTube Gemini 摘要（預計 15 分鐘）

**檔案清單**：
1. `lib/youtube.ts`
2. `app/api/youtube/feed/route.ts`
3. `app/(app)/dashboard/page.tsx`
4. `lib/__tests__/youtube.test.ts`（如果有）

**改動詳情**：

### 1.1 修改 `lib/youtube.ts`
- 移除：`import { GoogleGenerativeAI }` + `from '@google/generative-ai'`
- 移除：`const GEMINI_MODEL = 'gemini-2.5-flash'`
- 移除：初始化 Gemini 的區塊（約 line 113-115）
- 移除：try/catch 的 Gemini 呼叫區塊（約 line 136-145）
- 改為：`summary: undefined` 直接設定（不呼叫 Gemini）
- **驗證**：`npm test -- tests/lib/youtube.test.ts` 轉綠燈

### 1.2 修改 `app/api/youtube/feed/route.ts`
- 檢查是否有 summary 欄位在 response 中
- 移除或確認不傳遞 summary（依目前實作）
- **驗證**：無編譯錯誤

### 1.3 修改 `app/(app)/dashboard/page.tsx`
- 搜尋 `summary` 欄位的使用
- 移除顯示 summary 的 UI（若有）
- **驗證**：`npm run build` 無錯誤

---

## Task 2：Gemini → Groq（預計 20 分鐘）

**檔案清單**：
1. `app/api/chat/insight/route.ts`
2. 可選：`lib/gemini-prompts.ts`（移動 insightPrompt）

**改動詳情**：

### 2.1 替換 `app/api/chat/insight/route.ts`
```typescript
// 移除
import { GoogleGenerativeAI } from '@google/generative-ai';
const GEMINI_MODEL = 'gemini-2.5-flash';

// 新增
import Groq from 'groq-sdk';

// 改 API 呼叫
// 原：
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
const result = await model.generateContent(...);
const text = result.response.text();

// 新：
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    {
      role: 'user',
      content: `${ANALYSIS_PROMPT}\n\n---\n對話紀錄：\n${conversationText}`
    }
  ],
  response_format: { type: 'json_object' }
});
const text = completion.choices[0]?.message?.content || '';
```

- JSON parse 邏輯保持不變（remove markdown backticks）
- **驗證**：`npm test -- tests/api/chat-insight.test.ts` 轉綠燈

### 2.2 可選：整理 prompt（後續優化）
- `lib/gemini-prompts.ts` 的 `insightPrompt` 可移到 route 或新檔 `lib/insight-prompts.ts`
- 暫不重構（Phase 2 只做最小改動）

---

## Task 3：刪除死碼 /api/chat（預計 10 分鐘）

**檔案清單**：
1. `app/api/chat/route.ts`
2. `lib/gemini.ts`（檢查後決定）

**改動詳情**：

### 3.1 驗證 /api/chat 無人呼叫
```bash
grep -rn "'/api/chat'" app/ --include="*.ts" --include="*.tsx"
grep -rn '"/api/chat"' app/ --include="*.ts" --include="*.tsx"
```
- 確認無直接呼叫（排除 `/api/chat/insight` 等子路由）

### 3.2 刪除檔案
```bash
rm app/api/chat/route.ts
```

### 3.3 驗證 build 成功
```bash
npm run build
```

### 3.4 檢查 lib/gemini.ts 的依賴
```bash
grep -rn "from '@/lib/gemini'" app/ lib/
```
- 若無依賴，可刪除 `lib/gemini.ts`
- 若有依賴（如 `summaryPrompt`），保留

---

## 成功標準（綠燈檢查清單）

- [ ] `npm test -- tests/lib/youtube.test.ts` → ✅ 全綠
- [ ] `npm test -- tests/api/chat-insight.test.ts` → ✅ 全綠
- [ ] `npm test -- tests/api/chat-route-deleted.test.ts` → ✅ 全綠
- [ ] `npm run build` → ✅ 無編譯錯誤
- [ ] `npm test` → ✅ 全套測試無回歸
- [ ] `npm run lint` → ✅ 無 lint 錯誤

---

## 環境變數確認

需檢查：
- `GROQ_API_KEY` 已在 `.env` 中（原用於 STT）
- `GEMINI_API_KEY` 可移除（Task 3 後）

---

## Git Commit 策略

建議分三個 commit（對應三個 Task）：

```bash
git add lib/youtube.ts app/api/youtube/feed/route.ts app/(app)/dashboard/page.tsx
git commit -m "refactor: remove gemini summary from youtube feed (task 1/3)"

git add app/api/chat/insight/route.ts
git commit -m "refactor: replace gemini with groq in chat insight api (task 2/3)"

git add app/api/chat/route.ts  # 實際上是 git rm
git commit -m "chore: delete deprecated /api/chat route (task 3/3)"
```

---

## 注意事項

1. **TypeScript 類型檢查**：確保 Groq 的回應類型符合
2. **Error Handling**：Groq API 的 error 格式可能不同，保留 try/catch
3. **環境變數**：`.env` 同步（Vercel 部署時）
4. **測試 mock**：groq-sdk mock 已在 chat-insight.test.ts 中準備好

