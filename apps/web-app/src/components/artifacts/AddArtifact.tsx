import {
  useAddJsonArtifactMutation,
  useUploadArtifactFileMutation,
} from "@/redux/api/artifacts-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type ManualFormat = "json" | "text" | "markdown";

export function AddArtifact() {
  const [addJsonArtifact, addJsonState] = useAddJsonArtifactMutation();
  const [uploadArtifactFile, uploadState] = useUploadArtifactFileMutation();
  const [label, setLabel] = useState("");
  const [format, setFormat] = useState<ManualFormat>("json");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const handleManualSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      if (format === "json") {
        const value = JSON.parse(text);
        const res = await addJsonArtifact({
          value,
          ...(label ? { label } : {}),
        });
        setStatus(JSON.stringify(res, null, 2));
        return;
      }

      const extension = format === "text" ? "txt" : "md";
      const contentType = format === "text" ? "text/plain" : "text/markdown";
      const upload = await uploadArtifactFile({
        file: new File([text], `artifact.${extension}`, { type: contentType }),
        ...(label ? { label } : {}),
      });
      setStatus(JSON.stringify(upload, null, 2));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Error creating artifact");
    }
  };

  const handleFileSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!file) return;
    const res = await uploadArtifactFile({
      file,
      ...(label ? { label } : {}),
    });
    setStatus(JSON.stringify(res, null, 2));
    setFile(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleFileSubmit} className="flex flex-col gap-3">
        <h3 className="font-bold">Upload Artifact File</h3>
        <Input
          className="w-2/6 cursor-pointer"
          type="file"
          accept=".json,.txt,.md,application/json,text/plain,text/markdown"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button
          className="w-1/6 cursor-pointer"
          type="submit"
          disabled={uploadState.isLoading || !file}
        >
          Upload File
        </Button>
      </form>
      <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
        <h3 className="font-bold">Create Artifact</h3>

        <select
          className="w-1/6 rounded-md border bg-transparent p-2"
          value={format}
          onChange={(e) => setFormat(e.target.value as ManualFormat)}
        >
          <option value="json">json</option>
          <option value="text">text</option>
          <option value="markdown">markdown</option>
        </select>
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-2/6"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[500px] rounded-md border bg-transparent p-3 font-mono text-sm"
          placeholder={
            format === "json"
              ? '{\n  "hello": "world"\n}'
              : format === "markdown"
                ? "# Markdown"
                : "plain text"
          }
        />
        <Button
          type="submit"
          className="w-1/6 cursor-pointer"
          size="lg"
          disabled={
            addJsonState.isLoading ||
            uploadState.isLoading ||
            text.trim() === ""
          }
        >
          Create
        </Button>
      </form>

      {status ? (
        <pre className="text-xs mb-8 whitespace-pre-wrap rounded-md bg-blue-200 p-3 dark:bg-blue-900">
          {status}
        </pre>
      ) : null}
    </div>
  );
}
