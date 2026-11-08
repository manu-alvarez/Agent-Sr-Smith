export function independent(authorRole: string, reviewerRole: string): boolean {
  return Boolean(authorRole) && authorRole !== reviewerRole;
}
