// Shape-tolerant readers for the CrewAI status payload.
// The crew's status JSON is not strictly typed, so every accessor here
// probes a few plausible locations and falls back to null rather than throwing.

export type ScoreCard = {
  score: string | null;
  strongest: string | null;
  weakest: string | null;
};

const DONE_STATES = new Set(["SUCCESS", "COMPLETED", "COMPLETE", "SUCCEEDED", "DONE"]);
const FAILED_STATES = new Set([
  "FAILED",
  "FAILURE",
  "ERROR",
  "CANCELLED",
  "CANCELED",
  // The crew answers an unknown kickoff id with 200 + this state. Without it
  // the client would poll a dead id for the full three minutes.
  "NOT FOUND",
]);

function stateOf(payload: any): string {
  const raw = payload?.state ?? payload?.status ?? "";
  return String(raw).toUpperCase();
}

/** Final answer text, or null while the run is still in flight. */
export function extractResult(payload: any): string | null {
  const result = payload?.result;

  if (typeof result === "string" && result.trim()) return result;
  if (typeof result?.raw === "string" && result.raw.trim()) return result.raw;
  if (typeof payload?.raw === "string" && payload.raw.trim()) return payload.raw;
  if (typeof payload?.output === "string" && payload.output.trim()) return payload.output;

  const json = payload?.result_json;
  if (typeof json === "string" && json.trim()) return json;
  if (typeof json?.raw === "string" && json.raw.trim()) return json.raw;

  // Some deployments nest the final text under the last task output.
  const tasks = payload?.tasks_output ?? result?.tasks_output;
  if (Array.isArray(tasks) && tasks.length > 0) {
    const last = tasks[tasks.length - 1];
    if (typeof last?.raw === "string" && last.raw.trim()) return last.raw;
  }

  return null;
}

export function isDone(payload: any): boolean {
  return DONE_STATES.has(stateOf(payload)) || extractResult(payload) !== null;
}

export function isFailed(payload: any): boolean {
  return FAILED_STATES.has(stateOf(payload)) && extractResult(payload) === null;
}

export function failureReason(payload: any): string {
  const detail =
    payload?.error ??
    payload?.status ??
    payload?.last_step?.error ??
    payload?.message ??
    null;
  return typeof detail === "string" && detail.trim()
    ? detail.trim()
    : "The crew ended the run without producing an answer.";
}

/** Parses a value that may already be an object, or may be a JSON string. */
function asObject(value: any): any | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === "object" ? parsed : null;
      } catch {
        return null;
      }
    }
  }

  return null;
}

function readField(obj: any, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return stripMarkdown(value);
  }
  return null;
}

/**
 * Builds a card from an already-structured score object. Accepts the handful
 * of key spellings a crew is likely to emit rather than demanding one exact
 * schema, since the crew side may be edited independently of this frontend.
 */
function coerceScoreCard(obj: any): ScoreCard | null {
  if (!obj || typeof obj !== "object") return null;

  const score = readField(obj, ["score", "trust_score", "trustScore", "overall", "value"]);
  const strongest = readField(obj, ["strongest", "strength", "strongest_point", "strongestPoint"]);
  const weakest = readField(obj, ["weakest", "weakness", "weakest_point", "weakestPoint"]);

  if (!score && !strongest && !weakest) return null;
  return { score, strongest, weakest };
}

export type StructuredResult = { answer: string; card: ScoreCard };

/**
 * Preferred path: the crew emitted JSON with the answer and the score as
 * separate fields, so nothing has to be regexed back out of prose.
 * Returns null when the payload is plain markdown, which leaves the caller
 * on the legacy text parser.
 */
export function extractStructured(payload: any): StructuredResult | null {
  const candidates = [
    payload?.result_json,
    payload?.result,
    payload?.result?.json_dict,
    payload?.result?.raw,
    payload?.output,
    payload?.raw,
  ];

  for (const candidate of candidates) {
    const obj = asObject(candidate);
    if (!obj) continue;

    const answer = readField(obj, ["answer", "final_answer", "finalAnswer", "response"]);
    if (!answer) continue;

    // The score may be nested under its own key or flattened alongside the
    // answer; try the nested object first, then the envelope itself.
    const card =
      coerceScoreCard(obj.score) ??
      coerceScoreCard(obj.trust) ??
      coerceScoreCard(obj.score_card) ??
      coerceScoreCard(obj) ??
      { score: null, strongest: null, weakest: null };

    return { answer, card };
  }

  return null;
}

export type RunUsage = {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens: number;
  requests: number;
};

/**
 * Per-run telemetry the crew gateway already returns. Every field is a real
 * measured count — nothing here is derived from the answer text.
 *
 * Note that cachedPromptTokens is a SUBSET of promptTokens, not a sibling of
 * it. prompt + completion is the whole; cache is a discount inside the prompt
 * half. Stacking all three in one bar would double-count.
 */
export function extractUsage(payload: any): RunUsage | null {
  const u = payload?.usage_metrics ?? payload?.usageMetrics ?? payload?.result?.usage_metrics;
  if (!u || typeof u !== "object") return null;

  const num = (v: any) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);

  const promptTokens = num(u.prompt_tokens);
  const completionTokens = num(u.completion_tokens);
  const totalTokens = num(u.total_tokens) || promptTokens + completionTokens;

  // A run with no measured tokens has nothing to show; hide rather than
  // render a panel full of zeroes.
  if (totalTokens === 0) return null;

  return {
    totalTokens,
    promptTokens,
    completionTokens,
    cachedPromptTokens: Math.min(num(u.cached_prompt_tokens), promptTokens),
    requests: num(u.successful_requests),
  };
}

export type Challenge = {
  from: string;
  claim: string;
  ruling: string | null;
  survived: boolean | null;
};

