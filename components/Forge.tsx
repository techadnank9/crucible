"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProgressRail from "./ProgressRail";
import ScoreCard from "./ScoreCard";
import Answer from "./Answer";
import {
  extractResult,
  extractScoreCard,
  failureReason,
  isDone,
  isFailed,
  type ScoreCard as Card,
} from "@/lib/parse";
import { POLL_MS, STEPS, STEP_MS, TIMEOUT_MS } from "@/lib/steps";

const EXAMPLES = [
  "Should a seed-stage startup hire a designer or a second engineer first?",
  "Is intermittent fasting actually better than plain calorie counting?",
  "How exposed is the EU grid to a cold, windless winter week?",
  "Should I take equity or a higher salary at a Series B company?",
];

type Status = "idle" | "running" | "done" | "error";

type ErrorState = { message: string; detail?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Forge() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

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
      setActiveStep(Math.min(Math.floor(ms / STEP_MS), STEPS.length - 1));
    }, 500);

    return () => clearInterval(tick);
  }, [running]);

  const run = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) return;

    const id = ++runId.current;
    const stale = () => runId.current !== id;

    setStatus("running");
    setAnswer(null);
    setCard(null);
    setError(null);

    let kickoffId: string;

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
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

    const deadline = Date.now() + TIMEOUT_MS;

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
          setError({
            message: payload?.error ?? "Lost contact with the run mid-forge.",
            detail: payload?.detail,
          });
          setStatus("error");
          return;
        }
      } catch {
        // Single transient network blip: keep polling until the deadline.
        continue;
      }

      if (isFailed(payload)) {
        setError({ message: failureReason(payload) });
        setStatus("error");
        return;
      }

      if (isDone(payload)) {
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
        setActiveStep(STEPS.length - 1);
        setStatus("done");
        return;
      }
    }

    if (stale()) return;

    setError({
      message:
        "Three minutes in the fire with no answer returned. The run may still be finishing upstream — try again, or narrow the question.",
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
    run(question);
  }

  function reset() {
    runId.current++;
    setStatus("idle");
    setAnswer(null);
    setCard(null);
    setError(null);
    setActiveStep(0);
    setElapsed(0);
  }

  return (
    <>
      <section className="console">
        <p className="eyebrow eyebrow--ink">Put a question in the fire</p>

        <form onSubmit={onSubmit}>
          <label className="field">
            <span className="sr-only">Your question</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything worth arguing about…"
              disabled={running}
              autoComplete="off"
              maxLength={2000}
            />
          </label>

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
              <span className="elapsed">
                Roughly a minute. Do not close the tab.
              </span>
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
        {running && <ProgressRail activeStep={activeStep} elapsedMs={elapsed} />}

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
            <Answer text={answer} />
          </>
        )}
      </div>
    </>
  );
}
