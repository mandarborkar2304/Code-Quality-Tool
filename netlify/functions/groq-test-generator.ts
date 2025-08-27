import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

// Add TypeScript declaration for global cache
declare global {
  var __testCaseCache: Record<string, any>;
}

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!, 
});

const formatActualOutput = (output) => {
  if (typeof output === 'string') {
    try {
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2); // Pretty print JSON
    } catch {
      return output; // Return as is if not JSON
    }
  }
  return JSON.stringify(output, null, 2); // Handle non-string outputs
};

const handler: Handler = async (event) => {
  // Handle CORS
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { code, language = "Java" } = body;

    if (!code) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Code is required" }),
      };
    }

    // Create language-specific analysis instructions
    let languageSpecificInstructions = '';
    
    if (language.toLowerCase() === 'java') {
      languageSpecificInstructions = `
For Java code:
- Analyze class structure, method signatures, and exception handling
- Consider Scanner input patterns and System.out.println output formats
- Account for checked exceptions (IOException, etc.) and runtime exceptions
- For input with Scanner, format as space or newline separated values
- For expected output, include exact formatting (spaces, newlines)
- If exceptions are expected, specify the exception type and message
`;
    } else if (language.toLowerCase() === 'python') {
      languageSpecificInstructions = `
For Python code:
- Analyze function definitions, control flow, and exception handling
- Consider input() patterns and print() output formats
- Account for both raised exceptions and assertion errors
- For input with input(), provide each value on a separate line
- For expected output, include exact formatting (spaces, newlines)
- If exceptions are expected, specify the exception type and message
`;
    } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      languageSpecificInstructions = `
For JavaScript/TypeScript code:
- Analyze function definitions, control flow, and error handling
- Consider console.log output formats and process.argv input patterns
- Account for thrown errors and rejected promises
- For expected output, include exact formatting (spaces, newlines)
- If errors are expected, specify the error type and message
`;
    }

    const prompt = `
You are an advanced test case generation AI with deep code analysis capabilities.

First, analyze this ${language} code by:
1. Identifying input mechanisms (Scanner, input(), args, etc.)
2. Tracing control flow through conditionals, loops, and function calls
3. Detecting exception/error handling patterns
4. Determining boundary conditions and edge cases
5. Understanding the expected output format

${languageSpecificInstructions}

Then, generate a JSON array with 5 test cases that thoroughly test the code's functionality:

Each test case should contain:
- "input": A string representing the input that would be provided to the program
- "expectedOutput": The EXACT output the program would produce, including formatting
- "executionDetails": A description of what the test case is checking
- "expectedExceptionType": If applicable, the type of exception that would be thrown (otherwise null)
- "expectedExceptionMessage": If applicable, the exception message (otherwise null)

Generate these test case types:
1. Happy path - normal valid input
2. Edge case - unusual but valid input
3. Boundary case - input at the limits of valid range
4. Error case - input that should trigger exception handling
5. Complex case - input testing multiple code paths

Your test cases must be deterministic and accurately reflect the code's behavior.
DO NOT return any explanation, markdown, or comments. Only the raw JSON array.

Example format:
[
  {
    "input": "5 7",
    "expectedOutput": "Sum: 12",
    "executionDetails": "Basic addition with positive integers",
    "expectedExceptionType": null,
    "expectedExceptionMessage": null
  },
  {
    "input": "-3 -8",
    "expectedOutput": "Sum: -11",
    "executionDetails": "Addition with negative integers",
    "expectedExceptionType": null,
    "expectedExceptionMessage": null
  },
  {
    "input": "2147483647 1",
    "expectedOutput": "",
    "executionDetails": "Integer overflow boundary case",
    "expectedExceptionType": "ArithmeticException",
    "expectedExceptionMessage": "Integer overflow"
  },
  {
    "input": "abc def",
    "expectedOutput": "",
    "executionDetails": "Invalid non-numeric input",
    "expectedExceptionType": "NumberFormatException",
    "expectedExceptionMessage": "For input string: \"abc\""
  },
  {
    "input": "",
    "expectedOutput": "",
    "executionDetails": "Empty input test",
    "expectedExceptionType": "NoSuchElementException",
    "expectedExceptionMessage": "No line found"
  }
]
`;

    // Use the compound-beta-mini model for test case generation
    const modelToUse = "compound-beta-mini";
    
    // Cache mechanism to avoid redundant API calls
    const cacheKey = `${modelToUse}_${Buffer.from(code).toString('base64').substring(0, 50)}`;
    const cachedResponse = global.__testCaseCache?.[cacheKey];
    
    if (cachedResponse) {
      console.log("Using cached test cases");
      // Validate and auto-fix cache if needed
      if (
        typeof cachedResponse === 'object' &&
        cachedResponse !== null &&
        typeof cachedResponse.statusCode === 'number' &&
        cachedResponse.headers &&
        cachedResponse.body
      ) {
        return cachedResponse;
      }
      // If the cached value is just the testCases array, wrap it
      if (Array.isArray(cachedResponse)) {
        // Auto-fix the cache for next time
        const fixedResponse = {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ testCases: cachedResponse }),
        };
        global.__testCaseCache[cacheKey] = fixedResponse;
        return fixedResponse;
      }
      // If the cached value is an object with testCases, wrap it
      if (
        typeof cachedResponse === 'object' &&
        cachedResponse !== null &&
        Array.isArray(cachedResponse.testCases)
      ) {
        const fixedResponse = {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ testCases: cachedResponse.testCases }),
        };
        global.__testCaseCache[cacheKey] = fixedResponse;
        return fixedResponse;
      }
      // Fallback: always return a valid response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ testCases: [] }),
      };
    }
    
    const response = await client.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: prompt.trim() },
        { role: "user", content: code },
      ],
      temperature: 0.1, // Lower temperature for more deterministic outputs
      max_tokens: 1500, // Reduced token limit to manage costs
    });
    
    // Initialize cache if it doesn't exist
    if (!global.__testCaseCache) {
      global.__testCaseCache = {};
    }
    
    // Store in cache for future use
    global.__testCaseCache[cacheKey] = response;

    const raw = response.choices?.[0]?.message?.content ?? "";
    console.log("Raw response:", raw);
    
    // Try to extract JSON array from the response
    let jsonStr = raw;
    
    // If the response contains markdown code blocks, extract the content
    if (raw.includes("```json")) {
      const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
    } else if (raw.includes("```")) {
      const match = raw.match(/```\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
    }
    
    // Clean up the JSON string - replace single quotes with double quotes
    jsonStr = jsonStr.replace(/'/g, '"');
    
    // Make sure it starts with [ and ends with ]
    if (!jsonStr.trim().startsWith('[')) {
      const arrayStart = jsonStr.indexOf('[');
      if (arrayStart >= 0) {
        jsonStr = jsonStr.substring(arrayStart);
      }
    }
    
    if (!jsonStr.trim().endsWith(']')) {
      const arrayEnd = jsonStr.lastIndexOf(']');
      if (arrayEnd >= 0) {
        jsonStr = jsonStr.substring(0, arrayEnd + 1);
      }
    }
    
    try {
      // Try to parse the JSON
      const testCases = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!Array.isArray(testCases)) {
        throw new Error("Response is not an array");
      }
      
      // Ensure each test case has the required properties and format the actual output
      const validatedTestCases = testCases.map(tc => ({
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expectedOutput: typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
        actualOutput: formatActualOutput(tc.actualOutput || ""),
        executionDetails: tc.executionDetails || "Test case execution",
        expectedExceptionType: tc.expectedExceptionType || null,
        expectedExceptionMessage: tc.expectedExceptionMessage || null
      }));
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ testCases: validatedTestCases }),
      };
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError, "for string:", jsonStr);
      
      // Fallback: generate basic test cases with exception handling
      const fallbackTestCases = [
        {
          input: "test input",
          expectedOutput: "expected output",
          executionDetails: "Basic test case (auto-generated)",
          expectedExceptionType: null,
          expectedExceptionMessage: null
        },
        {
          input: "",
          expectedOutput: "",
          executionDetails: "Empty input test (auto-generated)",
          expectedExceptionType: null,
          expectedExceptionMessage: null
        },
        {
          input: "1",
          expectedOutput: "1",
          executionDetails: "Simple numeric test (auto-generated)",
          expectedExceptionType: null,
          expectedExceptionMessage: null
        },
        {
          input: "invalid",
          expectedOutput: "",
          executionDetails: "Invalid input test (auto-generated)",
          expectedExceptionType: "Exception",
          expectedExceptionMessage: "Invalid input format"
        },
        {
          input: "999999999",
          expectedOutput: "",
          executionDetails: "Boundary test (auto-generated)",
          expectedExceptionType: null,
          expectedExceptionMessage: null
        }
      ];
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          testCases: fallbackTestCases,
          warning: "Could not parse AI-generated test cases. Using fallback test cases instead."
        }),
      };
    }
  } catch (error) {
    console.error("Groq test case error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

export { handler };
