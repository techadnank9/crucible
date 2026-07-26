<div align="center">

# 🔥 Crucible

### An AI that argues with itself — and tells you how far to trust the result.

**Ten agents. Four stacked patterns. One structural guarantee: the critic *fails its task* if it agrees.**

[![Next.js](https://img.shields.io/badge/Next.js-16-161210?style=for-the-badge&logo=next.js&logoColor=E2571F)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-161210?style=for-the-badge&logo=react&logoColor=E2571F)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-161210?style=for-the-badge&logo=typescript&logoColor=E2571F)](https://typescriptlang.org)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-E2571F?style=for-the-badge)](https://crewai.com)
[![License](https://img.shields.io/badge/License-MIT-E8A33D?style=for-the-badge)](LICENSE)

</div>

---

## The one-sentence version

Give Crucible a diagnostic report or any high-stakes question. It assembles its own specialist team, researches the problem live, writes an answer — then makes its own agents **attack that answer** before you ever see it. A judge rules which objections survive, the answer is rebuilt around the strongest one, and a reliability auditor returns a **trust score from 0 to 100**.

> **No single model can genuinely disagree with itself.** That is the entire reason this is a multi-agent system and not one long prompt.

---

## Why this exists

| | |
|---|---|
| **795,000** | Americans killed or permanently disabled every year by diagnostic error<sup>[1]</sup> |
| **$100B+** | Annual cost to U.S. healthcare |
| **Jan 2026** | FDA loosened oversight of AI clinical decision support, leaning on clinician review as the safety net |

The FDA's safety net assumes a human challenges the AI. In practice, clinicians defer to confident machines — and LLMs fail in one specific way: *clinically plausible, factually wrong.*

**Crucible is that missing challenge, automated.**

<sub>[1] BMJ Quality & Safety / Johns Hopkins, 2023; AHRQ</sub>

---

## Functional architecture

How a question becomes a scored, debated answer.

```mermaid
flowchart TD
    IN(["📄 Report text and/or question"]) --> A1

    subgraph INTAKE ["① INTAKE"]
        A1["<b>Clinical Report Analyst</b><br/><i>frames the problem — never judges it</i>"]
    end

    subgraph BUILD ["② SELF-ASSEMBLY + RESEARCH"]
        A2["<b>Recruiter</b><br/><i>designs the specialist team, live</i>"]
        A3["<b>Research Lead</b><br/><i>executes research · web search</i>"]
        A4["<b>Answer Writer</b><br/><i>version 1</i>"]
    end

    subgraph DEBATE ["③ ADVERSARIAL DEBATE"]
        A5["<b>Defender</b><br/><i>argues v1 is correct</i>"]
        A6["<b>Attacker</b><br/>⚠️ <i>FAILS if it agrees</i>"]
        A7["<b>Skeptic</b><br/>⚠️ <i>FAILS if it overlaps</i>"]
    end

    subgraph RESOLVE ["④ RULING + REBUILD"]
        A8["<b>Judge</b><br/><i>VALID / NOISE → one rewrite directive</i>"]
        A9["<b>Answer Writer</b><br/><i>version 2 · surgical rewrite</i>"]
    end

    subgraph SCORE ["⑤ META-SCORING"]
        A10["<b>Reliability Auditor</b><br/><i>trust score + strongest / weakest</i>"]
    end

    A1 --> A2 --> A3 --> A4
    A4 --> A5 & A6
    A5 & A6 --> A7
    A7 --> A8 --> A9 --> A10
    A10 --> OUT(["✅ Answer v2 + trust score 0–100"])

    style A6 fill:#E2571F,color:#fff,stroke:#161210,stroke-width:2px
    style A7 fill:#E2571F,color:#fff,stroke:#161210,stroke-width:2px
    style A8 fill:#161210,color:#fff,stroke:#E2571F,stroke-width:2px
    style A10 fill:#E8A33D,color:#161210,stroke:#161210,stroke-width:2px
    style OUT fill:#E8A33D,color:#161210,stroke:#161210,stroke-width:2px
```

### The ten agents

| # | Agent | Responsibility | Failure condition |
|:--:|---|---|---|
| 1 | **Clinical Report Analyst** | Extracts stated diagnosis, supporting and contradicting findings, unresolved ambiguities. Frames — does not solve. | — |
| 2 | **Recruiter** | Designs 3–5 specialists specific to *this* problem | — |
| 3 | **Research Lead** | Executes each specialist's research. **Only tool-holding agent** (web search) | — |
| 4 | **Answer Writer** | Produces answer version 1 | — |
| 5 | **Defender** | Argues v1 is correct, quoting ≥3 supported claims | — |
| 6 | **Attacker** | ≥3 objections, each quoting the exact claim attacked | 🔴 **Fails if it agrees** |
| 7 | **Skeptic** | ≥2 blind spots both others missed | 🔴 **Fails if it overlaps** |
| 8 | **Judge** | Rules VALID/NOISE per objection, issues one rewrite directive | 🔴 Fails if it merely summarises |
| 9 | **Answer Writer** *(reused)* | Version 2 — applies the directive as one surgical rewrite | — |
| 10 | **Reliability Auditor** | Trust score 0–100 + strongest and weakest sentence | — |

### Why the failure conditions matter

They are enforced **in the task definitions**, not requested politely in a prompt.

A single model asked to "consider counterarguments" has no mechanism to genuinely disagree with itself — it produces agreeable hedging. Here, an Attacker that agrees has *failed its task*. That structural guarantee is the whole thesis.

```mermaid
flowchart LR
    subgraph ONE ["❌ One prompt"]
        P["'Consider counterarguments'"] --> R["Agreeable hedging<br/><i>no mechanism to truly disagree</i>"]
    end
    subgraph MANY ["✅ Crucible"]
        A["Attacker task"] --> B["FAILS if it agrees"]
        B --> C["Genuine objections,<br/>each quoting a claim"]
    end
    style R fill:#f5e6e0,color:#161210
    style B fill:#E2571F,color:#fff
    style C fill:#E8A33D,color:#161210
```

---

## Technical architecture

The browser **never** contacts the CrewAI API. Every call is proxied server-side, so the bearer token stays in server env and CORS is never a factor.

```mermaid
flowchart LR
    subgraph CLIENT ["🌐 Browser"]
        UI["Report / question input<br/>PDF upload<br/>Progress rail<br/>Trust score card"]
    end

    subgraph SERVER ["▲ Next.js server — token lives here"]
        R1["POST /api/solve"]
        R2["GET /api/status"]
        R3["POST /api/extract-report"]
        LIB["lib/crew.ts<br/><i>env validation</i>"]
    end

    subgraph CREW ["🤖 CrewAI deployment"]
        K["POST /kickoff"]
        ST["GET /status/:id"]
        AG["10-agent crew"]
    end

    UI -->|"{ question, report_text }"| R1
    UI -->|"poll every 2.5s"| R2
    UI -->|"FormData: PDF"| R3
    R3 -->|"pdf-parse<br/>text layer only"| UI

    R1 --> LIB
    R2 --> LIB
    LIB -->|"Bearer token"| K
    LIB -->|"Bearer token"| ST
    K --> AG --> ST

    style SERVER fill:#161210,color:#fff
    style R1 fill:#E2571F,color:#fff
    style R2 fill:#E2571F,color:#fff
    style R3 fill:#E2571F,color:#fff
    style CREW fill:#E8A33D,color:#161210
```

### Request lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant B as 🌐 Browser
    participant N as ▲ Next.js
    participant C as 🤖 CrewAI

    opt PDF upload
        B->>N: POST /api/extract-report (FormData)
        N->>N: pdf-parse → text layer
        alt has text layer
            N-->>B: { text }
        else scanned image
            N-->>B: 422 "paste the text instead"
        end
    end

    B->>N: POST /api/solve { question?, report_text? }
    N->>C: POST /kickoff (Bearer) { inputs }
    C-->>N: { kickoff_id }
    N-->>B: { kickoff_id }

    loop every 2.5s · 3 min ceiling
        B->>N: GET /api/status?id=…
        N->>C: GET /status/{id} (Bearer)
        C-->>N: { state, result? }
        N-->>B: passthrough JSON
    end

    B->>B: render markdown + parse trust score
```

### API surface

| Route | Method | Input | Output | Errors |
|---|:--:|---|---|---|
| `/api/solve` | `POST` | `{ question?, report_text? }` — at least one | `{ kickoff_id }` | `400` neither given · `500` env missing · `502` kickoff failed |
| `/api/status` | `GET` | `?id=<kickoff_id>` | Crew status JSON | `400` no id · `500` env missing · `502` upstream failure |
| `/api/extract-report` | `POST` | `FormData` with `file` | `{ text }` | `400` no file · `422` no text layer |

---

## Model strategy

Strong reasoning where the reasoning is hard. Lean models everywhere else.

```mermaid
pie showData
    title Model allocation across 10 agents
    "Strong reasoning — Analyst, Attacker, Skeptic, Judge" : 4
    "Fast / lean — Recruiter, Research, Writer x2, Defender, Monitor" : 6
```

| Tier | Agents | Rationale |
|---|---|---|
| 🔥 **Strong** <br/><sub>claude-sonnet-4.5 · gpt-4o · o3 · gemini-2.5-pro</sub> | Report Analyst, Attacker, Skeptic, Judge | Must catch subtle errors, avoid mutual overlap, and separate valid from noise |
| ⚡ **Lean** <br/><sub>gpt-4o-mini · claude-haiku-4.5 · gemini-2.5-flash</sub> | Recruiter, Research Lead, Answer Writer ×2, Defender, Monitor | Execution, synthesis, formatting — a frontier model adds latency and cost, not quality |

> **Measured, not assumed:** on a lean model the Judge rubber-stamped *every* objection as VALID and the debate went flat. That is the split earning its place.

---

## The product

### Two input modes

| Mode | Inputs | Behaviour |
|---|---|---|
| **Review a report** | `report_text` required, `question` optional | Intake agent frames the report. No question given → defaults to *"Is this diagnosis correct and complete?"* |
| **Ask a question** | `question` required | General decision-making system — the original, proven path |

### Report intake

```mermaid
flowchart LR
    P["📋 Paste<br/>radiology · pathology · labs"] --> F
    U["📎 Upload PDF"] --> E{"Text layer?"}
    E -->|yes| F["🧠 Intake agent frames<br/>the clinical problem"]
    E -->|"no — scanned"| X["⛔ Refused with guidance<br/><i>never silently mangled</i>"]
    F --> D["→ into the debate"]
    style X fill:#f5e6e0,color:#161210
    style F fill:#161210,color:#fff
    style D fill:#E2571F,color:#fff
```

### What the user sees

While the crew runs (~60s), an eight-step progress rail advances so there is never a bare spinner. When it lands, the trust score card surfaces the score plus the strongest and weakest claims, with the rebuilt answer rendered in full beneath.

---

## Quick start

```bash
git clone https://github.com/techadnank9/crucible.git
cd crucible
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

```env
CREW_URL=https://your-crew-name.crewai.com
CREW_TOKEN=your-bearer-token-here
```

```bash
npm run dev
```

Open **http://localhost:3000**.

> Without the env vars the UI loads and every control works — submitting returns a clear configuration error rather than failing silently.

---

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/techadnank9/crucible)

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Add environment variables under **Project Settings → Environment Variables**:
   - `CREW_URL`
   - `CREW_TOKEN`
3. Deploy

Both variables are read **server-side only** — neither is prefixed `NEXT_PUBLIC_`, so neither can reach client code.

> 🔐 Rotate the bearer token in CrewAI Studio after any public demo, and update the Vercel variable to match.

---

## Building the crew

The crew itself lives in CrewAI Studio. To rebuild it from scratch, paste the scaffold prompt into Studio (choose **Crews**, not Flows) — it specifies all ten agents, the sequential task flow, and the per-role model split.

Verification checklist after scaffolding:

- [ ] Intake task runs **before** the Recruiter
- [ ] `report_text` appears as an input on the Run/Kickoff tab
- [ ] A question-only run (blank `report_text`) still works
- [ ] The Attacker quotes **exact claims** — not vague concerns
- [ ] The Judge rules at least one objection VALID and forces a real rewrite, so v2 differs from v1

If the Attacker comes back polite, harden its goal field and re-run. A flat debate is the one failure mode that invalidates the whole system.

---

## Project structure

```
app/
├── layout.tsx                  fonts, metadata
├── page.tsx                    mode toggle, inputs, polling state machine
├── globals.css                 forge palette, hard shadows, heat glow
└── api/
    ├── solve/route.ts          kickoff proxy
    ├── status/route.ts         status proxy
    └── extract-report/route.ts PDF text extraction
components/
├── ProgressRail.tsx            7-step rail (8 in report mode)
└── ResultView.tsx              markdown render + trust score card
lib/
├── crew.ts                     env access and validation
├── parseResult.ts              completion detection, trust score parsing
└── samples.ts                  synthetic test reports
docs/
├── Crucible.pptx               21-slide deck with speaker notes
├── DECK.md                     deck content and anticipated Q&A
└── STORYBOARD.md               3-minute demo script and failure playbook
```

---

## Key implementation decisions

<details>
<summary><b>Progress is timer-driven, not event-driven</b></summary>

The CrewAI status endpoint reports overall state, not which agent is currently executing. The rail advances on a ~9s timer to give the ~60s run visible motion. It is an honest approximation of pipeline position, not a live trace.
</details>

<details>
<summary><b>Completion detection is defensive</b></summary>

`isDone()` accepts `SUCCESS`, `COMPLETED`, `COMPLETE`, or `DONE`, *or* the presence of a result field — deployments differ in which they report. `extractResultText()` handles `result` as both a string and `result.raw`.
</details>

<details>
<summary><b>PDF extraction is text-layer only — no OCR</b></summary>

Scanned or photographed reports return `422` telling the user to paste text instead. A silent partial read of a medical document is worse than a clear refusal.
</details>

<details>
<summary><b>serverExternalPackages is required, not optional</b></summary>

`pdfjs` resolves its worker from disk at runtime. Bundling it breaks that path with `Setting up fake worker failed`. Hence `serverExternalPackages: ["pdf-parse", "pdfjs-dist"]` in `next.config.ts`.
</details>

<details>
<summary><b>Trust score parsing is best-effort</b></summary>

`parseTrustScore()` regex-matches the score and strongest/weakest lines out of free-form model output. If the pattern does not match, the card is omitted and the full answer still renders — the result is never withheld because the decoration failed.
</details>

### Failure modes

| Failure | Handling |
|---|---|
| Env vars missing | `500` naming both variables explicitly |
| Non-2xx on kickoff | `502`, upstream status and body surfaced |
| No `kickoff_id` returned | `502` with explicit message |
| Crew reports `FAILED` | Polling stops, error shown in UI |
| Run exceeds 3 minutes | Timers cleared, timeout message shown |
| Completed but empty result | Treated as an error, never as blank success |
| PDF has no text layer | `422` directing the user to paste |
| Component unmounts mid-poll | `useEffect` cleanup clears both timers |

---

## Stack

**Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5** · **Tailwind CSS v4** · **react-markdown** + remark-gfm · **pdf-parse v2** · **CrewAI** (hosted deployment)

---

## Roadmap

- [ ] **Calibration study** — does the trust score actually track correctness?
- [ ] **Clinical pilot** — retrospective cases measured against known outcomes
- [ ] **FHIR / EHR integration** — reports flow in automatically
- [ ] **Streaming agent trace** — replace the timer rail with live per-agent events
- [ ] **Other domains** — the same review layer for law, finance, insurance

---

## Documentation

| File | Contents |
|---|---|
| [`docs/Crucible.pptx`](docs/Crucible.pptx) | 21-slide deck, speaker notes with timings on every slide |
| [`docs/DECK.md`](docs/DECK.md) | Deck content, honesty guardrails, anticipated Q&A |
| [`docs/STORYBOARD.md`](docs/STORYBOARD.md) | 3-minute demo script, failure playbook, claims discipline |

---

## ⚠️ Disclaimer

**Crucible is not a medical device.** It is a demonstration of an adversarial review pattern.

- Not validated for clinical use
- The trust score is **not** a calibrated probability — it is a reliability signal from a dedicated auditor agent
- **Never enter real patient data.** The bundled sample reports are synthetic and fictional
- Claims a *working pattern with a healthcare beachhead* — not that misdiagnosis is solved

---

## License

[MIT](LICENSE)

---

<div align="center">

### *An AI that doubts itself on purpose.*
### *And that's the one thing that makes it safe to act.*

</div>
