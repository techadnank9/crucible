"use client";

import { scoreToPercent, type ScoreCard as Card } from "@/lib/parse";

export default function ScoreCard({ card }: { card: Card }) {
  const percent = scoreToPercent(card.score);

  return (
    <section className="score reveal" aria-label="Trust score">
      <div className="score-top">
        <span className="score-label">Trust score</span>
        <span className="score-value">{card.score ?? "—"}</span>
      </div>

      {percent !== null && (
        <div
          className="meter"
          role="meter"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Trust score"
        >
          <div className="meter-fill" style={{ width: `${percent}%` }} />
        </div>
      )}

      {(card.strongest || card.weakest) && (
        <div className="verdicts">
          {card.strongest && (
            <div className="verdict verdict--strong">
              <div className="verdict-key">Strongest</div>
              <p>{card.strongest}</p>
            </div>
          )}
          {card.weakest && (
            <div className="verdict verdict--weak">
              <div className="verdict-key">Weakest</div>
              <p>{card.weakest}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
