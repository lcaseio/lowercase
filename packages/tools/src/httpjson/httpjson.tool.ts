import { ToolContext, ToolInstancePort } from "@lcase/ports/tools";
import { JobRequestedType } from "@lcase/types";

export class HttpJsonTool implements ToolInstancePort {
  id = "httpjson" as const;
  name = "Internal Http Json Tool";
  async invoke(
    data: unknown,
    context: ToolContext<JobRequestedType>
  ): Promise<void> {
    throw new Error("Not Yet Implemented");
  }
}
