// Server-only helpers for talking to the deployed CrewAI crew.
// Nothing in this file may ever be imported into a client component.

import "server-only";

export type CrewConfig = {
  url: string;
  token: string;
};

/**
 * Reads CREW_URL / CREW_TOKEN from the environment.
 * Throws with an interface-voice message if either is missing so the API
 * routes can surface a 500 the UI can actually explain.
 */
export function getCrewConfig(): CrewConfig {
  const url = process.env.CREW_URL;
  const token = process.env.CREW_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Crew credentials are not configured. Set CREW_URL and CREW_TOKEN in the environment."
    );
  }

  return { url: url.replace(/\/+$/, ""), token };
}

export function crewHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * 5xx and 429 from the crew gateway are almost always transient — it hiccups
 * under load while a run is executing. The client should keep polling through
 * these rather than killing the run on a single bad response.
 */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 408;
}

/**
 * The gateway returns an HTML error page on 502. Dumping that into the UI is
 * useless noise, so collapse any HTML body to a short readable line.
 */
export function summariseUpstream(text: string, status: number): string {
  const body = text.trim();

  if (!body) return `Upstream returned HTTP ${status} with an empty body.`;

  if (body.startsWith("<") || /<html[\s>]/i.test(body)) {
    const title = body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    return title
      ? `Upstream gateway responded: ${title}`
      : `Upstream gateway returned an HTML error page (HTTP ${status}).`;
  }

  return body.slice(0, 300);
}
