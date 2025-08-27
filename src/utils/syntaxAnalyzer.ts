// GROQ-Based Comprehensive Syntax Error Detection System
// AI-powered syntax analysis similar to IntelliSense functionality

import { getGroqResponse, getGroqSyntaxAnalysis } from './GroqClient';

export interface SyntaxError {
  line: number;
  column: number;
  startColumn?: number; // Optional, for more precise error highlighting
  endLineNumber?: number; // Optional, for multi-line errors
  endColumn?: number; // Optional, for more precise error highlighting
  message: string;
  severity: 'error' | 'warning' | 'info';
  type: 'syntax' | 'semantic' | 'style';
  code?: string; // Error code for categorization
  quickFix?: string; // Suggested fix
}

export interface SyntaxAnalysisResult {
  errors: SyntaxError[];
  warnings: SyntaxError[];
  suggestions: SyntaxError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  analysisTime: number;
  aiAnalysisUsed: boolean;
}

/**
 * GROQ-based syntax analysis prompt template
 */
const getSyntaxAnalysisPrompt = (code: string, language: string): string => {
  return `You are an expert code analyzer with IntelliSense-like capabilities. Analyze the following ${language} code for syntax errors, warnings, and suggestions.

Please provide a comprehensive analysis in the following JSON format:
{
  "errors": [
    {
      "line": number,
      "column": number, 
      "message": "description of error",
      "severity": "error",
      "type": "syntax|semantic|style",
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
      "type": "syntax|semantic|style",
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
${getLanguageSpecificInstructions(language)}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON response without any additional text or markdown formatting.`;
};

/**
 * Get language-specific analysis instructions
 */
function getLanguageSpecificInstructions(language: string): string {
  const instructions: Record<string, string> = {
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
  
  return instructions[language] || 'General syntax and style issues';
}

/**
 * GROQ-powered syntax analysis
 */
export async function analyzeSyntaxErrors(code: string, language: string): Promise<SyntaxAnalysisResult> {
  const startTime = Date.now();
  
  // Early validation
  if (!code || code.trim().length === 0) {
    return {
      errors: [],
      warnings: [],
      suggestions: [],
      hasErrors: false,
      hasWarnings: false,
      analysisTime: Date.now() - startTime,
      aiAnalysisUsed: false
    };
  }

  try {
    // Use dedicated GROQ syntax analysis function
    const aiResponse = await getGroqSyntaxAnalysis(code, language, {
      maxTokens: 2000,
      temperature: 0.1, // Low temperature for consistent analysis
      systemPrompt: `You are a professional code analyzer with expertise in ${language}. Provide accurate, actionable syntax analysis in JSON format.`
    });

    // Parse the AI response
    const analysisResult = parseGroqSyntaxResponse(aiResponse, code);
    
    return {
      ...analysisResult,
      analysisTime: Date.now() - startTime,
      aiAnalysisUsed: true
    };

  } catch (error) {
    console.error('GROQ syntax analysis error:', error);
    
    // Fallback to basic pattern-based analysis if GROQ fails
    const fallbackResult = await performFallbackAnalysis(code, language);
    
    return {
      ...fallbackResult,
      analysisTime: Date.now() - startTime,
      aiAnalysisUsed: false
    };
  }
}

/**
 * Parse GROQ response into structured syntax analysis result
 */
function parseGroqSyntaxResponse(response: string, code: string): Omit<SyntaxAnalysisResult, 'analysisTime' | 'aiAnalysisUsed'> {
  try {
    // Clean the response to extract JSON
    let cleanResponse = response.trim();
    
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON within the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanResponse);
    
    // Validate and structure the response
    const errors: SyntaxError[] = Array.isArray(parsed.errors) ? 
      parsed.errors.map((error: any) => validateSyntaxError(error, code)) : [];
    
    const warnings: SyntaxError[] = Array.isArray(parsed.warnings) ? 
      parsed.warnings.map((warning: any) => validateSyntaxError(warning, code)) : [];
    
    const suggestions: SyntaxError[] = Array.isArray(parsed.suggestions) ? 
      parsed.suggestions.map((suggestion: any) => validateSyntaxError(suggestion, code)) : [];
    
    return {
      errors: errors.filter(Boolean),
      warnings: warnings.filter(Boolean),
      suggestions: suggestions.filter(Boolean),
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0
    };
    
  } catch (parseError) {
    console.error('Failed to parse GROQ syntax response:', parseError);
    
    // Attempt to extract syntax issues from text response
    return parseTextSyntaxResponse(response, code);
  }
}

/**
 * Validate and normalize syntax error objects from AI response
 */
function validateSyntaxError(error: any, code: string): SyntaxError | null {
  try {
    const lines = code.split('\n');
    const lineNumber = Math.max(1, Math.min(error.line || 1, lines.length));
    const line = lines[lineNumber - 1] || '';
    const columnNumber = Math.max(1, Math.min(error.column || 1, line.length + 1));
    
    return {
      line: lineNumber,
      column: columnNumber,
      message: error.message || 'Syntax issue detected',
      severity: ['error', 'warning', 'info'].includes(error.severity) ? error.severity : 'warning',
      type: ['syntax', 'semantic', 'style'].includes(error.type) ? error.type : 'syntax',
      code: error.code || 'SYNTAX_ISSUE',
      quickFix: error.quickFix || undefined
    };
  } catch {
    return null;
  }
}

/**
 * Parse text-based syntax response when JSON parsing fails
 */
