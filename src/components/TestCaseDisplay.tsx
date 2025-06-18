import { useState } from "react";
import { TestCase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X, Info, Play, ClipboardCopy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateTestCases } from "@/pages/api/testCaseAPI";
import { simulateExecution } from "@/pages/api/groqSimulatorAPI";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TestCaseDisplayProps {
  testCases: TestCase[];
  code: string;
  language: string;
  onUpdate: (index: number, updated: Partial<TestCase>) => void;
  onReplaceAll: (newTests: TestCase[]) => void;
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({
  testCases,
  code,
  language,
  onUpdate,
  onReplaceAll,
}) => {
  const [loading, setLoading] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const passedTests = testCases.filter((tc) => tc.passed).length;

  const runTest = async (index: number) => {
    const tc = testCases[index];
    const output = await simulateExecution(code, tc.input, language);
    const passed = output.trim() === tc.expectedOutput.trim();
    onUpdate(index, {
      actualOutput: output,
      passed,
      executionDetails: `Executed with input '${tc.input}'`,
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    const newCases = await generateTestCases(code, language);
    onReplaceAll(
      newCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: "",
        passed: undefined,
        executionDetails: "",
      }))
    );
    setLoading(false);
  };

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
  };

  const handleDeleteTestCase = (index: number) => {
    const updated = testCases.filter((_, i) => i !== index);
    onReplaceAll(updated);
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const tryPrettify = (raw: string): string => {
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  };

  const tryParse = (raw: string): string => {
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      toast.error("Invalid JSON format");
      return raw;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Test Cases</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Test Cases"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleAddTestCase}>
            + Add Test Case
          </Button>
          <div className="flex items-center gap-1">
            <Switch
              id="json-mode"
              checked={jsonMode}
              onCheckedChange={setJsonMode}
            />
            <Label htmlFor="json-mode" className="text-xs">
              JSON Mode
            </Label>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              passedTests === testCases.length
                ? "bg-green-900/20"
                : "bg-yellow-900/20"
            )}
          >
            <span className="mr-1 font-bold">{passedTests}</span>/
            <span className="ml-1">{testCases.length}</span>
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {testCases.map((testCase, index) => (
          <div
            key={index}
            className={cn(
              "p-3 rounded-md border",
              testCase.passed
                ? "bg-green-950/20 border-green-700/30"
                : testCase.passed === false
                ? "bg-red-950/20 border-red-700/30"
                : "bg-black/10 border-muted"
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium flex items-center gap-1">
                Test Case #{index + 1}
                {testCase.executionDetails && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="max-w-xs text-xs">
                          {testCase.executionDetails}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => runTest(index)}
                >
                  <Play className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteTestCase(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                {testCase.passed !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-1.5 py-0 h-5 gap-1",
                      testCase.passed
                        ? "bg-green-900/20 border-green-700/30"
                        : "bg-red-900/20 border-red-700/30"
                    )}
                  >
                    {testCase.passed ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        <span>Passed</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-red-500" />
                        <span>Failed</span>
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-muted-foreground">Input:</span>
                  {jsonMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(testCase.input)}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <textarea
                  rows={jsonMode ? 4 : 2}
                  className="p-2 w-full rounded font-mono bg-black/30"
                  value={
                    jsonMode ? tryPrettify(testCase.input) : testCase.input
                  }
                  onChange={(e) =>
                    onUpdate(index, {
                      input: jsonMode
                        ? tryParse(e.target.value)
                        : e.target.value,
                    })
                  }
                />
              </div>

              {/* Expected Output */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-muted-foreground">Expected Output:</span>
                  {jsonMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(testCase.expectedOutput)}
                    >
                      <ClipboardCopy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <textarea
                  rows={jsonMode ? 4 : 2}
                  className="p-2 w-full rounded font-mono bg-black/30"
                  value={
                    jsonMode
                      ? tryPrettify(testCase.expectedOutput)
                      : testCase.expectedOutput
                  }
                  onChange={(e) =>
                    onUpdate(index, {
                      expectedOutput: jsonMode
                        ? tryParse(e.target.value)
                        : e.target.value,
                    })
                  }
                />
              </div>

              {/* Actual Output */}
              {testCase.actualOutput !== undefined && (
                <div>
                  <span className="font-medium text-muted-foreground">
                    Actual Output:
                  </span>
                  <pre className="mt-1 p-2 bg-black/30 rounded overflow-x-auto scrollbar-thin whitespace-pre-wrap font-mono">
                    {tryPrettify(testCase.actualOutput)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCaseDisplay;
