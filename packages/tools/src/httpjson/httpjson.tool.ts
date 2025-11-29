import { ToolDeps, ToolInstancePort } from "@lcase/ports/tools";
import { AnyEvent, ToolEvent } from "@lcase/types";

type ResponseObject =
  | {
      error: false;
      response: Response;
    }
  | { error: true; event: AnyEvent<"tool.failed"> };

type GetJsonObject =
  | {
      error: false;
      json: unknown;
    }
  | { error: true; event: AnyEvent<"tool.failed"> };

export class HttpJsonTool implements ToolInstancePort<"httpjson"> {
  id = "httpjson" as const;
  version = "0.1.0-alpha.7";
  name = "Internal Http Json Tool";
  #deps: ToolDeps;
  constructor(deps: ToolDeps) {
    this.#deps = deps;
  }

  async invoke(
    event: AnyEvent<"job.httpjson.started">
  ): Promise<ToolEvent<"tool.completed"> | ToolEvent<"tool.failed">> {
    await this.emitToolStarted(event);

    const headers = this.mapHeaders(event.data.headers);
    const body = this.parseBody(event.data.body);

    const response = await this.getResponse(
      {
        url: event.data.url,
        headers,
        method: event.data.method,
        body,
      },
      event
    );

    if (response.error) return response.event;

    const json = await this.getJson(response.response, event);
    if (json.error) return json.event;

    const e = await this.emitToolCompleted(event, { json: json.json });
    return e;
  }

  async getJson(
    response: Response,
    event: AnyEvent<"job.httpjson.started">
  ): Promise<GetJsonObject> {
    try {
      const data = await response.json();
      return { error: false, json: data };
    } catch (err) {
      const e = await this.emitToolFailed(
        event,
        `Could not parse response as json. respones: ${response}; error: ${err};`
      );
      return { error: true, event: e };
    }
  }

  async getResponse(
    args: {
      url: string;
      method?: string;
      headers?: Headers;
      body?: string;
    },
    event: AnyEvent<"job.httpjson.started">
  ): Promise<ResponseObject> {
    try {
      const { url, method, headers, body } = args;
      const response = await fetch(url, {
        ...(method ? { method } : {}),
        ...(headers ? { headers } : {}),
        ...(body ? { body } : {}),
      });
      return { error: false, response };
    } catch (err) {
      const e = await this.emitToolFailed(
        event,
        `[httpjson-tool] error fetching ${args.url}: ${err}`
      );
      return { error: true, event: e };
    }
  }

  mapHeaders(headers?: Record<string, string>): Headers | undefined {
    if (!headers) return;
    const customHeaders = new Headers();
    for (const [k, v] of Object.entries(headers)) {
      customHeaders.set(k, v);
    }
    return customHeaders;
  }
  parseBody(body?: unknown): string | undefined {
    if (!body) return;
    return JSON.stringify(body);
  }

  async emitToolStarted(event: AnyEvent<"job.httpjson.started">) {
    const emitter = this.#deps.ef.newToolEmitterFromEvent(
      event,
      "lowercase://httpjson-tool/emit-tool-started"
    );
    await emitter.emit("tool.started", {
      tool: {
        id: this.id,
        name: this.name,
        version: this.version,
      },
      log: "httpjson tool started",
    });
  }

  async emitToolCompleted(
    event: AnyEvent<"job.httpjson.started">,
    payload: Record<string, unknown>
  ): Promise<ToolEvent<"tool.completed">> {
    const emitter = this.#deps.ef.newToolEmitterFromEvent(
      event,
      "lowercase://httpjson-tool/emit-tool-compelted"
    );
    const e = await emitter.emit("tool.completed", {
      tool: {
        id: this.id,
        name: this.name,
        version: this.version,
      },
      status: "success",
      payload,
    });
    return e;
  }
  async emitToolFailed(
    event: AnyEvent<"job.httpjson.started">,
    reason: string
  ) {
    const emitter = this.#deps.ef.newToolEmitterFromEvent(
      event,
      "lowercase://httpjson-tool/emit-tool-compelted"
    );
    return await emitter.emit("tool.failed", {
      tool: {
        id: this.id,
        name: this.name,
        version: this.version,
      },
      status: "failure",
      reason,
    });
  }
}
