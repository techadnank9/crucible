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
        <h1>
          Any answer
          <br />
          worth keeping
          <br />
          is <span className="fire">tested by fire.</span>
        </h1>
        <p className="tagline">
          Crucible <strong>builds its own expert team</strong>,{" "}
          <strong>attacks its own answer</strong>, and{" "}
          <strong>rebuilds it</strong> — then tells you how far to trust the
          result.
        </p>
      </section>

      <Forge />

      <section className="how">
        <p className="eyebrow">What happens in the sixty seconds</p>
        <div className="how-grid">
          <div className="how-item">
            <span className="how-num">01 / Assemble</span>
            <h3>It picks its own specialists</h3>
            <p>
              No fixed panel. The crew reads your question, decides which kinds
              of expert it needs, and staffs the room before it writes a word.
            </p>
          </div>
          <div className="how-item">
            <span className="how-num">02 / Attack</span>
            <h3>A defender, an attacker, a skeptic</h3>
            <p>
              The first draft gets torn at from three directions. A judge rules
              on what survived and directs the rewrite that follows.
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

      <footer className="colophon">
        <span>Crucible</span>
        <span>Answers, tested by fire</span>
      </footer>
    </main>
  );
}
