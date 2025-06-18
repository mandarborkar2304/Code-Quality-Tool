import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY!, 
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { code, language = "Java" } = body;

    const prompt = `
You are a strict test case generation AI.

Given this ${language} code, return ONLY a JSON array with 3 objects.

Each object should contain:
- "input": a string or JSON-like string used as input to the code
- "expectedOutput": the expected printed output
- "executionDetails": a short description (max 15 words)

Generate:
1. Simple valid input
2. Edge case
3. Boundary case

DO NOT return any explanation, markdown, or comments. Only the raw JSON array.

Example format:
[
  {
    "input": "2 3",
    "expectedOutput": "5",
    "executionDetails": "Adds two small integers"
  },
  {
    "input": "-1000 1000",
    "expectedOutput": "0",
    "executionDetails": "Handles negative and positive canceling"
  },
  {
    "input": "2147483647 1",
    "expectedOutput": "Overflow error",
    "executionDetails": "Tests upper boundary for 32-bit integer"
  }
]
`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: prompt.trim() },
        { role: "user", content: code },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[\s*{[\s\S]*?}\s*\]/); // Extract valid JSON

    if (!match) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No valid test cases generated." }),
      };
    }

    const testCases = JSON.parse(match[0]);
    return {
      statusCode: 200,
      body: JSON.stringify({ testCases }),
    };
  } catch (error) {
    console.error("Groq test case error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

export { handler };
