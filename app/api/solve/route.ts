import { NextResponse } from "next/server";
import { crewHeaders, getCrewConfig } from "@/lib/crew";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let question: unknown;

  try {
    const body = await req.json();
    question = body?.question;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  if (typeof question !== "string" || question.trim().length === 0) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  if (question.length > 2000) {
    return NextResponse.json(
      { error: "Question is too long. Keep it under 2000 characters." },
      { status: 400 }
    );
  }

  let config;
  try {
    config = getCrewConfig();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${config.url}/kickoff`, {
      method: "POST",
      headers: crewHeaders(config.token),
      body: JSON.stringify({ inputs: { question: question.trim() } }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "The crew endpoint is unreachable. Try again in a moment." },
      { status: 502 }
    );
  }

  const text = await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: `The crew rejected the kickoff (HTTP ${upstream.status}).`,
        detail: text.slice(0, 500),
      },
      { status: 502 }
    );
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "The crew returned a response that could not be parsed." },
      { status: 502 }
    );
  }

  const id = data?.kickoff_id ?? data?.kickoffId ?? data?.id;

  if (!id) {
    return NextResponse.json(
      { error: "The crew accepted the run but returned no kickoff id." },
      { status: 502 }
    );
  }

  return NextResponse.json({ kickoff_id: String(id) });
}
