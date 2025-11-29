import { ToolDeps, ToolInstancePort } from "@lcase/ports/tools";
import { AnyEvent } from "@lcase/types";

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
  ): Promise<Record<string, unknown> | undefined> {
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

    if (!response) throw new Error("response is undefined");
    const json = await this.getJson(response, event);

    if (!json) return { ok: false, status: "failure" };

    await this.emitToolCompleted(event);
    return { json, ok: response.ok, status: response.status };
  }

  async getJson(response: Response, event: AnyEvent<"job.httpjson.started">) {
    try {
      const data = await response.json();
      return data;
    } catch (err) {
      this.emitToolFailed(
        event,
        `Could not parse response as json. respones: ${response}; error: ${err};`
      );
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
  ) {
    try {
      const { url, method, headers, body } = args;
      const response = await fetch(url, {
        ...(method ? { method } : {}),
        ...(headers ? { headers } : {}),
        ...(body ? { body } : {}),
      });
      return response;
    } catch (err) {
      await this.emitToolFailed(
        event,
        `[httpjson-tool] error fetching ${args.url}: ${err}`
      );
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
      status: "started",
    });
  }

  async emitToolCompleted(event: AnyEvent<"job.httpjson.started">) {
    const emitter = this.#deps.ef.newToolEmitterFromEvent(
      event,
      "lowercase://httpjson-tool/emit-tool-compelted"
    );
    await emitter.emit("tool.completed", {
      tool: {
        id: this.id,
        name: this.name,
        version: this.version,
      },
      status: "completed",
    });
  }
  async emitToolFailed(
    event: AnyEvent<"job.httpjson.started">,
    reason: string
  ) {
    const emitter = this.#deps.ef.newToolEmitterFromEvent(
      event,
      "lowercase://httpjson-tool/emit-tool-compelted"
    );
    await emitter.emit("tool.failed", {
      tool: {
        id: this.id,
        name: this.name,
        version: this.version,
      },
      status: "failed",
      reason,
    });
  }
}
