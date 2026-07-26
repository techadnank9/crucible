export const STEPS = [
  "Assembling the specialist team",
  "Researching live",
  "Writing the first answer",
  "Defender / Attacker / Skeptic debate",
  "Judge rules and directs a rewrite",
  "Reforging the answer",
  "Scoring trust",
] as const;

/** How long each rail step holds before the next one lights up. */
export const STEP_MS = 9000;

/** Gap between /api/status polls. */
export const POLL_MS = 2500;

/** Hard stop for a single run. */
export const TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Consecutive failed polls tolerated before a run is declared lost.
 * At POLL_MS = 2500 this rides out ~30s of gateway flapping.
 */
export const MAX_CONSECUTIVE_FAILURES = 12;
