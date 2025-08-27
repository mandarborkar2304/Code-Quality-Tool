import { useState, useEffect, useRef } from "react";
import { CodeAnalysis, ProgrammingLanguage } from "@/types";
import { analyzeCode } from "@/utils/codeAnalysis";
import { programmingLanguages } from "@/data/languages";
import { suggestLanguage } from "@/utils/languageDetection";

import { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";
import { realtimeSyntaxAnalyzer } from "@/utils/realtimeSyntaxAnalyzer";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import AnalysisPanel from "@/components/AnalysisPanel";
import { fetchComprehensiveAnalysis } from "./api/groqComprehensiveAnalysisAPI";
import SimpleCodeEditor, { SimpleCodeEditorRef } from "@/components/SimpleCodeEditor";
import CoreMonacoEditor from "@/components/CoreMonacoEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, AlertCircle } from "lucide-react";
import TestCaseDisplay from "@/components/TestCaseDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  handleError,
  createApiError,
  createAnalysisError,
  createSyntaxError,
  tryCatch
} from "@/utils/errorHandling";

// Utility to get default instructions for a language (mirrors CodeEditor)
function getDefaultInstructions(langId: string) {
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
}

const Editor = () => {
  const [activeTab, setActiveTab] = useState("code");
  const [code, setCode] = useState("");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecheckingSyntax, setIsRecheckingSyntax] = useState(false);
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(programmingLanguages.find(lang => lang.id === 'plaintext') || programmingLanguages[0]);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxAnalysisResult[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]); // Assuming 'any[]' for now, adjust if 'TestCase' type is available
  const lastDetectedLang = useRef(selectedLanguage.id);
  const editorRef = useRef<SimpleCodeEditorRef>(null);

  const handleSyntaxErrorClick = (lineNumber: number, column?: number) => {
    if (editorRef.current) {
      editorRef.current.goToLine(lineNumber);
    }
  };

  const handleReset = () => {
    setCode("");
    setTestCases([]);
    setAnalysis(null);
    toast({
      title: "Reset Complete",
      description: "All code has been cleared.",
    });
  };

  const handleAnalyzeCode = async () => {
    const codeToAnalyze = code;

    if (
      !codeToAnalyze.trim() ||
      codeToAnalyze.trim() === getDefaultInstructions(selectedLanguage.id).trim()
    ) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    setSyntaxErrors([]); // Clear previous syntax errors
    
    try {
      // Comprehensive Analysis
      const analysisResult = await tryCatch(
        async () => {
          const result = await fetchComprehensiveAnalysis(codeToAnalyze, selectedLanguage.id);
          if (!result) {
            throw createAnalysisError(
              "Analysis failed to produce results", 
              { language: selectedLanguage.id },
              () => handleAnalyzeCode()
            );
          }
          return result;
        },
        null // Fallback value if analysis fails
      );
      
      if (analysisResult) {
        setAnalysis(analysisResult);
        toast({
          title: "Comprehensive Analysis Complete",
          description: "Your code has been comprehensively analyzed.",
        });
      }



    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecheckSyntax = async () => {
    const codeToAnalyze = code;

    if (
      !codeToAnalyze.trim() ||
      codeToAnalyze.trim() === getDefaultInstructions(selectedLanguage.id).trim()
    ) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to recheck syntax.",
        variant: "destructive",
      });
      return;
    }

    setIsRecheckingSyntax(true);
    setSyntaxErrors([]); // Clear previous syntax errors

    try {
      const syntaxResult = await tryCatch(
        async () => {
          const result = await realtimeSyntaxAnalyzer.analyze(codeToAnalyze, selectedLanguage);
          if (!result) {
            throw createSyntaxError(
              "Syntax check failed to produce results",
              { language: selectedLanguage.id },
              () => handleRecheckSyntax() // Recheck button will call this
            );
          }
          return result;
        },
        null // Fallback value if syntax check fails
      );

      if (syntaxResult) {
        setSyntaxErrors([syntaxResult]); // Pass the full SyntaxAnalysisResult[]
      } else {
        setSyntaxErrors([]);
      }
    } finally {
      setIsRecheckingSyntax(false);
    }
  };

  const handleRunJudge = async () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please enter some code to run the judge.",
        variant: "destructive",
      });
      return;
    }

    if (testCases.length === 0) {
      toast({
        title: "No Test Cases",
        description: "Please generate test cases first.",
        variant: "destructive",
      });
      return;
    }



    let allTestsPassed = true;
    for (const testCase of testCases) {
      try {
        const response = await fetch("/.netlify/functions/groq-judge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: selectedLanguage.id,
            code: code,
            stdin: testCase.input,
            expected_output: testCase.expected_output,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        // Update the specific test case with actual output and status
        testCase.actual_output = result.actual_output;
        testCase.status = result.status;
        testCase.verdict_message = result.verdict_message;

        if (result.status !== "Pass") {
          allTestsPassed = false;
        }

      } catch (error) {
        console.error("Error running judge for test case:", testCase, error);
        testCase.status = "Fail";
        testCase.verdict_message = `Error: ${error instanceof Error ? error.message : String(error)}`;
        allTestsPassed = false;
      }
    }

    setTestCases([...testCases]); // Trigger re-render

    if (allTestsPassed) {
      
      toast({
        title: "All Tests Passed",
        description: "All generated test cases passed successfully.",
        variant: "default",
      });
    } else {
      
      toast({
        title: "Tests Failed",
        description: "Some test cases did not pass.",
        variant: "destructive",
      });
    }
  };



  // Auto-detect language on code change (debounced) - Fully automated
  useEffect(() => {
    if (!code.trim()) return;
    const handler = setTimeout(() => {
      const detection = suggestLanguage(code);
      if (
        detection.detectedLanguage &&
        detection.detectedLanguage.id !== selectedLanguage.id &&
        detection.confidence > 60 && // Lowered threshold for more aggressive detection
        detection.detectedLanguage.id !== lastDetectedLang.current
      ) {
        setSelectedLanguage(detection.detectedLanguage);
        lastDetectedLang.current = detection.detectedLanguage.id;
        toast({
          title: "Language Auto-Detected",
          description: `Automatically switched to ${detection.detectedLanguage.name} (${detection.confidence}% confidence)`,
          duration: 3000
        });
      }
    }, 300); // Faster detection
    return () => clearTimeout(handler);
  }, [code, selectedLanguage.id, toast]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if not in an input field or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Ctrl+Shift+Enter or Cmd+Shift+Enter to analyze code (changed from Ctrl+Enter to avoid conflicts)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter' && !isAnalyzing && code.trim()) {
        e.preventDefault();
        handleAnalyzeCode();
      }
      
      // Ctrl+Shift+R or Cmd+Shift+R to reset (changed from Ctrl+R to avoid browser refresh conflict)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        handleReset();
      }
      
      // Ctrl+Shift+S or Cmd+Shift+S to run judge (new shortcut for test cases)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        if (activeTab === "test-cases" && testCases.length > 0 && code.trim()) {
          handleRunJudge();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [code, isAnalyzing, activeTab, testCases]);






  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex flex-col flex-1 p-4 overflow-hidden min-h-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.03]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-orange-500/3 to-orange-400/5"></div>
        </div>

        <div className="flex flex-1 gap-4 h-full overflow-hidden min-h-0">
          {/* Editor Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
            <div className="flex flex-col h-full min-h-0">
              {/* Top Controls - Consolidated Toolbar */}
              <div className="flex items-center justify-between border-b px-4 py-2 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <LanguageSelector
                    languages={programmingLanguages}
                    selected={selectedLanguage}
                    onSelect={setSelectedLanguage}
                    code={code}
                    autoDetect={true}
                    onAutoDetect={(result) => {
                      if (result.confidence > 70 && result.detectedLanguage.id !== selectedLanguage.id) {
                        setSelectedLanguage(result.detectedLanguage);
                        toast({
                          title: "Language Auto-Detected",
                          description: `Switched to ${result.detectedLanguage.name} (${result.confidence}% confidence)`,
                        });
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {activeTab === "test-cases" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleRunJudge}
                      disabled={testCases.length === 0 || !code.trim()}
                      className="gap-1 text-xs px-2 py-1 h-8"
                    >
                      Compile & Run
                      <span className="hidden sm:inline ml-1 opacity-60">(Ctrl+Shift+S)</span>
                    </Button>
                  )}


                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAnalyzeCode}
                    disabled={isAnalyzing}
                    className="gap-1 text-xs px-2 py-1 h-8"
                    data-test-id="analyze-code-button"
                  >
                    <Brain className="h-3 w-3" />
                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                    <span className="hidden sm:inline ml-1 opacity-60">(Ctrl+Shift+Enter)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1 text-xs px-2 py-1 h-8"
                    data-test-id="reset-button"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                    <span className="hidden sm:inline ml-1 opacity-60">(Ctrl+Shift+R)</span>
                  </Button>
                </div>
              </div>
              
              {/* Code Editor */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Tabs defaultValue="code" className="flex flex-col h-full min-h-0" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                    <TabsTrigger value="code">Code Editor</TabsTrigger>
                    <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
                  </TabsList>
                  <TabsContent value="code" className="mt-0 p-0 flex flex-col flex-1 min-h-0 data-[state=inactive]:hidden overflow-hidden">
                    <CoreMonacoEditor
                       value={code}
                       onChange={setCode}
                       onSyntaxErrorsChange={syntaxErrors}
                       language={selectedLanguage.id}
                       ref={editorRef}
                     options={{
                       readOnly: false,
                     }}
                   />
                  </TabsContent>
                  <TabsContent value="test-cases" className="mt-0 p-0 flex flex-col flex-1 min-h-0 data-[state=inactive]:hidden overflow-hidden">
                    <TestCaseDisplay
                      testCases={testCases}
                      setTestCases={setTestCases}
                    />
                  </TabsContent>
                </Tabs>

              </div>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl shadow-lg border-2 border-orange-400 dark:border-orange-500 overflow-hidden flex flex-col min-h-0">
            <AnalysisPanel
              analysis={analysis}
              language={selectedLanguage.id}
              onApplyCorrection={(correctedCode) => setCode(correctedCode)}
              isAnalyzing={isRecheckingSyntax}
              onSyntaxErrorClick={handleSyntaxErrorClick}
              syntaxErrors={syntaxErrors.flatMap(result => result.errors)} // Pass the errors array
              onReanalyze={handleRecheckSyntax}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Editor;
