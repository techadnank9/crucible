import { NextResponse } from "next/server";
import { crewHeaders, getCrewConfig } from "@/lib/crew";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id || !/^[A-Za-z0-9._:-]{1,128}$/.test(id)) {
    return NextResponse.json({ error: "A valid run id is required." }, { status: 400 });
  }

  let config;
  try {
    config = getCrewConfig();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${config.url}/status/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: crewHeaders(config.token),
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
        error: `Status check failed (HTTP ${upstream.status}).`,
        detail: text.slice(0, 500),
      },
      { status: 502 }
    );
  }

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json(
      { error: "The crew returned a status payload that could not be parsed." },
      { status: 502 }
    );
  }
}
