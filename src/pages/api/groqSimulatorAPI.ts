// src/pages/api/groqSimulatorAPI.ts

export const simulateExecution = async (code: string, input: string, language: string) => {
  const res = await fetch("/.netlify/functions/groq-execute-simulator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, input, language }),
  });

  const data = await res.json();
  return data.output || "Execution failed.";
};
