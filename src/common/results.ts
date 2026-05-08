type success<T> = { ok: true; value?: T };
type failure<E> = { ok: false; error: E };

export type Result<T, E> = success<T> | failure<E>;

export const Result = {
    success: <T>(value?: T): success<T> => ({ ok: true, value }),
    failure: <E>(error: E): failure<E> => ({ ok: false, error }),
};

