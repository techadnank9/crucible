"use client";

type Props = {
  activeStep: number;
  elapsedMs: number;
  /** Rail contents for this run — report mode prepends a reading step. */
  steps: readonly string[];
};

function clock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function ProgressRail({ activeStep, elapsedMs, steps }: Props) {
  return (
    <section className="rail reveal" aria-label="Run progress">
      <div className="masthead-note" style={{ marginBottom: 14 }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          In the fire — {clock(elapsedMs)}
        </span>
      </div>

      <ol className="rail-list">
        {steps.map((label, i) => {
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
        Step {Math.min(activeStep + 1, steps.length)} of {steps.length}:{" "}
        {steps[Math.min(activeStep, steps.length - 1)]}
      </p>
    </section>
  );
}
