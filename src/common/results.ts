type success<T> = { ok: true; value?: T };
type failure<E> = { ok: false; error: E };

export type Result<T, E> = success<T> | failure<E>;

