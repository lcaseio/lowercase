import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef, useState } from "react";
import { useTheme } from "@/contexts/use-theme";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";

// Passed as Editor's own `loading` node -- only ever mounted while Monaco's
// own bundle/worker is initializing (a separate phase from any data fetch
// the caller already resolved before rendering <CodeEditor>), so "isLoading"
// is trivially always true for as long as this exists: it unmounts the
// instant Monaco becomes ready. useDelayedLoading(true) then means "don't
// show anything for the first 200ms" -- if Monaco's already ready by then,
// this unmounts before the timeout ever fires, and nothing renders at all.
function MonacoLoadingFallback() {
  const showLoading = useDelayedLoading(true);
  return showLoading ? (
    <div className="p-4 text-sm text-muted-foreground">Loading editor...</div>
  ) : null;
}

type Props = {
  value: string;
  onChange?: (value: string) => void;
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
  // Hands the caller the mounted Monaco editor instance -- for anything
  // beyond display, e.g. programmatic reveal/selection (see
  // ExplorerJsonDefinitionContent.tsx's revealPath handling).
  onMount?: (editor: Parameters<OnMount>[0]) => void;
};

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  readOnly = false,
  height = "200px",
  autoHeight = false,
  minHeight = 40,
  maxHeight = 240,
  onMount,
}: Props) {
  const { resolvedTheme } = useTheme();
  const [contentHeight, setContentHeight] = useState(minHeight);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const syncHeight = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setContentHeight(
      Math.min(Math.max(editor.getContentHeight(), minHeight), maxHeight),
    );
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    if (autoHeight) {
      syncHeight();
      editor.onDidContentSizeChange(syncHeight);
    }
    onMount?.(editor);
  };

  return (
    <Editor
      height={autoHeight ? contentHeight : height}
      language={language}
      value={value}
      onChange={(value) => onChange?.(value ?? "")}
      theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
      loading={<MonacoLoadingFallback />}
      onMount={autoHeight || onMount ? handleMount : undefined}
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
