import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect
} from "react";
import * as monaco from "monaco-editor";
import { editor as MonacoEditorType } from "monaco-editor";
import type { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer"; // For optional syntax error callback

export interface CoreMonacoEditorRef {
  /**
   * Reveal a specific line in the center of the viewport and move cursor there.
   */
  goToLine: (lineNumber: number) => void;
  /**
   * Give focus to the underlying Monaco editor instance.
   */
  focus: () => void;
}

export interface CoreMonacoEditorProps {
  /**
   * Current code value shown in the editor.
   */
  value: string;
  /**
   * Language ID supported by Monaco (e.g. "javascript", "python").
   */
  language: string;
  /**
   * Callback fired on every content change.
   */
  onChange: (value: string) => void;
  /**
   * Optional editor height (default "100%").
   */
  height?: string | number;
  /**
   * Theme applied to the editor ("vs-dark" | "vs-light", default "vs-dark").
   */
  theme?: string;
  /**
   * Additional Monaco construction options merged into the defaults.
   */
  options?: MonacoEditorType.IStandaloneEditorConstructionOptions;
  /**
   * Callback fired when syntax errors change (not yet implemented by CoreMonacoEditor).
   */
  onSyntaxErrorsChange?: SyntaxAnalysisResult[];
  /**
   * Optional hook into the underlying onMount event from @monaco-editor/react.
   */
  onMount?: (editor: MonacoEditorType.IStandaloneCodeEditor) => void;
}

/**
 * CoreMonacoEditor is a thin wrapper around @monaco-editor/react that provides
 * a stable API for the rest of the app without leaking Monaco specifics.
 */
const CoreMonacoEditor = forwardRef<CoreMonacoEditorRef, CoreMonacoEditorProps>(
  (
    {
      value,
      language,
      onChange,
      height = "100%",
      theme = "vs-dark",
      options,
      onMount,
      onSyntaxErrorsChange
    },
    ref
  ) => {
    const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
    const monacoEl = useRef(null);

    useEffect(() => {
      if (monacoEl.current) {
        editorRef.current = monaco.editor.create(monacoEl.current, {
          value: value,
          language: language,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly: false,
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          theme: theme || "vs-dark",
          ...options,
        });

        editorRef.current.onDidChangeModelContent(() => {
          onChange(editorRef.current?.getValue() ?? "");
        });

        onMount?.(editorRef.current);
      }

      return () => {
        editorRef.current?.dispose();
      };
    }, []);

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.setValue(value);
      }
    }, [value]);

    useEffect(() => {
      if (editorRef.current) {
        monaco.editor.setModelLanguage(editorRef.current.getModel()!, language);
      }
    }, [language]);

    useEffect(() => {
      if (editorRef.current && onSyntaxErrorsChange) {
        const model = editorRef.current.getModel();
        if (model) {
          // Clear existing markers
          monaco.editor.setModelMarkers(model, 'owner', []);

          // Set new markers based on onSyntaxErrorsChange
          const newMarkers: monaco.editor.IMarkerData[] = onSyntaxErrorsChange.flatMap(analysisResult =>
          analysisResult.errors.map(error => ({
            severity: monaco.MarkerSeverity.Error,
            message: error.message,
            startLineNumber: error.line,
            startColumn: error.column,
            endLineNumber: error.endLineNumber || error.line,
            endColumn: error.endColumn || (error.column + 1),
          }))
        );
          monaco.editor.setModelMarkers(model, 'owner', newMarkers);
        }
      }
    }, [onSyntaxErrorsChange, language]);

    useImperativeHandle(
      ref,
      (): CoreMonacoEditorRef => ({
        goToLine: (lineNumber: number) => {
          if (!editorRef.current) return;
          const position = { lineNumber, column: 1 };
          editorRef.current.revealLineInCenter(lineNumber);
          editorRef.current.setPosition(position);
          editorRef.current.focus();
        },
        focus: () => {
          editorRef.current?.focus();
        }
      }),
      []
    );

    return <div id="monaco-editor-container" ref={monacoEl} style={{ height, width: '100%' }}></div>;
  }
);

CoreMonacoEditor.displayName = "CoreMonacoEditor";

export default CoreMonacoEditor;