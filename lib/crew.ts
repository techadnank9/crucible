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
