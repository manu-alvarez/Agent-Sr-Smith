export function scanArtifact(source: string): string[] {
  const findings: string[] = [];
  if (source.includes("eval(")) findings.push("eval");
  if (/-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(source)) findings.push("private-key");
  return findings;
}
