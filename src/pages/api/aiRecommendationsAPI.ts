import { CodeAnalysis } from "@/types";

export const fetchAIRecommendations = async (analysis: CodeAnalysis, language: string): Promise<string> => {
  try {
    const response = await fetch("/.netlify/functions/groq-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: analysis.originalCode,
        language,
      }),
    });

    const data = await response.json();
    return data.suggestions || "No recommendations generated.";
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    return "Failed to fetch AI recommendations.";
  }
};
