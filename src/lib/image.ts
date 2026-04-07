const PROXY_HOSTS = ["en.onepiece-cardgame.com"];

export function getImageUrl(src: string): string {
  try {
    const url = new URL(src);
    if (PROXY_HOSTS.includes(url.hostname)) {
      return `/api/image?url=${encodeURIComponent(src)}`;
    }
  } catch {
    // relative URL or invalid, return as-is
  }
  return src;
}
