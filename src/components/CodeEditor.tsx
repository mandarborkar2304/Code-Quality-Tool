
import React, { useState, useRef, useEffect } from "react";
import { ProgrammingLanguage } from "@/types";
import { FileCode, FileText, AlertCircle } from "lucide-react";


import { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";
import MonacoEditor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
  onSyntaxErrorsChange?: SyntaxAnalysisResult[];
  options?: any;
  hasBorderOutline?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  // onSyntaxErrorsChange is removed since it's not used
  options,
  hasBorderOutline = false,
}) => {
  const editorRef = useRef<any>(null);

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
  

  
  return (
    <div className={`relative w-full h-full rounded-md bg-code overflow-hidden border ${hasBorderOutline ? 'border-orange-500' : 'border-border'}`}>
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
      <MonacoEditor
        onMount={(editor) => (editorRef.current = editor)}
        value={displayedCode}
        language={language.id}
        onChange={(value) => onChange(value || "")}
        height="calc(100% - 2.5rem)"
        theme="vs-dark"
        options={options}
      />
    </div>
  );
};
