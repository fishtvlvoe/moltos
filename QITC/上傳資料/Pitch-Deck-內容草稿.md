# Moltos — Pitch Deck (English)

> 14 slides. Final version to be converted to PDF/PPT for upload.

---

## Slide 1: Cover

**Moltos**
*Proactive Mental Wellness AI*

Turn life's noise into your inner voice.

NiCoreFlow Co., Ltd. | moltos.net
Qualcomm Innovate in Taiwan Challenge 2026

---

## Slide 2: The Problem

### Information Overload Is Destroying Mental Health

**Global crisis:**
- **76%** of workers report daily stress from information overload
- **43%** experience burnout from communication overload
- **117** emails/day + endless LINE / Slack / WhatsApp messages
- Information overload costs the US economy **$1 trillion/year**

**Taiwan is ground zero:**
- **#1 globally** in workplace burnout rate — 36% (WTW 2024)
- **1.17 billion** sleeping pills consumed annually — #1 in Asia
- Sleeping pill usage grew **22% in 3 years**

**The vicious cycle no one is breaking:**

Message overload → Anxiety builds → Stress internalized → Insomnia & burnout → Productivity drops → More messages pile up → Repeat

---

## Slide 3: Why Existing Solutions Fail

### Everyone waits for you to ask for help

| Solution | Approach | The Gap |
|----------|----------|---------|
| Woebot / Wysa | Wait for user to self-report via chatbot | Doesn't see real behavioral data |
| Headspace Ebb | Voice companion inside meditation app | Doesn't integrate with work tools |
| Replika / Pi | Emotional companion chatbot | Doesn't know your real stress level |
| ChatGPT | General AI assistant | Doesn't proactively monitor you |

**Common blind spot:** None of them see your actual communication patterns.

Woebot shut down its consumer app (June 2025) — proving passive chatbot models can't sustain B2C in mental health.

---

## Slide 4: The Solution

### Moltos: The First AI That Sees Your Stress

Moltos integrates with your messaging platforms to:

**Detect** — Passively monitor behavioral patterns across LINE, Telegram, WhatsApp, Gmail, Slack

**Analyze** — Compute a real-time Calm Index (0-100) based on your personal 14-day baseline

**Act** — Proactively initiate a voice call when stress is detected, with real-time emotion analysis

**Not a chatbot waiting for you to self-report.**
**An AI guardian that sees your struggle before you say a word.**

---

## Slide 5: How It Works

### From Data to Care in 3 Steps

**Step 1: Connect**
Link your messaging platforms. Only metadata is extracted — message counts, timestamps, reply intervals. Never message content.

**Step 2: Monitor**
The Calm Index algorithm builds your personal baseline using Exponential Weighted Moving Average (EWMA) over 14 days, then detects anomalies via Z-score analysis across 5 behavioral dimensions.

**Step 3: Intervene**
When your Calm Index drops below your personal threshold → Moltos initiates a voice call with dual-channel emotion analysis: what you say (text sentiment) + how you say it (speech rate, pitch, pause patterns).

---

## Slide 6: The Calm Index Algorithm

### Open-Source, Transparent, Verifiable

**5 Behavioral Dimensions:**

| Dimension | Signal | Anomaly Threshold |
|-----------|--------|-------------------|
| Message Volume | Daily count vs. baseline | >1.5σ deviation |
| Reply Latency | Response time trend | Consistently slower |
| Night Activity | 23:00-05:00 usage | Abnormal increase |
| Unread Pileup | Unread count trend | Rising without clearing |
| Voice Emotion | Speech rate, pitch, pauses | Anxiety markers |

**Algorithm pipeline:**
EWMA personal baseline → Z-score anomaly detection → Sigmoid decay scoring → Multi-dimension cross-penalty

**Open source:** MIT License at github.com/fishtvlvoe/moltos

---

## Slide 7: Architecture — Privacy First, Edge Ready

```
┌──────────────────────────────────────────┐
│         DEVICE LAYER (On-Device AI)       │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Calm Index│ │  Voice   │ │ Metadata │ │
│  │  Engine   │ │ Emotion  │ │ Extractor│ │
│  │ (local)   │ │ Analyzer │ │ (local)  │ │
│  └───────────┘ └──────────┘ └──────────┘ │
├──────────────────────────────────────────┤
│       CLOUD LAYER (Minimal, Encrypted)    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  AI Chat │ │  Smart   │ │ Proactive│  │
│  │  Engine  │ │  Router  │ │ Scheduler│  │
│  └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────────────┘
```

**Key design decisions:**
- Calm Index computed on-device → zero cloud cost, zero latency
- Only metadata leaves device → never message content
- Multi-model routing: 80% lightweight models, 20% premium
- End-to-end encryption for all voice sessions

