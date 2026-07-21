import type { MultipartFile } from "@fastify/multipart";
import type {
  ArtifactPutInput,
  JsonValue,
  PostArtifactFileRes,
} from "@lcase/types";
import type { FastifyInstance } from "fastify/types/instance.js";

const jsonMimeSet = new Set([
  "application/json",
  "text/json",
  "application/octet-stream",
]);

const textMimeSet = new Set(["text/plain"]);
const markdownMimeSet = new Set(["text/markdown", "text/x-markdown"]);

type SupportedArtifactFormat = ArtifactPutInput["format"] &
  ("json" | "text" | "markdown");

type BufferedUpload = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

export const postArtifactFileRoute = async (app: FastifyInstance) => {
  app.post("/", async (req, reply): Promise<PostArtifactFileRes> => {
    let fileCount = 0;
    let upload: BufferedUpload | undefined;
    let label: string | undefined;

    for await (const part of req.parts()) {
      if (part.type === "field") {
        if (part.fieldname === "label" && typeof part.value === "string") {
          label = part.value;
        }
        continue;
      }

      fileCount += 1;

      if (fileCount > 1) {
        return reply
          .code(400)
          .send({ ok: false, error: "Only one file upload is supported" });
      }

      upload = {
        filename: part.filename,
        mimetype: part.mimetype,
        buffer: await part.toBuffer(),
      };
    }

    if (!upload) {
      return reply.code(400).send({ ok: false, error: "Missing upload file" });
    }

    const format = detectArtifactFileFormat(upload);
    if (!format) {
      return reply
        .code(400)
        .send({ ok: false, error: "Unsupported artifact file type" });
    }

    const putInput = makeArtifactPutInputFromBuffer(upload, format, label);
    if (!putInput.ok) {
      return reply.code(400).send(putInput);
    }

    const result = await app.services.artifact.putArtifact(putInput.value);
    if (!result.ok) return reply.code(500).send(result);
    return result;
  });
};

export function detectArtifactFileFormat(
  part: Pick<MultipartFile, "filename" | "mimetype">,
): SupportedArtifactFormat | undefined {
  const filename = part.filename?.toLowerCase();
  if (!filename) return;

  if (filename.endsWith(".json") && jsonMimeSet.has(part.mimetype)) {
    return "json";
  }

  if (filename.endsWith(".txt") && textMimeSet.has(part.mimetype)) {
    return "text";
  }

  if (filename.endsWith(".md") && markdownMimeSet.has(part.mimetype)) {
    return "markdown";
  }
}

export async function makeArtifactPutInput(
  part: MultipartFile,
  format: SupportedArtifactFormat,
  label?: string,
): Promise<
  { ok: true; value: ArtifactPutInput } | { ok: false; error: string }
> {
  return makeArtifactPutInputFromBuffer(
    {
      filename: part.filename,
      mimetype: part.mimetype,
      buffer: await part.toBuffer(),
    },
    format,
    label,
  );
}

export function makeArtifactPutInputFromBuffer(
  upload: BufferedUpload,
  format: SupportedArtifactFormat,
  label?: string,
): { ok: true; value: ArtifactPutInput } | { ok: false; error: string } {
  const text = upload.buffer.toString("utf8");
  const index = {
    filename: upload.filename,
    contentType: upload.mimetype,
    ...(label ? { label } : {}),
  };

  switch (format) {
    case "json": {
      try {
        const value = JSON.parse(text) as JsonValue;
        return { ok: true, value: { format: "json", value, index } };
      } catch {
        return { ok: false, error: "Invalid JSON file contents" };
      }
    }
    case "text":
      return { ok: true, value: { format: "text", value: text, index } };
    case "markdown":
      return { ok: true, value: { format: "markdown", value: text, index } };
  }
}
