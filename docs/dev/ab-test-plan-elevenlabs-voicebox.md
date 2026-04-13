# A/B 測試計畫：ElevenLabs vs Voicebox

**時程**：2026-04-13 至 2026-04-25（比賽前）  
**目標**：零風險微調，不改動現有生產環境  
**策略**：複製版本做平行測試，收集音質反饋

---

## 0. 前置澄清

### Voicebox 的真實身份
- ❌ **不是** Meta 官方開發的（會誤導）
- ✅ **是** Jamie Pine 開發的開源工作室
- 集成開源 TTS 引擎（Qwen-TTS、FastPitch 等）
- MIT License，可商業使用

### ElevenLabs 目前定價（2026）
- 計費單位：**額度（Credits）**
- 你用的 Starter $5/月 = 30,000 額度/月
- 1 字符 = 1 額度（標準模式）
- 高效能模型 = 0.5 額度/字符（打五折）
- **你現在用的方案足夠！** 30,000 額度 ≈ 100-200 分鐘語音

---

## 1. A/B 測試架構（零改動現有系統）

### 當前架構（保持不變）
```
用戶 → MOLTOS 前端 (call/page.tsx)
                  ↓
       /api/elevenlabs-signed-url
                  ↓
       ElevenLabs WebSocket
                  ↓
       語音通話 (現有流程)
```

### A/B 測試方案
```
用戶 → 前端檢查 URL 參數或 localStorage 標籤
        ├─ 有 ?test=voicebox
        │  └─ 使用 Voicebox 分支 (新路由)
        │
        └─ 無標籤（預設）
           └─ 使用 ElevenLabs (現有流程)
```

---

## 2. 實現步驟（微改動最小化）

### Step 1：新增 Voicebox API Route（<20 行代碼）

**檔案**：`app/api/voicebox-synthesize/route.ts`

