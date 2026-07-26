"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ProgressRail from "@/components/ProgressRail";
import ResultView from "@/components/ResultView";
import { SAMPLE_REPORTS } from "@/lib/samples";
import { extractResultText, isDone, isFailed } from "@/lib/parseResult";

const EXAMPLE_QUESTIONS = [
  "Which car should I buy for a family of four with a 30k budget and a long daily commute?",
  "Should our sales team aggressively pursue an inbound lead from a VP of Engineering at a fast-growing startup?",
];

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 3 * 60 * 1000;

type Phase = "idle" | "polling" | "done" | "error";
type Mode = "question" | "report";

export default function Home() {
  const [mode, setMode] = useState<Mode>("report");
  const [question, setQuestion] = useState("");
  const [reportText, setReportText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    pollTimer.current = null;
    timeoutTimer.current = null;
  }

  useEffect(() => clearTimers, []);

  async function handleFile(file: File) {
    setUploading(true);
    setErrorMsg(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract-report", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read that file.");
      setReportText(data.text);
    } catch (err) {
      setPhase("error");
      setErrorMsg((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function startForge() {
    const payload =
      mode === "report"
        ? { question: question.trim() || undefined, report_text: reportText }
        : { question };

    const primary = mode === "report" ? reportText : question;
    if (!primary.trim() || phase === "polling") return;

    clearTimers();
    setPhase("polling");
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }

      const kickoffId = data.kickoff_id;

      timeoutTimer.current = setTimeout(() => {
        clearTimers();
        setPhase("error");
        setErrorMsg(
          "The forge timed out. The crew is taking longer than expected — try again in a moment."
        );
      }, TIMEOUT_MS);

      pollTimer.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/status?id=${encodeURIComponent(kickoffId)}`
          );
          const statusData = await statusRes.json();

          if (!statusRes.ok) {
            throw new Error(
              statusData.error ?? `Status check failed (${statusRes.status}).`
            );
          }

          if (isFailed(statusData)) {
            throw new Error("The crew failed to produce an answer.");
          }

          if (isDone(statusData)) {
            clearTimers();
            const text = extractResultText(statusData);
            if (text) {
              setResult(text);
              setPhase("done");
            } else {
              throw new Error("The crew finished but returned no result.");
            }
          }
        } catch (err) {
          clearTimers();
          setPhase("error");
          setErrorMsg((err as Error).message);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      clearTimers();
      setPhase("error");
      setErrorMsg((err as Error).message);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startForge();
  }

  const isPolling = phase === "polling";
  const isReport = mode === "report";
  const canSubmit = isReport ? Boolean(reportText.trim()) : Boolean(question.trim());

  const tabClass = (selected: boolean) =>
    `flex-1 rounded-sm border-2 border-ink px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
      selected ? "bg-ink text-paper" : "bg-paper text-ink/60 hover:bg-gold hover:text-ink"
    }`;

  return (
    <div className="relative flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
      <div className="heat-glow" />

      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-10">
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember">
            The adversarial review layer for AI diagnosis
          </span>
          <h1 className="font-display text-5xl font-black italic leading-[1.05] sm:text-6xl">
            Crucible
          </h1>
          <p className="max-w-lg font-sans text-base text-ink/80 sm:text-lg">
            Diagnostic error kills or disables 795,000 Americans a year. Crucible
            takes a diagnostic report, builds its own specialist team, attacks its
            own reading — then tells you how far to trust it.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPolling}
              onClick={() => setMode("report")}
              className={tabClass(isReport)}
            >
              Review a report
            </button>
            <button
              type="button"
              disabled={isPolling}
              onClick={() => setMode("question")}
              className={tabClass(!isReport)}
            >
              Ask a question
            </button>
          </div>

          {isReport ? (
            <>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Paste a diagnostic report — radiology, pathology, labs..."
                rows={9}
                disabled={isPolling}
                className="w-full resize-none rounded-sm border-2 border-ink bg-paper px-4 py-3 font-mono text-xs leading-relaxed shadow-hard placeholder:font-sans placeholder:text-sm placeholder:text-ink/40 disabled:opacity-60"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-ink/50">Samples —</span>
                {SAMPLE_REPORTS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={isPolling}
                    onClick={() => {
                      setReportText(s.text);
                      setQuestion(s.question);
                    }}
                    className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-mono text-xs transition-colors hover:bg-gold disabled:opacity-60"
                  >
                    {s.label}
                  </button>
                ))}

                <label className="ml-auto cursor-pointer rounded-full border-2 border-dashed border-ink px-3 py-1.5 font-mono text-xs transition-colors hover:bg-gold">
                  {uploading ? "Reading PDF…" : "Upload PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    disabled={isPolling || uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should it check? (optional)"
                disabled={isPolling}
                className="w-full rounded-sm border-2 border-ink bg-paper px-4 py-2.5 font-sans text-sm shadow-hard-sm placeholder:text-ink/40 disabled:opacity-60"
              />
            </>
          ) : (
            <>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Give it any high-stakes question or decision..."
                rows={3}
                disabled={isPolling}
                className="w-full resize-none rounded-sm border-2 border-ink bg-paper px-4 py-3 font-sans text-base shadow-hard placeholder:text-ink/40 disabled:opacity-60"
              />

              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={isPolling}
                    onClick={() => setQuestion(q)}
                    className="rounded-full border-2 border-ink bg-paper px-3 py-1.5 font-mono text-xs transition-colors hover:bg-gold disabled:opacity-60"
                  >
                    {q.length > 54 ? q.slice(0, 54) + "…" : q}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPolling || !canSubmit}
            className="w-full rounded-sm border-2 border-ink bg-ember px-6 py-3.5 font-display text-lg font-bold text-paper shadow-hard transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-ink)] active:translate-x-0 active:translate-y-0 active:shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard"
          >
            {isPolling ? "Forging…" : isReport ? "Challenge this report" : "Forge answer"}
          </button>
        </form>

        {isPolling && <ProgressRail active={isPolling} reportMode={isReport} />}

        {phase === "error" && errorMsg && (
          <div
            role="alert"
            className="w-full rounded-sm border-2 border-ink bg-paper-dim px-5 py-4 font-sans text-sm shadow-hard-sm"
          >
            <span className="font-mono font-bold text-ember">
              FORGE INTERRUPTED —{" "}
            </span>
            {errorMsg}
          </div>
        )}

        {phase === "done" && result && <ResultView text={result} />}

        <p className="max-w-lg text-center font-mono text-xs leading-relaxed text-ink/50">
          Demonstration only. Not a medical device and not for clinical use. Do not
          paste real patient data.
        </p>
      </main>
    </div>
  );
}
