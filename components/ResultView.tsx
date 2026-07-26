import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseTrustScore } from "@/lib/parseResult";

export default function ResultView({ text }: { text: string }) {
  const { score, strongest, weakest } = parseTrustScore(text);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {score !== null && (
        <div className="flex flex-col gap-3 rounded-sm border-2 border-ink bg-gold shadow-hard px-6 py-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70">
              Trust score
            </span>
            <span className="font-display text-5xl font-black text-ink">
              {score}
              <span className="text-2xl">/100</span>
            </span>
          </div>
          {strongest && (
            <p className="font-sans text-sm text-ink">
              <span className="font-mono font-bold">STRONGEST — </span>
              {strongest}
            </p>
          )}
          {weakest && (
            <p className="font-sans text-sm text-ink">
              <span className="font-mono font-bold">WEAKEST — </span>
              {weakest}
            </p>
          )}
        </div>
      )}

      <article className="prose prose-neutral max-w-none rounded-sm border-2 border-ink bg-paper shadow-hard px-6 py-5 prose-headings:font-display prose-headings:font-bold prose-a:text-ember prose-strong:text-ink">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </article>
    </div>
  );
}
