// Frontend API for syntax checking using Groq

export interface SyntaxError {
  line: number;
  column: number;
  startColumn?: number;
  endColumn?: number;
  message: string;
  severity: 'error' | 'warning';
  type: string;
  suggestion?: string;
}

export interface SyntaxAnalysisResult {
  errors: SyntaxError[];
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}

export const checkSyntax = async (code: string, language: string): Promise<SyntaxAnalysisResult> => {
  try {
    const response = await fetch("/.netlify/functions/groq-syntax-checker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      throw new Error(`Syntax check failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.analysis) {
      return data.analysis;
    } else {
      throw new Error('No analysis data received');
    }

  } catch (error) {
    console.error('Syntax checking failed:', error);
    
    // Fallback to basic client-side syntax checking
    return performBasicSyntaxCheck(code, language);
  }
};

// Basic client-side syntax checking as fallback
function performBasicSyntaxCheck(code: string, language: string): SyntaxAnalysisResult {
  const errors: SyntaxError[] = [];
  const lines = code.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 1;
    const trimmed = line.trim();

    // Basic syntax checks based on language
    if (language === 'javascript' || language === 'typescript') {
      // Check for missing semicolons (basic heuristic)
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          !trimmed.includes('//') &&
          trimmed.match(/^(let|const|var|return|throw)\s+/)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          startColumn: line.length,
          endColumn: line.length + 1,
          message: 'Missing semicolon',
          severity: 'warning',
          type: 'syntax',
          suggestion: 'Add a semicolon at the end of this statement'
        });
      }

      // Check for unmatched brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      if (openBrackets !== closeBrackets && trimmed.length > 0) {
        errors.push({
          line: lineNumber,
          column: 1,
          startColumn: 1,
          endColumn: line.length,
          message: 'Possible unmatched brackets',
          severity: 'warning',
          type: 'syntax',
          suggestion: 'Check bracket matching in this line'
        });
      }
    } else if (language === 'python') {
      // Check for missing colons in control structures
      if (trimmed.match(/^(if|for|while|def|class|try|except|with)\s+/) && !trimmed.endsWith(':')) {
        errors.push({
          line: lineNumber,
          column: line.length,
          startColumn: line.length,
          endColumn: line.length + 1,
          message: 'Missing colon',
          severity: 'error',
          type: 'syntax',
          suggestion: 'Add a colon at the end of this statement'
        });
      }
    } else if (language === 'java' || language === 'cpp' || language === 'csharp') {
      // Check for missing semicolons
      if (trimmed && 
          !trimmed.endsWith(';') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('}') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('/*') &&
          trimmed.match(/^(int|string|double|float|boolean|var|final)\s+/)) {
        errors.push({
          line: lineNumber,
          column: line.length,
          startColumn: line.length,
          endColumn: line.length + 1,
          message: 'Missing semicolon',
          severity: 'error',
          type: 'syntax',
          suggestion: 'Add a semicolon at the end of this statement'
        });
      }
    }

    // Universal checks
    // Check for unmatched quotes
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      errors.push({
        line: lineNumber,
        column: line.lastIndexOf("'") + 1,
        startColumn: line.lastIndexOf("'") + 1,
        endColumn: line.lastIndexOf("'") + 2,
        message: 'Unmatched single quote',
        severity: 'error',
        type: 'syntax',
        suggestion: 'Add missing single quote to close the string'
      });
    }

    if (doubleQuotes % 2 !== 0) {
      errors.push({
        line: lineNumber,
        column: line.lastIndexOf('"') + 1,
        startColumn: line.lastIndexOf('"') + 1,
        endColumn: line.lastIndexOf('"') + 2,
        message: 'Unmatched double quote',
        severity: 'error',
        type: 'syntax',
        suggestion: 'Add missing double quote to close the string'
      });
    }
  });

  const totalErrors = errors.filter(e => e.severity === 'error').length;
  const totalWarnings = errors.filter(e => e.severity === 'warning').length;

  return {
    errors,
    isValid: totalErrors === 0,
    totalErrors,
    totalWarnings
  };
}