```typescript
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, referenceAudioPath } = await request.json();
  const voiceboxUrl = process.env.VOICEBOX_LOCAL_URL || 'http://localhost:17493';

  try {
    const response = await fetch(`${voiceboxUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        reference_audio_path: referenceAudioPath || null, // 台灣腔樣本（可選）
        language: 'zh',
      }),
    });

    if (!response.ok) {
      console.error('[Voicebox] 合成失敗:', await response.text());
      return NextResponse.json({ error: '合成失敗' }, { status: response.status });
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

### Step 2：前端 A/B 邏輯（條件分支）

**檔案**：`lib/voice-provider.ts`（新建或擴展）

```typescript
/**
 * 根據 A/B 測試標籤選擇語音提供者
 */
export function getVoiceProvider(): 'elevenlabs' | 'voicebox' {
  if (typeof window === 'undefined') return 'elevenlabs';
  
  // 檢查 URL 參數 ?test=voicebox
  const params = new URLSearchParams(window.location.search);
  const testMode = params.get('test');
  
  // 或檢查 localStorage 標籤
  const savedPref = localStorage.getItem('voice_provider_test');
  
  return testMode === 'voicebox' || savedPref === 'voicebox' ? 'voicebox' : 'elevenlabs';
}

/**
 * 合成語音（自動選擇提供者）
 */
export async function synthesizeVoice(
  text: string,
  options?: { useVoicebox?: boolean; taiwaneseAccentSample?: string }
): Promise<ArrayBuffer> {
  const provider = options?.useVoicebox ? 'voicebox' : getVoiceProvider();

  if (provider === 'voicebox') {
    return synthesizeWithVoicebox(text, options?.taiwaneseAccentSample);
  } else {
    return synthesizeWithElevenLabs(text);
  }
}

async function synthesizeWithVoicebox(
  text: string,
  referenceAudioPath?: string
): Promise<ArrayBuffer> {
  const response = await fetch('/api/voicebox-synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, referenceAudioPath }),
  });

  if (!response.ok) throw new Error('Voicebox 合成失敗');
  return response.arrayBuffer();
}

async function synthesizeWithElevenLabs(text: string): Promise<ArrayBuffer> {
  // 現有 ElevenLabs 邏輯（保持不變）
  // ...
}
```

### Step 3：環境變數設定

**檔案**：`.env.local`

```bash
# 現有 ElevenLabs（保持）
ELEVENLABS_API_KEY=xxx
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=xxx

# 新增 Voicebox 本地服務
VOICEBOX_LOCAL_URL=http://localhost:17493

# 可選：台灣腔參考音檔路徑
NEXT_PUBLIC_VOICEBOX_REFERENCE_AUDIO=/public/taiwan-accent-sample.wav
```

---

## 3. 台灣腔實現方式

### 方案 A：提供 2 秒台灣人錄音樣本（推薦）

**準備工作**：
1. 錄製 2-5 秒的台灣人自然講話（說什麼不重要，只要台灣腔）
2. 轉成 `.wav` 格式，放在 `public/audio/taiwan-sample.wav`

**API 呼叫**：
```typescript
const taiwanSamplePath = '/audio/taiwan-sample.wav';
const audioBuffer = await synthesizeVoice(
  '您好，這是台灣腔的語音。',
  { useVoicebox: true, taiwaneseAccentSample: taiwanSamplePath }
);
```

**原理**：
- Voicebox 的 zero-shot 複製會分析你的樣本檔
- 提取韻律、語速、音調特徵
- 套用到生成的文字上

### 方案 B：依賴模型預設（簡單但可能不夠台灣）

```typescript
const audioBuffer = await synthesizeVoice(
  '您好，這是預設台灣腔。',
  { useVoicebox: true }
);
// 不提供 taiwaneseAccentSample，用模型預設
```

**建議**：方案 A 效果更好（用樣本微調）

---

## 4. 測試清單

### 上線前檢查

- [ ] Voicebox 本地服務正常運行（`http://localhost:17493` 可訪問）
- [ ] 新路由 `/api/voicebox-synthesize` 測試通過
- [ ] 前端 A/B 邏輯正確（?test=voicebox 切換有效）
- [ ] ElevenLabs 流程保持不變（確認現有用戶無影響）

### 測試用戶執行

**Phase 1：內部測試（你 + 團隊，3 天）**
```
用戶A：訪問 ?test=voicebox → 用 Voicebox
用戶B：正常訪問 → 用 ElevenLabs
收集反饋：延遲、音質、穩定性
```

**Phase 2：有限用戶測試（5 天）**
```
邀請 5-10 個可靠測試用戶
URL：https://moltos.app/?test=voicebox
收集：A/B 音質對比反饋
```

**Phase 3：決策（2 天）**
```
對比數據 → 決定是否在比賽前上線
風險評估：如果 Voicebox 更好 → 用它
         如果 EL 更穩定 → 保持現狀
```

---

## 5. 回滾計畫（保險）

如果 Voicebox 在比賽前出問題：

```typescript
// 強制回到 ElevenLabs（緊急開關）
localStorage.setItem('voice_provider_test', 'elevenlabs');
location.reload();
```

或直接註解路由，前端自動回到預設 ElevenLabs

---

## 6. 成本與資源

### ElevenLabs 方面
- **現況**：Starter $5/月，30,000 額度
- **測試消耗**：估計 1,000-3,000 額度（<100 次合成測試）
- **成本**：**無額外費用**（在月度額度內）

### Voicebox 方面
- **部署**：本地 Docker（已有）
- **成本**：$0（開源 + 本地運行）
- **網路**：本地調用，無延遲成本

---

## 7. 時程規劃

| 日期 | 任務 | 負責人 |
|------|------|--------|
| 4/13-4/14 | 實作 API 路由 + A/B 邏輯 | Claude + 你確認 |
| 4/15-4/17 | 內部測試（你 + 團隊） | MOLTOS 團隊 |
| 4/18-4/22 | 用戶測試反饋收集 | 測試用戶 |
| 4/23 | 決策會議 | Fish 最終裁決 |
| 4/24-4/25 | 備用調整時間 | 應急用 |

---

## 8. 風險評估

| 風險 | 機率 | 對策 |
|------|------|------|
| Voicebox 延遲高 | 中等 | 本地 Docker，延遲應該 < 200ms |
| 台灣腔樣本效果差 | 低 | 測試中替換樣本 |
| EL 方案被破壞 | 低 | 前端分支完全隔離，回滾即可 |
| 比賽時出故障 | 低 | 堅持用 EL（驗證過的方案） |

---

## 9. 最終建議

### 為什麼這樣做？

1. **零改動現有系統** — EL 部分完全保持
2. **平行測試** — A/B 版本獨立運行
3. **低風險** — 最壞情況回滾 = 恢復 EL
4. **時間充足** — 12 天測試，夠收集反饋
5. **成本無增加** — 用現有 Starter 方案，額度足夠

### 如果測試結果好？

比賽時可以選擇用 Voicebox（台灣腔 + 低成本），之後規模化時繼續優化

### 如果測試結果不好？

比賽用 EL（保守方案），之後再評估是否值得折騰 Voicebox

---

**行動第一步**：確認你能本地運行 Voicebox Docker？如果可以，今天我就幫你實作 API 層。
