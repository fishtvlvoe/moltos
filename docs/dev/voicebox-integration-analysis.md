# Voicebox 整合分析報告

**日期**：2026-04-13  
**目標**：評估 jamiepine/voicebox 在 MOLTOS 專案中的整合可行性  
**狀態**：初步分析完成

---

## 1. MOLTOS 現狀分析

### 1.1 技術棧

| 層級 | 技術 |
|------|------|
| **前端** | Next.js 15 (App Router) + React 19 + TypeScript 5 + Tailwind CSS |
| **後端** | Next.js API Routes (Node.js) |
| **認證** | next-auth v4 (JWT) |
| **資料庫** | Supabase (PostgreSQL) |
| **音訊處理** | ElevenLabs API (@elevenlabs/react @11labs/react) |

### 1.2 現有音訊/語音功能

| 功能 | 實現方式 | API 依賴 |
|------|---------|---------|
| **語音通話** | Conversational AI Agent | ElevenLabs (Voice Conversation) |
| **signed URL 取得** | `/api/elevenlabs-signed-url` | ElevenLabs API |
| **語音情緒分析** | `analyzeVoiceEmotion()` 函式 | 本地演算法 |
| **文字轉語音** | ElevenLabs TTS | ElevenLabs API |

### 1.3 現有外部服務整合方式

**ElevenLabs 整合架構：**

```
┌─────────────────────┐
│   React 前端        │  @11labs/react SDK
│  (call/page.tsx)    │  useConversation hook
└──────────┬──────────┘
           │ 請求 signed URL
           ↓
┌─────────────────────────────────────────┐
│  Next.js API Route                      │
│  /api/elevenlabs-signed-url             │
│  - 驗證 session                          │
│  - 用 ELEVENLABS_API_KEY 呼叫 ElevenLabs │
│  - 回傳 signed URL 給前端               │
└──────────┬──────────────────────────────┘
           │ signed URL
           ↓
┌─────────────────────────────────────────┐
│  ElevenLabs WebSocket                   │
│  - 雙向語音通話                          │
│  - Conversational AI Agent              │
│  - 即時文字/音訊串流                     │
└─────────────────────────────────────────┘
```

**關鍵程式碼位置：**
- 前端：`app/(app)/call/page.tsx` — 語音介面 UI
- 後端：`app/api/elevenlabs-signed-url/route.ts` — API Key 管理
- Lib：`lib/elevenlabs.ts` — helper 函式（stripEmotionTags、mapConversationStatus）
- 規格：`openspec/specs/voice-conversation/spec.md` — 需求定義

---

## 2. Voicebox 技術特性分析

### 2.1 核心能力

| 能力 | 說明 | 優勢 |
|------|------|------|
| **語音複製（Voice Cloning）** | 數秒音檔 → 複製人聲 | 即時、精準，無需訓練 |
| **多引擎 TTS** | 支援 Qwen3-TTS、LuxTTS 等 | 開源、無訂閱費 |
| **本地執行** | Python + FastAPI 後端 | 隱私優先、成本控制 |
| **REST API** | 標準 HTTP 端點 | 易於整合 |
| **DAW 編輯器** | 多軌時間軸介面 | 非必需（MOLTOS 不需） |

### 2.2 vs ElevenLabs 對比

| 維度 | Voicebox | ElevenLabs |
|------|----------|-----------|
| **部署** | 自架（本地或 VPS） | 雲端 SaaS |
| **成本** | 伺服器運營成本 | 按用量計費（≈$0.03/分鐘語音） |
| **延遲** | 可控（取決於伺服器） | 10-50ms（穩定） |
| **隱私** | 資料不離伺服器 | 資料送上雲 |
| **客製化** | 完全開源，可修改模型 | 黑盒 API |
| **實時性** | ⚠️ 需要優化 | ✅ 優化良好 |

---

## 3. MOLTOS 內可整合的位置

### 3.1 「直接替換」方案（推薦 ⭐⭐⭐⭐）

**目標**：將 ElevenLabs TTS 替換為 Voicebox，保留對話邏輯不變

#### 整合點 1：API Route 層

**檔案**：`app/api/elevenlabs-signed-url/route.ts`

**改動**：

```typescript
// 舊：呼叫 ElevenLabs API
const response = await fetch(
  `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
  { headers: { 'xi-api-key': apiKey } }
);

