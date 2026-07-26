# Crucible

A front-end for a deployed CrewAI crew. You ask a question; the crew assembles
its own specialists, debates its own draft, rewrites it, and returns a refined
answer with a trust score.

Next.js 14, App Router, TypeScript. No database, no auth, no client-side secrets.

---

## Architecture — the browser never touches CrewAI

```
browser ──POST /api/solve─────▶ Next.js server ──POST {CREW_URL}/kickoff──▶ CrewAI
        ◀──{ kickoff_id }──────                ◀──{ kickoff_id }───────────

browser ──GET /api/status?id=─▶ Next.js server ──GET {CREW_URL}/status/{id}▶ CrewAI
        ◀──status JSON─────────                ◀──status JSON──────────────
```

Every CrewAI call is made server-side. The consequences:

- **No CORS.** The browser only ever hits same-origin `/api/*`.
- **No token exposure.** `CREW_TOKEN` is read inside route handlers and never
  reaches the client bundle. `lib/crew.ts` imports `server-only`, so a build
  fails loudly if anyone tries to import it into a client component.
- **Neither variable uses the `NEXT_PUBLIC_` prefix**, which is the only way
  Next.js inlines an env var into browser JavaScript.

Verify it yourself: open DevTools → Network, run a question, and filter by
domain. The only requests are to your own origin. `crewai.com` never appears.

### Files

| Path | Role |
| --- | --- |
| `app/api/solve/route.ts` | Kicks off a run, returns `kickoff_id` |
| `app/api/status/route.ts` | Proxies a single status poll |
| `lib/crew.ts` | Server-only env reading + auth headers |
| `lib/parse.ts` | Shape-tolerant result / trust-score extraction |
| `lib/steps.ts` | Rail copy and all timing constants |
| `components/Forge.tsx` | Client state machine: submit → poll → render |
| `components/ProgressRail.tsx` | Animated 7-step rail |
| `components/ScoreCard.tsx` | Trust score, meter, strongest / weakest |
| `components/Answer.tsx` | Markdown rendering of the final answer |

---

## Run locally

```bash
cp .env.local.example .env.local   # then fill in both values
npm install
npm run dev                        # http://localhost:3000
```

`.env.local` is gitignored. Do not commit it.

---

## Deploy to Vercel

### Option A — CLI

```bash
npm i -g vercel     # if you don't have it
vercel login
vercel              # first run: creates + links the project (preview deploy)
```

Add the two env vars, then ship to production:

```bash
vercel env add CREW_URL production
vercel env add CREW_TOKEN production
# repeat for preview + development if you want previews to work too:
vercel env add CREW_URL preview
vercel env add CREW_TOKEN preview

vercel --prod
```

### Option B — Dashboard (git-based)

1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. [vercel.com/new](https://vercel.com/new) → **Import** the repo.
3. Framework preset auto-detects as **Next.js**. Leave build settings alone.
4. Before clicking Deploy, expand **Environment Variables** and add both.
5. Deploy.

### Exactly where the env vars go

**Vercel Dashboard → your project → Settings → Environment Variables**

Add two entries:

| Key | Value | Environments |
| --- | --- | --- |
| `CREW_URL` | `https://crucible-2162fcf8-b95c-4e94-aacd-b314ec845f-39ca5c3c.crewai.com` | Production, Preview, Development |
| `CREW_TOKEN` | your bearer token from the CrewAI deployment page | Production, Preview, Development |

Notes:

- No trailing slash on `CREW_URL` (a trailing one is stripped anyway).
- Do **not** prefix either key with `NEXT_PUBLIC_`.
- Mark `CREW_TOKEN` as **Sensitive** so it cannot be read back in the UI.
- **Env vars only apply to deployments created after they are saved.** After
  adding them to an existing project, go to **Deployments → ⋯ → Redeploy**.

---

## How a run behaves

1. `POST /api/solve` with `{ question }` → `{ kickoff_id }`.
2. Client polls `GET /api/status?id=…` every **2.5s**, hard timeout at **3
   minutes**.
3. The rail advances on a **9s** timer so the ~60s wait has motion. It is a
   narration of the crew's pipeline, not a live progress feed.
4. Done when the payload's state is `SUCCESS` / `COMPLETED` (also `COMPLETE`,
   `SUCCEEDED`, `DONE`) **or** a result field is present. The answer text is
   read from `result`, `result.raw`, `raw`, `output`, or the last
   `tasks_output[].raw`.
5. `lib/parse.ts` scans the answer for a trust score and strongest / weakest
   lines. Any it finds get lifted into the score card; the rest of the text
   still renders in full as markdown. If nothing matches, the card is hidden
   and only the answer shows.

Timings live in `lib/steps.ts`.

## Accessibility

- Visible `outline` focus rings on every interactive element.
- `prefers-reduced-motion: reduce` kills the glow breathe, rail pulse, reveal,
  and hover translates.
- The rail announces the current step via `aria-live="polite"`; errors use
  `role="alert"`; the score meter exposes `role="meter"` with value/min/max.
- Focus moves to the result region when a run resolves.
- Responsive from 320px up.
