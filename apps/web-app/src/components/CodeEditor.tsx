import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { useTheme } from "@/contexts/use-theme";

type Props = {
  value: string;
  language?: "json" | "markdown" | "plaintext";
  readOnly?: boolean;
  height?: string;
  /** Fit height to content instead of a fixed height — clamped between
   * minHeight/maxHeight, with the editor's own scrolling taking over past
   * maxHeight. Accounts for wrapped lines (not just literal newlines), since
   * wordWrap is always on. */
  autoHeight?: boolean;
  minHeight?: number;
  maxHeight?: number;
};

export function CodeEditor({
  value,
  language = "plaintext",
  readOnly = false,
  height = "200px",
  autoHeight = false,
  minHeight = 40,
  maxHeight = 240,
}: Props) {
  const { resolvedTheme } = useTheme();
  const [contentHeight, setContentHeight] = useState(minHeight);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const syncHeight = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setContentHeight(Math.min(Math.max(editor.getContentHeight(), minHeight), maxHeight));
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    syncHeight();
    editor.onDidContentSizeChange(syncHeight);
  };

  return (
    <Editor
      height={autoHeight ? contentHeight : height}
      language={language}
      value={value}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      onMount={autoHeight ? handleMount : undefined}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        wordWrap: "on",
      }}
    />
  );
}
