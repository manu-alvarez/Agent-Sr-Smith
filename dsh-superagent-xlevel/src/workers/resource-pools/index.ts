export function allocate(maxParallel: number, inUse: number): { granted: boolean; slots: number } {
  const slots = Math.max(0, maxParallel - inUse);
  return { granted: slots > 0, slots };
}
