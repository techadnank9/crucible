import { NextResponse } from "next/server";
import { crewHeaders, getCrewConfig, summariseUpstream } from "@/lib/crew";
import { MAX_REPORT_CHARS } from "@/lib/fixtures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let question: unknown;
  let reportText: unknown;

  try {
    const body = await req.json();
    question = body?.question;
    reportText = body?.report_text;
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

  // Report mode is optional. Anything absent, blank or non-string leaves the
  // request on the original question-only path untouched.
  let report: string | null = null;

  if (typeof reportText === "string" && reportText.trim().length > 0) {
    if (reportText.length > MAX_REPORT_CHARS) {
      return NextResponse.json(
        {
          error: `The report is too long. Keep it under ${MAX_REPORT_CHARS.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }
    report = reportText.trim();
  } else if (reportText !== undefined && reportText !== null && typeof reportText !== "string") {
    return NextResponse.json(
      { error: "report_text must be a string." },
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
      // report_text is omitted entirely when absent, so a question-only
      // kickoff is byte-identical to what the crew received before report
      // mode existed.
      body: JSON.stringify({
        inputs: report
          ? { question: question.trim(), report_text: report }
          : { question: question.trim() },
      }),
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
    const detail = summariseUpstream(text, upstream.status);

    // 429 from the kickoff endpoint means the deployment's execution quota is
    // spent, not that the request should be retried. Say so plainly.
    if (upstream.status === 429) {
      return NextResponse.json(
        {
          error: /limit|quota/i.test(detail)
            ? "The crew has spent its execution quota for this billing period. No runs can start until the plan resets or is upgraded."
            : "The crew is rate limited right now. Wait a moment and try again.",
          detail,
        },
        { status: 429 }
      );
    }

    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json(
        {
          error:
            "The crew refused the token. Check CREW_TOKEN in the environment.",
          detail,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: `The crew rejected the kickoff (HTTP ${upstream.status}).`,
        detail,
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
