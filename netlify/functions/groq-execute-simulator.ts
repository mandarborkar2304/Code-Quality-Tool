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
    const { code, input, language } = body;

    const systemPrompt = `
You are a strict code simulator.

Rules:
- Simulate the following ${language} code.
- Use the provided input as stdin.
- Assume the code compiles correctly.
- Respond ONLY with what the code would print to the console.
- Do NOT include explanation, markdown, or labels.
- If the code crashes or errors, just respond with:
"Runtime Error"
`;

    const userPrompt = `Code:\n${code}\n\nInput:\n${input}`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    });

    const output = response.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ output: output || "No output returned." }),
    };
  } catch (error) {
    console.error("Execution simulation failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Execution failed." }),
    };
  }
};

export { handler };
