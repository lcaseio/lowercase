import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
app.use(express.json());

// map transports to specific session ids (no auth)
const sessions = new Map<string, SSEServerTransport>();
const port = 3004;
const mcp = new McpServer({
  name: "unicode-server",
  version: "0.1.0-alpha.10",
  capabilities: { logging: {} },
});

// 12x16 unicode art
// 🟥
// ⬜
// 🟧
// ⬛️
// 🟫
// 🟦

const art = `
⬜⬜⬜🟥🟥🟥🟥🟥⬜⬜⬜⬜
⬜⬜🟥🟥🟥🟥🟥🟥🟥🟥🟥⬜
⬜⬜🟫🟫🟫🟧🟧⬛️🟧⬜⬜⬜
⬜🟫🟧🟫🟧🟧🟧⬛️🟧🟧🟧⬜
⬜🟫🟧🟫🟫🟧🟧🟧⬛️🟧🟧🟧
⬜🟫🟫🟧🟧🟧🟧⬛️⬛️⬛️⬛️⬜
⬜⬜⬜🟧🟧🟧🟧🟧🟧🟧⬜⬜
⬜⬜🟥🟥🟦🟥🟥🟥🟥⬜⬜⬜
⬜🟥🟥🟥🟦🟥🟥🟦🟥🟥🟥⬜
🟥🟥🟥🟥🟦🟦🟦🟦🟥🟥🟥🟥
🟧🟧🟥🟦🟧🟦🟦🟧🟦🟥🟧🟧
🟧🟧🟧🟦🟦🟦🟦🟦🟦🟧🟧🟧
🟧🟧🟦🟦🟦🟦🟦🟦🟦🟦🟧🟧
⬜⬜🟦🟦🟦⬜⬜🟦🟦🟦⬜⬜
⬜🟫🟫🟫⬜⬜⬜⬜🟫🟫🟫⬜
🟫🟫🟫🟫⬜⬜⬜⬜🟫🟫🟫🟫`.trim();

// draw tool that updates the SSE with transport.send() messages

const DrawOutputSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
  data: z.string().optional(),
});
type DrawOutput = z.infer<typeof DrawOutputSchema>;

mcp.registerTool(
  "draw",
  {
    title: "draw",
    description: "produces unicode individual strings in a SSE stream",
    inputSchema: { delayMs: z.number(), useStream: z.boolean() },
    outputSchema: {
      ok: z.boolean(),
      message: z.string().optional(),
      data: z.string().optional(),
    },
  },
  async ({ delayMs, useStream }, ctx) => {
    // just return the full art if not streaming

    if (!useStream) {
      const output: DrawOutput = {
        ok: true,
        data: art,
        message: "returning full art",
      };
      console.log("ok");
      return {
        content: [{ type: "text", text: output.data ?? "" }],
        structuredContent: output,
      };
    }

    const { sessionId } = ctx;
    console.log("[unicode-server] sessionId:", sessionId);

    if (!sessionId) {
      console.log("[unicode-server] no session");
      const output: DrawOutput = {
        ok: false,
        message: "no session id provided",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    }
    const transport = sessions.get(sessionId);

    if (!sessions.has(sessionId) || transport === undefined) {
      const output: DrawOutput = {
        ok: false,
        message: "Unable to create session",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        structuredContent: output,
      };
    }

    // this should run later.  right now its in this tool for convenience.
    // using delayMS and unawaited promise to return before this starts
    // hopefully.  this is just a mock MCP server for demo purposes.
    // this feature would be kicked off by an unawaited promise
    // or set timeout to m
    // ake sure return reaches the client before
    // sending over SSE
    (async () => {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      const chars = [...segmenter.segment(art)].map((seg) => seg.segment);
      console.log(chars);

      for (const char of chars) {
        await new Promise((r) => setTimeout(r, delayMs));
        await transport.send({
          jsonrpc: "2.0",
          method: "notifications/message",
          params: {
            level: "info",
            message: char,
          },
        });
      }
      // send end message
      await transport.send({
        jsonrpc: "2.0",
        method: "notifications/message",
        params: {
          level: "info",
          message: "END",
        },
      });
      return;
    })();

    const output: DrawOutput = {
      ok: true,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  },
);

app.get("/health", async (req, res) => {
  return res.status(200).send("ok");
});
// endpoint for created th sse connection
app.get("/sse", async (req, res) => {
  console.log("[unicode-server] connecting /sse");
  const transport = new SSEServerTransport("/messages", res);
  sessions.set(transport.sessionId, transport);

  res.on("close", () => {
    sessions.delete(transport.sessionId);
    transport.close();
  });

  await mcp.connect(transport);
});

// endpoint for handling other non SSE stuff like tool calls
// POST /messages or /messages/:sessionId JSON-RPC calls
app.post(["/messages", "/messages/:sessionId"], async (req, res) => {
  console.log("[unicode-server] received messages post request");

  // /messages/:sessionId
  const paramId = (req.params as any)?.sessionId as string | undefined;
  // /messages?sessionId=
  const queryId = (req.query?.sessionId as string) || undefined;
  const headerId = (req.header("mcp-session-id") as string) || undefined;

  const sessionId = paramId || queryId || headerId || "";
  const transport = sessions.get(sessionId);

  if (!transport) {
    console.error(
      "[unicode-server] Error; No transport for sessionId:",
      sessionId,
      "path:",
      req.path,
    );
    return res.status(400).send("No transport for sessionId");
  }

  await transport.handlePostMessage(req, res, req.body);
});

app.listen(port, () => {
  console.log("[unicode-server] unicode MCP SSE server running.");
  console.log(`[unicode-server] Listening on http://localhost:${port}`);
  console.log(`[unicode-server] GET /sse, POST /messages`);
});
process.on("SIGINT", () => {
  for (const [id, transport] of sessions.entries()) {
    transport.close();
  }
  sessions.clear();
  process.exit();
});
process.on("SIGTERM", () => {
  for (const [id, transport] of sessions.entries()) {
    transport.close();
  }
  sessions.clear();
  process.exit();
});
process.on("exit", () => {
  for (const [id, transport] of sessions.entries()) {
    transport.close();
  }
  sessions.clear();
  process.exit();
});
