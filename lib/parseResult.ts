export type CrewStatus = {
  state?: string;
  status?: string;
  result?: string | { raw?: string } | null;
};

const DONE_STATES = new Set(["SUCCESS", "COMPLETED", "COMPLETE", "DONE"]);
const FAILED_STATES = new Set(["FAILED", "FAILURE", "ERROR"]);

export function extractResultText(data: CrewStatus): string | null {
  if (typeof data.result === "string" && data.result.trim()) {
    return data.result;
  }
  if (data.result && typeof data.result === "object" && data.result.raw) {
    return data.result.raw;
  }
  return null;
}

export function isDone(data: CrewStatus): boolean {
  const state = (data.state ?? data.status ?? "").toUpperCase();
  return DONE_STATES.has(state) || Boolean(extractResultText(data));
}

export function isFailed(data: CrewStatus): boolean {
  const state = (data.state ?? data.status ?? "").toUpperCase();
  return FAILED_STATES.has(state);
}

export type TrustScoreInfo = {
  score: number | null;
  strongest: string | null;
  weakest: string | null;
};

export function parseTrustScore(text: string): TrustScoreInfo {
  const scoreMatch = text.match(/trust\s*score[^0-9]{0,10}(\d{1,3})/i);
  const strongestMatch = text.match(
    /strongest[^:\n]*:\s*([^\n]+)/i
  );
  const weakestMatch = text.match(/weakest[^:\n]*:\s*([^\n]+)/i);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1], 10) : null,
    strongest: strongestMatch ? strongestMatch[1].trim() : null,
    weakest: weakestMatch ? weakestMatch[1].trim() : null,
  };
}
