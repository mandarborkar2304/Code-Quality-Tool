// src/pages/api/groqSimulatorAPI.ts

import { fetchWithRetry } from "@/utils/apiUtils";
import { createCacheKey } from "@/utils/apiCache";

export interface ExecutionResult {
  output: string;
  exceptionType?: string | null;
  exceptionMessage?: string | null;
  success: boolean;
  error?: string;
}

export const simulateExecution = async (
  code: string, 
  input: string, 
  language: string
): Promise<ExecutionResult> => {
  try {
    // Create cache key for this execution
    const cacheKey = createCacheKey('execution', { code, input, language });
    
    // Make API call to Netlify function
    const response = await fetchWithRetry<{
      output: string;
      exceptionType?: string | null;
      exceptionMessage?: string | null;
      message?: string;
    }>(
      "/.netlify/functions/groq-execute-simulator",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          input,
          language,
        }),
      },
      cacheKey,
      3, // retries
      1000 // retry delay
    );

    // Check if the response indicates an API error
    if (response.message) {
      return {
        output: "",
        success: false,
        error: response.message,
      };
    }

    // Return structured execution result
    return {
      output: response.output || "",
      exceptionType: response.exceptionType || null,
      exceptionMessage: response.exceptionMessage || null,
      success: true,
    };
  } catch (error) {
    console.error("Execution simulation failed:", error);
    return {
      output: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown execution error",
    };
  }
};
