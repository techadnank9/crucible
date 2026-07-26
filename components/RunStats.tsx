"use client";

import type {
  Challenge,
  Dimension,
  RecommendationCheck,
  Revision,
  RunUsage,
} from "@/lib/parse";
import { scoreToPercent } from "@/lib/parse";

type Props = {
  score: string | null;
  /** Empty until the crew emits a structured score. */
  dimensions: Dimension[];
  /** Empty until the crew reports what the panel raised. */
  challenges: Challenge[];
  /** Null until the crew reports what the rewrite changed. */
  revision: Revision | null;
  /** The report's own recommendation, checked against its findings. */
  recommendation: RecommendationCheck | null;
  usage: RunUsage | null;
  elapsedMs: number;
};

/**
 * Named bands for the trust score.
 *
 * These are an interpretation layer, not a crew output, so the thresholds are
 * printed on the scale rather than hidden in code — a reader can see exactly
 * why a number landed in a band and disagree with it.
 */
const BANDS = [
  { min: 0, label: "Low" },
  { min: 50, label: "Moderate" },
  { min: 70, label: "High" },
  { min: 85, label: "Very high" },
] as const;

function bandFor(pct: number): string {
  let label: string = BANDS[0].label;
  for (const b of BANDS) if (pct >= b.min) label = b.label;
  return label;
}

function duration(ms: number): string {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
}

