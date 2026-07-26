# Crucible — setup sheet

Everything you copy-paste, in the order you do it.

---

## 1 · Vercel environment variables

Project → Settings → Environment Variables. Both already exist pointing at the
old deployment, so use **⋯ → Edit** rather than adding new ones. Tick both
**Production** and **Development**.

### CREW_URL

Key:

```
CREW_URL
```

Value:

```
https://crucible-c-846340a8-2f25-42bd-8a40-c2b3cc36-d2b3be5e.crewai.com
```

### CREW_TOKEN

Key:

```
CREW_TOKEN
```

Value: the **Bearer Token** from Crucible C's dashboard. Use the copy icon
beside the field. Not the User Bearer Token.

Names are case-sensitive — `lib/crew.ts` reads `process.env.CREW_URL` and
`process.env.CREW_TOKEN`. No `NEXT_PUBLIC_` prefix on either; that is what keeps
the token out of the browser bundle.

**Redeploy after saving.** Vercel bakes env vars at build time, so existing
deployments keep the old values until rebuilt.

---

## 2 · Local `.env.local`

Same two values. `CREW_URL` is already correct; only the token needs changing.

```
cd /Users/adnan/Documents/crucible && sed -i '' 's|^CREW_TOKEN=.*|CREW_TOKEN=PASTE_TOKEN_HERE|' .env.local && grep -c '^CREW_TOKEN=' .env.local
```

Or edit by hand: `open -e .env.local`

Next.js picks up the change without a restart.

---

## 3 · CrewAI Studio prompt

Paste everything between the markers into Studio. Not the markers themselves.

>>> COPY FROM HERE >>>

Change the final task of this crew so its output carries the full answer, not
just a score block.

THE PROBLEM: score_final_answer is the last task, so its output IS the crew
result. It currently returns only "Trust Score / Strongest Element / Weakest
Element" — roughly 350 characters. The reforged answer is produced earlier in
the run and then thrown away. The frontend has nothing to display.

REQUIRED: the final task must emit a single JSON object, and nothing else — no
prose before or after, no markdown fence around it. Use output_json or
output_pydantic so the shape is enforced rather than requested.

{
  "answer": "<the FULL reforged answer as markdown — the complete text, not a summary>",
  "score": {
    "value": 85,
    "strongest": "<one sentence>",
    "weakest": "<one sentence>",
    "dimensions": {
      "internal_consistency": 92,
      "evidence_quality": 74,
      "reasoning": 81,
      "source_recency": 60
    }
  },
  "challenges": [
    {
      "from": "Attacker",
      "claim": "<what this agent argued, quoting the source text>",
      "ruling": "<how the Judge ruled>",
      "survived": false
    }
  ],
  "revision": { "changed": 4, "kept": 6, "note": "<what the rewrite changed>" },
  "recommendation_check": {
    "stated": "<the recommendation the REPORT itself makes, quoted>",
    "follows_from": "<the report's own conclusion that recommendation rests on>",
    "consistent": false,
    "note": "<whether that recommendation still stands given the findings>"
  }
}

FIELD RULES:
- answer: mandatory and non-empty. This is the single most important field.
  Pass the reforged answer through via task context — do not regenerate or
  summarise it.
- score.value: 0-100 integer.
- dimensions: each 0-100. internal_consistency means "does the conclusion
  follow from the findings stated in the same document" — that is the crew's
  core job, so it must be scored explicitly.
- challenges: one entry per objection the panel raised. survived=true means
  the claim withstood the challenge; false means it forced a rewrite. Include
  every Defender, Attacker and Skeptic objection, not just sustained ones.
- revision: counts of claims changed versus left standing after the ruling.
- recommendation_check: quote the recommendation the REPORT makes and name the
  conclusion it rests on. Set consistent=false when that conclusion is one the
  report's own findings contradict — the recommendation then inherits the
  discrepancy. Report this as a finding about the document. NEVER propose a
  course of action, a treatment, or a next step of your own. The output states
  whether what is already written down still stands; a clinician decides what
  follows.

CONSTRAINTS:
- The Reforger's output must reach this task via context so the answer is
  carried forward verbatim.
- If a section genuinely has no data, omit the key. Never emit placeholder
  numbers — the frontend hides absent sections and shows invented ones.
- Question-only runs (no report_text) must keep working unchanged.

<<< COPY TO HERE <<<

**Redeploy the crew after pasting.** Studio edits do not reach the deployment
until it rebuilds. This is the step most often missed.

---

## 4 · Verify

1. Run the mammogram fixture from the app
2. Confirm the result is JSON with a populated `answer` — not a ~350-character
   score block
3. Confirm the app renders the answer body instead of "Verdict only"
4. Confirm the run appears in the **Crucible C** dashboard

If `answer` comes back empty, the Reforger's output is not reaching the final
task via context. That is the one wiring detail to check.

---

## What each field switches on

| Emitted | Effect in the UI |
|---|---|
| `answer` | The answer body renders. Removes "Verdict only". **The one that matters.** |
| `score.dimensions` | "What the score is made of" bars |
| `challenges` | "What the panel attacked" cards |
| `revision` | "What the rewrite changed" bar |
| `recommendation_check` | "The report's own recommendation" panel |

Everything degrades safely — emit only `answer` and the demo works.

## Accepted key spellings

The extractors are tolerant, so the crew need not match exactly:

| Field | Also accepted |
|---|---|
| `answer` | `final_answer`, `finalAnswer`, `response` |
| `score.value` | `score`, `trust_score`, `trustScore`, `overall` |
| `strongest` | `strength`, `strongest_point` |
| `weakest` | `weakness`, `weakest_point` |
| `dimensions` | `subscores`, `breakdown` |
| `challenges` | `disputes`, `objections` |
| `challenges[].from` | `agent`, `role` |
| `challenges[].survived` | `upheld`, `sustained` |
| `revision` | `rewrite`, `delta` |
| `recommendation_check` | `recommendationCheck`, `recommendation` |
| `recommendation_check.consistent` | `supported`, `holds` |

`answer` is the only field with no fallback worth relying on.

---

## Housekeeping

Rotate the bearer token once everything works — it has been pasted into chat
several times. **Reset** in the CrewAI dashboard, then update Vercel and
`.env.local` with the fresh value.
