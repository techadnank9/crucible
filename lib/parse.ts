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
