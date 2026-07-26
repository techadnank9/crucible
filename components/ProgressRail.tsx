"use client";

import { STEPS } from "@/lib/steps";

type Props = {
  activeStep: number;
  elapsedMs: number;
};

function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function ProgressRail({ activeStep, elapsedMs }: Props) {
  return (
    <section className="rail reveal" aria-label="Run progress">
      <div className="masthead-note" style={{ marginBottom: 14 }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          In the fire — {clock(elapsedMs)}
        </span>
      </div>

      <ol className="rail-list">
        {STEPS.map((label, i) => {
          const state =
            i < activeStep ? "is-done" : i === activeStep ? "is-active" : "";
          return (
            <li key={label} className={`rail-step ${state}`}>
              <span className="rail-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="rail-label">{label}</span>
              <span className="rail-state">
                {i < activeStep ? "done" : i === activeStep ? "running" : "queued"}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="visually-live" aria-live="polite" style={{ position: "absolute", left: "-9999px" }}>
        Step {Math.min(activeStep + 1, STEPS.length)} of {STEPS.length}:{" "}
        {STEPS[Math.min(activeStep, STEPS.length - 1)]}
      </p>
    </section>
  );
}
