# Crew prompt — make the final task return the answer

Paste everything between the two `>>>` markers into CrewAI Studio. Do not
include the markers themselves or anything on this page outside them.

The JSON contract below was tested against this repo's real extractors in
`lib/parse.ts` — score, dimensions, challenges and revision all parse.

---

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

---

## What each field switches on

| Emitted | Effect in the UI |
|---|---|
| `answer` | The answer body renders. Removes the "Verdict only" fallback. **The one that matters.** |
| `score.dimensions` | "What the score is made of" bars appear |
| `challenges` | "What the panel attacked" cards appear |
| `revision` | "What the rewrite changed" bar appears |
| `recommendation_check` | "The report's own recommendation" panel appears |

Everything degrades safely. Emit only `answer` and the demo works. Emit none of
it and today's behaviour is unchanged.

## Accepted key spellings

The extractors are deliberately tolerant, so the crew does not have to match the
schema exactly:

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

## After pasting

1. Redeploy the crew — Studio edits do not reach the deployment until rebuilt
2. Run the mammogram fixture once
3. Confirm the result is JSON with a populated `answer`, not a score block
4. Check the app renders the answer body instead of "Verdict only"
