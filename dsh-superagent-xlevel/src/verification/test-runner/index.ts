export interface TestCase { id: string; criterion: string }
export function casesFromCriteria(criteria: string[]): TestCase[] {
  return criteria.map((criterion, index) => ({ id: `case-${index + 1}`, criterion }));
}
