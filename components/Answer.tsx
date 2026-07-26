"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Answer({ text }: { text: string }) {
  return (
    <section className="card card--ember answer reveal" aria-label="Final answer">
      <p className="eyebrow">Answer, after the rebuild</p>
      <div className="answer-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ node, ...props }) => (
              <div className="table-wrap">
                <table {...props} />
              </div>
            ),
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </section>
  );
}