/**
 * What the adversarial panel actually raised and how the judge ruled. This is
 * the substance of a run — but the status payload carries only the LAST task,
 * so it stays empty until the crew emits the panel's findings in its result.
 */
export function extractChallenges(obj: any): Challenge[] {
  const source = obj?.challenges ?? obj?.disputes ?? obj?.objections;
  if (!Array.isArray(source)) return [];

  const out: Challenge[] = [];
  for (const c of source) {
    const claim = typeof c?.claim === "string" ? c.claim : typeof c?.text === "string" ? c.text : null;
    if (!claim) continue;
    const survivedRaw = c?.survived ?? c?.upheld ?? c?.sustained;
    out.push({
      from: String(c?.from ?? c?.agent ?? c?.role ?? "Panel"),
      claim,
      ruling: typeof c?.ruling === "string" ? c.ruling : null,
      survived: typeof survivedRaw === "boolean" ? survivedRaw : null,
    });
  }
  return out;
}

export type Revision = { changed: number; kept: number; note: string | null };

/** What the rewrite actually changed. Empty until the crew reports it. */
export function extractRevision(obj: any): Revision | null {
  const r = obj?.revision ?? obj?.rewrite ?? obj?.delta;
  if (!r || typeof r !== "object") return null;
  const changed = Number(r.changed ?? r.changed_claims ?? r.revised);
  const kept = Number(r.kept ?? r.kept_claims ?? r.unchanged);
  if (!Number.isFinite(changed) || !Number.isFinite(kept)) return null;
  return {
    changed: Math.max(0, changed),
    kept: Math.max(0, kept),
    note: typeof r.note === "string" ? r.note : null,
  };
}

export type Dimension = { label: string; value: number };

/**
 * Per-dimension subscores, present only once the crew emits a structured
 * score. Returns an empty array today, which keeps the panel hidden rather
 * than inventing numbers to fill it.
 */
export function extractDimensions(scoreObj: any): Dimension[] {
  const source = scoreObj?.dimensions ?? scoreObj?.subscores ?? scoreObj?.breakdown;
  if (!source || typeof source !== "object") return [];

  const entries = Array.isArray(source)
    ? source.map((d: any) => [d?.name ?? d?.label, d?.value ?? d?.score])
    : Object.entries(source);

  const out: Dimension[] = [];
  for (const [rawLabel, rawValue] of entries) {
    const value = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!rawLabel || !Number.isFinite(value)) continue;
    out.push({
      label: String(rawLabel).replace(/[_-]+/g, " ").trim(),
      value: Math.max(0, Math.min(100, value)),
    });
  }
  return out;
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = match[1].replace(/^[\s:*_\-–—]+/, "").trim();
      if (value) return value;
    }
  }
  return null;
}

/**
 * Pulls a trust score and the strongest/weakest lines out of the answer text.
 * Everything is optional — a missing field just hides that row in the card.
 */
export function extractScoreCard(text: string): ScoreCard {
  const clean = text.replace(/\r/g, "");

  const score = firstMatch(clean, [
    /trust\s*score[^0-9]{0,20}(\d{1,3}\s*(?:\/|out of)\s*\d{1,3})/i,
    /trust\s*score[^0-9]{0,20}(\d{1,3}\s*%)/i,
    /trust\s*score[^0-9]{0,20}(\d{1,3}(?:\.\d+)?)/i,
    /\btrust[^0-9\n]{0,20}(\d{1,3}\s*(?:\/|out of)\s*\d{1,3})/i,
  ]);

  const strongest = firstMatch(clean, [
    /strongest[^\n:]*[:\-–—]\s*(.+)/i,
    /\bstrength[^\n:]*[:\-–—]\s*(.+)/i,
  ]);

  const weakest = firstMatch(clean, [
    /weakest[^\n:]*[:\-–—]\s*(.+)/i,
    /\bweakness[^\n:]*[:\-–—]\s*(.+)/i,
  ]);

  return {
    score,
    strongest: strongest ? stripMarkdown(strongest) : null,
    weakest: weakest ? stripMarkdown(weakest) : null,
  };
}

/**
 * Removes the lines that were lifted into the score card so the answer body
 * does not repeat them. Some crews return a full answer plus a score block;
 * others return only the score block, in which case this returns "".
 */
export function stripScoreCard(text: string): string {
  const drop =
    /^\s*(?:\d+[.)]\s*)?(?:[-*]\s*)?\**\s*(?:trust\s*score|strongest|weakest|strength|weakness)\b[^\n]*$/i;

  return text
    .split("\n")
    .filter((line) => !drop.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** True when the answer is nothing but the score block. */
export function isScoreOnly(text: string): boolean {
  return stripScoreCard(text).replace(/[\s\-*_#>]/g, "").length < 40;
}

function stripMarkdown(line: string): string {
  return line
    .replace(/\*\*/g, "")
    .replace(/^[*\-]\s+/, "")
    .trim();
}

/** Normalises a score to 0-100 for the meter, or null if it is not numeric. */
export function scoreToPercent(score: string | null): number | null {
  if (!score) return null;

  const ratio = score.match(/^(\d{1,3}(?:\.\d+)?)\s*(?:\/|out of)\s*(\d{1,3})/i);
  if (ratio) {
    const value = Number(ratio[1]);
    const max = Number(ratio[2]);
    if (max > 0) return Math.max(0, Math.min(100, (value / max) * 100));
  }

  const plain = score.match(/^(\d{1,3}(?:\.\d+)?)/);
  if (plain) {
    const value = Number(plain[1]);
    if (value <= 10 && !score.includes("%")) return value * 10;
    return Math.max(0, Math.min(100, value));
  }

  return null;
}
