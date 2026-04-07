const PROXY_HOSTS = ["en.onepiece-cardgame.com"];

export function getImageUrl(src: string): string {
  if (!src) return "";
  try {
    const url = new URL(src);
    // Only proxy hosts that block CORS
    // optcgapi.com and pokemontcg.io serve images directly
    if (PROXY_HOSTS.includes(url.hostname)) {
      return `/api/image?url=${encodeURIComponent(src)}`;
    }
  } catch {
    // relative URL or invalid, return as-is
  }
  return src;
}
