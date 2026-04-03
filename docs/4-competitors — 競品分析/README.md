# MOLTOS 競品分析

**更新日期：** 2026-04-03

## 市場概覽

AI 陪伴 / 心理健康 AI 市場 2025 年已達 320-370 億美元，年增 30% CAGR。全球活躍用戶超過 1 億，但「贏家通吃」現象明顯：前 10% 的產品拿走 89% 收入。

**MOLTOS 的機會：** 市場上尚無任何競品做到「從數位行為（Email、YouTube）提取客觀壓力指標」。

---

## 一、開源競品

| # | 專案名稱 | GitHub | Stars | 一句話描述 | 技術棧 | 與 MOLTOS 差異 |
|---|---------|--------|-------|-----------|--------|--------------|
| 1 | **companion-app** (a16z) | [連結](https://github.com/a16z-infra/companion-app) | 5.9k | AI 陪伴啟動包，含記憶與向量搜尋 | Next.js, LangChain, Pinecone, OpenAI | 純對話陪伴，無行為分析 |
| 2 | **GirlfriendGPT** | [連結](https://github.com/EniasCailliau/GirlfriendGPT) | 2.7k | ChatGPT AI 陪伴機器人（已停維護） | Python, ChatGPT, ElevenLabs | 無情緒量化，靠用戶主動輸入 |
| 3 | **Open-LLM-VTuber** | [連結](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) | 6.4k | 全離線 Live2D 虛擬角色語音互動 | Python, Live2D, Ollama | 聚焦 VTuber 視覺化，無健康監測 |
| 4 | **MyGirlGPT** | [連結](https://github.com/Synthintel0/MyGirlGPT) | 415 | 本地部署 AI 女友，整合語音/圖片 | Python, Stable Diffusion, Bark | 強調隱私本地運行，無壓力分析 |
| 5 | **MentalLLaMA** | [連結](https://github.com/SteveKGYang/MentalLLaMA) | 學術 | 可解釋心理健康分析 LLM（社群文本） | Python, LLaMA, NLP | 學術研究，分析社群文本非個人行為 |
| 6 | **airi** (moeru-ai) | [連結](https://github.com/moeru-ai/airi) | 37k | 自架 AI 陪伴，語音+遊戲互動 | TypeScript, Live2D, VRM | 娛樂導向，無心理健康功能 |

## 二、商業競品

| # | 產品 | 用戶規模 | 年收入 | 定位 | 與 MOLTOS 差異 |
|---|------|---------|--------|------|--------------|
| 1 | **Replika** | 30M 總用戶 | $14M ARR | AI 朋友/伴侶 | 靠用戶主動分享，無被動監測 |
| 2 | **Character.AI** | 20-28M MAU | $32M ARR（Google $27億收購） | 多角色扮演 | 娛樂/創作，無心理健康框架 |
| 3 | **Woebot** | 未公開 | $123M 融資 | 臨床 CBT 心理支持 | 高度臨床化，無數位行為整合，有 FDA 認可 |
| 4 | **Wysa** | 企業通路 | $20M 融資 | CBT/DBT 自助工具 | B2B 面向雇主/保險，非 C 端 |
| 5 | **Glow** | 台灣有上架 | 未公開 | 虛擬戀人 | 純虛擬戀愛情境，無壓力指標 |

## 三、台灣市場

目前台灣**沒有**本土產品做到「Email 行為分析 + 壓力量化 + AI 陪伴」三合一。

- 兒福聯盟 2025：26% 有心理困擾的台灣兒少曾向 AI 求助
- 台灣學術界做穿戴裝置 + 睡眠 + 語音分析，但無 Email 行為維度

## 四、MOLTOS 競爭優勢矩陣

```
                    被動行為監測  壓力量化指標  AI 陪伴對話  個人數位生活整合
Replika                  ✗           ✗           ✓            ✗
Woebot                   ✗           ✗           ✓(CBT)       ✗
Character.AI             ✗           ✗           ✓            ✗
companion-app            ✗           ✗           ✓            ✗
MentalLLaMA              △           △           ✗            ✗
MOLTOS                   ✓ Gmail     ✓ 平靜指數  ✓            ✓ YT摘要
```

## MOLTOS 的唯一性（Blue Ocean）

1. **客觀 vs 主觀** — 所有競品靠用戶主動輸入情緒，MOLTOS 從 Gmail 行為被動推算
2. **數位生態整合** — Gmail + YouTube 嵌入用戶數位生活，非另一個「額外要開」的 App
3. **量化指標** — 平靜指數 0-100 可追蹤趨勢，競品多為定性對話
4. **預防性定位** — Woebot/Wysa 針對已有困擾者，MOLTOS 是預防監測（類似健康手環）

## 風險

- Gmail 授權隱私顧慮是最大門檻
- Replika 已被義大利罰款 €560 萬（資料保護），監管風險需提前布局
- airi（37k stars）顯示「開源、隱私」路線受歡迎
