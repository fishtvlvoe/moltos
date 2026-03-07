# Product Description — Moltos

## What Is Moltos?

Moltos is a **proactive mental wellness AI** that monitors your stress through real communication patterns and intervenes before burnout becomes a crisis.

Unlike traditional mental health apps that wait for users to self-report how they feel, Moltos integrates directly with the messaging platforms people already use every day — LINE, Telegram, WhatsApp, Gmail, and Slack — to passively detect behavioral changes that signal rising stress.

## The Problem We Solve

Information overload is the invisible epidemic of the modern workplace:

- **76%** of workers report daily stress from information overload
- **43%** experience burnout from communication overload
- Taiwan ranks **#1 globally** in workplace burnout (36%, WTW 2024)
- Taiwan consumes **1.17 billion sleeping pills** annually — #1 in Asia

The cycle is relentless: message overload → anxiety → stress internalization → insomnia and burnout → declining productivity → even more messages. No existing product breaks this cycle by monitoring real behavioral data.

## How Moltos Works

### 1. Connect
Users link their messaging platforms. Moltos extracts only **metadata** — message counts, timestamps, reply intervals. Never message content.

### 2. Monitor — The Calm Index
Our proprietary algorithm computes a **Calm Index (0-100)** across 5 behavioral dimensions:

| Dimension | What It Measures |
|-----------|-----------------|
| Message Volume | Daily message count vs. personal 14-day baseline |
| Reply Latency | Changes in response time patterns |
| Night Activity | Usage during 23:00-05:00 (sleep disruption indicator) |
| Unread Pileup | Rising unread counts without clearing (avoidance signal) |
| Voice Emotion | Speech rate, pitch, pause patterns, volume variability |

The algorithm uses **Exponential Weighted Moving Average (EWMA)** to build personal baselines, **Z-score analysis** for anomaly detection, and **Sigmoid decay scoring** for smooth score transitions.

**Open source under MIT License:** github.com/fishtvlvoe/moltos

### 3. Intervene
When the Calm Index drops below a personal threshold:

- **Mild drop** → Text-based check-in message
- **Significant drop** → Proactive AI voice call with real-time emotion analysis
- **Critical pattern** → Guided breathing exercise + professional resource suggestions

Voice calls use dual-channel analysis: **what you say** (text sentiment from speech-to-text) and **how you say it** (acoustic features — speech rate, fundamental frequency, pause ratio, volume variability).

## Key Differentiators

| vs. Competitors | Moltos Advantage |
|----------------|------------------|
| vs. Woebot/Wysa | We don't wait for self-reports — we see real behavioral data |
| vs. Headspace Ebb | We integrate with work communication tools, not just a meditation app |
| vs. Replika/Pi | We know your actual stress level, not just what you tell us |
| vs. ChatGPT | We proactively monitor and intervene — no user setup required |

## Privacy Architecture

Mental health data is the most sensitive personal data. Moltos uses **architecture, not just policy** to protect it:

- **Metadata only:** Message counts and timestamps extracted; content never read
- **On-device computation:** Calm Index calculated locally; no cloud processing needed
- **End-to-end encryption:** All voice conversations encrypted
- **User control:** View, export, or delete all data at any time
- **Edge AI ready:** Designed for on-device deployment on Qualcomm AI Engine

## Cost Efficiency

| Metric | Value |
|--------|-------|
| AI cost per user/month | $0.24 |
| vs. ChatGPT Plus ($20/month) | 83x cheaper |
| Calm Index cloud cost | $0 (on-device) |
| Gross margin at $7.99/month | 96% |

Achieved through **multi-model smart routing**: 80% of tasks use lightweight models (Gemini Flash / GPT-4o mini), 20% use premium models (GPT-4o) for deep emotional conversations and crisis response.

## Target Users

- **Busy professionals** overwhelmed by messaging across multiple platforms
- **Entrepreneurs and freelancers** with no colleague to notice their burnout
- **Knowledge workers** processing 100+ messages daily
- **Anyone** whose stress builds silently through digital communication overload
