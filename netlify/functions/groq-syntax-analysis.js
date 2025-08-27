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
- Unreachable code after return statements
- Misplaced or duplicate import/export statements
- Potential security issues such as use of eval or insecure regex patterns
- Performance pitfalls like excessive DOM access or deep object cloning`,
    
    typescript: `
- All JavaScript issues plus:
- Type annotations and interface compliance
- Missing return type declarations
- Incorrect generic usage
- Access modifier misuse (public/private/protected)
- Import statement syntax and path resolution
- Strict null checks, any-type leaks, and implicit any
- Enum misuse and const enum pitfalls
- Unsafe type assertions and non-exhaustive switch cases`,
    
    python: `
- Indentation errors (critical in Python)
- Missing colons after control structures
- Invalid variable names starting with numbers
- Incorrect function/class definitions
- Import statement issues (circular or unused imports)
- Mixed tabs and spaces
- Misuse of mutable default arguments
- Unhandled exceptions and bare except clauses
- Performance concerns such as inefficient list comprehensions or global variable usage`,
    
    java: `
- Missing semicolons (required in Java)
- Class naming conventions (PascalCase)
- Missing public static void main method
- Access modifier misuse
- Import statement syntax and unused imports
- Bracket matching for methods and classes
- Null-pointer dereference risks
- Incorrect equals/hashCode implementations
- Inefficient string concatenation in loops`,
    
    css: `
- Missing closing braces
- Invalid property syntax
- Missing semicolons after property values
- Incorrect selector specificity or syntax
- Redundant or conflicting properties
- Performance issues with deeply nested selectors`,
    
    html: `
- Unclosed HTML tags
- Invalid attribute syntax
- Missing DOCTYPE declaration
- Incorrect nesting of elements
- Accessibility violations (missing alt, aria- labels)
- Duplicate IDs in the DOM`
  };

  return `You are a **compiler-grade static analysis engine** for ${language}. Parse, type-check, and inspect the code for **syntax**, **semantic**, **type**, **security**, **performance**, and **style** issues.

Output **only** a JSON object in the schema below (no markdown):
{
  "errors": [ { "line": number, "column": number, "message": string, "severity": "error", "type": "syntax|semantic|type|security|performance", "code": string, "quickFix": string } ],
  "warnings": [ { "line": number, "column": number, "message": string, "severity": "warning", "type": "syntax|semantic|type|security|performance|style", "code": string, "quickFix": string } ],
  "suggestions": [ { "line": number, "column": number, "message": string, "severity": "info", "type": "style|performance", "code": string, "quickFix": string } ],
  "securityIssues": [ { "line": number, "column": number, "message": string, "severity": "error|warning", "type": "security", "code": string, "quickFix": string } ],
  "performanceIssues": [ { "line": number, "column": number, "message": string, "severity": "warning|info", "type": "performance", "code": string, "quickFix": string } ]
}

Be exhaustive: list every detected problem.

Pay special attention to ${language}-specific concerns:
${languageInstructions[language] || 'General syntax, semantic, security, and performance best practices'}

Analyse this code:
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