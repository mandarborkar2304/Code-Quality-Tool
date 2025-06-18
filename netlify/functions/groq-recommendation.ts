import { Handler } from '@netlify/functions';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY!,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { code, language } = body;

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a professional code reviewer assistant specializing in ${language}.
Your task is to analyze the code provided and return improvement suggestions in clean text.

Instructions:
- Focus on correctness, readability, maintainability, and efficiency.
- Use a numbered list for each suggestion.
- Each suggestion should be concise (1-2 sentences), specific, and context-aware.
- Avoid generic advice. Do not include markdown formatting or code blocks.
- Do not echo the original code or repeat user instructions.`,
        },
        {
          role: 'user',
          content: code,
        },
      ],
    });

    const suggestions = completion.choices?.[0]?.message?.content || 'No suggestions generated.';

    return {
      statusCode: 200,
      body: JSON.stringify({ suggestions }),
    };
  } catch (error) {
    console.error('Groq error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch Groq suggestions' }),
    };
  }
};

export { handler };
