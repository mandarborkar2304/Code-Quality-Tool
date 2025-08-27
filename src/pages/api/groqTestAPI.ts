import { fetchWithRetry } from "@/utils/apiUtils";
import { createCacheKey } from "@/utils/apiCache";

export interface TestCase {
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  executionDetails?: string;
  expectedExceptionType?: string | null;
  expectedExceptionMessage?: string | null;
  actualExceptionType?: string | null;
  actualExceptionMessage?: string | null;
  error?: string;
}

export interface ExecutionResult {
  output: string;
  passed: boolean; // Added to indicate if the execution passed
  exceptionType?: string | null;
  exceptionMessage?: string | null;
  error?: string; // Added for general execution errors
}

/**
 * Generate test cases for the given code using GROQ API with caching and retry
 * @param code Code to generate tests for
 * @param language Programming language
 * @returns Array of test cases
 */
export async function generateTestCases(code: string, language: string): Promise<TestCase[]> {
  try {
    const cacheKey = createCacheKey('test-generation', {
      language,
      codeHash: code.substring(0, 100)
    });

    const response = await fetchWithRetry<any>(
      '/.netlify/functions/groq-test-generator',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      },
      cacheKey,
      2,
      1000
    );

    if (response && response.testCases) {
      return response.testCases.map((tc: any) => {
        const actualOutput = formatActualOutput(tc.actualOutput || '', tc.exceptionType, tc.exceptionMessage);
        return {
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput,
          passed: actualOutput === tc.expectedOutput,
          executionDetails: tc.executionDetails,
          expectedExceptionType: tc.expectedExceptionType || null,
          expectedExceptionMessage: tc.expectedExceptionMessage || null,
          actualExceptionType: tc.actualExceptionType || null,
          actualExceptionMessage: tc.actualExceptionMessage || null
        };
      });
    }

    throw new Error('Invalid response format from test generator');
  } catch (error) {
    console.error('Test case generation failed:', error);
    throw new Error('Failed to generate test cases');
  }
}

/**
 * Format actual output intelligently based on execution result
 * @param output Normal output or exception output
 * @param exceptionType Type of exception, if any
 * @param exceptionMessage Message of exception, if any
 * @returns Formatted actual output
 */
function formatActualOutput(output: string, exceptionType?: string | null, exceptionMessage?: string | null): string {
  if (exceptionType && exceptionMessage) {
    return `Exception: ${exceptionType}\nMessage: ${exceptionMessage}`;
  }
  return output;
}

/**
 * Simulate execution of code with the given input using GROQ API with caching and retry
 * @param code Code to execute
 * @param input Input for the code
 * @param language Programming language
 * @returns Execution result
 */
export async function simulateExecution(
  code: string, 
  input: string, 
  language: string
): Promise<ExecutionResult> {
  try {
    const cacheKey = createCacheKey('execution-simulation', { 
      language, 
      codeHash: code.substring(0, 50),
      input: input.substring(0, 50)
    });

    const response = await fetchWithRetry<any>(
      '/.netlify/functions/groq-execute-simulator',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input, language }),
      },
      cacheKey,
      1,
      1000
    );

    if (response) {
      return {
        output: response.output || '',
        passed: response.passed !== undefined ? response.passed : true, // Assume passed if not explicitly provided
        exceptionType: response.exceptionType || null,
        exceptionMessage: response.exceptionMessage || null,
        error: response.error || null
      };
    }

    throw new Error('Invalid response format from execution simulator');
  } catch (error) {
    console.error('Execution simulation failed:', error);
    return {
      output: 'Execution failed: ' + (error instanceof Error ? error.message : String(error)),
      passed: false,
      exceptionType: 'ExecutionError',
      exceptionMessage: 'Failed to execute code',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}