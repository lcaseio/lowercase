import type { FlowVersionRecord } from "@lcase/types";

type Props = {
  version: FlowVersionRecord;
};
export function FlowVersionListItem({ version }: Props) {
  return (
    <div className="">
      <span className="text-xs text-muted-foreground">
        Sequence: {version.sequence} {version?.versionLabel}
      </span>
    </div>
  );
}
