// src/pages/api/testCaseAPI.ts

export const generateTestCases = async (code: string, language: string) => {
  const res = await fetch("/.netlify/functions/groq-test-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language }),
  });

  const data = await res.json();
  return data.testCases || [];
};
