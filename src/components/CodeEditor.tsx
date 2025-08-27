
import React, { useState, useRef, useEffect } from "react";
import { ProgrammingLanguage } from "@/types";
import { FileCode, FileText, AlertCircle } from "lucide-react";
import SimpleCodeEditor, { SimpleCodeEditorRef } from "@/components/SimpleCodeEditor";

import { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
  onSyntaxErrorsChange?: SyntaxAnalysisResult[];
  webContent?: {
    html: string;
    css: string;
    js: string;
    onChangeHtml: (value: string) => void;
    onChangeCss: (value: string) => void;
    onChangeJs: (value: string) => void;
  };
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onSyntaxErrorsChange,
  webContent
}) => {
  const editorRef = useRef<SimpleCodeEditorRef>(null);

  // Generate default placeholder instructions based on language
  const getDefaultInstructions = () => {
    const langId = language.id;
    if (langId === "python" || langId === "python3") {
      return "# Start by importing necessary modules\n# Use proper indentation for blocks\n\n";
    } else if (langId === "pythonml" || langId === "pytorch" || langId === "tensorflow") {
      return "# Import data science libraries (numpy, pandas, etc.)\n# Initialize models with appropriate parameters\n\n";
    } else if (langId === "java" || langId === "java19") {
      return "// Define a class with proper access modifiers\n// Include a main method to run your program\n\n";
    } else if (langId === "javascript" || langId === "nodejs") {
      return "// Initialize variables with const or let\n// Use modern ES6+ syntax when possible\n\n";
    } else if (langId === "c" || langId === "cpp" || langId === "csharp") {
      return "// Include necessary header files\n// Remember to free allocated memory\n\n";
    } else if (langId === "go") {
      return "// Import required packages\n// Define proper error handling\n\n";
    } else if (langId === "shell" || langId === "bash") {
      return "#!/bin/bash\n# Use proper file permissions\n# Handle command errors with proper exit codes\n\n";
    } else {
      return "// Write your code here\n// Follow best practices for this language\n\n";
    }
  };

  // Use instructions if code is empty
  const displayedCode = code.trim() === "" ? getDefaultInstructions() : code;
  
  if (language.id === "web" && webContent) {
    return <WebCodeEditor html={webContent.html} css={webContent.css} js={webContent.js} onChangeHtml={webContent.onChangeHtml} onChangeCss={webContent.onChangeCss} onChangeJs={webContent.onChangeJs} />;
  }
  
  return (
    <div className="relative w-full h-full rounded-md bg-code overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-code border-b border-border">
        <div className="flex items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {language.name}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {language.fileExtension}
          </span>
        </div>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-code-red"></div>
          <div className="w-3 h-3 rounded-full bg-code-yellow"></div>
          <div className="w-3 h-3 rounded-full bg-code-green"></div>
        </div>
      </div>
      <SimpleCodeEditor
        ref={editorRef}
        code={displayedCode}
        language={language.id}
        onCodeChange={onChange}
        height="calc(100% - 2.5rem)"
        theme="vs-dark"
        onSyntaxErrorsChange={onSyntaxErrorsChange}
      />
    </div>
  );
};

interface WebCodeEditorProps {
  html: string;
  css: string;
  js: string;
  onChangeHtml: (value: string) => void;
  onChangeCss: (value: string) => void;
  onChangeJs: (value: string) => void;
}

const WebCodeEditor: React.FC<WebCodeEditorProps> = ({
  html,
  css,
  js,
  onChangeHtml,
  onChangeCss,
  onChangeJs
}) => {


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 mb-2">
        <h3 className="text-lg font-semibold mb-1">HTML</h3>
        <div className="relative w-full h-[calc(33%-0.5rem)] rounded-md bg-code overflow-hidden border border-border">
          <SimpleCodeEditor
            code={html}
            language="html"
            onCodeChange={onChangeHtml}
            height="100%"
            theme="vs-dark"
          />
        </div>
      </div>
      <div className="flex-1 mb-2">
        <h3 className="text-lg font-semibold mb-1">CSS</h3>
        <div className="relative w-full h-[calc(33%-0.5rem)] rounded-md bg-code overflow-hidden border border-border">
          <SimpleCodeEditor
            code={css}
            language="css"
            onCodeChange={onChangeCss}
            height="100%"
            theme="vs-dark"
          />
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1">JavaScript</h3>
        <div className="relative w-full h-[calc(33%-0.5rem)] rounded-md bg-code overflow-hidden border border-border">
          <SimpleCodeEditor
            code={js}
            language="javascript"
            onCodeChange={onChangeJs}
            height="100%"
            theme="vs-dark"
          />
        </div>
      </div>
    </div>
  );
};
