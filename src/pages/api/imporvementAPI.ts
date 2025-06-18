// src/pages/api/improvementAPI.ts

import { CodeAnalysis } from "@/types";

export const fetchAIImprovements = async (analysis: CodeAnalysis) => {
  try {
    const res = await fetch("/.netlify/functions/groq-improvements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis }),
    });

    const data = await res.json();
    return data.improvements || [];
  } catch (err) {
    console.error("Failed to fetch AI improvements:", err);
    return [];
  }
};
