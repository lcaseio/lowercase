import type {
  ArtifactsPort,
  FlowIndexStorePort,
  IndexStorePort,
  JsonValue,
} from "@lcase/ports";
import type { FlowDefinition, FlowIndex, Result } from "@lcase/types";
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";

export async function addFlowToCas(
  flowDef: FlowDefinition,
  artifacts: ArtifactsPort,
): Promise<string | undefined> {
  try {
    const result = await artifacts.putJson(flowDef as JsonValue);
    if (result.ok) return result.value;
    console.log(`Unable to save flow in CAS: ${result.error}`);
  } catch (e) {
    throw new Error(`Error adding file to CAS: ${e}`);
  }
}

export function readFlowFile(absoluteFilePath: string): JsonValue {
  if (
    !path.isAbsolute(absoluteFilePath) ||
    path.extname(absoluteFilePath).length === 0
  ) {
    throw new Error(`Path is not an absolute file path: ${absoluteFilePath}`);
  }

  try {
    const data = fs.readFileSync(absoluteFilePath, { encoding: "utf8" });
    const json = JSON.parse(data) as JsonValue;
    return json;
  } catch (e) {
    throw new Error(`Error adding file to CAS: ${e}`);
  }
}

export async function addFlowIndex(
  index: FlowIndex,
  store: IndexStorePort<FlowIndex>,
): Promise<Result<string, string>> {
  const id = makeId(index.name, index.version);
  const result = await store.put(id, index);
  return result;
}

function makeId(name: string, version: string, path?: string, p0?: {}): string {
  const hash = createHash("md5");
  hash.update(name + version + path);
  return hash.digest("hex");
}
