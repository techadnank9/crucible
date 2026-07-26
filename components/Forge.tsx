"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProgressRail from "./ProgressRail";
import ScoreCard from "./ScoreCard";
import Answer from "./Answer";
import RunStats from "./RunStats";
import {
  extractResult,
  extractScoreCard,
  extractChallenges,
  extractDimensions,
  extractRevision,
  extractStructured,
  extractUsage,
  failureReason,
  isDone,
  isFailed,
  isScoreOnly,
  stripScoreCard,
  type Challenge,
  type Dimension,
  type Revision,
  type RunUsage,
  type ScoreCard as Card,
} from "@/lib/parse";
import {
  LONG_RUN_MS,
  MAX_CONSECUTIVE_FAILURES,
  POLL_MS,
  STEPS,
  STEP_MS,
  TIMEOUT_MS,
  stepsFor,
} from "@/lib/steps";
import { MAX_REPORT_CHARS, REPORT_FIXTURES } from "@/lib/fixtures";

const EXAMPLES = [
  "Is adjuvant chemotherapy justified for a 1.2cm node-negative ER+ breast tumour?",
  "How reliable is PSA screening as a first-line test in men over 70?",
  "When is short-interval follow-up the wrong call on a probably-benign breast mass?",
  "Does DCIS extending to within 1mm of a margin count as a negative margin?",
];

type Status = "idle" | "running" | "done" | "error";

