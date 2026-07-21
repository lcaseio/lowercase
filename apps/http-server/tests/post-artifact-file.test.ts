import type { MultipartFile } from "@fastify/multipart";
import { describe, expect, it } from "vitest";
import {
  detectArtifactFileFormat,
  makeArtifactPutInput,
} from "../src/routes/artifacts/post-artifact-file.js";

describe("artifact file upload helpers", () => {
  it("detects supported artifact formats", () => {
    expect(
      detectArtifactFileFormat({
        filename: "data.json",
        mimetype: "application/json",
      }),
    ).toBe("json");

    expect(
      detectArtifactFileFormat({
        filename: "notes.txt",
        mimetype: "text/plain",
      }),
    ).toBe("text");

    expect(
      detectArtifactFileFormat({
        filename: "prompt.md",
        mimetype: "text/markdown",
      }),
    ).toBe("markdown");
  });

  it("rejects unsupported file metadata", () => {
    expect(
      detectArtifactFileFormat({
        filename: "data.json",
        mimetype: "text/plain",
      }),
    ).toBeUndefined();

    expect(
      detectArtifactFileFormat({
        filename: "notes.md",
        mimetype: "application/json",
      }),
    ).toBeUndefined();
  });

  it("parses a json file into a json artifact input", async () => {
    const part = makeMultipartFile(
      '{"hello":"world"}',
      "data.json",
      "application/json",
    );

    const result = await makeArtifactPutInput(part, "json", "Prompt");
    expect(result).toEqual({
      ok: true,
      value: {
        format: "json",
        value: { hello: "world" },
        index: {
          label: "Prompt",
          filename: "data.json",
          contentType: "application/json",
        },
      },
    });
  });

  it("rejects invalid json file contents", async () => {
    const part = makeMultipartFile("{", "data.json", "application/json");

    const result = await makeArtifactPutInput(part, "json");
    expect(result).toEqual({ ok: false, error: "Invalid JSON file contents" });
  });

  it("builds text and markdown artifact inputs", async () => {
    const textResult = await makeArtifactPutInput(
      makeMultipartFile("plain text", "notes.txt", "text/plain"),
      "text",
      "Notes",
    );

    expect(textResult).toEqual({
      ok: true,
      value: {
        format: "text",
        value: "plain text",
        index: {
          label: "Notes",
          filename: "notes.txt",
          contentType: "text/plain",
        },
      },
    });

    const markdownResult = await makeArtifactPutInput(
      makeMultipartFile("# title", "notes.md", "text/markdown"),
      "markdown",
    );

    expect(markdownResult).toEqual({
      ok: true,
      value: {
        format: "markdown",
        value: "# title",
        index: {
          filename: "notes.md",
          contentType: "text/markdown",
        },
      },
    });
  });
});

function makeMultipartFile(
  content: string,
  filename: string,
  mimetype: string,
): MultipartFile {
  return {
    filename,
    mimetype,
    async toBuffer() {
      return Buffer.from(content, "utf8");
    },
  } as MultipartFile;
}