---

## Slide 8: Qualcomm Integration Opportunity

### Why On-Device AI Is Essential for Mental Health

| | Cloud Approach | On-Device (Qualcomm AI Engine) |
|-|---------------|-------------------------------|
| **Privacy** | Data leaves device | Data stays on device |
| **Latency** | Network dependent | Instant inference |
| **Cost** | $0.24/user/month | Near $0/user/month |
| **Availability** | Requires internet | Always-on monitoring |

**Integration roadmap:**
- **Phase 1:** Calm Index engine → Qualcomm AI Engine / Hexagon DSP
- **Phase 2:** Voice emotion inference → Qualcomm Neural Processing SDK
- **Phase 3:** Always-on monitoring → Qualcomm Sensing Hub (ultra-low power)

Moltos was architectured for on-device deployment from day one.

---

## Slide 9: Market Opportunity

### $91B Market Growing at 23% CAGR

**Global AI Mental Health Market:**
- 2025: $17.1 billion
- 2033: $91.2 billion (CAGR 23.29%)
— Grand View Research

**Target segments:**

| Segment | TAM | Strategy |
|---------|-----|----------|
| B2C | 30M+ knowledge workers in Asia-Pacific | Freemium via LINE/Telegram |
| B2B | 2,000+ enterprises (Headspace benchmark) | Per-employee licensing |
| B2B2C | Insurance & healthcare platforms | Partnership integration |

**Go-to-market:**
Taiwan (LINE) → Japan / Southeast Asia → Global (WhatsApp / Slack)

---

## Slide 10: Competitive Landscape

### No One Does All Four

| Capability | Moltos | Woebot | Wysa | Headspace Ebb | Replika |
|-----------|--------|--------|------|---------------|---------|
| Real communication data | ✓ | ✗ | ✗ | ✗ | ✗ |
| Passive stress detection | ✓ | ✗ | ✗ | ✗ | ✗ |
| Proactive voice call | ✓ | ✗ | ✗ | Partial | Partial |
| On-device / privacy-first | ✓ | ✗ | ✗ | ✗ | ✗ |
| Open-source algorithm | ✓ | ✗ | ✗ | ✗ | ✗ |

**Moltos occupies a unique intersection that no competitor addresses.**

---

## Slide 11: Business Model

### 96% Gross Margin at Scale

| Metric | Value |
|--------|-------|
| AI cost per user/month | $0.24 |
| Pro subscription | $7.99/month |
| Gross margin | 96% |
| vs. ChatGPT Plus ($20/mo) | 83x cheaper |

**Revenue streams:**
1. **B2C subscriptions** — Free + Pro tier
2. **B2B enterprise** — Per-employee licensing for corporate wellness
3. **B2B2C partnerships** — Insurance, healthcare platforms

**With on-device deployment (Qualcomm), per-user cloud cost approaches $0.**

---

## Slide 12: Traction & Milestones

| Milestone | Status |
|-----------|--------|
| Community validation (30-person survey) | ✓ Done |
| Calm Index algorithm — core development | ✓ Done |
| Open-source release (MIT License) | ✓ Done |
| Product website (moltos.net) | ✓ Done |
| 2026 Best AI Awards submission | ✓ Done |
| Telegram Bot MVP | In Progress |
| LINE integration | Planned Q2 2026 |
| Beta launch (100 users) | Planned Q3 2026 |

---

## Slide 13: Team

**Chi-Chang Yu (余啓彰)** — Founder & CEO

- 5+ years full-stack independent development
- Shipped ERP systems, payment integrations, LINE Bot platforms
- Multiple WordPress plugins serving real businesses
- Lean execution philosophy: one person + AI-augmented development

LinkedIn: linkedin.com/in/fishtvlove
GitHub: github.com/fishtvlvoe/moltos

**Seeking QITC mentorship for:**
Edge AI deployment strategy, enterprise market entry, fundraising guidance

---

## Slide 14: The Ask & Vision

### What We Need from QITC

1. **Mentorship** — Edge AI deployment + go-to-market strategy
2. **Qualcomm tech access** — AI Engine SDK, Sensing Hub docs
3. **Network** — Enterprise wellness buyers, healthcare partners
4. **Grant** — US$10,000 to accelerate MVP → beta

### 12-Month Roadmap

| Quarter | Milestone |
|---------|-----------|
| Q2 2026 | MVP complete + LINE integration |
| Q3 2026 | Beta (100 users) + on-device Calm Index PoC |
| Q4 2026 | Public launch + first enterprise pilot |
| Q1 2027 | Japan/SEA expansion + Seed fundraising |

### Vision

> We don't replace therapists. We catch people before they need one.

**moltos.net** | **github.com/fishtvlvoe/moltos**
