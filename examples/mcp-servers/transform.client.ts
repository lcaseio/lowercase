import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { LoggingMessageNotificationSchema } from "@modelcontextprotocol/sdk/types.js";

const client = new Client({ name: "ascii-client", version: "0.1.0-alpha.10" });
const transport = new SSEClientTransport(new URL("http://localhost:3005/sse"));
console.log("[transform-client] running");
await client.connect(transport);

let art = `
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

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const chars = [...segmenter.segment(art)].map((seg) => seg.segment);
// console.log(chars);

let tranformedArt = "";
client.setNotificationHandler(LoggingMessageNotificationSchema, (n) => {
  console.log("[transform-client] log message arg:", n);
  tranformedArt += n.params.message;
  console.log(tranformedArt);
});

const useStreaming = true;

if (useStreaming) {
  for (const char of chars) {
    await new Promise((r) => setTimeout(r, 50));
    console.log(char);
    client.callTool({
      name: "transform",
      arguments: { delayMs: 10, art: char, isStreaming: useStreaming },
    });
  }
} else {
  const result = await client.callTool({
    name: "transform",
    arguments: { delayMs: 5, art, isStreaming: useStreaming },
  });
  console.log("[transform-client] draw tool result:", result.structuredContent);
}
