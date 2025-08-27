import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
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
    const { language, code, stdin, expected_output, compare_mode, normalize, tolerance, time_limit_ms, memory_limit_kb } = JSON.parse(event.body || "{}");

    if (!code || !language) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Code and language are required" }),
      };
    }

    const systemPrompt = `
You are "Judge Agent", a deterministic code runner and comparator.

Steps:
1. Receive: {language, code, stdin, expected_output, compare_mode?, normalize?, tolerance?}.
2. Execute code in sandbox, capture stdout, stderr, exit code, runtime.
3. Normalize stdout (trim spaces, unify newlines, etc.).
4. Compare actual_output vs expected_output (modes : exact | case_insensitive | token | lineset | float_tolerance).
5. Return ONLY a JSON object :

{
  "input": string,
  "expected_output": string,
  "actual_output": string,
  "actual_output_raw": string,
  "stderr": string,
  "exit_code": integer,
  "runtime_ms": integer,
  "memory_kb": integer|null,
  "compare_mode": string,
  "normalize" : { ... },
  "tolerance": number|null,
  "status": "Pass" | "Fail",
  "verdict_message": string
}
`;

    const userPrompt = `Run and judge this submission.

language: ${language}
code:
<<<CODE
${code}
CODE

stdin:
<<<INPUT
${stdin}
INPUT

expected_output:
<<<EXPECTED
${expected_output}
EXPECTED

compare_mode: ${compare_mode || "exact"}
normalize:
  trim_line_trailing_space: ${normalize?.trim_line_trailing_space ?? true}
  unify_newlines_to_lf: ${normalize?.unify_newlines_to_lf ?? true}
  trim_outer_blank_lines: ${normalize?.trim_outer_blank_lines ?? true}
  lowercase: ${normalize?.lowercase ?? false}
  collapse_internal_whitespace: ${normalize?.collapse_internal_whitespace ?? (compare_mode === "token")}
tolerance: ${tolerance ?? "null"}
time_limit_ms: ${time_limit_ms ?? 2000}
memory_limit_kb: ${memory_limit_kb ?? 262144}
`;

    const response = await client.chat.completions.create({
      model: "compound-beta-mini", // Using the same model as the simulator
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
      temperature: 0.1, // Lower temperature for more deterministic outputs
    });

    const rawGroqOutput = response.choices?.[0]?.message?.content?.trim() || "";

    let judgeResult;
    try {
      // Extract only the JSON part from the raw Groq output
      const jsonMatch = rawGroqOutput.match(/```json\n([\s\S]*?)\n```/);
      let cleanGroqOutput = rawGroqOutput;

      if (jsonMatch && jsonMatch[1]) {
        cleanGroqOutput = jsonMatch[1];
      } else {
        // Fallback if no ```json block is found, try to parse directly
        // This handles cases where Groq might return pure JSON without markdown block
        try {
          JSON.parse(cleanGroqOutput);
        } catch (e) {
          // If direct parse also fails, it means there's extra text outside a json block
          // Attempt to find the first and last curly braces to extract a potential JSON object
          const firstBrace = cleanGroqOutput.indexOf('{');
          const lastBrace = cleanGroqOutput.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanGroqOutput = cleanGroqOutput.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      judgeResult = JSON.parse(cleanGroqOutput);
    } catch (jsonError) {
      console.error("Failed to parse Groq output as JSON:", rawGroqOutput);
      judgeResult = {
        input: stdin,
        expected_output: expected_output,
        actual_output: "",
        actual_output_raw: rawGroqOutput,
        stderr: "Error: Groq output was not valid JSON.",
        exit_code: 1,
        runtime_ms: 0,
        memory_kb: null,
        compare_mode: compare_mode || "exact",
        normalize: normalize || {},
        tolerance: tolerance || null,
        status: "Fail",
        verdict_message: "Internal Error: Failed to parse judge result from AI.",
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(judgeResult),
    };
  } catch (error) {
    console.error("Error in Judge Agent function:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};

export { handler };