import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

export const getGroqResponse = async (prompt: string): Promise<string> => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful code review assistant. Provide detailed, constructive feedback on code.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices?.[0]?.message?.content?.trim() || 'No recommendations found.';
  } catch (err) {
    console.error('Groq API error:', err);
    return 'Error fetching AI recommendations.';
  }
};
