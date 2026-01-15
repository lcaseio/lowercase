export type getBytesReturn = {
  contentType: string;
  body: Buffer;
};
export type ArtifactStorePort = {
  putBytes(contentType: string, bytes: unknown): Promise<void>;
  getBytes(hash: string): Promise<getBytesReturn>;
  putJson(object: Record<string, unknown>): Promise<string>;
  getJson(hash: string): Promise<Record<string, unknown>>;
};
