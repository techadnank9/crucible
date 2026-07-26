# Crucible — 15-Slide Deck

Forge palette: ink `#161210` · ember `#E2571F` · gold `#E8A33D` · paper `#F3ECE2`
Display: Fraunces (heavy) · Body: Space Grotesk · Labels: JetBrains Mono

> **The deck is a frame. The live demo is the star.** The hackathon explicitly says
> "no slideware." Target ~20 seconds per slide; slides 7 and 8 carry the weight.

> **Honesty guardrail (do not violate):** claim a *working pattern demonstrated end to
> end with a healthcare beachhead*. Never claim misdiagnosis is "solved." Technical
> judges reward the calibrated claim and punish the inflated one.

---

## 1 — Title

**CRUCIBLE**
*Tested by fire.*

An AI that argues with itself — and tells you how far to trust the result.

> **Notes:** Say the one-liner, don't read the slide. 5 seconds. Move.

---

## 2 — The shift

AI is moving out of the chat window and into the decision.

Diagnosis. Underwriting. Sentencing recommendations. Trade execution.

> **Notes:** Set the frame in one breath: this used to be a toy, now it's in the room
> where decisions get made. Don't linger — slide 3 is the punch.

---

## 3 — The problem

**795,000** Americans killed or permanently disabled every year by diagnostic error.
*(BMJ Quality & Safety / Johns Hopkins, 2023; AHRQ)*

**$100B+** annual cost to U.S. healthcare.

**January 2026** — the FDA loosened oversight of AI clinical decision support, leaning
on clinician review as the safety net.

> **Notes:** Slow down here. Three numbers, three beats. The FDA date is the "why now" —
> this is not a hypothetical future problem, the door opened this year.

---

## 4 — The dangerous gap

The FDA's safety net is **clinician review**.

But clinicians defer to confident machines. And LLMs fail in a specific way:
*clinically plausible, factually wrong.*

A single confident model is documented as unsafe for diagnosis.

> **Notes:** This is the gap the whole product lives in. The regulation assumes someone
> challenges the AI. In practice, nobody does. Land that sentence.

---

## 5 — The insight

Trust isn't produced by confidence.

**Trust is what's left after disagreement.**

Every high-stakes human system already knows this: peer review, tumor boards,
adversarial legal process, red teams.

> **Notes:** The conceptual turn of the talk. Medicine already solved this socially —
> the tumor board exists because one radiologist alone isn't enough. We built the
> tumor board out of agents.

---

## 6 — Meet Crucible

Give it a diagnostic report or any high-stakes question. Crucible:

1. Builds its own specialist team for that specific problem
2. Researches it live
3. Writes an answer — then **attacks its own answer**
4. Rebuilds from the strongest objection
5. Returns a **trust score, 0–100**

> **Notes:** Don't over-explain. The next slide shows the machinery, and the demo
> proves it. This slide just plants "it argues with itself."

---

## 7 — How it works

```
Report / Question
  ↓
01  Report Analyst      frames the problem, extracts findings
02  Recruiter           designs the specialist team, live
03  Research Lead       executes research (web)
04  Answer Writer       version 1
  ↓
05  ┌─ Defender    argues v1 is right
    ├─ Attacker    proves v1 wrong — fails if it agrees
    └─ Skeptic     finds what both missed — fails if it overlaps
  ↓
06  Judge              rules VALID / NOISE, issues one rewrite directive
07  Answer Writer      version 2 — surgical rewrite
08  Monitor            trust score + strongest / weakest sentence
```

**10 agents. Four stacked patterns:** self-assembly · adversarial debate ·
reflection & rewrite · meta-scoring.

> **Notes:** Highlight the Debate and Reforge bands in ember. The key line to say out
> loud: *"The Attacker fails its task if it agrees. That's structural — you cannot get
> that from one prompt."*

---

## 8 — The moment

On a live run, Crucible caught **its own recommendation breaking the user's hard
constraint** — a car over the stated $30k budget.

The Judge ruled the objection VALID. The answer was rebuilt. **Trust score: 85.**

> Swap "budget" for "the patient's biopsy result," and that's a caught misdiagnosis.

