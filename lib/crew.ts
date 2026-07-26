export function getCrewConfig() {
  const url = process.env.CREW_URL;
  const token = process.env.CREW_TOKEN;

  if (!url || !token) {
    throw new Error(
      "CREW_URL and CREW_TOKEN must be set as environment variables."
    );
  }

  return { url: url.replace(/\/$/, ""), token };
}
