"use client";

import { useEffect, useState } from "react";

export const PROGRESS_STEPS = [
  "Assembling the specialist team",
  "Researching live",
  "Writing the first answer",
  "Defender / Attacker / Skeptic debate",
  "Judge rules and directs a rewrite",
  "Reforging the answer",
  "Scoring trust",
];

const REPORT_INTAKE_STEP = "Reading the report";

const STEP_INTERVAL_MS = 9000;

export default function ProgressRail({
  active,
  reportMode = false,
}: {
  active: boolean;
  reportMode?: boolean;
}) {
  const [step, setStep] = useState(0);
  const steps = reportMode ? [REPORT_INTAKE_STEP, ...PROGRESS_STEPS] : PROGRESS_STEPS;

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }

    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(id);
  }, [active, steps.length]);

  if (!active) return null;

  return (
    <ol className="flex flex-col gap-2 w-full max-w-xl">
      {steps.map((label, i) => {
        const isDone = i < step;
        const isCurrent = i === step;
        return (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-sm border-2 border-ink px-4 py-2.5 transition-colors ${
              isCurrent
                ? "bg-ember text-paper shadow-hard-sm"
                : isDone
                  ? "bg-ink text-paper"
                  : "bg-paper text-ink/50"
            }`}
          >
            <span className="font-mono text-xs font-bold tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-sans text-sm">{label}</span>
            {isCurrent && (
              <span
                className="ml-auto inline-block h-2 w-2 animate-pulse rounded-full bg-paper motion-reduce:animate-none"
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
