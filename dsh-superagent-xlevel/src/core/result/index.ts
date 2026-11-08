export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err<E> {
  ok: false;
  error: E;
}

export type Result<T, E = DshFailure> = Ok<T> | Err<E>;

export interface DshFailure {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function failure(
  code: string,
  message: string,
  retryable = false,
  details?: Record<string, unknown>,
): DshFailure {
  return { code, message, retryable, details };
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (!result.ok) return result;
  return ok(fn(result.value));
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    const error = result.error;
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "Result is an error";
    throw new Error(message);
  }
  return result.value;
}
