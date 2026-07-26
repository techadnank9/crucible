import { NextResponse } from "next/server";
import {
  crewHeaders,
  getCrewConfig,
  isRetryableStatus,
  summariseUpstream,
} from "@/lib/crew";

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
    // Network-level failure. The run itself is probably still alive upstream,
    // so let the client decide whether to keep waiting.
    return NextResponse.json(
      {
        error: "The crew endpoint is unreachable.",
        retryable: true,
      },
      { status: 503 }
    );
  }

  const text = await upstream.text();

  if (!upstream.ok) {
    const retryable = isRetryableStatus(upstream.status);
    return NextResponse.json(
      {
        error: retryable
          ? `The crew gateway is briefly unavailable (HTTP ${upstream.status}).`
          : `Status check failed (HTTP ${upstream.status}).`,
        detail: summariseUpstream(text, upstream.status),
        retryable,
      },
      { status: retryable ? 503 : 502 }
    );
  }

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    // A 200 carrying HTML means the gateway answered instead of the crew.
    return NextResponse.json(
      {
        error: "The crew returned a status payload that could not be parsed.",
        detail: summariseUpstream(text, 200),
        retryable: true,
      },
      { status: 503 }
    );
  }
}
