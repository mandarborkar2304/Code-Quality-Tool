import React, { useState, useRef, useEffect } from "react";
import { ProgrammingLanguage } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileCode, X, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SyntaxError, SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";
import { realtimeSyntaxAnalyzer } from "@/utils/realtimeSyntaxAnalyzer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ensureCursorVisible, 
  scrollToTop,
  scrollToBottom 
} from "@/utils/editorScrollUtils";
import { CodeEditor } from "./CodeEditor";

export interface CodeFile {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  content: string;
}

interface TabsCodeEditorProps {
  files: CodeFile[];
  onFileContentChange: (fileId: string, newContent: string) => void;
  onRemoveFile?: (fileId: string) => void;
  activeFileId: string;
  onActiveFileChange: (fileId: string) => void;
  onSyntaxErrors?: (fileId: string, errors: SyntaxAnalysisResult) => void;
  hasBorderOutline?: boolean;
}

const TabsCodeEditor: React.FC<TabsCodeEditorProps> = ({
  files,
  onFileContentChange,
  onRemoveFile,
  activeFileId,
  onActiveFileChange,
  onSyntaxErrors,
  hasBorderOutline = false,
}) => {
  const [syntaxErrors, setSyntaxErrors] = useState<Record<string, SyntaxAnalysisResult>>({});
  const [checkingFiles, setCheckingFiles] = useState<Set<string>>(new Set());

  // Debounced syntax checking
  useEffect(() => {
    const checkSyntaxForFile = async (file: CodeFile) => {
      if (!file.content.trim()) return;

      const newCheckingFiles = new Set(checkingFiles);
      newCheckingFiles.add(file.id);
      setCheckingFiles(newCheckingFiles);

      try {
        const result = await realtimeSyntaxAnalyzer.analyze(file.content, file.language);
        
        setSyntaxErrors(prev => ({
          ...prev,
          [file.id]: result
        }));

        if (onSyntaxErrors) {
          onSyntaxErrors(file.id, result);
        }
      } catch (error) {
        console.error('Syntax check failed for file:', file.id, error);
      } finally {
        const updatedCheckingFiles = new Set(checkingFiles);
        updatedCheckingFiles.delete(file.id);
        setCheckingFiles(updatedCheckingFiles);
        }
    };

    // Debounce syntax checking
    const currentFileTimeouts: Record<string, NodeJS.Timeout> = {};

    files.forEach(file => {
      if (currentFileTimeouts[file.id]) {
        clearTimeout(currentFileTimeouts[file.id]);
      }
      
      currentFileTimeouts[file.id] = setTimeout(() => {
        checkSyntaxForFile(file);
      }, 1000); // 1 second debounce
    });

    return () => {
      Object.values(currentFileTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [files, onSyntaxErrors, checkingFiles]);

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-code text-muted-foreground">
        <p>No files to display</p>
      </div>
    );
  }

  const activeFile = files.find(file => file.id === activeFileId) || files[0];

  return (
    <Tabs
      value={activeFileId}
      onValueChange={onActiveFileChange}
      className="h-full flex flex-col"
    >
      <div className="border-b border-border bg-muted min-h-0 flex-shrink-0">
        <TabsList className="h-10 bg-muted w-full flex overflow-x-auto overflow-y-hidden scrollbar-thin whitespace-nowrap">
          {files.map((file) => (
            <TabsTrigger
              key={file.id}
              value={file.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-r border-border relative flex-shrink-0",
                "data-[state=active]:bg-code data-[state=active]:text-foreground",
                "hover:bg-code/50 transition-colors",
                file.id === activeFileId ? 
                  "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 
                  "text-muted-foreground"
              )}
            >
              <FileCode className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap truncate max-w-[150px]">{file.name}</span>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive ml-1 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {files.map((file) => (
          <TabsContent
            key={file.id}
            value={file.id}
            className="h-full data-[state=active]:flex data-[state=inactive]:hidden m-0 p-0"
          >
            <CodeEditor
              code={file.content}
              language={file.language}
              onChange={(newContent) => onFileContentChange(file.id, newContent)}
              onSyntaxErrorsChange={syntaxErrors[file.id] ? [syntaxErrors[file.id]] : []}
              hasBorderOutline={hasBorderOutline}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );




};

export default TabsCodeEditor;
