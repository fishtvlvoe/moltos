# fal.ai API 開發參考

> 整理日期：2026-04-09 | 用途：MOLTOS 影片/圖片生成模組選型依據

---

## 1. SDK 安裝

```bash
npm install @fal-ai/client
```

```typescript
import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });
```

> videogo 專案已有完整 fal.ai 整合範例（`src/providers/kling-o3.ts`）可直接參考。

---

## 2. 圖片生成模型比較

| 模型 | ID | 速度 | 成本 | 推薦場景 |
|------|-----|------|------|---------|
| **FLUX.1 Schnell** | `fal-ai/flux/schnell` | **< 1 秒** (4-step) | **$0.003/MP** | 快速預覽、批次生成 |
| HiDream-I1 Fast | `fal-ai/hidream-i1-fast` | 2~5 秒 | $0.01/MP | 高品質單張 |
| FLUX.1 Dev | `fal-ai/flux/dev` | 3~8 秒 | $0.025/MP | 精細控制 |

**MOLTOS 推薦**：`FLUX.1 Schnell` — 最便宜最快，適合 App 即時預覽體驗。

---

## 3. 影片生成模型比較

| 模型 | ID | 成本/秒 | 生成時間 | 特色 |
|------|-----|---------|---------|------|
| **Kling 3.0 Standard** | `fal-ai/kling-video/v3/standard/...` | $0.168/秒 | 30~60秒 | 性價比高 |
| Kling O3 Standard | `fal-ai/kling-video/o3/standard/...` | $0.112/秒 | 30~60秒 | 有語音生成 |
| MiniMax Video-01 | `fal-ai/minimax/video-01` | $0.50/片 | 排隊不定 | 定額計費 |

> videogo 目前使用 Kling O3（含語音），`costPerSecond: 0.112`（standard）/ `0.392`（pro）

---

## 4. 呼叫範例

### 圖片生成（FLUX Schnell）

```typescript
import { fal } from '@fal-ai/client';

const result = await fal.subscribe('fal-ai/flux/schnell', {
  input: { prompt: 'a zen mountain landscape, photorealistic' },
  pollInterval: 500,
});

const imageUrl = result.data.images[0].url;
```

### 影片生成（Kling O3）

```typescript
const result = await fal.subscribe('fal-ai/kling-video/o3/standard/image-to-video', {
  input: {
    image_url: imageUrl,
    prompt: 'Upper body shot. She says "你好". Natural smile.',
    duration: '5',
    generate_audio: true,
    aspect_ratio: '9:16',
  },
  logs: true,
});

const videoUrl = result.data.video?.url;
```

### WebSocket 即時串流（Realtime API）

```typescript
// 適用低延遲互動場景（3~5 FPS，使用 msgpack 協議）
const connection = fal.realtime('fal-ai/flux/schnell', {
  onResult: (result) => console.log(result.images[0].url),
});
connection.send({ prompt: 'your prompt' });
```

---

## 5. 定價摘要

| 計費單位 | 費率 |
|---------|------|
| 圖片（FLUX Schnell） | $0.003 / Megapixel |
| 影片（Kling O3 Standard） | $0.112 / 秒 |
| 影片（Kling O3 Pro） | $0.392 / 秒 |

---

## 6. 參考程式碼來源

- videogo 完整 Kling O3 Provider：`videogo/src/providers/kling-o3.ts`
- videogo TTS 服務：`videogo/src/services/tts.ts`（OpenAI / VoAI / Edge TTS 三選一）
