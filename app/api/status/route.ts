import { NextRequest, NextResponse } from "next/server";
import { getCrewConfig } from "@/lib/crew";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "A kickoff id is required." },
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

  const res = await fetch(`${crew.url}/status/${id}`, {
    headers: { Authorization: `Bearer ${crew.token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Crew status check failed (${res.status}): ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
