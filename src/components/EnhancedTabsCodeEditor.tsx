import React, { useState, useEffect } from "react";
import { ProgrammingLanguage } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileCode, X, Plus, AlertCircle, TestTube, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SyntaxAnalysisResult } from "@/utils/syntaxAnalyzer";
import { realtimeSyntaxAnalyzer } from "@/utils/realtimeSyntaxAnalyzer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CoreMonacoEditor from "./CoreMonacoEditor";
import { TestCase, generateTestCases, simulateExecution } from "@/pages/api/groqTestAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export interface CodeFile {
  id: string;
  name: string;
  language: ProgrammingLanguage;
  content: string;
}

interface EnhancedTabsCodeEditorProps {
  files: CodeFile[];
  onFileContentChange: (fileId: string, newContent: string) => void;
  onRemoveFile?: (fileId: string) => void;
  activeFileId: string;
  onActiveFileChange: (fileId: string) => void;
  onSyntaxErrorsForFile?: (fileId: string, errors: SyntaxAnalysisResult) => void;
  onAddFile?: () => void;
}

const EnhancedTabsCodeEditor: React.FC<EnhancedTabsCodeEditorProps> = ({
  files,
  onFileContentChange,
  onRemoveFile,
  activeFileId,
  onActiveFileChange,
  onSyntaxErrorsForFile,
  onAddFile,
}) => {
  const [syntaxErrors, setSyntaxErrors] = useState<Record<string, SyntaxAnalysisResult>>({});
  const [checkingFiles, setCheckingFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"code" | "tests">("code");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [executingTests, setExecutingTests] = useState<Set<number>>(new Set());
  const [isExecutingAllTests, setIsExecutingAllTests] = useState(false);

  // Manual syntax checking function
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

      if (onSyntaxErrorsForFile) {
        onSyntaxErrorsForFile(file.id, result);
      }
    } catch (error) {
      console.error('Syntax check failed for file:', file.id, error);
    } finally {
      const updatedCheckingFiles = new Set(checkingFiles);
      updatedCheckingFiles.delete(file.id);
      setCheckingFiles(updatedCheckingFiles);
    }
  };

  // Check syntax for active file
  const handleCheckSyntax = () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (activeFile) {
      checkSyntaxForFile(activeFile);
    }
  };

  // Generate test cases for the active file with improved intelligence
  const handleGenerateTests = async () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile || !activeFile.content.trim()) {
      toast.error("Please enter some code before generating tests");
      return;
    }

    setIsGeneratingTests(true);
    try {
      // Show a toast to indicate the process has started
      toast.info("Analyzing code and generating intelligent test cases...");
      
      // Generate test cases with the code and language
      const newTestCases = await generateTestCases(activeFile.content, activeFile.language.id);
      
      // Auto-execute the first test case if available
      if (newTestCases.length > 0) {
        // Prepare the test cases
        setTestCases(newTestCases);
        setActiveTab("tests");
        
        // Auto-execute the first test case after a short delay
        setTimeout(async () => {
          try {
            const result = await simulateExecution(
              activeFile.content,
              newTestCases[0].input,
              activeFile.language.id
            );
            
            // Check if we should compare exception or output
            let passed = false;
            if (newTestCases[0].expectedExceptionType) {
              // If we expect an exception, check if the actual exception matches
              passed = result.exceptionType !== null && 
                (result.exceptionType === newTestCases[0].expectedExceptionType || 
                 result.exceptionType.includes(newTestCases[0].expectedExceptionType));
            } else {
              // Otherwise compare the output
              passed = compareOutputs(result.output, newTestCases[0].expectedOutput.trim());
            }
            
            // Update test case with results
            const updatedTestCases = [...newTestCases];
            updatedTestCases[0] = {
              ...newTestCases[0],
              actualOutput: result.output,
              actualExceptionType: result.exceptionType,
              actualExceptionMessage: result.exceptionMessage,
              passed
            };
            setTestCases(updatedTestCases);
            
            // Show result toast
            if (passed) {
              toast.success("First test case passed automatically!");
            } else {
              toast.warning("First test case executed but didn't match expected output");
            }
          } catch (error) {
            console.error("Auto-execution failed:", error);
          }
        }, 1000);
      }
      
      toast.success(`Generated ${newTestCases.length} intelligent test cases`);
    } catch (error) {
      console.error("Failed to generate test cases:", error);
      toast.error("Failed to generate test cases");
    } finally {
      setIsGeneratingTests(false);
    }
  };

  // Execute a single test case with intelligent input/output handling
  const executeTestCase = async (index: number) => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;

    const testCase = testCases[index];
    const newExecutingTests = new Set(executingTests);
    newExecutingTests.add(index);
    setExecutingTests(newExecutingTests);

    try {
      // Preprocess input based on language and code structure
      let processedInput = testCase.input;
      
      // Detect if the code expects JSON input
      const expectsJsonInput = activeFile.content.includes('JSON.parse') || 
                              (activeFile.language.id === 'javascript' && activeFile.content.match(/parse\s*\(/));
      
      // Detect if the code expects array input
      const expectsArrayInput = activeFile.content.includes('.split') || 
                               activeFile.content.match(/\[\s*\d+\s*,/);
      
      // Intelligently format input based on detected patterns
      if (expectsJsonInput && !testCase.input.trim().startsWith('{') && !testCase.input.trim().startsWith('[')) {
        try {
          // Try to convert to JSON if it looks like it should be JSON
          const jsonObj = { input: testCase.input };
          processedInput = JSON.stringify(jsonObj);
        } catch (e) {
          // Keep original if conversion fails
          console.log("JSON conversion failed, using original input");
        }
      } else if (expectsArrayInput && !testCase.input.includes('[') && testCase.input.includes(',')) {
        // Format as array if it looks like comma-separated values
        processedInput = `[${testCase.input}]`;
      }
      
      // Execute with processed input
      const result = await simulateExecution(
        activeFile.content,
        processedInput,
        activeFile.language.id
      );

      // Intelligently process output
      let processedOutput = result.output;
      
      // Try to detect and format JSON output
      if (processedOutput.startsWith('{') || processedOutput.startsWith('[')) {
        try {
          const jsonOutput = JSON.parse(processedOutput);
          processedOutput = JSON.stringify(jsonOutput, null, 2); // Pretty print
        } catch (e) {
          // Not valid JSON, keep as is
        }
      }

      // Determine if test passed based on expected output or expected exception
      let passed = false;
      
      if (testCase.expectedExceptionType) {
        // If we expect an exception, check if the actual exception matches
        passed = result.exceptionType !== null && 
          (result.exceptionType === testCase.expectedExceptionType || 
           result.exceptionType.includes(testCase.expectedExceptionType));
      } else {
        // Otherwise compare the output
        passed = compareOutputs(processedOutput, testCase.expectedOutput.trim());
      }

      // Update test case with results
      const updatedTestCases = [...testCases];
      updatedTestCases[index] = {
        ...testCase,
        actualOutput: processedOutput,
        actualExceptionType: result.exceptionType,
        actualExceptionMessage: result.exceptionMessage,
        passed
      };
      setTestCases(updatedTestCases);

      // Show toast notification with more details
      if (passed) {
        toast.success(`Test case ${index + 1} passed successfully!`);
      } else {
        toast.error(`Test case ${index + 1} failed. Check output for details.`);
      }
    } catch (error) {
      console.error("Test execution failed:", error);
      toast.error(`Failed to execute test case ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Update test case with error information
      const updatedTestCases = [...testCases];
      updatedTestCases[index] = {
        ...testCase,
        actualOutput: `Error: ${error instanceof Error ? error.message : 'Execution failed'}`,
        passed: false
      };
      setTestCases(updatedTestCases);
    } finally {
      const updatedExecutingTests = new Set(executingTests);
      updatedExecutingTests.delete(index);
      setExecutingTests(updatedExecutingTests);
    }
  };

  // Execute all test cases
  const executeAllTestCases = async () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile || testCases.length === 0) return;

    setIsExecutingAllTests(true);
    try {
      for (let i = 0; i < testCases.length; i++) {
        await executeTestCase(i);
      }
      toast.success("All test cases executed");
    } catch (error) {
      console.error("Failed to execute all test cases:", error);
      toast.error("Failed to execute all test cases");
    } finally {
      setIsExecutingAllTests(false);
    }
  };

  // Enhanced intelligent output comparison
  const compareOutputs = (actual: string, expected: string): boolean => {
    // Exact match
    if (actual === expected) return true;
    
    // Normalize whitespace and compare
    const normalizedActual = actual.replace(/\s+/g, ' ').trim();
    const normalizedExpected = expected.replace(/\s+/g, ' ').trim();
    if (normalizedActual === normalizedExpected) return true;
    
    // Try parsing as numbers for numeric comparison
    const actualNum = parseFloat(actual);
    const expectedNum = parseFloat(expected);
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      return Math.abs(actualNum - expectedNum) < 0.0001; // Small tolerance for floating point
    }
    
    // Case-insensitive comparison
    if (actual.toLowerCase() === expected.toLowerCase()) return true;
    
    // Try comparing as JSON
    try {
      const actualJson = JSON.parse(actual);
      try {
        const expectedJson = JSON.parse(expected);
        // Deep compare JSON objects
        return JSON.stringify(actualJson) === JSON.stringify(expectedJson);
      } catch (e) {
        // Expected is not valid JSON
      }
    } catch (e) {
      // Actual is not valid JSON
    }
    
    // Try comparing as arrays
    if (actual.includes(',') && expected.includes(',')) {
      const actualArray = actual.split(',').map(item => item.trim());
      const expectedArray = expected.split(',').map(item => item.trim());
      
      if (actualArray.length === expectedArray.length) {
        return actualArray.every((item, index) => {
          const expectedItem = expectedArray[index];
          // Try numeric comparison for each item
          const actualNum = parseFloat(item);
          const expectedNum = parseFloat(expectedItem);
          if (!isNaN(actualNum) && !isNaN(expectedNum)) {
            return Math.abs(actualNum - expectedNum) < 0.0001;
          }
          return item.toLowerCase() === expectedItem.toLowerCase();
        });
      }
    }
    
    // Check if the expected output is contained within the actual output
    if (normalizedActual.includes(normalizedExpected)) return true;
    
    // Check if the actual output is contained within the expected output
    if (normalizedExpected.includes(normalizedActual)) return true;
    
    return false;
  };

  // Update a test case
  const updateTestCase = (index: number, updates: Partial<TestCase>) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      ...updates
    };
    setTestCases(updatedTestCases);
  };

  // Add a new test case
  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        input: "",
        expectedOutput: "",
        executionDetails: "Custom test case",
        actualOutput: "",
        passed: undefined,
        expectedExceptionType: null,
        expectedExceptionMessage: null,
        actualExceptionType: null,
        actualExceptionMessage: null
      }
    ]);
  };

  // Delete a test case
  const deleteTestCase = (index: number) => {
    const updatedTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(updatedTestCases);
  };

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-code text-muted-foreground">
        <p>No files to display</p>
      </div>
    );
  }

  const activeFile = files.find(file => file.id === activeFileId) || files[0];
  const fileErrors = syntaxErrors[activeFileId]?.errors || [];
  // Filter warnings from errors array
  const fileWarnings = fileErrors.filter(err => err.severity === 'warning');
  const formattedErrors = [
    ...fileErrors.filter(err => err.severity === 'error').map(err => ({ ...err, severity: 'error' as const })),
    ...fileWarnings.map(err => ({ ...err, severity: 'warning' as const }))
  ];

  const passedTests = testCases.filter(tc => tc.passed).length;
  const totalTests = testCases.length;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-muted min-h-0 flex-shrink-0">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onActiveFileChange(file.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 border-r border-border relative flex-shrink-0 cursor-pointer",
                    "hover:bg-code/50 transition-colors",
                    file.id === activeFileId ? 
                      "bg-code text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : 
                      "text-muted-foreground"
                  )}
                >
                  <FileCode className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap truncate max-w-[150px]">{file.name}</span>
                  {syntaxErrors[file.id] && syntaxErrors[file.id].errors.length > 0 && (
                    <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                  )}
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
                </div>
              ))}
              {onAddFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddFile}
                  className="h-10 px-3 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add File
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckSyntax}
                    disabled={checkingFiles.has(activeFileId)}
                    className="gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {checkingFiles.has(activeFileId) ? 'Checking...' : 'Check Syntax'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Check syntax for current file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateTests}
                    disabled={isGeneratingTests}
                    className="gap-1"
                  >
                    <TestTube className="h-4 w-4" />
                    {isGeneratingTests ? 'Generating...' : 'Generate Tests'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate test cases for current file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "tests")} className="flex-1 flex flex-col">
        <div className="border-b border-border bg-muted">
          <TabsList className="h-8 bg-muted">
            <TabsTrigger value="code" className="h-8 px-4">Code</TabsTrigger>
            <TabsTrigger value="tests" className="h-8 px-4">
              Tests
              {totalTests > 0 && (
                <Badge variant="outline" className="ml-2 h-5 px-1">
                  {passedTests}/{totalTests}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="code" className="h-full m-0 p-0 data-[state=active]:flex data-[state=inactive]:hidden">
            <div className="w-full h-full">
              <CoreMonacoEditor
                value={activeFile.content}
                language={activeFile.language.id}
                onChange={(newContent) => onFileContentChange(activeFile.id, newContent)}
              />
            </div>
          </TabsContent>

          <TabsContent value="tests" className="h-full m-0 p-0 data-[state=active]:flex data-[state=inactive]:hidden">
            <div className="w-full h-full p-4">
              <Card className="w-full max-w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-blue-600" />
                      <span>Test Cases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addTestCase}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Test
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={executeAllTestCases}
                        disabled={isExecutingAllTests || testCases.length === 0}
                        className="gap-1"
                      >
                        {isExecutingAllTests ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                        Run All Tests
                      </Button>
                      {totalTests > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-sm px-2 py-1",
                            passedTests === totalTests && totalTests > 0
                              ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                          )}
                        >
                          {passedTests}/{totalTests} Passed
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {testCases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TestTube className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No test cases available.</p>
                      <p className="text-sm">Click "Generate Tests" to create test cases automatically.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                      {testCases.map((testCase, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all duration-200",
                            testCase.passed === true
                              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                              : testCase.passed === false
                              ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                              : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                          )}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">Test Case #{index + 1}</span>
                              <span className="text-sm text-muted-foreground">{testCase.executionDetails}</span>
                              {testCase.passed !== undefined && (
                                <Badge
                                  className={cn(
                                    "px-2 py-1",
                                    testCase.passed
                                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                  )}
                                >
                                  {testCase.passed ? "PASSED" : "FAILED"}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => executeTestCase(index)}
                                disabled={executingTests.has(index)}
                                className="gap-1"
                              >
                                {executingTests.has(index) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                                Run
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteTestCase(index)}
                                className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="mb-2">
                                <label className="text-sm font-medium">Input:</label>
                              </div>
                              <Textarea
                                placeholder="Enter test input..."
                                value={testCase.input}
                                onChange={(e) => updateTestCase(index, { 
                                  input: e.target.value,
                                  actualOutput: "",
                                  passed: undefined
                                })}
                                className="font-mono text-sm resize-none h-24 overflow-y-auto custom-scrollbar"
                              />
                            </div>

                            <div>
                              <div className="mb-2">
                                <label className="text-sm font-medium">Expected Output:</label>
                              </div>
                              <Textarea
                                placeholder="Enter expected output..."
                                value={testCase.expectedOutput}
                                onChange={(e) => updateTestCase(index, { 
                                  expectedOutput: e.target.value,
                                  actualOutput: "",
                                  passed: undefined
                                })}
                                className="font-mono text-sm resize-none h-24 overflow-y-auto custom-scrollbar"
                              />
                            </div>
                          </div>
                          
                          {/* Exception handling fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <div className="mb-2 flex items-center">
                                <label className="text-sm font-medium">Expected Exception Type:</label>
                                <span className="text-xs text-muted-foreground ml-2">(Leave empty if no exception expected)</span>
                              </div>
                              <input
                                type="text"
                                placeholder="e.g., NullPointerException"
                                value={testCase.expectedExceptionType || ''}
                                onChange={(e) => updateTestCase(index, { 
                                  expectedExceptionType: e.target.value || null,
                                  actualOutput: "",
                                  passed: undefined
                                })}
                                className="w-full p-2 font-mono text-sm border rounded"
                              />
                            </div>

                            <div>
                              <div className="mb-2">
                                <label className="text-sm font-medium">Expected Exception Message:</label>
                              </div>
                              <input
                                type="text"
                                placeholder="e.g., Index out of bounds"
                                value={testCase.expectedExceptionMessage || ''}
                                onChange={(e) => updateTestCase(index, { 
                                  expectedExceptionMessage: e.target.value || null,
                                  actualOutput: "",
                                  passed: undefined
                                })}
                                className="w-full p-2 font-mono text-sm border rounded"
                              />
                            </div>
                          </div>

                          {testCase.actualOutput && (
                            <div className="mt-4">
                              <div className="mb-2">
                                <label className="text-sm font-medium">Actual Output:</label>
                              </div>
                              <div className="font-mono text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                                {testCase.actualOutput}
                              </div>
                            </div>
                          )}
                          
                          {testCase.actualExceptionType && (
                            <div className="mt-4">
                              <div className="mb-2">
                                <label className="text-sm font-medium">Actual Exception:</label>
                              </div>
                              <div className="font-mono text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 whitespace-pre-wrap">
                                <div className="font-bold">{testCase.actualExceptionType}</div>
                                {testCase.actualExceptionMessage && (
                                  <div className="mt-1">{testCase.actualExceptionMessage}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default EnhancedTabsCodeEditor;