// 新：呼叫 Voicebox API
const response = await fetch(
  `http://voicebox-server:8000/api/v1/synthesize`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: userMessage,
      voice_id: voiceCloneId,
      language: 'zh-TW'
    })
  }
);
```

**難度**：⭐ 低（單一端點替換）

#### 整合點 2：Lib 層 Helper

**檔案**：`lib/elevenlabs.ts` → 改名為 `lib/voice-provider.ts`

**改動**：
- `stripEmotionTags()` — 保留（ElevenLabs 也有情緒標籤）
- `mapConversationStatus()` — 需要調整（Voicebox 沒有 ElevenLabs SDK）
- 新增 `generateVoiceCloneFromAudio()` — 利用 Voicebox 語音複製能力

**難度**：⭐⭐ 中（新增 Voicebox 特有功能）

### 3.2 「深度整合」方案（推薦 ⭐⭐⭐）

**目標**：利用 Voicebox 的語音複製功能，為用戶提供「個人化 AI 配音」

#### 功能：用戶上傳語音片段 → Voicebox 複製 → AI 用用戶音色說話

**新增工作流**：

```
1. 用戶上傳 5-10 秒的語音樣本（MP3/WAV）
   ↓
2. 後端 /api/voice-clone 呼叫 Voicebox 分析
   ↓
3. Voicebox 產生 voice_id（用於後續合成）
   ↓
4. 儲存 voice_id 到 Supabase (users.voice_clone_id)
   ↓
5. 對話時，AI 用該 voice_id 說話（而非預設女聲）
```

**新增路由**：
- `POST /api/voice-clone/upload` — 上傳並複製
- `GET /api/voice-clone/status/:voiceId` — 查詢複製進度

**難度**：⭐⭐⭐ 中等（涉及檔案上傳、非同步任務）

---

## 4. 成本 vs 效益分析

### 4.1 ElevenLabs 現況成本

假設：
- 每位用戶平均月語音通話 **30 分鐘**
- ElevenLabs 費率 **$0.03/分鐘**（按 tier 不同）

**月成本**：

| 用戶數 | 30分/用戶/月 | 費用 |
|-------|-----------|------|
| 100 | 3,000 分鐘 | $90 |
| 1,000 | 30,000 分鐘 | $900 |
| 10,000 | 300,000 分鐘 | $9,000 |

### 4.2 Voicebox 自架成本

假設部署在 AWS EC2 (c6i.2xlarge)：

| 成本項 | 月費 | 說明 |
|-------|------|------|
| **EC2 實例** | $300 | c6i.2xlarge (8vCPU, 16GB RAM) |
| **EBS 儲存** | $30 | 100GB SSD |
| **頻寬** | $10-50 | 數據傳出 |
| **總計** | **$340-380/月** | 固定成本 |

**損益平衡點**：
- ElevenLabs: $900/月 ÷ $0.03/分鐘 = **30,000 分鐘**
- Voicebox: $380 ÷ 多少分鐘成本？→ **接近零**（固定成本）

✅ **結論**：
- **用戶量 > 1,000 時**，Voicebox 顯著更便宜
- **隱私要求高時**，Voicebox 必選

---

## 5. 技術風險評估

| 風險 | 嚴重程度 | 對策 |
|------|---------|------|
| **Voicebox 實時性較弱** | 🟡 中 | 用 WebSocket 替代 REST API，或加快硬體 |
| **自架運維成本** | 🟡 中 | 寫自動化部署腳本（Docker）；可選用 Fly.io/Railway |
| **語言支援（中文）** | 🟢 低 | Qwen3-TTS 支援中文，預設模型也可 fine-tune |
| **音質 vs ElevenLabs** | 🟡 中 | 先跑 PoC，A/B 測試確認 |
| **團隊不熟 Python** | 🟡 中 | Voicebox 提供 Docker 鏡像，無需改 Python 程式碼 |

---

## 6. 整合實施計畫

### Phase 1：PoC（概念驗證，1-2 週）

**目標**：確認 Voicebox 音質 + 延遲是否可接受

**任務**：
1. 本地跑 Voicebox Docker：`docker run -p 8000:8000 jamiepine/voicebox:latest`
2. 測試 TTS API：`curl -X POST http://localhost:8000/api/v1/synthesize -d '{"text":"你好","language":"zh-TW"}'`
3. 與 ElevenLabs 對比音質 + 延遲
4. 撰寫 PoC 報告

