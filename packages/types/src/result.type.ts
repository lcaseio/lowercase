// common binary return type for handling errors
export type Result<V, E> = { ok: true; value: V } | { ok: false; error: E };
