import Forge from "@/components/Forge";

export default function Page() {
  return (
    <main className="shell">
      <header className="masthead">
        <div className="wordmark">
          <span className="spark" aria-hidden="true" />
          Crucible
        </div>
        <div className="masthead-note">Multi-agent adversarial answering</div>
      </header>

      <section className="hero">
        <p className="eyebrow">An adversarial second read — starting with oncology</p>
        <h1>
          When the answer
          <br />
          is a diagnosis,
          <br />
          it must be <span className="fire">tested by fire.</span>
        </h1>
        <p className="tagline">
          Crucible <strong>builds its own expert panel</strong>,{" "}
          <strong>attacks its own answer</strong>, and{" "}
          <strong>rebuilds it</strong>. Paste a report and it flags where the
          conclusion does not follow from the findings written in that same
          report — then hands the contradiction to a clinician.
        </p>
      </section>

      <Forge />

      <section className="stakes">
        <p className="eyebrow">Why this shape</p>
        <p>
          A confident wrong answer is the dangerous one. In diagnostics the
          failure is rarely a missing fact — it is a conclusion that does not
          follow from findings already written down in the same report. Nothing
          in a single-model system is structurally required to object. In
          Crucible the Attacker <strong>fails its task if it agrees</strong>.
          Disagreement is guaranteed by construction, not requested politely.
        </p>
        <p>
          That check needs no clinical knowledge — the contradiction is visible
          in the document itself. Which is exactly the limit of what this does:
          it surfaces the discrepancy. <strong>A clinician decides.</strong>
        </p>
      </section>

      <section className="how">
        <p className="eyebrow">What happens in the sixty seconds</p>
        <div className="how-grid">
          <div className="how-item">
            <span className="how-num">01 / Assemble</span>
            <h3>It picks its own specialists</h3>
            <p>
              No fixed panel. The crew reads the case, decides which kinds of
              expert it needs — radiology, pathology, oncology, or none of the
              above — and staffs the room before it writes a word.
            </p>
          </div>
          <div className="how-item">
            <span className="how-num">02 / Attack</span>
            <h3>A defender, an attacker, a skeptic</h3>
            <p>
              The first read gets torn at from three directions, each quoting
              the findings back. A judge rules on what survived and directs the
              rewrite that follows.
            </p>
          </div>
          <div className="how-item">
            <span className="how-num">03 / Score</span>
            <h3>It tells you where it is weak</h3>
            <p>
              The reforged answer ships with a trust score, its strongest claim,
              and the claim it would defend least. Confidence you can audit.
            </p>
          </div>
        </div>
      </section>

      <section className="disclaimer">
        <p>
          <strong>Research demonstration.</strong> Crucible is not a medical
          device, is not clinically validated, and has no regulatory clearance.
          It does not diagnose and does not recommend treatment. It must not be
          used for any patient-care decision. The trust score is the system
          rating its own argument; it is uncalibrated and is not evidence that
          an answer is correct. Sample reports on this page are synthetic and
          contain no patient data. The engine is general purpose — oncology is
          the first domain it is aimed at, not a limit on what it answers.
        </p>
      </section>

      <footer className="colophon">
        <span>Crucible</span>
        <span>Answers, tested by fire</span>
      </footer>
    </main>
  );
}
