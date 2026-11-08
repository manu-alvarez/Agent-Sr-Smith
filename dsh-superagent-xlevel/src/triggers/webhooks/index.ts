export function signaturesMatch(expected: string, received: string): boolean {
  if (!expected || !received || expected.length !== received.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return diff === 0;
}
