import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

// Add TypeScript declaration for global cache
declare global {
  var __executionCache: Record<string, any>;
}

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

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
    const { code, input, language } = body;

    if (!code || !language) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Code and language are required" }),
      };
    }

    const systemPrompt = `
You are a precise code execution simulator with exception handling capabilities.

Rules:
- Simulate the following ${language} code with the provided input.
- Trace through the code execution step by step, tracking variables and control flow.
- If the code executes successfully, return ONLY the exact console output.
- If the code throws an exception or crashes, return a JSON object with:
  {
    "output": "",
    "exceptionType": "The specific exception type (e.g., NullPointerException, IndexOutOfBoundsException)",
    "exceptionMessage": "The detailed exception message"
  }
- Be precise about exception types and messages based on the language's standard libraries.
- For Java: use proper exception types like NullPointerException, ArrayIndexOutOfBoundsException, etc.
- For Python: use proper exception types like ValueError, TypeError, IndexError, etc.
- For JavaScript: use proper error types like TypeError, ReferenceError, SyntaxError, etc.
- Do NOT include any explanation, markdown, or code blocks in your response.
`;

    const userPrompt = `Code:\n${code}\n\nInput:\n${input}`;

    // Use the compound-beta-mini model for execution simulation
    const modelToUse = "compound-beta-mini";
    
    // Cache mechanism to avoid redundant API calls
    const cacheKey = `${modelToUse}_${Buffer.from(code).toString('base64').substring(0, 30)}_${Buffer.from(input).toString('base64').substring(0, 20)}`;
    const cachedResponse = global.__executionCache?.[cacheKey];
    
    if (cachedResponse) {
      console.log("Using cached execution result");
      return cachedResponse;
    }
    
    const response = await client.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
      temperature: 0.1, // Lower temperature for more deterministic outputs
    });
    
    // Initialize cache if it doesn't exist
    if (!global.__executionCache) {
      global.__executionCache = {};
    }
    
    // Store in cache for future use (limit cache size to 100 entries)
    if (Object.keys(global.__executionCache).length > 100) {
      // Remove oldest entry
      const oldestKey = Object.keys(global.__executionCache)[0];
      delete global.__executionCache[oldestKey];
    }
    
    global.__executionCache[cacheKey] = response;

    const rawOutput = response.choices?.[0]?.message?.content?.trim() || "";
    
    // Check if the response is a JSON object with exception information
    try {
      // If it's JSON with exception info, parse it
      if (rawOutput.startsWith('{') && rawOutput.endsWith('}')) {
        const parsedOutput = JSON.parse(rawOutput);
        
        if (parsedOutput.exceptionType) {
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              output: parsedOutput.output || "",
              exceptionType: parsedOutput.exceptionType,
              exceptionMessage: parsedOutput.exceptionMessage || "Unknown error"
            }),
          };
        }
      }
      
      // If it's not exception JSON, return as normal output
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          output: rawOutput || "No output returned.",
          exceptionType: null,
          exceptionMessage: null
        }),
      };
    } catch (jsonError) {
      // If JSON parsing fails, it's just regular output
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ 
          output: rawOutput || "No output returned.",
          exceptionType: null,
          exceptionMessage: null
        }),
      };
    }
  } catch (error) {
    console.error("Execution simulation failed:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Execution failed." }),
    };
  }
};

export { handler };
