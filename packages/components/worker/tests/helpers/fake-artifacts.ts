import type { ArtifactsPort, GetError, PutError } from "@lcase/ports";
import type {
  ArtifactFormat,
  ArtifactIndex,
  ArtifactPutInput,
  JsonValue,
  Result,
} from "@lcase/types";

// A genuine in-memory ArtifactsPort -- implements the real interface rather
// than casting a partial object, matching the no-`as unknown as X` bar this
// codebase's newer tests hold to. `getByFormat` itself is correct by
// construction (a stored entry's `format`/`value` always come from one
// `ArtifactPutInput` union member, written together in `put`) -- the casts
// at each exposed method below only bridge TS's inability to correlate that
// across a widened `Map` read, the same kind of internal cast already
// accepted elsewhere in this codebase for the same structural reason.
export function createFakeArtifactsPort() {
  const store = new Map<string, ArtifactPutInput>();
  let counter = 0;

  function put(input: ArtifactPutInput): Promise<Result<string, PutError>> {
    counter += 1;
    const hash = `fake-hash-${counter}`;
    store.set(hash, input);
    return Promise.resolve({ ok: true, value: hash });
  }

  function getByFormat(
    hash: string,
    format: ArtifactFormat,
  ): Promise<Result<unknown, GetError>> {
    const stored = store.get(hash);
    if (!stored || stored.format !== format) {
      return Promise.resolve({
        ok: false,
        error: { code: "STORE_GET_FAILED", message: "not found" },
      });
    }
    return Promise.resolve({ ok: true, value: stored.value });
  }

  const get = ((hash: string, opts: { format: ArtifactFormat }) =>
    getByFormat(hash, opts.format)) as ArtifactsPort["get"];

  const artifacts: ArtifactsPort = {
    put,
    write: async (input) => {
      const result = await put(input);
      if (!result.ok) return result;
      const index: ArtifactIndex = {
        time: new Date().toISOString(),
        hash: result.value,
        format: input.format,
      };
      return { ok: true, value: index };
    },
    get,
    getAuto: async (hash) => {
      const stored = store.get(hash);
      if (!stored) {
        return {
          ok: false,
          error: { code: "STORE_GET_FAILED", message: "not found" },
        };
      }
      return {
        ok: true,
        format: stored.format,
        value: stored.value,
      } as Awaited<ReturnType<ArtifactsPort["getAuto"]>>;
    },
    putJson: (value: JsonValue, index) => put({ format: "json", value, index }),
    getJson: (hash) =>
      getByFormat(hash, "json") as ReturnType<ArtifactsPort["getJson"]>,
    putText: (value, index) => put({ format: "text", value, index }),
    putMarkdown: (value, index) => put({ format: "markdown", value, index }),
    getText: (hash) =>
      getByFormat(hash, "text") as ReturnType<ArtifactsPort["getText"]>,
    getMarkdown: (hash) =>
      getByFormat(hash, "markdown") as ReturnType<ArtifactsPort["getMarkdown"]>,
    putBytes: (value, index) => put({ format: "bytes", value, index }),
    getBytes: (hash) =>
      getByFormat(hash, "bytes") as ReturnType<ArtifactsPort["getBytes"]>,
  };

  return { artifacts, store };
}