export default function RunStats({
  score,
  dimensions,
  challenges,
  revision,
  recommendation,
  usage,
  elapsedMs,
}: Props) {
  const pct = scoreToPercent(score);

  const upheld = challenges.filter((c) => c.survived === true).length;
  const overturned = challenges.filter((c) => c.survived === false).length;

  // Nothing measured about the answer means nothing worth showing.
  if (
    pct === null &&
    dimensions.length === 0 &&
    challenges.length === 0 &&
    !revision &&
    !recommendation
  ) {
    return null;
  }

  return (
    <section className="stats reveal" aria-label="Answer analysis">
      <p className="eyebrow eyebrow--ink">Answer analysis</p>

      {/* ── Trust score in context ────────────────────────────────────── */}
      {pct !== null && (
        <figure className="chart">
          <figcaption>
            Self-assessed confidence
            <span className="chart-sub">
              How well-supported the crew judges its own argument to be. This is
              the crew rating itself &mdash; it is not a measure of whether the
              answer is correct.
            </span>
          </figcaption>

          <div className="scale-head">
            <span className="scale-score">{Math.round(pct)}</span>
            <span className="scale-band">{bandFor(pct)}</span>
          </div>

          <div
            className="scale"
            role="meter"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Trust score ${Math.round(pct)} of 100, ${bandFor(pct)} confidence`}
          >
            <div className="scale-track" />
            <div className="scale-marker" style={{ left: `${pct}%` }}>
              <span className="scale-marker-dot" />
            </div>
          </div>

          <p className="scale-caveat">
            Self-reported and uncalibrated. A high score means the crew found
            its own argument well-supported, not that the conclusion is right.
          </p>

          <div className="scale-ticks" aria-hidden="true">
            {BANDS.map((b) => (
              <span key={b.min} className="scale-tick" style={{ left: `${b.min}%` }}>
                <span className="scale-tick-num">{b.min}</span>
                <span className="scale-tick-label">{b.label}</span>
              </span>
            ))}
          </div>
        </figure>
      )}

      {/* ── The report's own recommendation ───────────────────────────── */}
      {recommendation && (
        <figure className="chart">
          <figcaption>
            The report&rsquo;s own recommendation
            <span className="chart-sub">
              Checked against the findings stated in the same document. Crucible
              does not propose a course of action &mdash; it reports whether the
              one already written down still stands.
            </span>
          </figcaption>

          <div
            className={`rec ${
              recommendation.consistent === false ? "is-broken" : ""
            }`}
          >
            <p className="rec-stated">&ldquo;{recommendation.stated}&rdquo;</p>

            {recommendation.followsFrom && (
              <p className="rec-from">
                Follows from: <strong>{recommendation.followsFrom}</strong>
              </p>
            )}

            {recommendation.consistent !== null && (
              <p className="rec-flag">
                {recommendation.consistent
                  ? "◆ Consistent with the stated findings"
                  : "▲ Inherits a conclusion the findings contradict"}
              </p>
            )}

            {recommendation.note && <p className="rec-note">{recommendation.note}</p>}
          </div>

          <p className="rec-handoff">
            A clinician decides what follows from this.
          </p>
        </figure>
      )}

      {/* ── Per-dimension subscores ───────────────────────────────────── */}
      {dimensions.length > 0 && (
        <figure className="chart">
          <figcaption>
            What the score is made of
            <span className="chart-sub">
              Each dimension rated 0&ndash;100 by the scoring pass
            </span>
          </figcaption>
          <ul className="dims">
            {dimensions.map((d) => (
              <li key={d.label} className="dim">
                <span className="dim-label">{d.label}</span>
                <span className="dim-track">
                  <span className="dim-fill" style={{ width: `${d.value}%` }} />
                </span>
                <span className="dim-val">{Math.round(d.value)}</span>
              </li>
            ))}
          </ul>
        </figure>
      )}

      {/* ── What the panel attacked ───────────────────────────────────── */}
      {challenges.length > 0 && (
        <figure className="chart">
          <figcaption>
            What the panel attacked
            <span className="chart-sub">
              {challenges.length} challenge{challenges.length === 1 ? "" : "s"} raised
              {overturned > 0 && ` · ${overturned} forced a rewrite`}
              {upheld > 0 && ` · ${upheld} survived`}
            </span>
          </figcaption>
          <ul className="challenges">
            {challenges.map((c, i) => (
              <li key={i} className="challenge">
                <div className="challenge-head">
                  <span className="challenge-from">{c.from}</span>
                  {c.survived !== null && (
                    <span
                      className={`challenge-flag ${c.survived ? "is-upheld" : "is-overturned"}`}
                    >
                      {c.survived ? "◆ claim held" : "▲ rewritten"}
                    </span>
                  )}
                </div>
                <p className="challenge-claim">{c.claim}</p>
                {c.ruling && <p className="challenge-ruling">Judge: {c.ruling}</p>}
              </li>
            ))}
          </ul>
        </figure>
      )}

      {/* ── What the rewrite changed ──────────────────────────────────── */}
      {revision && revision.changed + revision.kept > 0 && (
        <figure className="chart">
          <figcaption>
            What the rewrite changed
            <span className="chart-sub">
              Claims revised after the judge ruled, against those left standing
            </span>
          </figcaption>
          <div className="stack">
            <div
              className="stack-seg"
              style={{
                width: `${(revision.changed / (revision.changed + revision.kept)) * 100}%`,
                background: "#e2571f",
              }}
            />
            <div
              className="stack-seg"
              style={{
                width: `${(revision.kept / (revision.changed + revision.kept)) * 100}%`,
                background: "#e8a33d",
              }}
            />
          </div>
          <div className="stack-keys">
            <span className="stack-key">
              <strong>Revised</strong> {revision.changed}
            </span>
            <span className="stack-key">
              <strong>Unchanged</strong> {revision.kept}
            </span>
          </div>
          {revision.note && <p className="chart-tip">{revision.note}</p>}
        </figure>
      )}

      {/* Provenance. Kept to one quiet line — it is evidence the debate really
          ran, not a metric anyone reads for its own sake. */}
      <p className="provenance">
        {usage?.requests ? `${usage.requests} agent turns` : "Multi-agent run"}
        {elapsedMs > 0 && ` · ${duration(elapsedMs)}`}
        {usage && ` · ${(usage.totalTokens / 1000).toFixed(0)}k tokens`}
      </p>
    </section>
  );
}
