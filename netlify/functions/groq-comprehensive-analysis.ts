// This file is a Netlify serverless function. Do NOT import it in frontend code.

import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import Groq from 'groq-sdk';

// Add TypeScript declaration for global cache
declare global {
  var __analysisCache: Record<string, any>;
}

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

    const prompt = `You are an expert code analyzer with IntelliSense-like capabilities. Analyze the following ${language} code for syntax errors, warnings, and suggestions.

Return a valid JSON object in this format:
{
  "errors": [
    { "line": number, "column": number, "message": "description of error", "severity": "error", "type": "syntax|semantic|style", "code": "ERROR_CODE", "quickFix": "suggested fix (optional)" }
  ],
  "warnings": [
    { "line": number, "column": number, "message": "description of warning", "severity": "warning", "type": "syntax|semantic|style", "code": "WARNING_CODE", "quickFix": "suggested fix (optional)" }
  ],
  "suggestions": [
    { "line": number, "column": number, "message": "style or best practice suggestion", "severity": "info", "type": "style", "code": "SUGGESTION_CODE", "quickFix": "suggested improvement (optional)" }
  ]
}

Return ONLY valid JSON, do not omit any commas or brackets, and do not include comments or extra text.

Focus on detecting:
1. **Syntax Errors**: Missing semicolons, unclosed brackets/braces, invalid variable names, unclosed strings
2. **Semantic Issues**: Undefined variables, unreachable code, assignment in conditions
3. **Style Issues**: Code formatting, best practices, performance optimizations

For ${language}, pay special attention to language-specific syntax and common mistakes.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON response without any additional text or markdown formatting.`;

    // Use the compound-beta-mini model for code analysis
    const modelToUse = 'compound-beta-mini';
    
    // Cache mechanism to avoid redundant API calls
    const cacheKey = `${modelToUse}_${Buffer.from(code).toString('base64').substring(0, 50)}_${language}`;
    const cachedCompletion = global.__analysisCache?.[cacheKey];
    
    let completion;
    if (cachedCompletion) {
      console.log("Using cached analysis result");
      completion = cachedCompletion;
    } else {
      completion = await client.chat.completions.create({
        model: modelToUse,
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
        temperature: 0.1, // Lower temperature for more deterministic outputs
        max_tokens: 800, // Increased for complete JSON responses
      });
      
      // Initialize cache if it doesn't exist
      if (!global.__analysisCache) {
        global.__analysisCache = {};
      }
      
      // Store in cache for future use (limit cache size to 50 entries)
      if (Object.keys(global.__analysisCache).length > 50) {
        // Remove oldest entry
        const oldestKey = Object.keys(global.__analysisCache)[0];
        delete global.__analysisCache[oldestKey];
      }
      
      global.__analysisCache[cacheKey] = completion;
    }

    const response = completion.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      // Try to repair common JSON issues (trailing commas, missing brackets)
      let repaired = jsonMatch[0]
        .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
        .replace(/\,(\s*[}\]])/g, '$1');
      // Add missing closing brackets if possible
      if (!repaired.trim().endsWith('}')) repaired += '}';
      try {
        analysis = JSON.parse(repaired);
      } catch (jsonError2) {
        console.error('Failed to parse JSON response:', jsonMatch[0]);
        console.error('JSON Error:', jsonError2);
        // Return a minimal analysis structure with the raw response for debugging
        analysis = {
          errors: [
            {
              line: 1,
              column: 1,
              message: 'Failed to parse AI response',
              severity: 'error',
              type: 'syntax',
              code: 'AI_PARSE_ERROR',
              quickFix: jsonMatch[0].slice(0, 500) // Show part of the raw response for debugging
            }
          ],
          warnings: [],
          suggestions: []
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(analysis),
    };
  } catch (error: any) {
    console.error('Comprehensive analysis error:', error);
    
    // Handle rate limiting specifically
    if (error?.status === 429) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'Rate limit exceeded. Please wait a moment and try again.',
          error: 'rate_limit_exceeded',
          retryAfter: 60 // seconds
        }),
      };
    }
    
    // Return fallback analysis instead of error
    const fallbackAnalysis = {
      complexity: { overall: 'medium', score: 50 },
      security: { issues: [], score: 'medium' },
      performance: { issues: [], score: 'medium' },
      recommendations: {
        immediate: ['Analysis temporarily unavailable'],
        shortTerm: ['Please try again later'],
        longTerm: []
      },
      summary: {
        strengths: ['Code submitted successfully'],
        weaknesses: ['Analysis service temporarily unavailable'],
        priorityLevel: 'low',
        estimatedFixTime: '0 minutes'
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        analysis: fallbackAnalysis,
        fallback: true,
        message: 'Using fallback analysis'
      }),
    };
  }
};

export { handler };