function parseTextSyntaxResponse(response: string, code: string): Omit<SyntaxAnalysisResult, 'analysisTime' | 'aiAnalysisUsed'> {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];
  const suggestions: SyntaxError[] = [];
  
  const lines = response.split('\n');
  let currentLine = 1;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Look for line number references
    const lineMatch = trimmed.match(/line\s*(\d+)/i);
    if (lineMatch) {
      currentLine = parseInt(lineMatch[1]);
    }
    
    // Categorize by keywords
    if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('syntax error')) {
      errors.push({
        line: currentLine,
        column: 1,
        message: trimmed,
        severity: 'error',
        type: 'syntax',
        code: 'SYNTAX_ERROR'
      });
    } else if (trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('potential')) {
      warnings.push({
        line: currentLine,
        column: 1,
        message: trimmed,
        severity: 'warning',
        type: 'syntax',
        code: 'SYNTAX_WARNING'
      });
    } else if (trimmed.toLowerCase().includes('suggest') || trimmed.toLowerCase().includes('recommend')) {
      suggestions.push({
        line: currentLine,
        column: 1,
        message: trimmed,
        severity: 'info',
        type: 'style',
        code: 'STYLE_SUGGESTION'
      });
    }
  });
  
  return {
    errors,
    warnings,
    suggestions,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  };
}

/**
 * Fallback analysis when GROQ is unavailable
 */
async function performFallbackAnalysis(code: string, language: string): Promise<Omit<SyntaxAnalysisResult, 'analysisTime' | 'aiAnalysisUsed'>> {
  const errors: SyntaxError[] = [];
  const warnings: SyntaxError[] = [];
  const suggestions: SyntaxError[] = [];
  
  const lines = code.split('\n');
  
  // Basic bracket matching
  const bracketStack: Array<{ char: string; line: number; column: number }> = [];
  const brackets: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  
  lines.forEach((line, lineIndex) => {
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (Object.keys(brackets).includes(char)) {
        bracketStack.push({ char, line: lineIndex + 1, column: i + 1 });
      } else if (Object.values(brackets).includes(char)) {
        const last = bracketStack.pop();
        if (!last) {
          errors.push({
            line: lineIndex + 1,
            column: i + 1,
            message: `Unexpected closing bracket '${char}'`,
            severity: 'error',
            type: 'syntax',
            code: 'UNEXPECTED_BRACKET'
          });
        } else if (brackets[last.char] !== char) {
          errors.push({
            line: lineIndex + 1,
            column: i + 1,
            message: `Mismatched bracket: expected '${brackets[last.char]}' but found '${char}'`,
            severity: 'error',
            type: 'syntax',
            code: 'MISMATCHED_BRACKET'
          });
        }
      }
    }
    
    // Basic language-specific checks
    if (language === 'javascript' || language === 'typescript') {
      // Missing semicolon detection
      if (line.match(/(?:return|var|let|const)\s+[^;{}\n]+$/)) {
        warnings.push({
          line: lineIndex + 1,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning',
          type: 'syntax',
          code: 'MISSING_SEMICOLON',
          quickFix: 'Add semicolon at end of statement'
        });
      }
    } else if (language === 'python') {
      // Missing colon detection
      if (line.match(/^\s*(if|elif|else|for|while|def|class|try|except|finally|with)[^:]*$/)) {
        errors.push({
          line: lineIndex + 1,
          column: line.length,
          message: 'Missing colon',
          severity: 'error',
          type: 'syntax',
          code: 'MISSING_COLON',
          quickFix: 'Add colon at end of statement'
        });
      }
    }
  });
  
  // Check for unclosed brackets
  bracketStack.forEach(unclosed => {
    errors.push({
      line: unclosed.line,
      column: unclosed.column,
      message: `Unclosed bracket '${unclosed.char}'`,
      severity: 'error',
      type: 'syntax',
      code: 'UNCLOSED_BRACKET',
      quickFix: `Add closing '${brackets[unclosed.char]}'`
    });
  });
  
  return {
    errors,
    warnings,
    suggestions,
    hasErrors: errors.length > 0,
    hasWarnings: warnings.length > 0
  };
}

/**
 * Format syntax errors for display
 */
export function formatSyntaxErrors(result: SyntaxAnalysisResult): string[] {
  const formatted: string[] = [];
  
  result.errors.forEach(error => {
    formatted.push(`Line ${error.line}:${error.column} - Error: ${error.message}`);
  });
  
  result.warnings.forEach(warning => {
    formatted.push(`Line ${warning.line}:${warning.column} - Warning: ${warning.message}`);
  });
  
  return formatted;
}

/**
 * Get quick fixes for syntax errors
 */
export function getQuickFixes(result: SyntaxAnalysisResult): string[] {
  const fixes: string[] = [];
  
  [...result.errors, ...result.warnings, ...result.suggestions]
    .filter(item => item.quickFix)
    .forEach(item => {
      fixes.push(`Line ${item.line}: ${item.quickFix}`);
    });
  
  return fixes;
}

/**
 * Get syntax analysis summary
 */
export function getSyntaxSummary(result: SyntaxAnalysisResult): string {
  const { errors, warnings, suggestions, analysisTime, aiAnalysisUsed } = result;
  
  let summary = `Syntax Analysis Complete (${analysisTime}ms)${aiAnalysisUsed ? ' - AI Powered' : ' - Fallback Mode'}\n`;
  summary += `Found: ${errors.length} errors, ${warnings.length} warnings, ${suggestions.length} suggestions\n`;
  
  if (errors.length === 0 && warnings.length === 0) {
    summary += '✅ No syntax issues detected!';
  } else if (errors.length > 0) {
    summary += `🚨 ${errors.length} critical syntax error${errors.length > 1 ? 's' : ''} found`;
  } else {
    summary += `⚠️ ${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`;
  }
  
  return summary;
}