import { ToolDeps, ToolInstancePort } from "@lcase/ports/tools";
import { AnyEvent, ToolEvent } from "@lcase/types";

type ResponseObject =
  | {
      error: false;
      response: Response;
    }
  | { error: true; event: AnyEvent<"tool.failed"> };

type GetResponseBody =
  | {
      error: false;
      body: unknown;
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

    const inputHeaders = this.mapInputHeaders(event.data.headers);
    const inputBody = this.parseInputBody(event.data.body);

    const r = await this.getResponse(
      {
        url: event.data.url,
        headers: inputHeaders,
        method: event.data.method,
        body: inputBody,
      },
      event
    );

    if (r.error) return r.event;

    const getResponseBodyResult = await this.getResponseBody(r.response, event);

    if (getResponseBodyResult.error) return getResponseBodyResult.event;
    const { body } = getResponseBodyResult;

    if (r.response.ok) {
      const e = await this.emitToolCompleted(event, {
        body,
        headers: Object.fromEntries(r.response.headers.entries()),
        ok: r.response.ok,
        redirected: r.response.redirected,
        status: r.response.status,
        statusText: r.response.statusText,
        url: r.response.url,
      });
      return e;
    } else {
      const e = await this.emitToolFailed(event, "Response `ok` was false", {
        body,
        headers: Object.fromEntries(r.response.headers.entries()),
        ok: r.response.ok,
        redirected: r.response.redirected,
        status: r.response.status,
        statusText: r.response.statusText,
        url: r.response.url,
      });
      return e;
    }
  }

  async getResponseBody(
    r: Response,
    event: AnyEvent<"job.httpjson.started">
  ): Promise<GetResponseBody> {
    try {
      const contentType = r.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const body = await r.json();
        return { error: false, body };
      } else {
        const body = await r.text();
        return { error: false, body };
      }
    } catch (err) {
      const e = await this.emitToolFailed(
        event,
        `Could not parse response as json. respones: ${JSON.stringify(
          r,
          null,
          2
        )}; error: ${err};`
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

  mapInputHeaders(headers?: Record<string, string>): Headers | undefined {
    if (!headers) return;
    const customHeaders = new Headers();
    for (const [k, v] of Object.entries(headers)) {
      customHeaders.set(k, v);
    }
    return customHeaders;
  }
  parseInputBody(body?: unknown): string | undefined {
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
    reason: string,
    payload?: Record<string, unknown>
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
      ...(payload ? { payload } : {}),
    });
  }
}
