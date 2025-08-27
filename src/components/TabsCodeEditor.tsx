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
}

const TabsCodeEditor: React.FC<TabsCodeEditorProps> = ({
  files,
  onFileContentChange,
  onRemoveFile,
  activeFileId,
  onActiveFileChange,
  onSyntaxErrors,
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
    const timeouts: Record<string, NodeJS.Timeout> = {};
    
    files.forEach(file => {
      if (timeouts[file.id]) {
        clearTimeout(timeouts[file.id]);
      }
      
      timeouts[file.id] = setTimeout(() => {
        checkSyntaxForFile(file);
      }, 1000); // 1 second debounce
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [files, onSyntaxErrors]);

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
            <CodeEditorWithLineNumbers
              code={file.content}
              language={file.language}
              onChange={(newContent) => onFileContentChange(file.id, newContent)}
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

interface CodeEditorWithLineNumbersProps {
  code: string;
  language: ProgrammingLanguage;
  onChange: (value: string) => void;
}

// Color mapping for simple syntax highlighting
const getColorClass = (token: string): string => {
  if (token.match(/^(import|from|def|class|if|else|return|while|for|try|except|with|as|break|continue|pass|raise|yield|assert|del|global|nonlocal|lambda|True|False|None)$/)) {
    return "text-code-blue"; // Keywords
  } else if (token.match(/^".+"$/) || token.match(/^'.+'$/) || token.match(/^""".*"""$/) || token.match(/^'''.*'''$/)) {
    return "text-code-green"; // Strings
  } else if (token.match(/^[0-9]+$/)) {
    return "text-code-yellow"; // Numbers
  } else if (token.match(/^#.+$/)) {
    return "text-muted-foreground"; // Comments
  }
  return ""; // Default color
};

const CodeEditorWithLineNumbers: React.FC<CodeEditorWithLineNumbersProps> = ({
  code,
  language,
  onChange,
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineCountRef = useRef<HTMLDivElement>(null);
  
  // Update line numbers when code changes
  useEffect(() => {
    const lineCount = code.split('\n').length;
    const newLines = Array.from({ length: lineCount }, (_, i) => String(i + 1));
    setLines(newLines);
    
    // Sync scroll position between line numbers and code
    if (editorRef.current && lineCountRef.current) {
      const handleScroll = () => {
        if (lineCountRef.current && editorRef.current) {
          lineCountRef.current.scrollTop = editorRef.current.scrollTop;
        }
      };
      
      editorRef.current.addEventListener('scroll', handleScroll);
      return () => {
        editorRef.current?.removeEventListener('scroll', handleScroll);
      };
    }
  }, [code]);
  
  // Handle keyboard shortcuts and special keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const editor = e.currentTarget;
    
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      
      // Insert tab at cursor position
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
          ensureCursorVisible(editorRef.current);
        }
      }, 0);
    }
    
    // Ctrl+Home: Go to top
    else if (e.ctrlKey && e.key === 'Home') {
      e.preventDefault();
      scrollToTop(editor);
      editor.setSelectionRange(0, 0);
    }
    
    // Ctrl+End: Go to bottom
    else if (e.ctrlKey && e.key === 'End') {
      e.preventDefault();
      scrollToBottom(editor);
      const lastPosition = code.length;
      editor.setSelectionRange(lastPosition, lastPosition);
    }
    
    // Ctrl+A: Select all
    else if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      editor.setSelectionRange(0, code.length);
    }
    
    // Ctrl+Z: Basic undo (browser default)
    // Ctrl+Y: Basic redo (browser default)
    
    // Alt+Up/Down: Move lines up/down
    else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const lines = code.split('\n');
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      
      // Find current line
      let currentLine = 0;
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          currentLine = i;
          break;
        }
        charCount += lines[i].length + 1; // +1 for \n
      }
      
      if (e.key === 'ArrowUp' && currentLine > 0) {
        // Move line up
        const temp = lines[currentLine];
        lines[currentLine] = lines[currentLine - 1];
        lines[currentLine - 1] = temp;
        onChange(lines.join('\n'));
      } else if (e.key === 'ArrowDown' && currentLine < lines.length - 1) {
        // Move line down
        const temp = lines[currentLine];
        lines[currentLine] = lines[currentLine + 1];
        lines[currentLine + 1] = temp;
        onChange(lines.join('\n'));
      }
    }
    
    // Ensure cursor stays visible after navigation
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) {
      setTimeout(() => {
        if (editorRef.current) {
          ensureCursorVisible(editorRef.current);
        }
      }, 0);
    }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col bg-code overflow-hidden">
      <div className="px-4 py-2 bg-code flex items-center justify-between border-b border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{language.name}</span>
          <span className="opacity-50">{language.fileExtension}</span>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div 
          ref={lineCountRef}
          className="bg-code border-r border-border px-2 py-1 text-muted-foreground text-right select-none overflow-hidden sticky-line-numbers"
          style={{ 
            width: '4rem', 
            backgroundColor: 'rgb(30, 30, 30)',
            fontSize: '12px',
            lineHeight: '1.5',
            flexShrink: 0,
            overflowX: 'hidden',
            overflowY: 'hidden'
          }}
        >
          {lines.map((line, i) => (
            <div key={i} className="leading-6 text-xs py-0.5 min-h-[24px] flex items-center justify-end pr-2">
              {line}
            </div>
          ))}
        </div>
        
        {/* Code editor */}
        <div className="relative flex-1 overflow-hidden">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="code-editor-container code-editor-enhanced p-4 bg-code text-code-foreground focus:outline-none w-full h-full font-mono resize-none custom-scrollbar"
            style={{ 
              resize: 'none',
              tabSize: 2,
              lineHeight: 1.5,
              whiteSpace: 'pre',
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
              backgroundColor: 'hsl(var(--code))',
              color: 'hsl(var(--code-foreground))',
              overflowX: 'auto',
              overflowY: 'auto',
              overflowWrap: 'normal',
              wordBreak: 'normal',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) rgba(40, 40, 40, 0.3)',
              minHeight: '100%',
              // Enhanced scrolling
              scrollBehavior: 'smooth',
              // Better text rendering
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
          />
        </div>

        {/* Success indicator (green checkmark) */}
        <div className="absolute right-4 top-2 text-green-500">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TabsCodeEditor;
