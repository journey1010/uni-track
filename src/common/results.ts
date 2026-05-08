type Success<T> = { ok: true; value?: T };
type Failure<E> = { ok: false; error: E };

export type Result<T, E> = Success<T> | Failure<E>;

