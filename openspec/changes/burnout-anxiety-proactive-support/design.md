## Context

MOLTOS today focuses on Gmail-derived calm index, conversational support, and retrospective review. The new direction introduces proactive mental-health support: baseline onboarding assessment, daily check-ins, micro-interventions, trend risk alerts, therapist escalation, and paid/commercial layers. This change touches product flows, data governance, integration boundaries, and monetization contracts across onboarding, dashboard, review, settings, and API surfaces.

The key implementation constraint is trust: the system MUST remain clearly non-medical while still delivering actionable early support. The second constraint is delivery timing: artifacts MUST support a late-April implementation kickoff with reduced ambiguity.

## Goals / Non-Goals

**Goals:**

- Define an end-to-end product contract for proactive support before coding starts.
- Establish explicit risk-tier and escalation rules that prevent unsafe or misleading UX.
- Define a data model that combines subjective check-ins and wearable signals.
- Define commercial boundaries for freemium, premium coaching, and partner referrals.
- Preserve MOLTOS’s calm interaction style without pressure mechanics.

**Non-Goals:**

- Build clinical diagnosis, treatment plans, or emergency hotline replacement.
- Finalize exact vendor selection for wearable providers or payment rails in this change.
- Implement model training improvements beyond minimal signal scoring contracts.
- Ship code in this phase.

## Decisions

### Decision: Baseline + daily check-in becomes the primary product loop

The system SHALL require a confidential baseline assessment during onboarding and SHALL treat daily check-in (voice or guided journal) as the default daily loop.

**Rationale:** The existing passive-signal model misses early emotional drift; proactive daily loops create earlier intervention points.

**Alternatives considered:** Keep passive-only monitoring. Rejected because it underperforms for early user self-awareness and premium conversion.

### Decision: Multi-signal risk model uses deterministic tier thresholds first

Risk detection SHALL start with deterministic rules (trend decline, sleep disruption, stress-language increase, check-in consistency drop) before any advanced model scoring.

**Rationale:** Deterministic thresholds are auditable, easier to explain to users, and safer for legal review.

**Alternatives considered:** End-to-end ML-only risk scoring. Rejected for initial commercialization due to explainability and compliance risk.

### Decision: Micro-interventions are constrained to low-risk, short-form actions

The intervention library SHALL include short sessions (around 3 minutes) such as breathing, CBT reframing, gratitude, and grounding, and SHALL avoid diagnostic or high-intensity protocols.

**Rationale:** Low-friction actions improve adherence and fit non-clinical product positioning.

**Alternatives considered:** Long therapy-like guided modules. Rejected due to abandonment risk and medical-positioning ambiguity.

### Decision: Escalation policy separates supportive prompts from therapist routing

The system SHALL implement explicit risk tiers with discrete UX outcomes: supportive nudge, stronger recommendation, and therapist-directory handoff with non-medical disclaimer.

**Rationale:** Commercial viability depends on trust and clear boundaries, not only features.

**Alternatives considered:** Generic escalation popups without tier policy. Rejected as legally fragile and operationally inconsistent.

### Decision: Commercial packaging is capability-gated by tier

Free tier SHALL include basic daily check-ins and simple trend visibility. Premium tier SHALL include intervention personalization, advanced insights, and therapist handoff conveniences. B2B/white-label SHALL reuse the same core contracts with tenant-level branding and reporting boundaries.

**Rationale:** Tiered capability boundaries are needed to prevent cannibalization and improve sales clarity.

**Alternatives considered:** Fully free core with optional add-ons only. Rejected due to weak recurring revenue predictability.

## Risks / Trade-offs

- **[Risk] False-positive escalation harms trust** → **Mitigation:** conservative thresholds, tier-specific copy, and explicit “not medical advice” framing.
- **[Risk] False-negative risk misses users who need support** → **Mitigation:** combine multiple signals and enforce minimum daily check-in prompts.
- **[Risk] Privacy concerns reduce adoption** → **Mitigation:** granular consent controls, data retention transparency, and user-triggered deletion/export contracts.
- **[Risk] Over-scoped first release delays execution** → **Mitigation:** stage rollout by loop foundation → risk policy → therapist handoff → monetization packaging.
- **[Risk] Partner therapist booking dependency blocks launch** → **Mitigation:** ship directory + outbound handoff first, then direct booking integration.

## Migration Plan

1. Introduce new capability specs and deltas for existing specs.
2. Implement schema and API contracts for check-ins, interventions, risk tiers, and consent fields.
3. Roll out UI information architecture updates (Today / Insights / Support) behind feature flags.
4. Launch free-tier daily loop first, then unlock premium intervention intelligence.
5. Enable therapist handoff with legal disclaimers and track referral funnel metrics.

Rollback strategy: disable new loops via feature flags and preserve existing calm index + chat pathways as fallback.

## Open Questions

- Which wearable integration partner is phase-1 mandatory versus optional?
- Which regions require additional legal copy for referral and non-medical disclaimers?
- Is direct therapist booking in MVP required, or is directory + outbound handoff sufficient for launch?
- What minimum measurable outcome defines “commercially valid” in the first 30 days (retention, intervention completion, referral conversion)?
