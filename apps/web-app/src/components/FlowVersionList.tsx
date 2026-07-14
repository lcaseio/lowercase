import type { FlowRecord, FlowVersionRecord } from "@lcase/types";
import { FlowVersionListItem } from "./FlowVersionListItem";

/**
 *
 * @param param0
 * @returns
 */
export function FlowVersionList({
  versions,
  flowName,
}: {
  flowName: FlowRecord["name"];
  kind: FlowRecord["kind"];
  versions: FlowVersionRecord[];
}) {
  return (
    <div>
      <h2 className="mb-3 mt-2">Versions</h2>
      <h2 className="mb-3 mt-2 text-sm">{flowName}</h2>
      {versions.map((version, index) => (
        <FlowVersionListItem version={version} key={index} />
      ))}
    </div>
  );
}
