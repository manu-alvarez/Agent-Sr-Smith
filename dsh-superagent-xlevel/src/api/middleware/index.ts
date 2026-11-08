export function requestId(header: string | undefined, fallback: string): string {
  return header && header.length < 80 ? header : fallback;
}
