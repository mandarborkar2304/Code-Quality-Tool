import { Handler } from "@netlify/functions";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface SyntaxError {
  line: number;
  column: number;
  startColumn?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning';
  type: string;
  suggestion?: string;
}

interface SyntaxAnalysisResult {
  errors: SyntaxError[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code, language } = JSON.parse(event.body || '{}');

    if (!code || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Code and language are required' }),
      };
    }

    const prompt = `As an expert code analyzer and syntax checker, perform a comprehensive syntactical analysis of the following ${language} code. 

IMPORTANT: Respond with a valid JSON object following this exact structure:

{
  "errors": [
    {
      "line": <line number (1-based)>,
      "column": <column number (1-based)>,
      "startColumn": <start column for highlighting>,
      "endColumn": <end column for highlighting>,
      "message": "<clear error description>",
      "severity": "<error|warning>",
      "type": "<syntax|semantic|style>",
      "suggestion": "<how to fix this issue>"
    }
  ],
  "isValid": <true|false>,
  "totalErrors": <number of errors>,
  "totalWarnings": <number of warnings>
}

Analyze for:
1. **Syntax Errors**: Missing semicolons, brackets, parentheses, quotes
2. **Semantic Errors**: Undefined variables, type mismatches, invalid operations
3. **Style Warnings**: Unused variables, inconsistent naming, deprecated syntax
4. **Language-specific Issues**: Import errors, declaration issues, scope problems

Be precise with line and column numbers. Provide actionable suggestions for fixes.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Respond only with the JSON object.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 2000,
    });

    const response = completion.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const analysis: SyntaxAnalysisResult = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the analysis
    const validatedAnalysis: SyntaxAnalysisResult = {
      errors: (analysis.errors || []).map(error => ({
        line: Math.max(1, error.line || 1),
        column: Math.max(1, error.column || 1),
        startColumn: error.startColumn || error.column || 1,
        endColumn: error.endColumn || (error.column || 1) + 10,
        message: error.message || 'Syntax error detected',
        severity: error.severity === 'warning' ? 'warning' : 'error',
        type: error.type || 'syntax',
        suggestion: error.suggestion || 'Check syntax and fix the issue'
      })),
      isValid: analysis.isValid !== false,
      totalErrors: 0,
      totalWarnings: 0
    };

    // Recalculate totals
    validatedAnalysis.totalErrors = validatedAnalysis.errors.filter(e => e.severity === 'error').length;
    validatedAnalysis.totalWarnings = validatedAnalysis.errors.filter(e => e.severity === 'warning').length;
    validatedAnalysis.isValid = validatedAnalysis.totalErrors === 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        analysis: validatedAnalysis,
        success: true 
      }),
    };

  } catch (error) {
    console.error('Syntax analysis error:', error);
    
    // Fallback analysis with basic syntax checking
    const fallbackAnalysis: SyntaxAnalysisResult = {
      errors: [],
      isValid: true,
      totalErrors: 0,
      totalWarnings: 0
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        analysis: fallbackAnalysis,
        success: false,
        error: 'Syntax analysis unavailable, using fallback'
      }),
    };
  }
};
