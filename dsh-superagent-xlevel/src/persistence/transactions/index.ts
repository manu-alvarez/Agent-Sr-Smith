export function transactional<T>(work: () => T): T {
  return work();
}
