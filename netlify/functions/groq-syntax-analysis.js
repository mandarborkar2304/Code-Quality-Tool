import { Groq } from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Generate syntax analysis prompt for GROQ
 */
function getSyntaxAnalysisPrompt(code, language) {
  const languageInstructions = {
    javascript: `
- Missing semicolons and proper statement termination
- Incorrect use of == vs === 
- Variable hoisting issues with var vs let/const
- Missing break statements in switch cases
- Unclosed template literals and strings
- Function calls missing parentheses
- Assignment in conditional expressions
- Unreachable code after return statements`,
    
    typescript: `
- All JavaScript issues plus:
- Type annotations and interface compliance
- Missing return type declarations
- Incorrect generic usage
- Access modifier usage (public/private/protected)
- Import statement syntax`,
    
    python: `
- Indentation errors (critical in Python)
- Missing colons after control structures
- Invalid variable names starting with numbers
- Incorrect function/class definitions
- Import statement issues
- Mixed tabs and spaces`,
    
    java: `
- Missing semicolons (required in Java)
- Class naming conventions (PascalCase)
- Missing public static void main method
- Access modifier usage
- Import statement syntax
- Bracket matching for methods and classes`,
    
    css: `
- Missing closing braces
- Invalid property syntax
- Missing semicolons after property values
- Incorrect selector syntax`,
    
    html: `
- Unclosed HTML tags
- Invalid attribute syntax
- Missing DOCTYPE declaration
- Incorrect nesting of elements`
  };

  return `You are an expert code analyzer with IntelliSense-like capabilities. Analyze the following ${language} code for syntax errors, warnings, and suggestions.

Please provide a comprehensive analysis in the following JSON format:
{
  "errors": [
    {
      "line": number,
      "column": number, 
      "message": "description of error",
      "severity": "error",
      "type": "syntax",
      "code": "ERROR_CODE",
      "quickFix": "suggested fix"
    }
  ],
  "warnings": [
    {
      "line": number,
      "column": number,
      "message": "description of warning", 
      "severity": "warning",
      "type": "syntax",
      "code": "WARNING_CODE",
      "quickFix": "suggested fix"
    }
  ],
  "suggestions": [
    {
      "line": number,
      "column": number,
      "message": "style or best practice suggestion",
      "severity": "info", 
      "type": "style",
      "code": "SUGGESTION_CODE",
      "quickFix": "suggested improvement"
    }
  ]
}

Focus on detecting:
1. **Syntax Errors**: Missing semicolons, unclosed brackets/braces, invalid variable names, unclosed strings
2. **Semantic Issues**: Undefined variables, unreachable code, assignment in conditions
3. **Style Issues**: Code formatting, best practices, performance optimizations

For ${language}, pay special attention to:
${languageInstructions[language] || 'General syntax and style issues'}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON response without any additional text or markdown formatting.`;
}

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { code, language, config = {} } = JSON.parse(event.body);

    if (!code || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing code or language parameter' })
      };
    }

    // Generate syntax analysis prompt
    const prompt = getSyntaxAnalysisPrompt(code, language);

    // Call GROQ API for syntax analysis
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: config.systemPrompt || `You are a professional code analyzer with expertise in ${language}. Provide accurate, actionable syntax analysis in JSON format.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant', // Fast model for syntax analysis
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.1,
      top_p: 1,
      stream: false
    });

    const analysis = completion.choices[0]?.message?.content || '{"errors": [], "warnings": [], "suggestions": []}';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        analysis,
        usage: completion.usage,
        model: 'llama-3.1-8b-instant'
      })
    };

  } catch (error) {
    console.error('GROQ syntax analysis error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Syntax analysis failed',
        analysis: '{"errors": [], "warnings": [], "suggestions": []}' // Fallback empty analysis
      })
    };
  }
};