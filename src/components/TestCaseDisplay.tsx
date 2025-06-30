import { useState } from "react";
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X, Play, ClipboardCopy, Trash2, Loader2, Plus, AlertCircle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { simulateExecution } from "@/pages/api/groqSimulatorAPI";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface TestCaseDisplayProps {
  testCases: TestCase[];
  code: string;
  language: string;
  onUpdate: (index: number, updated: Partial<TestCase>) => void;
  onReplaceAll: (newTests: TestCase[]) => void;
}

/**
 * Enhanced Test Case Execution with Intelligent Analysis
 */
const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({
  testCases,
  code,
  language,
  onUpdate,
  onReplaceAll,
}) => {
  const [loading, setLoading] = useState(false);
  const [executingTests, setExecutingTests] = useState<Set<number>>(new Set());
  const passedTests = testCases.filter((tc) => tc.passed).length;

  /**
   * Intelligent Test Execution with Advanced Analysis
   */
  const runTest = async (index: number) => {
    const tc = testCases[index];
    const newExecutingTests = new Set(executingTests);
    newExecutingTests.add(index);
    setExecutingTests(newExecutingTests);

    try {
      // Enhanced execution with better input handling
      const sanitizedInput = tc.input.trim();
      const sanitizedExpected = tc.expectedOutput.trim();
      
      if (!sanitizedInput) {
        throw new Error("Input cannot be empty");
      }
      
      if (!sanitizedExpected) {
        throw new Error("Expected output cannot be empty");
      }

      // Execute with intelligent input parsing
      const output = await simulateExecution(code, sanitizedInput, language);
      const actualOutput = output.trim();
      
      // Enhanced comparison logic
      const passed = compareOutputs(actualOutput, sanitizedExpected);
      
      // Generate detailed execution report
      const executionDetails = generateExecutionReport(
        sanitizedInput,
        sanitizedExpected,
        actualOutput,
        passed,
        language
      );
      
      onUpdate(index, {
        actualOutput,
        passed,
        executionDetails,
      });

      // Show success/failure toast
      if (passed) {
        toast.success(`Test ${index + 1} passed! ✅`);
      } else {
        toast.error(`Test ${index + 1} failed! ❌`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onUpdate(index, {
        actualOutput: `❌ Execution Error: ${errorMessage}`,
        passed: false,
        executionDetails: `Error during execution: ${errorMessage}. Please check your input and code.`,
      });
      
      toast.error(`Test ${index + 1} failed to execute: ${errorMessage}`);
    } finally {
      const newExecutingTests = new Set(executingTests);
      newExecutingTests.delete(index);
      setExecutingTests(newExecutingTests);
    }
  };

  /**
   * Enhanced output comparison with multiple strategies
   */
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
    
    return false;
  };

  /**
   * Generate detailed execution report
   */
  const generateExecutionReport = (
    input: string,
    expected: string,
    actual: string,
    passed: boolean,
    language: string
  ): string => {
    let report = `🔍 Test Execution Report\n`;
    report += `Language: ${language.toUpperCase()}\n`;
    report += `Input: "${input}"\n`;
    report += `Expected: "${expected}"\n`;
    report += `Actual: "${actual}"\n`;
    report += `Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    
    if (!passed) {
      report += `\n💡 Analysis:\n`;
      if (actual.length !== expected.length) {
        report += `- Length mismatch (expected: ${expected.length}, actual: ${actual.length})\n`;
      }
      if (actual.toLowerCase() === expected.toLowerCase()) {
        report += `- Case sensitivity issue detected\n`;
      }
      if (actual.replace(/\s+/g, '') === expected.replace(/\s+/g, '')) {
        report += `- Whitespace formatting issue detected\n`;
      }
      report += `- Consider checking data types, formatting, or logic\n`;
    }
    
    return report;
  };

  /**
   * Execute all tests with progress tracking
   */
  const runAllTests = async () => {
    setLoading(true);
    const totalTests = testCases.length;
    let completedTests = 0;
    
    try {
      // Run tests sequentially to avoid overwhelming the execution API
      for (let i = 0; i < testCases.length; i++) {
        await runTest(i);
        completedTests++;
        
        // Show progress
        toast.info(`Progress: ${completedTests}/${totalTests} tests completed`);
      }
      
      // Show final summary
      const finalPassed = testCases.filter(tc => tc.passed).length;
      if (finalPassed === totalTests) {
        toast.success(`🎉 All ${totalTests} tests passed!`);
      } else {
        toast.warning(`${finalPassed}/${totalTests} tests passed. Review failed tests.`);
      }
      
    } catch (error) {
      toast.error('Failed to execute all tests');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new empty test case
   */
  const handleAddTestCase = () => {
    onReplaceAll([
      ...testCases,
      {
        input: "",
        expectedOutput: "",
        actualOutput: "",
        passed: undefined,
        executionDetails: "",
      },
    ]);
    toast.success("New test case added");
  };

  /**
   * Delete a test case
   */
  const handleDeleteTestCase = (index: number) => {
    const updated = testCases.filter((_, i) => i !== index);
    onReplaceAll(updated);
    toast.success(`Test case ${index + 1} deleted`);
  };

  /**
   * Copy content to clipboard
   */
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Intelligent Test Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTestCase}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Test Case
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runAllTests}
              className="gap-1"
              disabled={loading || testCases.length === 0}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Execute All Tests
            </Button>
            <Badge
              variant="outline"
              className={cn(
                "text-sm px-2 py-1",
                passedTests === testCases.length && testCases.length > 0
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
              )}
            >
              {passedTests}/{testCases.length} Passed
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>

        {testCases.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No test cases available. Click "Add Test Case" to create your first test.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {testCases.map((testCase, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200",
                  testCase.passed === true
                    ? "bg-green-50 border-green-200"
                    : testCase.passed === false
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">Test Case #{index + 1}</span>
                    {testCase.passed !== undefined && (
                      <Badge
                        className={cn(
                          "px-2 py-1",
                          testCase.passed
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        )}
                      >
                        {testCase.passed ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            PASSED
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            FAILED
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTest(index)}
                      disabled={executingTests.has(index)}
                      className="gap-1"
                    >
                      {executingTests.has(index) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Execute
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTestCase(index)}
                      className="gap-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-medium text-sm text-gray-700">
                        Input:
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(testCase.input)}
                        className="h-6 w-6 p-0"
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Enter your test input here..."
                      value={testCase.input}
                      onChange={(e) =>
                        onUpdate(index, {
                          input: e.target.value,
                          // Reset execution state when input changes
                          actualOutput: "",
                          passed: undefined,
                          executionDetails: "",
                        })
                      }
                      className="font-mono text-sm resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Expected Output Section */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-medium text-sm text-gray-700">
                        Expected Output:
                      </label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(testCase.expectedOutput)}
                        className="h-6 w-6 p-0"
                      >
                        <ClipboardCopy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Enter the expected output here..."
                      value={testCase.expectedOutput}
                      onChange={(e) =>
                        onUpdate(index, {
                          expectedOutput: e.target.value,
                          // Reset execution state when expected output changes
                          actualOutput: "",
                          passed: undefined,
                          executionDetails: "",
                        })
                      }
                      className="font-mono text-sm resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Actual Output Section (only shown when executed) */}
                  {testCase.actualOutput !== undefined && testCase.actualOutput !== "" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-medium text-sm text-gray-700">
                          Actual Output:
                        </label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(testCase.actualOutput || "")}
                          className="h-6 w-6 p-0"
                        >
                          <ClipboardCopy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-md border font-mono text-sm whitespace-pre-wrap">
                        {testCase.actualOutput}
                      </div>
                    </div>
                  )}

                  {/* Execution Details */}
                  {testCase.executionDetails && (
                    <div className="mt-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-help">
                              <AlertCircle className="h-4 w-4" />
                              <span>Execution Details</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-md">
                            <pre className="text-xs whitespace-pre-wrap">
                              {testCase.executionDetails}
                            </pre>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestCaseDisplay;