type ErrorState = { message: string; detail?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A contested question can hold the crew for several minutes. Silence that
 * long reads as a hang, so the wait copy escalates instead of repeating one
 * optimistic estimate the run will obviously blow past.
 */
function waitingCopy(ms: number): string {
  if (ms < 90_000) return "Usually a couple of minutes. Do not close the tab.";
  if (ms < LONG_RUN_MS) return "Still forging. The debate round takes the longest.";
  return "This one is being argued hard. Still running — do not close the tab.";
}

export default function Forge() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  // True when the crew returned answer and score as separate JSON fields, in
  // which case the answer is already clean and must not be run through the
  // prose-stripping fallback.
  const [structured, setStructured] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Report mode. Closed by default so the plain question path is what the
  // page opens on.
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState("");

  // The rail for the run currently in flight. Captured at kickoff rather than
  // read from state so toggling the panel mid-run cannot reshape the rail.
  const [runSteps, setRunSteps] = useState<readonly string[]>(STEPS);

  // Real per-run telemetry from the crew gateway, plus the wall clock the run
  // actually took. Both are measured, never estimated.
  const [usage, setUsage] = useState<RunUsage | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [finalMs, setFinalMs] = useState(0);

  // Bumped on every new run so an in-flight poll loop from an abandoned run
  // can detect that it is stale and stop writing state.
  const runId = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const running = status === "running";

  // Rail animation + elapsed clock. Driven off wall time, not tick counts, so
  // a backgrounded tab does not fall behind.
  useEffect(() => {
    if (!running) return;

    const startedAt = Date.now();
    setActiveStep(0);
    setElapsed(0);

    const tick = setInterval(() => {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
      setActiveStep(Math.min(Math.floor(ms / STEP_MS), runSteps.length - 1));
    }, 500);

    return () => clearInterval(tick);
  }, [running, runSteps.length]);

  const run = useCallback(async (raw: string, rawReport = "") => {
    const q = raw.trim();
    if (!q) return;

    // An open-but-empty panel is not report mode. Only actual pasted text
    // switches the run onto the report path.
    const reportText = rawReport.trim();
    const steps = stepsFor(reportText.length > 0);

    const id = ++runId.current;
    const stale = () => runId.current !== id;

    setRunSteps(steps);
    setUsage(null);
    setDimensions([]);
    setChallenges([]);
    setRevision(null);
    setFinalMs(0);
    setStatus("running");
    setAnswer(null);
    setCard(null);
    setStructured(false);
    setError(null);

    let kickoffId: string;

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reportText ? { question: q, report_text: reportText } : { question: q }
        ),
      });
      const data = await res.json().catch(() => ({}));

      if (stale()) return;

      if (!res.ok || !data?.kickoff_id) {
        setError({
          message: data?.error ?? "The forge never lit. The crew did not accept the run.",
          detail: data?.detail,
        });
        setStatus("error");
        return;
      }

      kickoffId = String(data.kickoff_id);
    } catch {
      if (stale()) return;
      setError({
        message: "The connection dropped before the run started. Check the network and try again.",
      });
      setStatus("error");
      return;
    }

    const runStartedAt = Date.now();
    const deadline = runStartedAt + TIMEOUT_MS;

    // The crew gateway intermittently 502s while a run is executing. Those
    // polls are noise, not a dead run, so ride them out and only give up
    // after the run has been unreachable for a sustained stretch.
    let consecutiveFailures = 0;

    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      if (stale()) return;

      let payload: any;

      try {
        const res = await fetch(
          `/api/status?id=${encodeURIComponent(kickoffId)}`,
          { cache: "no-store" }
        );
        payload = await res.json().catch(() => ({}));

        if (stale()) return;

        if (!res.ok) {
          // A response our own API did not author — a 404 while the server
          // recompiles or redeploys, an HTML error page from a cold start —
          // arrives with no `error` field because JSON parsing failed. That is
          // a transient blip, not a verdict on the run, so it must ride the
          // same tolerance as a flapping gateway rather than killing a run
          // that is still executing upstream.
          const authored = typeof payload?.error === "string";

          if (!authored) {
            if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              setError({
                message:
                  "The status endpoint stopped answering for half a minute straight. The run may still be finishing upstream — try again shortly.",
              });
              setStatus("error");
              return;
            }
            continue;
          }

          // Hard rejection the API deliberately sent (bad id, auth): stop now.
          if (!payload?.retryable) {
            setError({
              message: payload?.error ?? "Lost contact with the run mid-forge.",
              detail: payload?.detail,
            });
            setStatus("error");
            return;
          }

          if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            setError({
              message:
                "The crew gateway stopped responding for half a minute straight. The run may still be finishing upstream — try again shortly.",
              detail: payload?.detail,
            });
            setStatus("error");
            return;
          }
          continue;
        }
      } catch {
        // Client-side network blip. Same tolerance.
        if (++consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          setError({
            message:
              "The connection kept dropping while waiting on the run. Check the network and try again.",
          });
          setStatus("error");
          return;
        }
        continue;
      }

      consecutiveFailures = 0;

      if (isFailed(payload)) {
        setError({ message: failureReason(payload) });
        setStatus("error");
        return;
      }

      if (isDone(payload)) {
        // Structured payloads carry the answer and the score as separate
        // fields, so prefer them and never regex prose when they are present.
        const packaged = extractStructured(payload);

        const startedMs = Date.now() - runStartedAt;

        if (packaged) {
          setAnswer(packaged.answer);
          setCard(packaged.card);
          setStructured(true);
          setUsage(extractUsage(payload));
          // Read the richer panels off the full envelope, not the narrow card.
          setDimensions(extractDimensions(packaged.source?.score ?? packaged.source));
          setChallenges(extractChallenges(packaged.source));
          setRevision(extractRevision(packaged.source));
          setFinalMs(startedMs);
          setActiveStep(steps.length - 1);
          setStatus("done");
          return;
        }

        const text = extractResult(payload);

        if (!text) {
          setError({
            message: "The crew reported success but returned an empty answer.",
          });
          setStatus("error");
          return;
        }

        setAnswer(text);
        setCard(extractScoreCard(text));
        setUsage(extractUsage(payload));
        setFinalMs(startedMs);
        setActiveStep(steps.length - 1);
        setStatus("done");
        return;
      }
    }

    if (stale()) return;

    setError({
      message:
        "Ten minutes in the fire with no answer returned. The run may still be finishing upstream — try again, or narrow the question.",
    });
    setStatus("error");
  }, []);

  // Move focus to the result once a run resolves.
  useEffect(() => {
    if (status === "done" || status === "error") {
      resultRef.current?.focus();
    }
  }, [status]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(question, reportOpen ? report : "");
  }

  function reset() {
    runId.current++;
    setStatus("idle");
    setAnswer(null);
    setCard(null);
    setStructured(false);
    setError(null);
    setActiveStep(0);
    setElapsed(0);
    setUsage(null);
    setDimensions([]);
    setChallenges([]);
    setRevision(null);
    setFinalMs(0);
  }

  return (
    <>
      <section className="console">
        <p className="eyebrow eyebrow--ink">Put a question in the fire</p>

        <form onSubmit={onSubmit}>
          <label className="field">
            <span className="sr-only">Your question</span>
            {/* A textarea, not an input: the sample questions run to ~70
                characters and a single-line field shows only their opening
                words once the value is set programmatically. Enter still
                submits, so it behaves like the input it replaced. */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  run(question, reportOpen ? report : "");
                }
              }}
              placeholder="Ask anything worth arguing about…"
              disabled={running}
              autoComplete="off"
              maxLength={2000}
              rows={2}
            />
          </label>

          <div className="report-bar">
            <button
              type="button"
              className="report-toggle"
              onClick={() => setReportOpen((open) => !open)}
              disabled={running}
              aria-expanded={reportOpen}
            >
              {reportOpen ? "− Remove report" : "+ Attach a report"}
            </button>

            <span className="report-or">or load a sample</span>

            {/* Always visible, so attaching a sample is one click rather than
                open-the-panel-then-choose. Loading one opens the panel itself
                so the pasted text is immediately visible and editable. */}
            {REPORT_FIXTURES.map((fixture) => (
              <button
                key={fixture.id}
                type="button"
                className="report-sample"
                disabled={running}
                onClick={() => {
                  setReport(fixture.report);
                  setQuestion(fixture.question);
                  setReportOpen(true);
                }}
              >
                {fixture.label}
              </button>
            ))}
          </div>

          {reportOpen && (
            <div className="report-panel">
              <label>
                <span className="sr-only">Report text</span>
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  disabled={running}
                  rows={10}
                  maxLength={MAX_REPORT_CHARS}
                  placeholder="Paste a report, transcript or document. The crew reads it before it answers."
                />
              </label>
              <p className="report-note">
                {report.trim()
                  ? `${report.trim().length.toLocaleString()} / ${MAX_REPORT_CHARS.toLocaleString()} characters`
                  : "Optional. Leave this empty to ask a plain question."}
              </p>
            </div>
          )}

          <div className="chips">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="chip"
                disabled={running}
                onClick={() => {
                  setQuestion(example);
                  run(example);
                }}
              >
                {example}
              </button>
            ))}
          </div>

          <div className="actions">
            <button
              type="submit"
              className="forge"
              disabled={running || question.trim().length === 0}
            >
              {running ? "Forging…" : "Forge answer"}
            </button>

            {running && (
              <span className="elapsed">{waitingCopy(elapsed)}</span>
            )}

            {(status === "done" || status === "error") && (
              <button type="button" className="ghost-btn" onClick={reset}>
                New question
              </button>
            )}
          </div>
        </form>
      </section>

      <div ref={resultRef} tabIndex={-1} style={{ outline: "none" }}>
        {running && (
          <ProgressRail
            activeStep={activeStep}
            elapsedMs={elapsed}
            steps={runSteps}
          />
        )}

        {status === "error" && error && (
          <div className="alert reveal" role="alert">
            <p className="alert-key">Run failed</p>
            <p>{error.message}</p>
            {error.detail && <p className="alert-detail">{error.detail}</p>}
          </div>
        )}

        {status === "done" && answer && (
          <>
            {card && (card.score || card.strongest || card.weakest) && (
              <ScoreCard card={card} />
            )}

            <RunStats
              score={card?.score ?? null}
              dimensions={dimensions}
              challenges={challenges}
              revision={revision}
              usage={usage}
              elapsedMs={finalMs}
            />

            {/* Some crews return a full answer plus a score block; this one
                returns only the score block. Rendering the stripped body in
                that case would show an empty card, so say so instead. */}
            {!structured && isScoreOnly(answer) ? (
              <div className="alert reveal">
                <p className="alert-key">Verdict only</p>
                <p>
                  The crew returned its scoring pass without the rewritten
                  answer attached. The judgement above is the complete response
                  for this run.
                </p>
              </div>
            ) : (
              <Answer text={structured ? answer : stripScoreCard(answer)} />
            )}
          </>
        )}
      </div>
    </>
  );
}
