import { ToolContext, ToolInstancePort } from "@lcase/ports/tools";
import { AnyEvent, JobRequestedType } from "@lcase/types";

export class HttpJsonTool implements ToolInstancePort {
  id = "httpjson" as const;
  name = "Internal Http Json Tool";
  async invoke(
    event: AnyEvent<"job.httpjson.queued">,
    context: ToolContext<JobRequestedType>
  ): Promise<void> {
    console.log("[httpjson-tool] executing with event:", event);
  }
}
