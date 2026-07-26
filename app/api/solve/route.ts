import { NextRequest, NextResponse } from "next/server";
import { getCrewConfig } from "@/lib/crew";

const DEFAULT_REPORT_QUESTION = "Is this diagnosis correct and complete?";

export async function POST(req: NextRequest) {
  const { question, report_text: reportText } = await req.json();

  const hasQuestion = typeof question === "string" && question.trim();
  const hasReport = typeof reportText === "string" && reportText.trim();

  if (!hasQuestion && !hasReport) {
    return NextResponse.json(
      { error: "A question or a diagnostic report is required." },
      { status: 400 }
    );
  }

  let crew: ReturnType<typeof getCrewConfig>;
  try {
    crew = getCrewConfig();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  const inputs: Record<string, string> = {
    question: hasQuestion ? question : DEFAULT_REPORT_QUESTION,
  };
  if (hasReport) inputs.report_text = reportText;

  const res = await fetch(`${crew.url}/kickoff`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${crew.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Crew kickoff failed (${res.status}): ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  const kickoffId = data.kickoff_id ?? data.id;

  if (!kickoffId) {
    return NextResponse.json(
      { error: "Crew did not return a kickoff id." },
      { status: 502 }
    );
  }

  return NextResponse.json({ kickoff_id: kickoffId });
}
