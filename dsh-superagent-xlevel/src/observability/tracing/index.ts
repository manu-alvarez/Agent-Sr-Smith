export interface Span {
  traceId: string;
  name: string;
  start: number;
  end?: number;
}

export function startSpan(traceId: string, name: string): Span {
  return { traceId, name, start: Date.now() };
}

export function finishSpan(span: Span): Span {
  return { ...span, end: Date.now() };
}
