import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, Play, Plus, Brain, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { generateIntelligentTestCases } from '@/utils/testGeneration';
import { executeTest } from '@/utils/testExecution';
import { TestCase, TestResult, TestExecutionConfig, TestReport } from '@/types/testTypes';
import { EditorToolbar, createGenerateTestsAction, createRunTestsAction } from '@/components/EditorToolbar';

interface TestRunnerProps {
  code: string;
  language: string;
  onTestComplete?: (report: TestReport) => void;
}

export function TestRunner({ code, language, onTestComplete }: TestRunnerProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executionResults, setExecutionResults] = useState<Map<number, TestResult>>(new Map());

  const executionConfig: TestExecutionConfig = {
    timeout: 5000, // 5 seconds
    memoryLimit: 128 * 1024 * 1024, // 128MB
    inputFormat: 'stdin',
    outputFormat: 'stdout',
    sandboxOptions: {
      isolationLevel: 'process',
      networkAccess: false,
      fileSystemAccess: false
    }
  };

  const handleGenerateTests = async () => {
    setIsGenerating(true);
    try {
      toast({
        description: 'Analyzing code and generating intelligent test cases...',
        variant: 'default'
      });
      
      // Enhanced test generation with more realistic inputs/outputs
      const generatedTests = await generateIntelligentTestCases(code, language);
      
      // Improve exception handling precision
      const enhancedTests = generatedTests.map(test => {
        // If test has an expected exception, make it more precise
        if (test.expectedExceptionType) {
          // Convert generic exceptions to more specific ones based on patterns
          if (test.expectedExceptionType === 'Exception' && test.description?.includes('division by zero')) {
            return {
              ...test,
              expectedExceptionType: language === 'java' ? 'ArithmeticException: / by zero' : 
                                    language === 'python' ? 'ZeroDivisionError' : 
                                    language === 'javascript' ? 'Error: Division by zero' : 
                                    test.expectedExceptionType
            };
          }
          
          // Add more specific exception handling for array/list index errors
          if (test.expectedExceptionType === 'Exception' && 
              (test.description?.includes('index') || test.description?.includes('bounds'))) {
            return {
              ...test,
              expectedExceptionType: language === 'java' ? 'ArrayIndexOutOfBoundsException' : 
                                    language === 'python' ? 'IndexError' : 
                                    language === 'javascript' ? 'TypeError: Cannot read property' : 
                                    test.expectedExceptionType
            };
          }
        }
        return test;
      });
      
      setTestCases(enhancedTests as any);
      toast({ description: `Generated ${enhancedTests.length} test cases with improved precision`, variant: 'default' });
    } catch (error) {
        toast({ description: 'Failed to generate test cases', variant: 'destructive' });
      console.error('Test generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const executeAllTests = async () => {
    if (testCases.length === 0) return;

    setIsExecuting(true);
    setProgress(0);
    const newResults = new Map<number, TestResult>();

    try {
      for (let i = 0; i < testCases.length; i++) {
        // Create ExecutionEnvironment with required language property
        const executionEnv = {
          ...executionConfig,
          language
        };
        const result = await executeTest(code, testCases[i], executionEnv);
        newResults.set(i, result);
        setProgress(((i + 1) / testCases.length) * 100);
      }

      setExecutionResults(newResults);
      generateAndEmitReport(newResults);
    } catch (error) {
      toast({ description: 'Test execution failed', variant: 'destructive' });
      console.error('Test execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const generateAndEmitReport = (results: Map<number, TestResult>) => {
    const passedTests = Array.from(results.values()).filter(r => r.passed).length;
    const totalTests = results.size;

    const report: TestReport = {
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        skippedTests: 0,
        totalExecutionTime: Array.from(results.values())
          .reduce((sum, r) => sum + r.executionTime, 0),
        averageExecutionTime: Array.from(results.values())
          .reduce((sum, r) => sum + r.executionTime, 0) / totalTests,
        coverage: {
          lines: 0,
          branches: 0,
          functions: 0,
          statements: 0
        }
      },
      testResults: Array.from(results.entries()).map(([index, result]) => ({
        testCase: testCases[index],
        result
      })),
      performance: {
        slowestTests: Array.from(results.entries())
          .map(([index, result]) => ({
            testCase: testCases[index],
            executionTime: result.executionTime
          }))
          .sort((a, b) => b.executionTime - a.executionTime)
          .slice(0, 3),
        memoryUsage: {
          peak: Math.max(...Array.from(results.values()).map(r => r.memoryUsage)),
          average: Array.from(results.values())
            .reduce((sum, r) => sum + r.memoryUsage, 0) / totalTests
        }
      },
      recommendations: generateRecommendations(results)
    };

    onTestComplete?.(report);
  };

  const generateRecommendations = (results: Map<number, TestResult>) => {
    const recommendations = [];
    const failedTests = Array.from(results.values()).filter(r => !r.passed).length;
    const totalTests = results.size;

    if (failedTests > 0) {
      recommendations.push({
        type: 'reliability',
        message: `${failedTests} of ${totalTests} tests failed. Review error patterns and improve error handling.`,
        priority: failedTests > totalTests / 2 ? 'high' : 'medium'
      });
    }

    const slowTests = Array.from(results.values())
      .filter(r => r.executionTime > 1000).length;
    if (slowTests > 0) {
      recommendations.push({
        type: 'performance',
        message: `${slowTests} tests took longer than 1 second to execute. Consider optimizing performance.`,
        priority: 'medium'
      });
    }

    return recommendations;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Intelligent Test Runner</span>
          </div>
          <EditorToolbar
            actions={[
              createGenerateTestsAction(handleGenerateTests, isGenerating),
              createRunTestsAction(executeAllTests, isExecuting, testCases.length === 0)
            ]}
            rightContent={
              testCases.length > 0 && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                  {Array.from(executionResults.values()).filter(r => r.passed).length}/{testCases.length} Passed
                </Badge>
              )
            }
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isExecuting && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-1">
              Executing tests ({Math.round(progress)}%)
            </p>
          </div>
        )}

        <div className="space-y-4">
          {testCases.map((testCase, index) => {
            const result = executionResults.get(index);
            return (
              <div
                key={index}
                className="border rounded-lg p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{testCase.name}</h3>
                  {result && (
                    <Badge
                      variant={result.passed ? 'default' : 'destructive'}
                      className="ml-2"
                    >
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {testCase.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Input:</p>
                    <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {testCase.input}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium">Expected Output:</p>
                    <pre className="bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {testCase.expectedOutput}
                    </pre>
                  </div>
                </div>
                {result && !result.passed && (
                  <div className="mt-4 bg-red-50 p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700">Test Failed</p>
                        <p className="text-sm text-red-600 mt-1">
                          {result.error || 'Actual output did not match expected output'}
                        </p>
                        {result.analysisDetails.suggestions.length > 0 && (
                          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                            {result.analysisDetails.suggestions.map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}