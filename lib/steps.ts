/**
 * Prepended to the rail only when a run carries a report. The crew has to read
 * and extract from the document before it can staff a team against it.
 */
export const REPORT_STEP = "Reading the report";

export const STEPS = [
  "Assembling the specialist team",
  "Researching live",
  "Writing the first answer",
  "Defender / Attacker / Skeptic debate",
  "Judge rules and directs a rewrite",
  "Reforging the answer",
  "Scoring trust",
] as const;

/** The rail for a run, with the reading step present only in report mode. */
export function stepsFor(reportMode: boolean): readonly string[] {
  return reportMode ? [REPORT_STEP, ...STEPS] : STEPS;
}

/** How long each rail step holds before the next one lights up. */
export const STEP_MS = 20000;

/** Gap between /api/status polls. */
export const POLL_MS = 2500;

/**
 * Hard stop for a single run.
 *
 * Seven sequential stages — research, draft, a three-way debate, a judge
 * ruling, a rewrite and a scoring pass — routinely run past five minutes.
 * The old three-minute ceiling was shorter than a healthy run, so it reported
 * slow crews as failures. Abandoning the poll loop does not stop the run
 * upstream, so the only cost of waiting longer is a held-open tab.
 */
export const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Once a run passes this mark the rail has nothing new to say, so the UI
 * switches to reassurance copy rather than letting a pinned last step read
 * as a hang.
 */
export const LONG_RUN_MS = 3 * 60 * 1000;

/**
 * Consecutive failed polls tolerated before a run is declared lost.
 * At POLL_MS = 2500 this rides out ~30s of gateway flapping.
 */
export const MAX_CONSECUTIVE_FAILURES = 12;
