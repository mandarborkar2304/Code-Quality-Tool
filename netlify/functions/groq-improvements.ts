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
    const { analysis } = body;

    const systemPrompt = `
You are a code quality assistant. Based on the following JSON-based code analysis, suggest the top 5 improvements.

Rules:
- Return only a JSON array.
- Each suggestion must contain: type (critical/high/medium/low), category, title, description, impact.
- Prioritize critical and high issues first.
- Do NOT include explanations, markdown, or additional text.

Example format:
[
  {
    "type": "critical",
    "category": "Reliability",
    "title": "Fix Major Violations",
    "description": "Resolve 3 major code violations that may affect stability",
    "impact": "Improves runtime safety and prevents errors"
  },
  ...
]
`;

    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        { role: 'user', content: JSON.stringify(analysis) },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';
    const match = content.match(/\[\s*{[\s\S]*?}\s*]/);

    const improvements = match ? JSON.parse(match[0]) : [];

    return {
      statusCode: 200,
      body: JSON.stringify({ improvements }),
    };
  } catch (err) {
    console.error('Groq Improvements Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to generate improvements' }),
    };
  }
};

export { handler };
