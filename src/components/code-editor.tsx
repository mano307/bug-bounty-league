import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

const THEME = "debugx-neon";

export function CodeEditor({
  value,
  language,
  onChange,
  height = "100%",
  readOnly = false,
}: {
  value: string;
  language: string;
  onChange?: (v: string) => void;
  height?: string;
  readOnly?: boolean;
}) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={THEME}
      loading={
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading editor…
        </span>
      }
      beforeMount={(monaco) => {
        monaco.editor.defineTheme(THEME, {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "comment", foreground: "5f7a70", fontStyle: "italic" },
            { token: "keyword", foreground: "4ade80" },
            { token: "string", foreground: "7dd3fc" },
            { token: "number", foreground: "fbbf24" },
          ],
          colors: {
            "editor.background": "#0d1117",
            "editor.foreground": "#d7e3dd",
            "editorLineNumber.foreground": "#3f5a50",
            "editorCursor.foreground": "#4ade80",
            "editor.selectionBackground": "#1f3d33",
            "editor.lineHighlightBackground": "#131b22",
          },
        });
      }}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        readOnly,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        padding: { top: 16, bottom: 16 },
        contextmenu: false,
        automaticLayout: true,
        tabSize: 2,
        renderLineHighlight: "line",
      }}
    />
  );
}
