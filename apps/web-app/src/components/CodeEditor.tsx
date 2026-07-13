import Editor from "@monaco-editor/react";
import { useTheme } from "@/contexts/use-theme";

type Props = {
  value: string;
  language?: "json" | "markdown" | "plaintext";
  readOnly?: boolean;
  height?: string;
};

export function CodeEditor({
  value,
  language = "plaintext",
  readOnly = false,
  height = "200px",
}: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
      }}
    />
  );
}
