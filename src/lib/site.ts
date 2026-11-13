/** Public origin. Set NEXT_PUBLIC_SITE_URL in production; the fallback keeps local builds working. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
