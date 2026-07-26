# Crucible — 3-Minute Demo Storyboard

Shot by shot. Left column is what the judges see, right is what you say.
Total 3:00. The live run takes ~60s — everything is timed around that gap.

**Golden rule:** start the run EARLY (0:30) and talk over it. Never watch a spinner
in silence.

---

## Pre-flight (morning of)

- [ ] Run your demo input once, end to end. Confirm it completes and time it.
- [ ] Both proven runs (car, sales) open in browser tabs as fallback.
- [ ] Front end loaded at the deployed URL, question already typed in, not submitted.
- [ ] Studio canvas open in a tab — for the "built in Studio" beat.
- [ ] Deck open, on slide 1.
- [ ] Wi-Fi checked. Phone hotspot as backup.
- [ ] Bearer token confirmed working (a 401 on stage is unrecoverable).

---

## Shot 1 — The Problem · 0:00–0:30

**Screen:** Deck slides 1 → 3. Land on the three numbers.

> "Every year, diagnostic error kills or permanently disables 795,000 Americans. It's
> the deadliest, most expensive mistake in medicine. And as of January 2026, the FDA
> opened the door to AI making those diagnoses.
>
> The problem? A single AI model is confidently wrong the same way a rushed doctor is.
> There's no one in the room to challenge it."

**Beat:** Pause after "no one in the room." That silence is the setup.

---

## Shot 2 — Start the run · 0:30–1:00

**Screen:** Switch to the live front end. Type or paste the input. **Hit submit.**

> "This is Crucible. Give it any high-stakes decision — or a diagnostic report — and it
> builds its own expert team, then makes those agents argue over the answer before you
> ever see it."

**Action:** Submit at ~0:40. The progress rail starts animating. Leave it on screen.

**Critical:** Do not wait for it. Keep talking — the rail gives you visible motion for
free.

---

## Shot 3 — Narrate the pipeline · 1:00–1:45

**Screen:** The progress rail, advancing. Optionally split with deck slide 7.

> "Watch what it's doing. It's designing the specialist team for this specific problem —
> nobody told it which experts to use. Now researching live. Writing a first answer.
>
> And now the part that matters — the attack. A Defender argues the answer is right. An
> Attacker has to prove it's wrong, quoting exact claims. And here's the thing: the
> Attacker *fails its task* if it agrees. Disagreement isn't requested. It's structural.
>
> Then a Skeptic finds what both of them missed. And a Judge rules which objections are
> real."

**If the run is slow:** this block stretches. Add the model-split line:
> "Strong reasoning models where the thinking is hard — the Attacker, the Skeptic, the
> Judge. Lean models where it isn't. That's a deliberate cost and latency choice."

---

## Shot 4 — The moment · 1:45–2:20

**Screen:** Scroll to the rebuilt answer + the trust score card.

> "There. It caught that its own recommendation broke the user's hard constraint — and
> rebuilt the answer around the objection. Nobody prompted that. It found it by
> attacking itself.
>
> Now swap 'budget' for 'the patient's biopsy result.' That's a caught misdiagnosis.
>
> And it doesn't just give you the answer — it tells you how far to trust it. Trust
> score: 85. Strongest claim, weakest claim, named."

**Beat:** The swap line is the whole pitch. Say it slowly. Let it land before moving.

---

## Shot 5 — Generality + Studio · 2:20–2:45

**Screen:** Second saved run (different team) → flash the Studio canvas.

> "Same system, any problem. It built a completely different expert team for a sales
> question — automotive analysts for one, deal-risk assessors for the other. No
> reconfiguration.
>
> Ten agents, four stacked patterns, all built on the Studio canvas — and deployed,
> live, right now."

**Action:** Keep the canvas on screen 3–4 seconds. Studio usage is 30% of the score;
make sure they see it.

---

## Shot 6 — Close · 2:45–3:00

**Screen:** Deck slide 15.

> "The FDA's guidance assumes someone challenges the AI. Today, nobody does.
>
> Crucible is an AI that doubts itself on purpose. And that's the one thing that makes
> it safe to act."

**Then stop talking.** Do not add. Take questions.

---

## Failure playbook

| What breaks | What you do |
|---|---|
| Run is slow (>90s) | Keep narrating Shot 3. You have ~45s of material there. Then: "while that finishes, here's one from earlier" → switch to saved run. |
| Run fails / errors | "Let me show you one from earlier" — no apology, no dwelling. Switch to a saved tab. Judges forgive a network; they don't forgive panic. |
| 401 / auth error | Go straight to saved runs. Do not debug on stage. |
| Front end is down | Drive the demo from the Studio Run tab instead. It always executes. |
| Judge asks a question mid-demo | Answer it, then say "and it's still running" — the delay works *for* you. |

---

## Claims discipline

Say these — all true, all verified:
- "It caught its own recommendation breaking a hard constraint." ✅ proven, trust 85
- "It built a different specialist team for each problem." ✅ proven twice
- "The Attacker fails its task if it agrees." ✅ structural, in the task config
- "Ten agents, deployed and live." ✅

Do **not** say:
- "It caught a cancer misdiagnosis" — you caught a budget error. Use the *swap* line.
- "The trust score is calibrated" — it isn't yet. If asked, say so; that answer earns
  more credit than a dodge.
- "This solves misdiagnosis" — claim a working pattern with a healthcare beachhead.
- Anything about the report-intake path working, **unless you have run it and watched
  it complete.** Untested until proven.

Reason this is strategy, not caution: 40% of the score is "it works." A claim you can't
survive one follow-up question on costs you that entire criterion — plus the
credibility of every true claim you made before it.
