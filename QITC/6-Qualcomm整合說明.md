# Qualcomm Technology Integration — Moltos

## Why On-Device AI Is Essential for Mental Health

Mental health monitoring presents a unique challenge: the data is extremely sensitive, but the analysis must be continuous and real-time. Cloud-based approaches create an inherent tension between privacy and functionality.

Moltos resolves this tension through **on-device AI** — and Qualcomm's edge AI platform is the natural deployment target.

## Current Architecture (Cloud-Assisted)

```
User's Phone
├── Metadata Extractor (local) — extracts message counts, timestamps
├── Calm Index Engine (local) — computes stress score on-device
└── Voice Recorder (local) — captures audio for emotion analysis

     ↓ (encrypted metadata only)

Cloud Services
├── AI Chat Engine — multi-model routing (Gemini Flash / GPT-4o)
├── Voice Emotion Analysis — Whisper STT + acoustic feature extraction
└── Proactive Scheduler — triggers check-ins based on Calm Index
```

**Already on-device:** Calm Index computation, metadata extraction
**Currently cloud:** Voice emotion analysis, conversational AI

## Qualcomm Integration Roadmap

### Phase 1: Calm Index on Qualcomm AI Engine
**Timeline:** Q3-Q4 2026

| Component | Current | With Qualcomm AI Engine |
|-----------|---------|------------------------|
| EWMA baseline calculation | JavaScript (on-device) | Optimized on Hexagon DSP |
| Z-score anomaly detection | JavaScript (on-device) | Hardware-accelerated inference |
| Power consumption | Standard CPU | Ultra-low power DSP |
| Latency | ~50ms | <10ms |

**Value:** Battery-efficient, always-on stress monitoring without app needing to be in foreground.

### Phase 2: Voice Emotion on Hexagon DSP
**Timeline:** Q1-Q2 2027

| Component | Current | With Hexagon DSP |
|-----------|---------|-----------------|
| Speech-to-text | Cloud (Whisper API) | On-device (Whisper.cpp on NPU) |
| Acoustic feature extraction | Cloud | On-device DSP processing |
| Emotion classification | Cloud | On-device neural network |
| Per-inference cost | ~$0.003 | $0 |
| Privacy | Audio sent to cloud | Audio never leaves device |

**Value:** Complete voice emotion analysis without any audio data leaving the device. True privacy-first voice AI.

### Phase 3: Always-On via Qualcomm Sensing Hub
**Timeline:** Q3 2027+

| Capability | Description |
|------------|-------------|
| Background monitoring | Continuous metadata collection via Sensing Hub |
| Wake-on-anomaly | Trigger main AI only when Calm Index anomaly detected |
| Power budget | <1mW continuous monitoring |
| User experience | Zero battery impact, seamless background operation |

**Value:** Mental health monitoring that works like a smoke detector — always watching, only alerts when something is wrong, uses almost no power.

## Technical Fit Summary

| Moltos Requirement | Qualcomm Solution |
|-------------------|-------------------|
| Low-power continuous monitoring | Qualcomm Sensing Hub |
| On-device neural inference | Qualcomm AI Engine / Hexagon DSP |
| Privacy-preserving computation | On-device processing, no cloud needed |
| Real-time audio processing | Hexagon Vector DSP |
| Multi-model optimization | Qualcomm Neural Processing SDK |
| Battery efficiency | Dedicated low-power AI accelerator |

## Why This Partnership Makes Sense

**For Moltos:**
- Access to hardware-accelerated AI inference → better battery life, lower latency
- Qualcomm's mobile ecosystem reach → faster deployment across Android devices
- Technical mentorship → edge AI deployment best practices

**For Qualcomm:**
- Mental health is a high-growth vertical ($17B → $91B by 2033)
- Demonstrates Snapdragon's AI capabilities in a human-impact use case
- Privacy-first on-device AI is a key differentiator vs. cloud-dependent competitors
- Potential showcase for Qualcomm Sensing Hub's always-on capabilities

## Conclusion

Moltos was designed for on-device deployment from day one. Our architecture already separates metadata extraction and Calm Index computation (on-device) from conversational AI (cloud). The natural next step is migrating voice emotion analysis and enabling always-on monitoring — and Qualcomm's AI platform is the ideal foundation for this evolution.
