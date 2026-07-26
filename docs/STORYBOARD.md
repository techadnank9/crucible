# Crucible — Demo Storyboard

Target length **3:00**. Everything here is either verified against a real run or
marked as unverified. Nothing in the spoken script asserts something the product
has not actually done.

---

## The one-sentence pitch

> Crucible builds its own expert panel, forces that panel to attack its own
> answer, and rebuilds the answer from what survived — then tells you how far to
> trust the result.

## The spine of the demo

The strongest thing you have is **not** the architecture. It is a measured,
reproducible contrast between two real runs of the same question:

| Run | Input | Verdict | Self-scored trust |
|---|---|---|---|
| `5f262e2f` | Question only | **BI-RADS 3** — endorsed the report's own wrong call | 88 |
| `4df25bf3` | Question **+ the report** | **BI-RADS 4** — the correct call | 85 |

Same engine. Same question. The difference is whether the panel could see the
findings. Without them it was confidently wrong and *rated itself higher for it*.

That is the whole product argument in one slide: **confidence is not accuracy,
and an adversarial panel with the evidence in front of it changes the answer.**

> **Verify before you present.** The BI-RADS 4 conclusion is inferred from the
> scoring pass, which is all the API returns. Open run `4df25bf3` in the CrewAI
> dashboard, read the full answer, and confirm it argues Category 4 for the
> stated reasons. If it got there by a different route, adjust the line — do not
> present the contrast until you have read both outputs end to end.

---

## Beat sheet

### 0:00 — 0:25 · The failure mode

**On screen:** Landing page. Do not scroll.

**Say:**
> Diagnostic errors are rarely a missing fact. They're a conclusion that doesn't
> follow from findings written down in the same report. And the system that
> produced it has no reason to object — nothing in a single model is *required*
> to disagree with itself.

**Why it works:** frames the problem so the architecture is the obvious answer.
Don't say "AI hallucinates" — every other team says it.

---

### 0:25 — 0:45 · What Crucible does differently

**On screen:** scroll to "Why this shape."

**Say:**
> Crucible staffs a panel per question — it isn't a fixed set of prompts. Then it
> makes one agent's *job* to attack the draft. The Attacker fails its task if it
> agrees. Disagreement is structural, not requested.

**Land this line.** It's the one that separates you from "we used multiple agents."

---

### 0:45 — 1:10 · Attach the report

**On screen:** click **Pathology — margin status** or **Mammogram — BI-RADS
category**. Panel opens with the report and question pre-filled. Hit **Forge answer**.

**Say while it runs:**
> This is a synthetic report — no patient data. It contains one planted
> contradiction. The findings describe an irregular mass with indistinct margins.
> The report's own conclusion says probably benign, six-month watch. Those two
> statements cannot both be right.

**Note:** the catch is checkable *from the document alone*. You are not claiming
the system knows oncology. That claim you cannot defend; this one you can.

---

### 1:10 — 2:10 · The run

**On screen:** progress rail. Runs measured at **2m28s** and **2m53s**.

Fill the time — do not narrate the spinner:

- The rail steps are real stages, not a loading animation
- Name the panel: Defender, Attacker, Skeptic, then a Judge who rules and orders
  the rewrite
- **Have a backup plan.** If it runs long, cut to a pre-recorded run or a
  screenshot. Never let dead air run past ~40 seconds.

---

### 2:10 — 2:40 · The verdict

**On screen:** trust scale, then the answer.

**Say:**
> It caught the contradiction. And look at the score — it doesn't just say
> "correct," it tells you how far to trust it and which claim it would defend
> least. That's the part you can audit.

**Then the contrast — the strongest 15 seconds you have:**
> We ran this same question without the report attached. It agreed with the
> wrong category and scored itself *higher*. Confidence is not accuracy. That gap
> is exactly what this is built to close.

---

### 2:40 — 3:00 · Close

**Say:**
> The engine is general — it's answered questions on hiring and on energy markets
> with no reconfiguration. We aimed it at oncology because that's where a
> confident wrong answer costs the most.

Then stop. Don't add features you didn't show.

---

## What this is not — refuse these three claims

A judge may hand you a bigger claim. Taking it loses the room, because each one
is contradicted by your own data.

**1. "It diagnoses."**
It checks whether a conclusion follows from findings stated in the same
document. That needs no clinical knowledge and makes no diagnosis. The narrow
claim is the defensible one.

