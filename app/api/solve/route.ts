import { NextRequest, NextResponse } from "next/server";
import { getCrewConfig } from "@/lib/crew";

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "A question is required." },
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

  const res = await fetch(`${crew.url}/kickoff`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${crew.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: { question } }),
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