> **Notes:** THE slide. This is the proof the pattern works, on a run judges can watch.
> Do not rush the swap line — it's what connects a car question to a cancer question.

---

## 9 — Generality

Same system. Zero reconfiguration.

| Input | Team it built |
|---|---|
| Car purchase, $30k budget | Automotive analyst, cost modeler, commuter-use specialist |
| Inbound B2B sales lead | Sales strategist, ICP analyst, deal-risk assessor |
| Diagnostic report | Clinical specialists, framed from the report itself |

The Recruiter designs a *different* team every time.

> **Notes:** Proves it isn't a hardcoded medical pipeline. Healthcare is the beachhead,
> not the boundary.

---

## 10 — Effective use of agents & models

Roles are structurally differentiated, not cosmetically:
- **Attacker fails if it agrees.** **Skeptic fails if it overlaps.**
- The Judge must issue a directive, not a summary.

**Model split — strong where the thinking is hard, lean where it isn't:**

| Strong reasoning | Fast / lean |
|---|---|
| Report Analyst · Attacker · Skeptic · Judge | Recruiter · Research Lead · Answer Writer ×2 · Defender · Monitor |

> **Notes:** This directly answers the judges' "effective use of agents and models"
> note. Be ready for the honest follow-up: only the Research Lead holds a tool
> (web search) — the other nine reason over passed context. The justification is
> the adversarial structure, not tool count. Say that plainly if asked.

---

## 11 — Built in Studio & deployed

Full crew built on the CrewAI Studio canvas — agents, tasks, context wiring, model
selection per node.

Deployed as a hosted crew. Live API. Plus a Next.js front end that proxies it
server-side.

~60s end-to-end run.

> **Notes:** Studio usage is 30% of the score. Show the canvas if there's a spare beat.

---

## 12 — Why it wins

| Criterion | Weight | Crucible |
|---|---|---|
| It works | 40% | Live demo, real input, end to end, ~60s |
| Ambition | 30% | 10 agents, 4 stacked patterns, per-role model strategy |
| Studio usage | 30% | Full system built on canvas and deployed |

> **Notes:** Don't read the table. Say: "It runs live, it stacks four patterns, and it's
> entirely built in Studio." Then move.

---

## 13 — Impact

Diagnostic error: ~795,000 deaths or permanent disabilities per year.
Studies attribute a large share to cognitive error — *unchallenged reasoning.*

An automatic adversarial review layer on every AI-assisted read is the missing
control the FDA guidance assumes exists.

**Beachhead:** healthcare. **Then:** law, finance, insurance, defense.

> **Notes:** Say "a large share" — do not put a fabricated preventable-harm number on
> screen. The calibrated claim is the credible one.

---

## 14 — What's next

- Clinical pilot with retrospective cases, measured against known outcomes
- FHIR / EHR integration so reports flow in automatically
- Calibration study: does the trust score actually track correctness?
- Same layer, other domains

> **Notes:** The calibration bullet is the one technical judges care about most. Owning
> that the score is currently uncalibrated buys credibility.

---

## 15 — Close

**Crucible**

An AI that doubts itself on purpose.

*And that's the one thing that makes it safe to act.*

> **Notes:** Say it, stop talking, take questions. Do not add anything after this line.

---

## Anticipated questions

**"Isn't this just one model prompted several times?"**
No — the Attacker's task fails if it agrees, the Skeptic's fails if it overlaps. Those
constraints are enforced structurally at the task level. A single prompt has no
mechanism to genuinely disagree with itself.

**"Is the trust score calibrated?"**
Not yet. It's a reliability signal produced by a dedicated auditor agent, not a
validated probability. Calibrating it against known outcomes is the next step. *(Say
this plainly — do not oversell.)*

**"What if the Judge is wrong?"**
It can be. The Judge on a lean model rubber-stamped every objection as VALID — which
is exactly why it runs on a strong reasoning model now. That's the model split earning
its place.

**"Could this be used clinically today?"**
No. It's a demonstration of a review pattern, not a medical device, and it's labeled
that way in the product.
