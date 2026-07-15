import type { FlowDefinition } from "@lcase/types";
import { InputField } from "./fields/InputField";
import { TextAreaField } from "./fields/TextAreaField";

type Props = Pick<
  FlowDefinition,
  "name" | "version" | "description" | "kind" | "start"
>;
export function FlowSettings({
  version,
  name,
  description,
  kind,
  start,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Name" value={name} />
      <InputField label="Kind" value={kind} />
      <InputField label="Version" value={version} />
      <TextAreaField label="Description" value={description} />
      <InputField label="Start Step" value={start} />
    </div>
  );
}
