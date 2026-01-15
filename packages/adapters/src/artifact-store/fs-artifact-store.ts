import type { ArtifactStorePort, getBytesReturn } from "@lcase/ports";

export class FsArtifactStore implements ArtifactStorePort {
  putBytes(contentType: string, bytes: unknown): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getBytes(hash: string): Promise<getBytesReturn> {
    throw new Error("Method not implemented.");
  }
  putJson(object: Record<string, unknown>): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getJson(hash: string): Promise<Record<string, unknown>> {
    throw new Error("Method not implemented.");
  }
}
