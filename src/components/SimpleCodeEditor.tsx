import React, {
  forwardRef,
  useImperativeHandle,
  useRef
} from "react";
import type { ProgrammingLanguage } from "@/types";
import CoreMonacoEditor,
  CoreMonacoEditorRef
} from "./CoreMonacoEditor";
import { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";

export interface SimpleCodeEditorRef {
  /**
   * Scrolls to the given line (1-indexed) and focuses the editor.
   */
  goToLine: (lineNumber: number, column?: number) => void;
  /**
   * Gives focus to the underlying Monaco editor.
   */
  focus: () => void;
}

export interface SimpleCodeEditorProps {
  /** Current code string rendered in the editor */
  code: string;
  /**
   * Programming language object or Monaco language id.
   * If a ProgrammingLanguage is provided its ``id`` will be used.
   */
  language: ProgrammingLanguage | string;
  /** Callback fired on every code change */
  onCodeChange: (newCode: string) => void;
  /**
   * Optional callback fired when syntax errors are updated.  The format mimics
   * the structure used elsewhere in the app so we can integrate deeper later.
   */
  onSyntaxErrorsChange?: SyntaxAnalysisResult[];
  /** Optional explicit height passed to CoreMonacoEditor */
  height?: string | number;
  /** Optional theme for Monaco (default ``vs-dark``) */
  theme?: string;
}

/**
 * SimpleCodeEditor wraps CoreMonacoEditor and exposes a limited, stable API
 * for consumers who do not need full Monaco control.  It also exposes an
 * imperative ref with ``goToLine`` / ``focus`` helpers used throughout the app.
 */
const SimpleCodeEditor = forwardRef<SimpleCodeEditorRef, SimpleCodeEditorProps>(
  (
    {
      code,
      language,
      onCodeChange,
      onSyntaxErrorsChange,
      height = "100%",
      theme
    },
    ref
  ) => {
    // Bridge to the underlying CoreMonacoEditor instance
    const coreRef = useRef<CoreMonacoEditorRef>(null);

    useImperativeHandle(
      ref,
      (): SimpleCodeEditorRef => ({
        goToLine: (lineNumber: number, column?: number) => {
          coreRef.current?.goToLine(lineNumber);
          if (column !== undefined) {
            // CoreMonacoEditor currently only centers the line; focusing afterwards
            // keeps UX consistent until fine-grained column support is added.
            coreRef.current?.focus();
          }
        },
        focus: () => {
          coreRef.current?.focus();
        }
      }),
      []
    );

    // Derive Monaco language id
    const monacoLanguageId = typeof language === "string" ? language : language.id;

    return (
      <CoreMonacoEditor
        ref={coreRef}
        value={code}
        language={monacoLanguageId}
        onChange={onCodeChange}
        onSyntaxErrorsChange={onSyntaxErrorsChange as any}
        height={height}
        theme={theme}
      />
    );
  }
);

SimpleCodeEditor.displayName = "SimpleCodeEditor";

export default SimpleCodeEditor;