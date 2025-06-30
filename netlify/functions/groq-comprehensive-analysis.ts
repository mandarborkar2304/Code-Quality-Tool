// This file is a Netlify serverless function. Do NOT import it in frontend code.

import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import Groq from 'groq-sdk';

if (typeof process === 'undefined' || !process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not defined. This function must run in a Netlify serverless environment with the correct env variable set.');
}

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { code, language } = body;

    if (!code || !language) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Code and language are required' }),
      };
    }

    const prompt = `As an expert software engineer, perform a comprehensive analysis of the following ${language} code.

IMPORTANT: Respond with a valid JSON object following this exact structure:

{
  "complexity": {
    "cyclomaticComplexity": <number 1-50>,
    "timeComplexity": "<Big O notation like O(1), O(n), O(n²), etc>",
    "spaceComplexity": "<Big O notation>",
    "maintainabilityIndex": <number 0-100>,
    "readabilityScore": <number 0-100>
  },
  "quality": {
    "overallScore": <number 0-100>,
    "codeSmells": [
      {
        "type": "<smell type>",
        "severity": "<low|medium|high|critical>",
        "description": "<detailed description>",
        "line": <line number if applicable>,
        "suggestion": "<how to fix>"
      }
    ],
    "violations": [
      {
        "category": "<violation category>",
        "severity": "<minor|major>",
        "description": "<what's wrong>",
        "line": <line number if applicable>,
        "impact": "<why it matters>"
      }
    ]
  },
  "security": [
    {
      "issue": "<security issue>",
      "severity": "<low|medium|high|critical>",
      "description": "<detailed explanation>",
      "recommendation": "<how to fix>",
      "line": <line number if applicable>
    }
  ],
  "performance": [
    {
      "issue": "<performance issue>",
      "impact": "<low|medium|high>",
      "description": "<what's inefficient>",
      "optimization": "<how to optimize>",
      "line": <line number if applicable>
    }
  ],
  "recommendations": {
    "immediate": ["<quick fixes>"],
    "shortTerm": ["<1-2 day improvements>"],
    "longTerm": ["<major refactoring suggestions>"]
  },
  "summary": {
    "strengths": ["<what code does well>"],
    "weaknesses": ["<main problems>"],
    "priorityLevel": "<low|medium|high|critical>",
    "estimatedFixTime": "<time estimate>"
  }
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Focus on:
- Accurate complexity analysis
- Real security vulnerabilities
- Performance bottlenecks
- Code maintainability
- Best practices for ${language}
- Realistic time estimates

Provide specific, actionable recommendations with line numbers where possible.`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a senior software engineer and security expert. Analyze code thoroughly and respond with valid JSON only. Be precise and practical in your assessments.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    const response = completion.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ analysis }),
    };
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        message: 'Failed to generate comprehensive analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };