// same type supplied by node fs promises I believe
type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "utf-16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "base64url"
  | "latin1"
  | "binary"
  | "hex";

export type FsJsonIndexStoreOptions<T> = {
  dir: string;
  extension?: string;
  encoding?: BufferEncoding;
  sort?: (a: T, b: T) => number;
};