**2. "It recommends treatment."**
It does not, and it cannot without real patient data, staging, comorbidities,
validation against outcomes, and regulatory clearance. A system that outputs
treatment recommendations is a regulated medical device. That is a different
product, not a prompt change.

**3. "The trust score tells you how confident to be in the answer."**
This is the one that will catch you out, because your own runs disprove it:

| Run | Verdict | Self-score |
|---|---|---|
| `5f262e2f` | BI-RADS 3 — **wrong** | **88** |
| `4df25bf3` | BI-RADS 4 — **right** | 85 |

**The wrong answer scored higher.** The score measures how well-supported the
crew judges its own argument, not whether it is correct. Nothing calibrated it
against ground truth.

If asked what the score means, say that plainly. "It's the system's own
assessment of how well it argued — we've seen it rate a wrong answer higher
than a right one, which is exactly why we show the reasoning underneath it
rather than just the number" is a *better* answer than a confident one. It
shows you understand your own system.

### The line that survives cross-examination

> Crucible doesn't diagnose and doesn't recommend treatment. It reads a report
> and flags when the conclusion doesn't follow from the findings written in the
> same report — the miss a rushed second reader makes. It surfaces the
> contradiction to a clinician, who decides.

---

## Hard lines — do not cross

1. **Never say Crucible diagnoses anything.** It reviews a document for internal
   consistency. That is the defensible claim and it is genuinely impressive.
2. **Never claim clinical validation.** It has none. The disclaimer is on the
   page; if asked, point at it. Volunteering it first reads as confidence.
3. **Don't quote a preventable-harm statistic you can't source.** A judge will
   Google it mid-pitch. Keep it qualitative.
4. **Don't present the BI-RADS 4 result until you've read the full output.** See
   the verification note above.

---

## Q&A prep

**"How is this different from asking GPT twice?"**
> A second pass agrees with the first — same weights, same priors. Here the
> Attacker fails its task if it agrees, and a separate Judge rules on the
> dispute. Disagreement is structural.

**"What if the panel is wrong?"**
> Then you see it. Every challenge, ruling, and the trust score are surfaced.
> A wrong answer you can audit beats a wrong answer you can't.

**"Is this a medical device?"**
> No, and we don't present it as one. No clearance, no clinical validation. It's
> a review layer over text.

**"Why so slow?"**
> Roughly two and a half minutes for a full adversarial pass. The debate round is
> the cost. We know how to parallelize it — the panel members don't read each
> other, so they can run concurrently.

**"How many agents?"**
> Ten, with a Recruiter that designs the specialist team per question at runtime.

---

## Pre-demo checklist

- [ ] **Execution quota.** Currently **102 of 100 used**. Runs will be refused
      until this resets or the plan is upgraded. *Nothing else on this list
      matters if this isn't fixed.*
- [ ] Read the full output of run `4df25bf3` and confirm the BI-RADS 4 reasoning
- [ ] Run the pathology fixture once — it has never been tested
- [ ] Have a clinician sanity-check both synthetic reports
- [ ] Record a backup run to play if the live one stalls
- [ ] Confirm the deployed site matches `main` — production is currently behind
- [ ] Hard-refresh the demo tab; confirm the sample buttons render
- [ ] Know your fallback question if a clinical run goes flat

---

## Storyboard frames

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  1. THE PROBLEM  │  │  2. THE SHAPE    │  │  3. ATTACH       │
│                  │  │                  │  │                  │
│  Landing hero    │  │  "Why this shape"│  │  Sample report   │
│  "a diagnosis"   │  │  Attacker fails  │  │  loads in 1 click│
│                  │  │  if it agrees    │  │                  │
│  0:00 — 0:25     │  │  0:25 — 0:45     │  │  0:45 — 1:10     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  4. THE RUN      │  │  5. THE CATCH    │  │  6. THE CONTRAST │
│                  │  │                  │  │                  │
│  Rail advances   │  │  Trust scale +   │  │  Same question,  │
│  ~2m30s          │  │  answer. It      │  │  no report → 88  │
│  NARRATE, don't  │  │  found the       │  │  and WRONG.      │
│  watch           │  │  contradiction   │  │  ← closer here   │
│  1:10 — 2:10     │  │  2:10 — 2:40     │  │  2:40 — 3:00     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

Frame 6 is the one they'll remember. Don't rush it.
