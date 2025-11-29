import { ToolDeps, ToolInstancePort } from "@lcase/ports/tools";
import { AnyEvent } from "@lcase/types";

export class HttpJsonTool implements ToolInstancePort<"httpjson"> {
  id = "httpjson" as const;
  name = "Internal Http Json Tool";
  #deps: ToolDeps;
  constructor(deps: ToolDeps) {
    this.#deps = deps;
  }

  async invoke(event: AnyEvent<"job.httpjson.started">): Promise<unknown> {
    console.log("[httpjson-tool] executing with event:", event);

    const { url, body, headers } = event.data;
    const response = await fetch(url);

    const data = JSON.parse(await response.json());

    return data;
  }
}