**成功標準**：
- ✅ 音質 ≥ ElevenLabs 現有水準
- ✅ 端到端延遲 < 500ms

### Phase 2：API 層整合（2-3 週）

**目標**：替換後端 ElevenLabs API 呼叫

**任務**：
1. 在 production VPS 上部署 Voicebox（Docker Compose）
2. 改寫 `/api/elevenlabs-signed-url` → `/api/voice/synthesize`
3. 更新 `lib/elevenlabs.ts` → `lib/voice-provider.ts`
4. 測試：單元測試 + e2e 測試（call/page.tsx）
5. Code Review（Kimi CR）

**成功標準**：
- ✅ 所有測試通過
- ✅ 前端無感（UI 邏輯不變）

### Phase 3：深度功能（2-4 週，選擇性）

**目標**：新增「用戶個人化配音」功能

**任務**：
1. 前端：新增「上傳語音樣本」UI（Settings 頁面）
2. 後端：`POST /api/voice-clone/upload` 路由
3. Voicebox：呼叫 `/voice-clone` 端點
4. Supabase：`users` 表新增 `voice_clone_id` 欄位
5. 整合到對話流程

**成功標準**：
- ✅ 用戶可上傳語音
- ✅ Voicebox 成功複製
- ✅ 對話時用複製後的音色

---

## 7. 具體整合程式碼框架

### 7.1 新增 API Route（`app/api/voice/synthesize/route.ts`）

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, voiceId } = await request.json();
  const voiceboxUrl = process.env.VOICEBOX_API_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${voiceboxUrl}/api/v1/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice_id: voiceId || 'default', // 預設女聲
        language: 'zh-TW',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Voicebox] 合成失敗:', error);
      return NextResponse.json(
        { error: '音訊合成失敗' },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error('[Voicebox] 錯誤:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
```

### 7.2 Lib Helper（`lib/voice-provider.ts`）

```typescript
/**
 * Voicebox 聲音提供者（替代 ElevenLabs）
 */

export async function synthesizeVoice(
  text: string,
  voiceId?: string
): Promise<ArrayBuffer> {
  const response = await fetch('/api/voice/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    throw new Error(`合成失敗: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

export async function cloneVoice(audioFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await fetch('/api/voice-clone/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`複製失敗: ${response.statusText}`);
  }

  const { voiceId } = await response.json();
  return voiceId;
}
```

### 7.3 資料庫遷移（新欄位）

```sql
ALTER TABLE public.users
ADD COLUMN voice_clone_id VARCHAR(255);

-- 索引加速查詢
CREATE INDEX idx_users_voice_clone_id ON public.users(voice_clone_id);
```

---

## 8. 決策矩陣（Fish 裁決用）

| 選項 | 成本 | 音質 | 延遲 | 隱私 | 客製化 | 推薦 |
|------|------|------|------|------|--------|------|
| **保持 ElevenLabs** | 月 $900+ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ❌ | 短期可行 |
| **切換 Voicebox** | 月 $380 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ✅ | 長期最優 |
| **混合方案** | 月 $500-600 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 過渡期最穩 |

**混合方案說明**：MOLTOS 使用 Voicebox 作為預設，保留 ElevenLabs 作為 fallback（用戶要求高音質時用）。

---

## 9. 後續行動清單

### 立即（本週）
- [ ] 本地跑 Voicebox Docker，測試基本 API
- [ ] 決定走 PoC → Phase 1 還是直接 Phase 2

### 短期（2-4 週）
- [ ] 部署 Voicebox 到測試 VPS
- [ ] 實作 `/api/voice/synthesize` 路由
- [ ] 前端整合測試

### 中期（1-2 個月）
- [ ] 決定是否上線使用（PoC 結果 + 成本評估）
- [ ] 若上線，進行 Phase 3（個人化配音）

---

## 10. 參考資源

- **Voicebox GitHub**：https://github.com/jamiepine/voicebox
- **Voicebox API 文件**：README / API 章節
- **ElevenLabs 現有整合**：
  - `/app/api/elevenlabs-signed-url/route.ts`
  - `/lib/elevenlabs.ts`
  - `/app/(app)/call/page.tsx`
- **Spectra 規格**：`/openspec/specs/voice-conversation/spec.md`

---

**分析完成** ✅  
**建議行動**：組織一個 30 分鐘的 PoC 會議，測試 Voicebox 音質，確認方向。
