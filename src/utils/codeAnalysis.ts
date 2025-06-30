import { CodeViolations } from '@/types';
import { TestCase } from '@/types';
import { ReliabilityIssue } from '@/types';
import { analyzeCodeViolations, formatViolationsReport } from '@/utils/quality/violationsFramework';
import { getGroqResponse, getTestCaseRecommendations, getComprehensiveCodeAnalysis, AICodeAnalysisResult } from './GroqClient';
import { calculateCyclomaticComplexity, calculateMaintainability } from './codeMetrics';
import { analyzeSyntaxErrors, formatSyntaxErrors, getQuickFixes, SyntaxAnalysisResult } from './syntaxAnalyzer';

// Quality Rules Configuration
export const rules = {
  cyclomaticComplexity: {
    warnThreshold: 10,
    failThreshold: 15
  },
  functionLength: {
    warnThreshold: 25,
    failThreshold: 40
  },
  nestingDepth: {
    warnThreshold: 4,
    failThreshold: 6
  },
  commentDensity: {
    warnThresholdPercent: 10,
    failThresholdPercent: 5
  },
  noGlobalVariables: {
    enabled: true
  },
  nestingRules: {
    exemptPatterns: [
      // Functional patterns that shouldn't count as nesting
      "\\.map\\s*\\(",
      "\\.filter\\s*\\(",
      "\\.reduce\\s*\\(",
      "\\.forEach\\s*\\(",
      "\\.then\\s*\\("
    ]
  },
  customSmells: [
    {
      id: "magic-numbers",
      pattern: "\\b(?<!\\.)\\d{2,}\\b(?!\\.)",
      message: "Magic number detected - consider using named constants",
      severity: "minor" as 'major' | 'minor'
    },
    {
      id: "no-console-log",
      pattern: "console\\.log\\s*\\(",
      message: "Console.log found - remove debug statements from production code",
      severity: "minor" as 'major' | 'minor'
    },
    {
      id: "single-letter-var",
      pattern: "\\b(?:let|const|var)\\s+[a-zA-Z]\\b",
      message: "Single letter variables reduce code readability",
      severity: "minor" as 'major' | 'minor'
    },
    {
      id: "no-todo-fixme",
      pattern: "(?://|/\\*|#).*(?:TODO|FIXME|XXX)",
      message: "TODO/FIXME comments found - resolve before production",
      severity: "minor" as 'major' | 'minor'
    },
    {
      id: "redundant-computation",
      pattern: "(?:Math\\.\\w+\\([^)]+\\)|\\w+\\s*\\*\\s*\\w+|\\w+\\s*\\+\\s*\\w+).*(?:Math\\.\\w+\\([^)]+\\)|\\w+\\s*\\*\\s*\\w+|\\w+\\s*\\+\\s*\\w+)",
      message: "Potential redundant computation detected",
      severity: "minor" as 'major' | 'minor'
    }
  ],
  unhandledExceptions: {
    enabled: true,
    riskOperations: [
      {
        id: "json-parse",
        pattern: "JSON\\.parse\\s*\\(",
        message: "Unhandled JSON.parse could throw on invalid JSON",
        languages: ["javascript", "typescript", "nodejs"]
      },
      {
        id: "file-system",
        pattern: "fs\\.\\w+Sync\\s*\\(",
        message: "Unhandled synchronous file operations may throw exceptions",
        languages: ["javascript", "typescript", "nodejs", "java"]
      },
      {
        id: "null-unsafe",
        pattern: "\\.\\w+\\s*\\(",
        message: "Potential null/undefined property access without checks",
        languages: ["javascript", "typescript", "nodejs"]
      },
      {
        id: "array-unsafe",
        pattern: "\\b\\w+\\[\\w+\\]",
        message: "Array access without bounds checking",
        languages: ["javascript", "typescript", "nodejs", "java", "python"]
      },
      {
        id: "explicit-throw",
        pattern: "throw\\s+new\\s+\\w+",
        message: "Explicit throw statement not within try-catch",
        languages: ["javascript", "typescript", "nodejs", "java"]
      },
      {
        id: "await-without-catch",
        pattern: "await\\s+\\w+",
        message: "Awaited promise without error handling",
        languages: ["javascript", "typescript", "nodejs"]
      },
      {
        id: "java-arithmetic",
        pattern: "\\w+\\s*/\\s*\\w+",
        message: "Division operation may cause ArithmeticException if divisor is zero",
        languages: ["java"]
      },
      {
        id: "java-null-pointer",
        pattern: "(?<!arr|s)\\.\\w+\\(",
        message: "Potential NullPointerException without null check",
        languages: ["java"]
      },
      {
        id: "java-array-index",
        pattern: "\\w+\\[\\w+\\]",
        message: "Potential ArrayIndexOutOfBoundsException without bounds check",
        languages: ["java"]
      },
      {
        id: "java-cast",
        pattern: "\\([A-Z][A-Za-z0-9_]*\\)\\s*\\w+",
        message: "Type casting may cause ClassCastException",
        languages: ["java"]
      },
      {
        id: "java-throw",
        pattern: "throw\\s+new\\s+\\w+",
        message: "Exception thrown without being caught or declared",
        languages: ["java"]
      }
    ]
  }
};

// Primary AI-driven analysis (recommended)
export const analyzeCode = async (code: string, language: string = 'javascript') => {
  // Use the deep analysis with AI integration directly
  return await analyzeCodeDeep(code, language);
};

// Legacy static analysis interface
export const analyzeCodeStatic = (code: string, language: string = 'javascript') => {
  // Delegate all static code violation analysis
  const violationResult = analyzeCodeViolations(code, language);
  const report = formatViolationsReport(violationResult);
  return {
    violationResult,
    report,
  };
};

// Extract variables that are bounded in loops
const extractBoundedVariables = (lines: string[], language: string): string[] => {
  const boundedVars: string[] = [];
  
  // Extract variables from for loop conditions
  for (const line of lines) {
    if (language === 'java') {
      // Match Java for loop structure: for(int i = 0; i < n; i++)
      const forMatches = line.match(/for\s*\(\s*(?:int|long|short|byte)\s+(\w+)\s*=.+?\s*(?:\+\+|--)\s*\)/);
      if (forMatches && forMatches[1]) {
        boundedVars.push(forMatches[1]);
      }
    } else {
      // Match JavaScript/TypeScript for loop: for(let i = 0; i < arr.length; i++)
      const forMatches = line.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s*=.+?\s*(?:\+\+|--)\s*\)/);
      if (forMatches && forMatches[1]) {
        boundedVars.push(forMatches[1]);
      }
    }
    
    // Match for...of loops: for (const item of items)
    const forOfMatches = line.match(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of/);
    if (forOfMatches && forOfMatches[1]) {
      boundedVars.push(forOfMatches[1]);
    }
    
    // Match for...in loops: for (const key in object)
    const forInMatches = line.match(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+in/);
    if (forInMatches && forInMatches[1]) {
      boundedVars.push(forInMatches[1]);
    }
    
    // Match array.forEach: array.forEach((item, index) => {...})
    const forEachMatches = line.match(/forEach\s*\(\s*(?:\([^)]*\)|(\w+))\s*=>/);
    if (forEachMatches && forEachMatches[1]) {
      boundedVars.push(forEachMatches[1]);
    }
    
    // Match Java enhanced for loop: for (Type item : items)
    if (language === 'java') {
      const enhancedForMatches = line.match(/for\s*\(\s*\w+\s+(\w+)\s*:/);
      if (enhancedForMatches && enhancedForMatches[1]) {
        boundedVars.push(enhancedForMatches[1]);
      }
    }
    
    // Enhanced detection for array method callbacks
    const arrayMethodMatches = line.match(/\.(?:forEach|map|filter|reduce|some|every|find)\s*\(\s*(?:function\s*\(\s*(\w+)|\(\s*(\w+)\s*(?:,\s*(\w+))?\s*\)\s*=>)/);
    if (arrayMethodMatches) {
      if (arrayMethodMatches[1]) boundedVars.push(arrayMethodMatches[1]);
      if (arrayMethodMatches[2]) boundedVars.push(arrayMethodMatches[2]);
      if (arrayMethodMatches[3]) boundedVars.push(arrayMethodMatches[3]);
    }
  }
  
  return boundedVars;
};

// Extract variables that have null checks
const extractNullCheckedVariables = (lines: string[], language: string): string[] => {
  const nullCheckedVars: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for null checks like: if (var != null), if (var !== null), etc.
    const nullCheckMatches = line.match(/if\s*\(\s*(\w+)\s*(?:!=|!==)\s*null\s*\)/);
    if (nullCheckMatches && nullCheckMatches[1]) {
      nullCheckedVars.push(nullCheckMatches[1]);
    }
    
    // Check for null checks like: if (null != var), if (null !== var), etc.
    const reversedNullCheckMatches = line.match(/if\s*\(\s*null\s*(?:!=|!==)\s*(\w+)\s*\)/);
    if (reversedNullCheckMatches && reversedNullCheckMatches[1]) {
      nullCheckedVars.push(reversedNullCheckMatches[1]);
    }
    
    // Check for Objects.nonNull(var)
    if (language === 'java') {
      const objectsNonNullMatches = line.match(/Objects\.nonNull\s*\(\s*(\w+)\s*\)/);
      if (objectsNonNullMatches && objectsNonNullMatches[1]) {
        nullCheckedVars.push(objectsNonNullMatches[1]);
      }
    }
    
    // Check for Optional checks in Java
    if (language === 'java' && line.includes('Optional')) {
      const optionalMatches = line.match(/(\w+)\.isPresent\(\)/);
      if (optionalMatches && optionalMatches[1]) {
        nullCheckedVars.push(optionalMatches[1]);
      }
    }
    
    // Add detection for optional chaining and nullish coalescing
    const optionalChainingMatches = line.match(/(\w+)\?\./g);
    if (optionalChainingMatches) {
      optionalChainingMatches.forEach(match => {
        const varMatch = match.match(/(\w+)\?\./);
        if (varMatch && varMatch[1]) {
          nullCheckedVars.push(varMatch[1]);
        }
      });
    }
    
    const nullishCoalescingMatches = line.match(/(\w+)\s*\?\?\s*/g);
    if (nullishCoalescingMatches) {
      nullishCoalescingMatches.forEach(match => {
        const varMatch = match.match(/(\w+)\s*\?\?\s*/);
        if (varMatch && varMatch[1]) {
          nullCheckedVars.push(varMatch[1]);
        }
      });
    }
  }
  
  return nullCheckedVars;
};

// Extract variables that have zero checks
const extractZeroCheckedVariables = (lines: string[], language: string): string[] => {
  const zeroCheckedVars: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for zero checks like: if (var != 0), if (var !== 0), etc.
    const zeroCheckMatches = line.match(/if\s*\(\s*(\w+)\s*(?:!=|!==|>)\s*0\s*\)/);
    if (zeroCheckMatches && zeroCheckMatches[1]) {
      zeroCheckedVars.push(zeroCheckMatches[1]);
    }
    
    // Check for reversed zero checks like: if (0 != var), if (0 !== var), etc.
    const reversedZeroCheckMatches = line.match(/if\s*\(\s*0\s*(?:!=|!==|<)\s*(\w+)\s*\)/);
    if (reversedZeroCheckMatches && reversedZeroCheckMatches[1]) {
      zeroCheckedVars.push(reversedZeroCheckMatches[1]);
    }
    
    // Check for non-zero validation before division
    const divChecks = line.match(/if\s*\(\s*(\w+)\s*(?:!=|!==|>)\s*0\s*\)[^;]*\/\s*\1/);
    if (divChecks && divChecks[1]) {
      zeroCheckedVars.push(divChecks[1]);
    }
  }
  
  return zeroCheckedVars;
};

// Extract main function input parameters
const extractMainFunctionInputs = (lines: string[], language: string): string[] => {
  const mainFunctionInputs: string[] = [];
  
  // Look for main method declaration
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (language === 'java') {
      // Java main method: public static void main(String[] args)
      const mainMethodMatch = line.match(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s*(\w+)/);
      if (mainMethodMatch && mainMethodMatch[1]) {
        mainFunctionInputs.push(mainMethodMatch[1]);
      }
    } else {
      // JavaScript/TypeScript main function: function main(args)
      const mainFunctionMatch = line.match(/function\s+main\s*\(\s*(\w+)/);
      if (mainFunctionMatch && mainFunctionMatch[1]) {
        mainFunctionInputs.push(mainFunctionMatch[1]);
      }
      
      // Check for default exported function or arrow function
      const exportDefaultMatch = line.match(/export\s+default\s+(?:function)?\s*\(\s*(\w+)/);
      if (exportDefaultMatch && exportDefaultMatch[1]) {
        mainFunctionInputs.push(exportDefaultMatch[1]);
      }
    }
  }
  
  return mainFunctionInputs;
};

// Extract function parameters from a function declaration
const extractFunctionParameters = (line: string, language: string): string[] => {
  const params: string[] = [];
  
  if (language === 'java') {
    // Java method parameters: methodName(Type param1, Type param2)
    const paramMatch = line.match(/\(\s*([^)]+)\s*\)/);
    if (paramMatch && paramMatch[1]) {
      const paramList = paramMatch[1].split(',');
      for (const param of paramList) {
        const paramNameMatch = param.trim().match(/\w+\s+(\w+)(?:\s*=.*)?$/);
        if (paramNameMatch && paramNameMatch[1]) {
          params.push(paramNameMatch[1]);
        }
      }
    }
  } else {
    // JavaScript/TypeScript function parameters: function name(param1, param2)
    const paramMatch = line.match(/\(\s*([^)]*)\s*\)/);
    if (paramMatch && paramMatch[1]) {
      const paramList = paramMatch[1].split(',');
      for (const param of paramList) {
        const trimmedParam = param.trim();
        if (trimmedParam) {
          // Handle destructuring, defaults, and type annotations
          const paramNameMatch = trimmedParam.match(/(?:const|let|var)?\s*(?:\{[^}]*\}|\[[^\]]*\]|(\w+))(?:\s*:[^=,]+)?(?:\s*=.*)?/);
          if (paramNameMatch && paramNameMatch[1]) {
            params.push(paramNameMatch[1]);
          }
        }
      }
    }
  }
  
  return params;
};

// Extract variable declarations from a line of code
const extractVariableDeclarations = (line: string, language: string): string[] => {
  const vars: string[] = [];
  
  if (language === 'java') {
    // Java variable declarations: Type varName = value;
    const varMatches = line.match(/(?:int|long|float|double|String|boolean|char|byte|short)\s+(\w+)(?:\s*=.*)?;/g);
    if (varMatches) {
      for (const match of varMatches) {
        const nameMatch = match.match(/\s+(\w+)(?:\s*=.*)?;/);
        if (nameMatch && nameMatch[1]) {
          vars.push(nameMatch[1]);
        }
      }
    }
  } else {
    // JavaScript/TypeScript variable declarations: let/const/var varName = value;
    const varMatches = line.match(/(?:let|const|var)\s+(\w+)(?:\s*=.*)?(?:;|$)/g);
    if (varMatches) {
      for (const match of varMatches) {
        const nameMatch = match.match(/\s+(\w+)(?:\s*=.*)?(?:;|$)/);
        if (nameMatch && nameMatch[1]) {
          vars.push(nameMatch[1]);
        }
      }
    }
  }
  
  return vars;
};

// Extract variables used in loops
const extractLoopVariables = (code: string, language: string): string[] => {
  const loopVars: string[] = [];
  
  // For regular for loops
  const forLoopMatches = code.match(/for\s*\(\s*(?:let|var|const|int|long)\s+(\w+)\s*=/g);
  if (forLoopMatches) {
    for (const match of forLoopMatches) {
      const varMatch = match.match(/\s+(\w+)\s*=$/);
      if (varMatch && varMatch[1]) {
        loopVars.push(varMatch[1]);
      }
    }
  }
  
  // For for-of and for-in loops
  const forOfInMatches = code.match(/for\s*\(\s*(?:let|var|const)\s+(\w+)\s+(?:of|in)/g);
  if (forOfInMatches) {
    for (const match of forOfInMatches) {
      const varMatch = match.match(/\s+(\w+)\s+(?:of|in)$/);
      if (varMatch && varMatch[1]) {
        loopVars.push(varMatch[1]);
      }
    }
  }
  
  // For Java enhanced for loops
  if (language === 'java') {
    const enhancedForMatches = code.match(/for\s*\(\s*\w+\s+(\w+)\s*:/g);
    if (enhancedForMatches) {
      for (const match of enhancedForMatches) {
        const varMatch = match.match(/\s+(\w+)\s*:$/);
        if (varMatch && varMatch[1]) {
          loopVars.push(varMatch[1]);
        }
      }
    }
  }
  
  return loopVars;
};

// Find the nearby method signature for a line of code
const findNearbyMethodSignature = (lines: string[], currentLineIndex: number, lookbackLines: number): string | null => {
  // Look backward from current line to find method signature
  for (let i = currentLineIndex; i >= Math.max(0, currentLineIndex - lookbackLines); i--) {
    const line = lines[i];
    if (/(?:public|private|protected)(?:\s+static)?\s+\w+\s+\w+\s*\(/.test(line)) {
      return line;
    }
  }
  
  return null;
};

// Find try-catch blocks in code with improved scope detection
function findTryCatchBlocks(lines: string[]): {start: number, end: number, scope: string[]}[] {
  const tryCatchBlocks: {start: number, end: number, scope: string[]}[] = [];
  let inTryBlock = false;
  let tryStartLine = 0;
  let braceCounter = 0;
  let scopeVars: string[] = [];
   
  lines.forEach((line, i) => {
    if (line.includes('try')) {
      inTryBlock = true;
      tryStartLine = i;
      braceCounter = 1;
      
      // Extract variables in the scope by looking ahead
      const scopeLines = lines.slice(i, Math.min(i + 10, lines.length));
      scopeVars = extractVariablesInScope(scopeLines);
    } else if (inTryBlock) {
      // Count braces to find the end of the try-catch block
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCounter += openBraces - closeBraces;
      
      // When we've reached the end of the try-catch block
      if (braceCounter === 0 && line.includes('}')) {
        tryCatchBlocks.push({ start: tryStartLine, end: i, scope: scopeVars });
        inTryBlock = false;
      }
    }
  });
  
  return tryCatchBlocks;
}

// New helper: Extract variables used within a scope
function extractVariablesInScope(lines: string[]): string[] {
  const scopeVars: string[] = [];
  const variablePattern = /(?:const|let|var)\s+(\w+)\s*=?/g;
  
  lines.forEach(line => {
    let match;
    while ((match = variablePattern.exec(line)) !== null) {
      if (match[1]) scopeVars.push(match[1]);
    }
    
    // Also check for parameters in function definitions
    const functionParamMatch = line.match(/function\s+\w+\s*\(\s*([^)]*)\s*\)/);
    if (functionParamMatch && functionParamMatch[1]) {
      const params = functionParamMatch[1].split(',').map(param => param.trim().split(' ')[0].split(':')[0]);
      scopeVars.push(...params);
    }
    
    // Check for arrow function parameters
    const arrowFnMatch = line.match(/\(\s*([^)]*)\s*\)\s*=>/);
    if (arrowFnMatch && arrowFnMatch[1]) {
      const params = arrowFnMatch[1].split(',').map(param => param.trim().split(' ')[0].split(':')[0]);
      scopeVars.push(...params);
    }
  });
  
  return scopeVars.filter(v => v && v !== 'function');
}

// Enhanced nestingDepth calculator - ignores functional patterns
function calculateActualNestingDepth(code: string): number {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  const exemptPatterns = rules.nestingRules.exemptPatterns;
  
  for (const line of lines) {
    // Skip lines that match exempt patterns (functional programming constructs)
    if (exemptPatterns.some(pattern => new RegExp(pattern).test(line))) {
      continue;
    }
    
    // Count opening braces as nesting depth increments
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    currentDepth += openBraces - closeBraces;
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  
  return maxDepth;
}

// Analyze code for issues with line references - enhanced with precise context awareness
export const analyzeCodeForIssues = (code: string, language: string = 'javascript'): { details: string[], lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] } => {
  const issues: string[] = [];
  const lineReferences: { line: number, issue: string, severity: 'major' | 'minor' }[] = [];
  const lines = code.split('\n');
  
  // Skip analysis for very simple code
  const hasControlFlow = code.includes('if') || code.includes('for') || code.includes('while');
  if (!hasControlFlow && lines.length < 15) {
    return { details: [], lineReferences: [] };
  }

  // Find initialization and bounds context to prevent false positives
  const boundedLoopVars = new Set(extractBoundedVariables(lines, language));
  const nullProtectedVars = new Set(extractNullCheckedVariables(lines, language));
  const zeroCheckedVars = new Set(extractZeroCheckedVariables(lines, language));
  const mainFunctionInputs = new Set(extractMainFunctionInputs(lines, language));
  
  // Find variables protected by optional chaining or nullish coalescing
  const safeNullHandling = lines.some(line => line.includes('?.') || line.includes('??'));
  
  // Find try-catch blocks with enhanced scope awareness
  const tryCatchBlocks = findTryCatchBlocks(lines);
  
  // Collect function information for context
  let currentFunction = 0;
  let inFunction = false;
  let functionStartLine = 0;
  let currentFunctionName = "";
  let currentFunctionVars: string[] = [];

  // Track main computation methods for correctly positioning error handling warnings
  let mainComputeMethodLines: number[] = [];

  // Check for long functions and track context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Different function detection based on language
    const isFunctionStart = language === 'java' ? 
      (line.includes('void') || line.includes('public') || line.includes('private') || line.includes('protected')) && line.includes('(') && line.includes(')') && !line.includes(';') : 
      (line.includes('function') || line.includes('=>')) && !line.includes('//');
    
    if (isFunctionStart) {
      inFunction = true;
      currentFunction = 0;
      functionStartLine = i + 1;
      
      // Extract function/method name for better context
      if (language === 'java') {
        const methodMatch = line.match(/(?:public|private|protected)(?:\s+static)?\s+\w+\s+(\w+)\s*\(/);
        if (methodMatch && methodMatch[1]) {
          currentFunctionName = methodMatch[1];
          // Identify main compute methods in Java
          if (currentFunctionName.match(/compute|calculate|solve|process|main/i)) {
            mainComputeMethodLines.push(functionStartLine);
          }
        }
      }
      
      currentFunctionVars = extractFunctionParameters(line, language);
    }

    // Detect variable declarations in function scope
    if (inFunction) {
      const varDeclarations = extractVariableDeclarations(line, language);
      currentFunctionVars.push(...varDeclarations);
      
      currentFunction++;
      if (line.includes('}') && line.trim() === '}') {
        inFunction = false;
        if (currentFunction > rules.functionLength.warnThreshold) {
          const issue = `Function length exceeds ${rules.functionLength.warnThreshold} lines (${currentFunction} lines) - consider breaking down into smaller functions`;
          issues.push(issue);
          lineReferences.push({ 
            line: functionStartLine, 
            issue: `Long function (${currentFunction} lines)`, 
            severity: currentFunction > rules.functionLength.failThreshold ? 'major' : 'minor'
          });
        }
      }
    }
  }

  // Check for deep nesting with improved context tracking
  let maxNesting = 0;
  let currentNesting = 0;
  let nestingLines: Map<number, number> = new Map(); // line -> nesting level
  let nestingBlocks: Map<number, { start: number, end: number }[]> = new Map(); // nesting level -> blocks

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closedBraces = (line.match(/}/g) || []).length;

    // Track opening braces
    for (let j = 0; j < openBraces; j++) {
      currentNesting++;
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        nestingLines.set(i + 1, currentNesting);

        // Track blocks at each nesting level for deduplication
        if (!nestingBlocks.has(currentNesting)) {
          nestingBlocks.set(currentNesting, []);
        }
        nestingBlocks.get(currentNesting)!.push({
          start: i + 1,
          end: -1 // Will be set when the brace is closed
        });
      }
    }

    maxNesting = Math.max(maxNesting, currentNesting);

    // Track closing braces
    for (let j = 0; j < closedBraces; j++) {
      // Update end line for nesting blocks
      if (currentNesting > rules.nestingDepth.warnThreshold) {
        const blocks = nestingBlocks.get(currentNesting);
        if (blocks && blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock.end === -1) {
            lastBlock.end = i + 1;
          }
        }
      }
      currentNesting--;
    }
  }

  // Add deep nesting warnings with improved deduplication
  if (maxNesting > rules.nestingDepth.warnThreshold) {
    const uniqueNestingStarts = new Set<number>();

    nestingBlocks.forEach((blocks) => {
      blocks.forEach(block => {
        uniqueNestingStarts.add(block.start);
      });
    });

    // Always treat deep nesting as major
    uniqueNestingStarts.forEach(line => {
      const nestingLevel = nestingLines.get(line) || 0;
      if (nestingLevel > rules.nestingDepth.warnThreshold) {
        lineReferences.push({
          line,
          issue: `Deep nesting (level ${nestingLevel}) - consider extracting nested blocks into helper methods`,
          severity: 'major'
        });
      }
    });

    issues.push(`Nesting level exceeds ${rules.nestingDepth.warnThreshold} (max: ${maxNesting}) - consider restructuring to reduce complexity`);
  }

  // Check for error handling based on main computation methods
  const needsErrorHandling = hasControlFlow && code.length > 100;
  const hasTryCatch = code.includes('try') && code.includes('catch');

  if (needsErrorHandling && !hasTryCatch) {
    const issue = "No error handling mechanisms (try-catch) detected in complex code";
    issues.push(issue);

    // Anchor the warning directly to the compute method declaration line
    const computeLine = lines.findIndex(l => 
      /public\s+static\s+\w+\s+compute/.test(l) || 
      /private\s+\w+\s+compute/.test(l) || 
      /public\s+\w+\s+calculate/.test(l) ||
      /function\s+compute/.test(l) ||
      /const\s+compute/.test(l)
    ) + 1 || 1;
    
    lineReferences.push({
      line: computeLine,
      issue: "Missing error handling - consider adding try-catch blocks for robust code",
      severity: 'major'
    });
  }

  // Check comment density with same logic as before
  if (lines.length > 20) {
    const commentLines = lines.filter(line =>
      line.trim().startsWith('//') ||
      line.trim().startsWith('/*') ||
      line.trim().startsWith('*')
    ).length;

    const commentRatio = commentLines / lines.length;
    if (commentRatio < rules.commentDensity.failThresholdPercent / 100) {
      const issue = `Low comment-to-code ratio (${(commentRatio * 100).toFixed(1)}% < ${rules.commentDensity.failThresholdPercent}%) - consider adding more documentation`;
      issues.push(issue);
      lineReferences.push({
        line: 1,
        issue: "Insufficient comments - add documentation for better maintainability",
        severity: 'minor'
      });
    }
  }

  // Check for single-letter variable names with improved exemption logic
  const exemptVars = new Set(['i', 'j', 'k', 'n', 'm']);
  const varPatternByLanguage = language === 'java' ?
    /\b(int|double|String|boolean|char|float|long)\s+([a-zA-Z]{1})\b/ :
    /\b(var|let|const)\s+([a-zA-Z]{1})\b/;

  // Track already reported single-letter variables to avoid duplicates
  const reportedShortVars = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const shortVarMatch = line.match(varPatternByLanguage);
    if (shortVarMatch) {
      const varName = shortVarMatch[2];

      // Skip if already reported or is an exempt loop variable
      if (!reportedShortVars.has(varName) && !exemptVars.has(varName)) {
        const isLoopVar = (line.includes('for') || boundedLoopVars.has(varName));

        if (!isLoopVar) {
          const issue = `Single-letter variable name "${varName}" detected - use descriptive naming for better readability`;
          issues.push(issue);
          lineReferences.push({
            line: i + 1,
            issue: `Short variable name "${varName}" - use descriptive names`,
            severity: 'minor'
          });

          reportedShortVars.add(varName);
        }
      }
    }
  }

  // Check for magic numbers with improved deduplication
  if (lines.length > 10) {
    // Map to track magic numbers by their actual value to avoid duplicates
    const magicNumbersByValue = new Map<string, Set<number>>(); // value -> line numbers
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comments, string literals, and typical test case input
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      const isStringLiteral = line.includes('"') || line.includes("'");
      const isTypicalIntInput = line.includes("Scanner") || line.includes("BufferedReader") ||
                             line.includes("readLine") || line.includes("parseInt") ||
                             line.includes("nextInt");
                              
      if (!isComment && !isTypicalIntInput) {
        // Match numbers not part of identifiers or decimal points
        const magicNumberMatches = line.match(/[^a-zA-Z0-9_\.]([3-9]|[1-9][0-9]+)(?![a-zA-Z0-9_\.])/g);
        
        if (magicNumberMatches) {
          magicNumberMatches.forEach(match => {
            // Extract just the number part
            const numMatch = match.match(/([3-9]|[1-9][0-9]+)/);
            if (numMatch) {
              const numValue = numMatch[1];
              
              // Skip if in a string context
              if (isStringLiteral && (line.indexOf('"' + numValue) >= 0 || line.indexOf("'" + numValue) >= 0)) {
                return;
              }
              
              // Track this number by value
              if (!magicNumbersByValue.has(numValue)) {
                magicNumbersByValue.set(numValue, new Set());
              }
              magicNumbersByValue.get(numValue)!.add(i + 1);
            }
          });
        }
      }
    }
    
    // Report only the first occurrence of each unique magic number
    magicNumbersByValue.forEach((lineSet, value) => {
      // Only report if there are lines containing this magic number
      if (lineSet.size > 0) {
        const firstLine = Math.min(...Array.from(lineSet));
        lineReferences.push({ 
          line: firstLine, 
          issue: `Magic number ${value} - replace with named constant`, 
          severity: 'minor' 
        });
      }
    });
    
    if (magicNumbersByValue.size > 0) {
      issues.push(`Magic numbers detected (${magicNumbersByValue.size} unique constants) - consider using named constants`);
    }
  }

  // Create a map to deduplicate similar issues
  const exceptionIssueMap = new Map<string, { count: number; lines: Set<number> }>();

  // Analyze for unhandled exceptions with improved context awareness
  if (rules.unhandledExceptions.enabled) {
    // Check for risky operations outside try-catch blocks
    rules.unhandledExceptions.riskOperations
      .filter(operation => !operation.languages || operation.languages.includes(language))
      .forEach(operation => {
        const regex = new RegExp(operation.pattern);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip comments
          if (
            line.trim().startsWith('//') ||
            line.trim().startsWith('*') ||
            line.trim().startsWith('/*')
          ) {
            continue;
          }

          if (regex.test(line)) {
            // Check if this line is within a try-catch block
            const isInTryCatch = tryCatchBlocks.some(block => {
              const isInBlock = i >= block.start && i <= block.end;
              if (!isInBlock) return false;
              
              // For more precision, check if variables in this line are in the try-catch scope
              const variablesInLine = extractVariablesInLine(line);
              return variablesInLine.some(v => block.scope.includes(v));
            });

            // Enhanced context check for different operation types
            if (!isInTryCatch && shouldFlagRiskyOperation(
              line,
              operation.id,
              boundedLoopVars,
              nullProtectedVars,
              mainFunctionInputs,
              zeroCheckedVars,
              safeNullHandling
            )) {
              const key = operation.id;

              if (!exceptionIssueMap.has(key)) {
                exceptionIssueMap.set(key, { count: 0, lines: new Set() });
              }

              const entry = exceptionIssueMap.get(key)!;
              entry.count++;
              entry.lines.add(i + 1);
            }
          }
        }
      });

    // Push aggregated exception issues
    exceptionIssueMap.forEach((entry, key) => {
      const operation = rules.unhandledExceptions.riskOperations.find(op => op.id === key);
      if (operation) {
        const description = operation.message || `Potential unhandled exception: ${key}`;
        issues.push(description);

        // Report first few lines for clarity
        const lineList = Array.from(entry.lines).slice(0, 3);
        lineList.forEach(line => {
          lineReferences.push({
            line,
            issue: description,
            severity: 'major'
          });
        });
      }
    });
  }

  // Add exactly one issue per line with proper prioritization
  const lineToIssue = new Map<number, { message: string, severity: 'major' | 'minor' }>();

  // Process each issue type
  exceptionIssueMap.forEach((value, key) => {
    const operation = rules.unhandledExceptions.riskOperations.find(op => op.id === key);
    if (operation) {
      // Add summarized issue to the issues list
      const issue = `${operation.message} (found in ${value.count} locations)`;
      issues.push(issue);

      // Add line references, but ensure only one issue per line with correct prioritization
      Array.from(value.lines).forEach(line => {
        const existing = lineToIssue.get(line);
        
        if (!existing || existing.severity === 'minor') {
          lineToIssue.set(line, {
            message: operation.message,
            severity: 'major'  // Treat all unhandled exceptions as major
          });
        }
      });
    }
  });

  // Convert deduplicated issues to line references
  lineToIssue.forEach((value, line) => {
    lineReferences.push({
      line,
      issue: value.message,
      severity: value.severity
    });
  });

  // Check for redundant loops or inefficient computations
  const redundantComputationIssues = new Map<number, string>();
  
  for (let i = 0; i < lines.length; i++) {
    const nextFewLines = lines.slice(i, i + 5).join('\n');
    
    // Check for nested loops with potential redundant computation
    if (/for\s*\([^)]+\)\s*{[^}]*for\s*\([^)]+\)/.test(nextFewLines) && !nextFewLines.includes('//')) {
      const innerVars = extractLoopVariables(nextFewLines, language);
      const outerVars = extractLoopVariables(lines[i], language);
      
      // Check if loops have dependency that could be optimized
      const hasRedundancy = innerVars.some(v => outerVars.includes(v));
      
      if (hasRedundancy) {
        // Only flag the outer loop start to avoid duplication
        redundantComputationIssues.set(i + 1, "Potential inefficient nested loops - check for redundant computation");
      }
    }
  }
  
  redundantComputationIssues.forEach((issue, line) => {
    lineReferences.push({
      line,
      issue,
      severity: 'major'
    });
  });
  
  // Analyze for custom code smells with improved deduplication
  const customSmellLines = new Map<string, Set<number>>();
  
  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, "g");
    lines.forEach((line, idx) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      if (regex.test(line) && !isComment) {
        const key = smell.id;
        
        if (!customSmellLines.has(key)) {
          customSmellLines.set(key, new Set());
        }
        
        const lineSet = customSmellLines.get(key)!;
        lineSet.add(idx + 1);
      }
    });
  });
  
  // Add only first occurrence of each smell type
  customSmellLines.forEach((lineSet, smellId) => {
    if (lineSet.size > 0) {
      const smell = rules.customSmells.find(s => s.id === smellId);
      if (smell) {
        // Add the issue description once
        issues.push(smell.message);
        
        // Report only the first occurrence
        const firstLine = Math.min(...Array.from(lineSet));
        lineReferences.push({ 
          line: firstLine, 
          issue: smell.message, 
          severity: smell.severity || 'minor' 
        });
      }
    }
  });

  // Java-specific checks with context awareness
  if (language === 'java') {
    // Check for proper exception declarations in method signatures
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Only flag explicit throw statements outside of both try-catch and throws declaration
      if (line.includes('throw ') && !hasTryCatch) {
        const nearbyMethodSig = findNearbyMethodSignature(lines, i, 5);
        if (nearbyMethodSig && !nearbyMethodSig.includes('throws')) {
          issues.push(`Method with throw statement doesn't declare throws in signature`);
          lineReferences.push({ 
            line: i + 1, 
            issue: "Exception thrown but not declared in method signature", 
            severity: 'major' 
          });
        }
      }
    }
  }

  // Deduplicate issues by combining similar line references and ensure only one issue per line
  return { 
    details: [...new Set(issues)], 
    lineReferences: deduplicateLineReferences(lineReferences)
  };
};

// Helper function to deduplicate line references with improved logic
function deduplicateLineReferences(
  refs: { line: number; issue: string; severity: 'major' | 'minor' }[]
): typeof refs {
  // Group issues by line number first
  const issuesByLine = new Map<number, { issues: string[], severity: 'major' | 'minor' }>();
  
  refs.forEach(ref => {
    if (!issuesByLine.has(ref.line)) {
      issuesByLine.set(ref.line, { issues: [], severity: 'minor' });
    }
    
    const existingForLine = issuesByLine.get(ref.line)!;
    
    // Add issue if it's not a duplicate for this line
    if (!existingForLine.issues.some(existing => 
      isSimilarIssue(existing, ref.issue) ||
      isSubsetIssue(existing, ref.issue)
    )) {
      existingForLine.issues.push(ref.issue);
    }
    
    // Upgrade severity if current issue is major
    if (ref.severity === 'major') {
      existingForLine.severity = 'major';
    }
  });
  
  // Convert back to the expected format, keeping only the most significant issue per line
  const deduplicated: typeof refs = [];
  
  issuesByLine.forEach((data, line) => {
    if (data.issues.length > 0) {
      // For each line, choose the most relevant issue:
      // Prefer issues about nesting for nesting issues
      let chosenIssue = data.issues[0];
      
      // Prioritize certain critical issues
      for (const issue of data.issues) {
        if (issue.includes('nesting') || 
            issue.includes('error handling') || 
            issue.includes('division by zero') ||
            issue.includes('NullPointerException')) {
          chosenIssue = issue;
          break;
        }
      }
      
      deduplicated.push({
        line,
        issue: chosenIssue,
        severity: data.severity
      });
    }
  });
  
  return deduplicated;
}

// Check if two issues are similar enough to be considered duplicates
function isSimilarIssue(issue1: string, issue2: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const norm1 = normalize(issue1);
  const norm2 = normalize(issue2);
  
  // If they're very similar in normalized form
  if (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }
  
  // Check for specific patterns that indicate duplicates
  if ((issue1.includes('nesting') && issue2.includes('nesting')) ||
      (issue1.includes('array') && issue2.includes('array')) ||
      (issue1.includes('null') && issue2.includes('null')) ||
      (issue1.includes('division') && issue2.includes('division'))) {
    return true;
  }
  
  return false;
}

// Check if one issue is a subset/less specific version of another
function isSubsetIssue(issue1: string, issue2: string): boolean {
  const keywords = ['nesting', 'error handling', 'array', 'null', 'division', 'magic number', 
                   'variable name', 'redundant', 'inefficient'];
  
  // Check if both issues refer to the same concept but one has more details
  for (const keyword of keywords) {
    if (issue1.includes(keyword) && issue2.includes(keyword) && 
        (issue1.length < issue2.length * 0.7 || issue2.length < issue1.length * 0.7)) {
      return true;
    }
  }
  
  return false;
}

// Enhanced categorization of violations
export const categorizeViolations = (
  issuesList: string[],
  lineReferences: { line: number; issue: string; severity: 'major' | 'minor' }[] = []
): CodeViolations & { reportMarkdown: string } => {
  // Create maps to track unique issues by category and type
  const uniqueMajorIssuesByType = new Map<string, string[]>();
  const uniqueMinorIssuesByType = new Map<string, string[]>();

  // Helper function to get the issue type/category from full issue text
  const getIssueCategory = (issue: string): string => {
    // Extract the general issue category
    if (issue.includes('nesting')) return 'Deep nesting';
    if (issue.includes('function length')) return 'Long functions';
    if (issue.includes('error handling') || issue.includes('try-catch')) return 'Missing error handling';
    if (issue.includes('comment') || issue.includes('documentation')) return 'Insufficient comments';
    if (issue.includes('Magic number') || issue.includes('constant')) return 'Magic numbers';
    if (issue.includes('variable name') || issue.includes('naming')) return 'Non-descriptive variable names';
    if (issue.includes('Array') || issue.includes('bounds')) return 'Unsafe array access';
    if (issue.includes('Null') || issue.includes('null reference')) return 'Null reference risk';
    if (issue.includes('division') || issue.includes('ArithmeticException')) return 'Division by zero risk';
    if (issue.includes('redundant') || issue.includes('inefficient') || issue.includes('performance')) return 'Performance concerns';
    if (issue.includes('console.log')) return 'Debug code in production';
    if (issue.includes('TODO') || issue.includes('FIXME')) return 'Unresolved TODOs';
    
    // If no specific type is found, use the first few words
    return issue.split(' ').slice(0, 3).join(' ');
  };

  // Process line references to categorize issues
  lineReferences.forEach((ref) => {
    const issueCategory = getIssueCategory(ref.issue);
    const issueKey = issueCategory;
    
    if (ref.severity === 'major') {
      if (!uniqueMajorIssuesByType.has(issueKey)) {
        uniqueMajorIssuesByType.set(issueKey, [ref.issue]);
      } else if (!uniqueMajorIssuesByType.get(issueKey)!.some(i => isSimilarIssue(i, ref.issue))) {
        uniqueMajorIssuesByType.get(issueKey)!.push(ref.issue);
      }
    } else {
      if (!uniqueMinorIssuesByType.has(issueKey)) {
        uniqueMinorIssuesByType.set(issueKey, [ref.issue]);
      } else if (!uniqueMinorIssuesByType.get(issueKey)!.some(i => isSimilarIssue(i, ref.issue))) {
        uniqueMinorIssuesByType.get(issueKey)!.push(ref.issue);
      }
    }
  });

  // Additional processing for issues without line references
  issuesList.forEach((issue) => {
    const issueCategory = getIssueCategory(issue);
    const issueKey = issueCategory;
    
    // Determine severity based on content
    const isMajor = /Function length exceeds|Nesting level exceeds|No error handling|Unhandled|Potential|Explicit|ArithmeticException|NullPointerException|ArrayIndexOutOfBoundsException/.test(issue);
    
    const targetMap = isMajor ? uniqueMajorIssuesByType : uniqueMinorIssuesByType;
    
    if (!targetMap.has(issueKey)) {
      targetMap.set(issueKey, [issue]);
    } else if (!targetMap.get(issueKey)!.some(i => isSimilarIssue(i, issue))) {
      targetMap.get(issueKey)!.push(issue);
    }
  });

  // Count total instances for each category
  const countLineReferencesByCategory = (category: string, severity: 'major' | 'minor'): number => {
    return lineReferences.filter(ref => 
      getIssueCategory(ref.issue) === category && ref.severity === severity
    ).length;
  };
  
  // Build detailed markdown report with counts
  const majorCategories = Array.from(uniqueMajorIssuesByType.keys());
  const minorCategories = Array.from(uniqueMinorIssuesByType.keys());
  
  const majorIssuesList = majorCategories.map(category => {
    const count = countLineReferencesByCategory(category, 'major');
    const displayCount = count > 0 ? count : 1; // At least 1 if the category exists
    return `- **${category}** (${displayCount} ${displayCount === 1 ? 'instance' : 'instances'})`;
  });
  
  const minorIssuesList = minorCategories.map(category => {
    const count = countLineReferencesByCategory(category, 'minor');
    const displayCount = count > 0 ? count : 1; // At least 1 if the category exists
    return `- **${category}** (${displayCount} ${displayCount === 1 ? 'instance' : 'instances'})`;
  });

  // Generate markdown report
  const reportMarkdown = [
    `### Major Violations (${majorCategories.length})`,
    ...majorIssuesList,
    ``,
    `### Minor Violations (${minorCategories.length})`,
    ...minorIssuesList
  ].join('\n');

  // Adjust the line references to include only one entry per line
  const adjustedLineReferences = deduplicateLineReferences(lineReferences);

  return {
    major: majorCategories.length,
    minor: minorCategories.length,
    details: [], // Not used anymore as we have more detailed categorization
    lineReferences: adjustedLineReferences,
    reportMarkdown: reportMarkdown
  };
};

// --- Code Smells Analysis Transformation ---
function getSmellSuggestion(type: string): string {
  switch (type) {
    case 'deep-nesting':
      return 'Refactor deeply nested code into smaller functions or use guard clauses.';
    case 'long-method':
      return 'Split long methods into smaller, focused functions.';
    case 'duplicate-code':
      return 'Extract duplicate code into reusable functions or modules.';
    case 'magic-numbers':
      return 'Replace magic numbers with named constants.';
    case 'unused-variables':
      return 'Remove unused variables to clean up the code.';
    case 'large-class':
      return 'Break large classes into smaller, single-responsibility classes.';
    case 'dead-code':
      return 'Remove dead code to improve maintainability.';
    default:
      return 'Review and refactor as needed.';
  }
}
function getSmellImpact(type: string): string {
  switch (type) {
    case 'deep-nesting':
      return 'Reduces readability and increases risk of bugs.';
    case 'long-method':
      return 'Harder to test and maintain.';
    case 'duplicate-code':
      return 'Increases maintenance cost and risk of inconsistencies.';
    case 'magic-numbers':
      return 'Makes code harder to understand and update.';
    case 'unused-variables':
      return 'Wastes memory and confuses readers.';
    case 'large-class':
      return 'Violates single responsibility, harder to maintain.';
    case 'dead-code':
      return 'Clutters codebase and may cause confusion.';
    default:
      return 'May impact code quality.';
  }
}
// Move codeSmellsAnalysis inside the function where codeSmells is defined

// AI-driven comprehensive code analysis (New approach)
export const analyzeCodeWithAI = async (code: string, language: string = 'javascript') => {
  const startTime = Date.now();
  const lines = code.split('\n');
  
  try {
    console.log('🚀 Starting AI-driven code analysis...');
    
    // 1. Get comprehensive AI analysis
    const aiAnalysis: AICodeAnalysisResult = await getComprehensiveCodeAnalysis(code, language);
    
    // 2. Generate AI-powered test cases
    const testCasesResponse = await getTestCaseRecommendations(code, language);
    const testCases = parseGroqTestCasesResponse(testCasesResponse);
    
    // 3. Apply our grading rules to AI results
    const grades = mapAIAnalysisToGrades(aiAnalysis);
    
    // 4. Calculate basic static metrics (lightweight)
    const basicMetrics = {
      linesOfCode: lines.length,
      codeLines: lines.filter(l => l.trim().length > 0).length,
      commentLines: lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*')).length,
      functionCount: (code.match(/function\s+\w+|def\s+\w+|public\s+\w+\s+\w+\s*\(/g) || []).length,
    };
    basicMetrics.commentLines = basicMetrics.codeLines > 0 ? (basicMetrics.commentLines / basicMetrics.codeLines) * 100 : 0;
    
    // 5. Build enhanced result with AI insights
    const analysisTime = Date.now() - startTime;
    
    return {
      originalCode: code,
      
      // Grades based on AI analysis
      cyclomaticComplexity: {
        score: grades.complexity,
        description: `Cyclomatic Complexity: ${aiAnalysis.complexity.cyclomaticComplexity}`,
        percentageScore: Math.max(0, 100 - (aiAnalysis.complexity.cyclomaticComplexity * 5)),
        emoji: grades.complexity === 'A' ? '🎉' : grades.complexity === 'B' ? '👍' : grades.complexity === 'C' ? '⚠️' : '❌',
        severity: grades.complexity === 'A' ? 'excellent' : grades.complexity === 'B' ? 'good' : grades.complexity === 'C' ? 'needs-improvement' : 'poor',
        recommendations: aiAnalysis.recommendations.immediate.filter(r => r.toLowerCase().includes('complexity'))
      },
      
      maintainability: {
        score: grades.maintainability,
        description: `Maintainability Index: ${aiAnalysis.complexity.maintainabilityIndex}`,
        percentageScore: aiAnalysis.complexity.maintainabilityIndex,
        emoji: grades.maintainability === 'A' ? '🎉' : grades.maintainability === 'B' ? '👍' : grades.maintainability === 'C' ? '⚠️' : '❌',
        severity: grades.maintainability === 'A' ? 'excellent' : grades.maintainability === 'B' ? 'good' : grades.maintainability === 'C' ? 'needs-improvement' : 'poor',
        recommendations: aiAnalysis.recommendations.shortTerm.filter(r => r.toLowerCase().includes('maintain'))
      },
      
      reliability: {
        score: grades.reliability,
        description: `Reliability Score: ${aiAnalysis.quality.overallScore}`,
        percentageScore: aiAnalysis.quality.overallScore,
        emoji: grades.reliability === 'A' ? '🎉' : grades.reliability === 'B' ? '👍' : grades.reliability === 'C' ? '⚠️' : '❌',
        severity: grades.reliability === 'A' ? 'excellent' : grades.reliability === 'B' ? 'good' : grades.reliability === 'C' ? 'needs-improvement' : 'poor',
        recommendations: [...aiAnalysis.recommendations.immediate, ...aiAnalysis.recommendations.shortTerm].slice(0, 3)
      },
      
      // AI-detected violations
      violations: {
        major: aiAnalysis.quality.violations.filter(v => v.severity === 'major').length,
        minor: aiAnalysis.quality.violations.filter(v => v.severity === 'minor').length,
        details: aiAnalysis.quality.violations.map(v => v.description),
        lineReferences: aiAnalysis.quality.violations.map(v => ({
          line: v.line || 1,
          issue: v.description,
          severity: v.severity
        })),
        total: aiAnalysis.quality.violations.length,
        summary: `AI detected ${aiAnalysis.quality.violations.filter(v => v.severity === 'major').length} major and ${aiAnalysis.quality.violations.filter(v => v.severity === 'minor').length} minor violations`,
        priorityIssues: aiAnalysis.security.slice(0, 3).map(s => s.issue)
      },
      
      // AI suggestions (structured)
      aiSuggestions: formatAISuggestions(aiAnalysis),
      
      correctedCode: '', // Future: AI could generate corrected code
      overallGrade: grades.overall,
      metrics: basicMetrics,
      testCases,
      
      // Enhanced complexity analysis from AI
      complexityAnalysis: {
        cyclomaticComplexity: aiAnalysis.complexity.cyclomaticComplexity,
        maxNestingDepth: 0, // AI doesn't measure this specifically
        functionCount: basicMetrics.functionCount,
        averageFunctionLength: Math.round(basicMetrics.codeLines / Math.max(basicMetrics.functionCount, 1)),
        timeComplexity: {
          notation: aiAnalysis.complexity.timeComplexity,
          confidence: 'high',
          description: `AI-analyzed time complexity: ${aiAnalysis.complexity.timeComplexity}`,
          factors: aiAnalysis.performance.map(p => p.description)
        },
        spaceComplexity: {
          notation: aiAnalysis.complexity.spaceComplexity,
          confidence: 'high', 
          description: `AI-analyzed space complexity: ${aiAnalysis.complexity.spaceComplexity}`,
          factors: []
        }
      },
      
      // AI-detected code smells
      codeSmells: {
        smells: aiAnalysis.quality.codeSmells.map(smell => ({
          type: smell.type,
          severity: smell.severity === 'critical' || smell.severity === 'high' ? 'major' : 'minor',
          description: smell.description,
          line: smell.line || 1,
          suggestion: smell.suggestion,
          impact: `${smell.severity} impact`
        })),
        totalCount: aiAnalysis.quality.codeSmells.length,
        majorCount: aiAnalysis.quality.codeSmells.filter(s => s.severity === 'critical' || s.severity === 'high').length,
        minorCount: aiAnalysis.quality.codeSmells.filter(s => s.severity === 'low' || s.severity === 'medium').length,
        categories: groupByCategory(aiAnalysis.quality.codeSmells)
      },
      
      // AI-enhanced results
      syntaxErrors: [], // AI doesn't typically detect syntax errors in valid code
      securityIssues: aiAnalysis.security.map(s => `${s.issue}: ${s.description}`),
      performanceIssues: aiAnalysis.performance.map(p => `${p.issue}: ${p.description}`),
      
      // Enhanced metadata
      analysisMetadata: {
        analysisDate: new Date(),
        language,
        codeSize: lines.length < 50 ? 'small' : lines.length < 200 ? 'medium' : 'large',
        analysisTime,
        aiAnalysisUsed: true,
        version: '2.1.0-AI'
      },
      
      // AI-generated summary
      summary: {
        overallScore: aiAnalysis.quality.overallScore,
        strengths: aiAnalysis.summary.strengths,
        weaknesses: aiAnalysis.summary.weaknesses,
        quickFixes: aiAnalysis.recommendations.immediate,
        longTermGoals: aiAnalysis.recommendations.longTerm,
        priorityLevel: aiAnalysis.summary.priorityLevel
      },
      
      // AI-generated insights
      insights: {
        codeComplexityLevel: aiAnalysis.complexity.cyclomaticComplexity < 5 ? 'simple' : 
                           aiAnalysis.complexity.cyclomaticComplexity < 15 ? 'moderate' : 
                           aiAnalysis.complexity.cyclomaticComplexity < 25 ? 'complex' : 'very-complex',
        maintenanceEffort: aiAnalysis.complexity.maintainabilityIndex > 70 ? 'low' : 
                          aiAnalysis.complexity.maintainabilityIndex > 50 ? 'medium' : 'high',
        testCoverage: testCases.length > 6 ? 'excellent' : testCases.length > 4 ? 'good' : testCases.length > 2 ? 'fair' : 'poor',
        readabilityScore: aiAnalysis.complexity.readabilityScore,
        technicalDebt: aiAnalysis.quality.overallScore > 80 ? 'low' : aiAnalysis.quality.overallScore > 60 ? 'medium' : 
                      aiAnalysis.quality.overallScore > 40 ? 'high' : 'very-high'
      }
    };
    
  } catch (error) {
    console.error('❌ AI analysis failed, falling back to static analysis:', error);
    // Fallback to existing static analysis
    return analyzeCodeDeep(code, language);
  }
};

// Map AI analysis results to our grading system
function mapAIAnalysisToGrades(aiAnalysis: AICodeAnalysisResult): {
  complexity: 'A' | 'B' | 'C' | 'D';
  maintainability: 'A' | 'B' | 'C' | 'D';
  reliability: 'A' | 'B' | 'C' | 'D';
  overall: 'A' | 'B' | 'C' | 'D';
} {
  // Complexity grading based on AI analysis
  const complexity = aiAnalysis.complexity.cyclomaticComplexity < 10 ? 'A' :
                    aiAnalysis.complexity.cyclomaticComplexity < 15 ? 'B' :
                    aiAnalysis.complexity.cyclomaticComplexity < 20 ? 'C' : 'D';
  
  // Maintainability grading
  const maintainability = aiAnalysis.complexity.maintainabilityIndex > 80 ? 'A' :
                         aiAnalysis.complexity.maintainabilityIndex > 60 ? 'B' :
                         aiAnalysis.complexity.maintainabilityIndex > 40 ? 'C' : 'D';
  
  // Reliability grading (considering security and quality)
  const securityPenalty = aiAnalysis.security.filter(s => s.severity === 'high' || s.severity === 'critical').length * 15;
  const adjustedScore = Math.max(0, aiAnalysis.quality.overallScore - securityPenalty);
  const reliability = adjustedScore > 85 ? 'A' : adjustedScore > 70 ? 'B' : adjustedScore > 50 ? 'C' : 'D';
  
  // Overall grade (weighted average)
  const gradeToNumber = { A: 4, B: 3, C: 2, D: 1 };
  const numberToGrade = { 4: 'A', 3: 'B', 2: 'C', 1: 'D' } as const;
  
  const weightedAverage = (
    gradeToNumber[complexity] * 0.3 +
    gradeToNumber[maintainability] * 0.4 +
    gradeToNumber[reliability] * 0.3
  );
  
  const overallGradeNumber = Math.round(weightedAverage) as 1 | 2 | 3 | 4;
  const overall = numberToGrade[overallGradeNumber];
  
  return { complexity, maintainability, reliability, overall };
}

// Format AI suggestions into readable text
function formatAISuggestions(aiAnalysis: AICodeAnalysisResult): string {
  const sections = [];
  
  if (aiAnalysis.recommendations.immediate.length > 0) {
    sections.push(`🚨 **Immediate Actions:**\n${aiAnalysis.recommendations.immediate.map(r => `• ${r}`).join('\n')}`);
  }
  
  if (aiAnalysis.recommendations.shortTerm.length > 0) {
    sections.push(`📋 **Short-term Improvements:**\n${aiAnalysis.recommendations.shortTerm.map(r => `• ${r}`).join('\n')}`);
  }
  
  if (aiAnalysis.recommendations.longTerm.length > 0) {
    sections.push(`🎯 **Long-term Goals:**\n${aiAnalysis.recommendations.longTerm.map(r => `• ${r}`).join('\n')}`);
  }
  
  if (aiAnalysis.security.length > 0) {
    sections.push(`🔒 **Security Issues:**\n${aiAnalysis.security.map(s => `• ${s.issue}: ${s.recommendation}`).join('\n')}`);
  }
  
  if (aiAnalysis.performance.length > 0) {
    sections.push(`⚡ **Performance Optimizations:**\n${aiAnalysis.performance.map(p => `• ${p.issue}: ${p.optimization}`).join('\n')}`);
  }
  
  return sections.join('\n\n') || 'No specific suggestions at this time.';
}

// Group code smells by category
function groupByCategory(codeSmells: any[]): { [key: string]: any[] } {
  return codeSmells.reduce((acc, smell) => {
    const category = smell.type || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(smell);
    return acc;
  }, {});
}

// Legacy deep analysis pipeline with GROQ integration (fallback)
export const analyzeCodeDeep = async (code: string, language: string = 'javascript') => {
  const startTime = Date.now();
  const lines = code.split('\n');
  
  // 1. Static analysis (existing logic)
  const violationResult = analyzeCodeViolations(code, language);
  const { details, lineReferences } = analyzeCodeForIssues(code, language);
  const categorizedViolations = categorizeViolations(details, lineReferences);

  // 2. Metrics
  const cyclomaticComplexity = calculateCyclomaticComplexity(code, language);
  const maintainabilityScore = calculateMaintainability(code, language);

  // --- NEW: Function Counting, Avg Length, Max Nesting ---
  let functionCount = 0;
  let totalFunctionLength = 0;
  let maxNestingDepth = 0;
  const linesArr = code.split('\n');
  let inFunction = false;
  let currentFunctionLength = 0;
  let currentNesting = 0;

  linesArr.forEach((line) => {
    // Detect function start (JS/TS/Python/Java)
    const isFunctionStart =
      /function\s+\w+\s*\(|def\s+\w+\s*\(|(?:public|private|protected)\s+(?:static\s+)?\w+\s+\w+\s*\(/.test(line) ||
      /const\s+\w+\s*=\s*\(/.test(line) ||
      /\w+\s*:\s*function\s*\(/.test(line);
    if (isFunctionStart) {
      inFunction = true;
      functionCount++;
      if (currentFunctionLength > 0) {
        totalFunctionLength += currentFunctionLength;
      }
      currentFunctionLength = 1;
      currentNesting = 0;
    } else if (inFunction) {
      currentFunctionLength++;
      // End of function (simple heuristic)
      if (/^\s*}\s*$/.test(line) || /^\s*$/.test(line)) {
        totalFunctionLength += currentFunctionLength;
        currentFunctionLength = 0;
        inFunction = false;
      }
    }
    // Track nesting depth
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    currentNesting += openBraces - closeBraces;
    if (currentNesting > maxNestingDepth) maxNestingDepth = currentNesting;
  });
  if (currentFunctionLength > 0) totalFunctionLength += currentFunctionLength;
  const averageFunctionLength = functionCount > 0 ? totalFunctionLength / functionCount : 0;

  // Compose metrics result
  const metrics = {
    linesOfCode: linesArr.length,
    codeLines: linesArr.filter(l => l.trim().length > 0).length,
    commentLines: linesArr.filter(l => l.trim().startsWith('//') || l.trim().startsWith('/*') || l.trim().startsWith('*')).length,
    commentPercentage: 0, // Will be set below
    functionCount,
    averageFunctionLength,
    maxNestingDepth,
    cyclomaticComplexity: cyclomaticComplexity,
  };
  metrics.commentPercentage = metrics.codeLines > 0 ? metrics.commentLines / metrics.codeLines * 100 : 0;

  // --- NEW: Code Smells Extraction ---
  // Use the same logic as in analyzeCodeForIssues for customSmells
  // Note: lines variable already declared above
  const codeSmells: { id: string; message: string; line: number; severity?: 'major' | 'minor' }[] = [];
  rules.customSmells.forEach((smell) => {
    const regex = new RegExp(smell.pattern, 'g');
    lines.forEach((line, idx) => {
      const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
      if (regex.test(line) && !isComment) {
        codeSmells.push({
          id: smell.id,
          message: smell.message,
          line: idx + 1,
          severity: smell.severity || 'minor',
        });
      }
    });
  });

  // --- NEW: Code Smells Analysis ---
  const codeSmellsAnalysis = (() => {
    if (!codeSmells || codeSmells.length === 0) {
      return {
        smells: [],
        totalCount: 0,
        majorCount: 0,
        minorCount: 0,
        categories: {},
      };
    }
    const smells = codeSmells.map(smell => ({
      type: (smell.id === 'magic-numbers' ? 'magic-numbers' :
             smell.id === 'no-console-log' ? 'dead-code' :
             smell.id === 'single-letter-var' ? 'unused-variables' :
             smell.id === 'redundant-computation' ? 'duplicate-code' :
             smell.id === 'no-todo-fixme' ? 'dead-code' :
             smell.id as any),
      severity: smell.severity || 'minor',
      description: smell.message,
      line: smell.line,
      suggestion: getSmellSuggestion(smell.id),
      impact: getSmellImpact(smell.id),
    }));
    const categories: { [key: string]: any[] } = {};
    smells.forEach(smell => {
      if (!categories[smell.type]) categories[smell.type] = [];
      categories[smell.type].push(smell);
    });
    return {
      smells,
      totalCount: smells.length,
      majorCount: smells.filter(s => s.severity === 'major').length,
      minorCount: smells.filter(s => s.severity === 'minor').length,
      categories,
    };
  })();

  // --- Simple Test Cases (just placeholders for execution) ---
  const testCases = [
    {
      input: "",
      expectedOutput: "",
      actualOutput: "",
      passed: undefined,
      executionDetails: "",
    },
    {
      input: "",
      expectedOutput: "",
      actualOutput: "",
      passed: undefined,
      executionDetails: "",
    },
    {
      input: "",
      expectedOutput: "",
      actualOutput: "",
      passed: undefined,
      executionDetails: "",
    }
  ];

  // --- NEW: GROQ-Based Comprehensive Syntax Error Detection ---
  const syntaxAnalysis: SyntaxAnalysisResult = await analyzeSyntaxErrors(code, language);
  const syntaxErrors: string[] = formatSyntaxErrors(syntaxAnalysis);
  const quickFixes: string[] = getQuickFixes(syntaxAnalysis);

  // 3. Enhanced GROQ integration for comprehensive code analysis
  let groqResult = "";
  // Note: GROQ integration is handled through Netlify functions for security
  // This frontend code focuses on basic analysis, AI analysis is done separately
  // 4. Enhanced parsing of GROQ result for comprehensive analysis
  let aiSuggestions: string = '';
  let securityIssues: string[] = [];
  let performanceIssues: string[] = [];
  
  if (groqResult && typeof groqResult === 'string') {
    // Parse different sections of the AI analysis
    const result = String(groqResult);
    
    // Note: Syntax errors are now handled by GROQ-based syntax analyzer above
    // AI can provide additional insights, but basic syntax errors are detected by our analyzer
    
    // Extract security issues
    const securitySection = result.match(/security[\s\S]*?(?=\n\n|\n[A-Z]|performance|maintainability|$)/i);
    if (securitySection) {
      securityIssues = securitySection[0].split('\n')
        .filter(line => line.trim() && !line.match(/^security:?$/i))
        .map(line => line.replace(/^[-*•]\s*/, '').trim());
    }
    
    // Extract performance issues
    const performanceSection = result.match(/performance[\s\S]*?(?=\n\n|\n[A-Z]|security|maintainability|$)/i);
    if (performanceSection) {
      performanceIssues = performanceSection[0].split('\n')
        .filter(line => line.trim() && !line.match(/^performance:?$/i))
        .map(line => line.replace(/^[-*•]\s*/, '').trim());
    }
    
    // Extract general suggestions
    const suggestionPatterns = [
      /suggestions?:[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
      /improvements?:[\s\S]*?(?=\n\n|\n[A-Z]|$)/i,
      /recommendations?:[\s\S]*?(?=\n\n|\n[A-Z]|$)/i
    ];
    
    for (const pattern of suggestionPatterns) {
      const match = result.match(pattern);
      if (match) {
        aiSuggestions = match[0].replace(/^[^:]*:\s*/, '').trim();
        break;
      }
    }
    
    // Fallback: use entire result if no specific sections found
    if (!aiSuggestions && !syntaxErrors.length) {
      aiSuggestions = result.trim();
    }
  }

  // --- Enhanced Reliability Metric ---
  // Comprehensive scoring: start at 100, subtract for various issues
  let reliabilityScore = 100;
  reliabilityScore -= (categorizedViolations.major || 0) * 10;
  reliabilityScore -= (categorizedViolations.minor || 0) * 2;
  reliabilityScore -= (codeSmells.filter(s => s.severity === 'major').length) * 5;
  reliabilityScore -= (codeSmells.filter(s => s.severity === 'minor').length) * 2;
  reliabilityScore -= syntaxErrors.length * 8;
  reliabilityScore -= securityIssues.length * 12;
  reliabilityScore -= performanceIssues.length * 4;
  
  // Structural penalties
  if (metrics.maxNestingDepth > 6) reliabilityScore -= 5;
  if (metrics.maxNestingDepth > 8) reliabilityScore -= 10;
  if (metrics.averageFunctionLength > 40) reliabilityScore -= 5;
  if (metrics.averageFunctionLength > 60) reliabilityScore -= 10;
  if (metrics.commentPercentage < 5) reliabilityScore -= 5;
  if (cyclomaticComplexity > 15) reliabilityScore -= 8;
  if (cyclomaticComplexity > 25) reliabilityScore -= 15;
  
  // Ensure score doesn't go below 0
  if (reliabilityScore < 0) reliabilityScore = 0;

  // --- Overall Grade ---
  // Weighted average of maintainability, cyclomatic, reliability
  const gradeScore =
    (maintainabilityScore * 0.4) +
    ((100 - cyclomaticComplexity * 5) * 0.3) +
    (reliabilityScore * 0.3);
  let overallGrade: 'A' | 'B' | 'C' | 'D';
  if (gradeScore > 85) overallGrade = 'A';
  else if (gradeScore > 70) overallGrade = 'B';
  else if (gradeScore > 50) overallGrade = 'C';
  else overallGrade = 'D';

  // --- Complexity Analysis ---
  const complexityAnalysis = {
    cyclomaticComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    functionCount: metrics.functionCount,
    averageFunctionLength: metrics.averageFunctionLength,
    // Add required complexity analysis properties
    timeComplexity: {
      notation: (cyclomaticComplexity < 5 ? 'O(1)' : 
                 cyclomaticComplexity < 10 ? 'O(n)' : 
                 cyclomaticComplexity < 20 ? 'O(n log n)' : 
                 cyclomaticComplexity < 30 ? 'O(n²)' : 'O(2^n)') as any,
      confidence: (cyclomaticComplexity < 10 ? 'high' : 
                   cyclomaticComplexity < 20 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      description: `Estimated based on cyclomatic complexity: ${cyclomaticComplexity}`,
      factors: [
        ...(hasNestedLoops(code) ? ['Nested loops detected'] : []),
        ...(hasRecursion(code) ? ['Recursive calls detected'] : []),
        ...(cyclomaticComplexity > 10 ? ['High cyclomatic complexity'] : [])
      ]
    },
    spaceComplexity: {
      notation: (metrics.maxNestingDepth < 3 ? 'O(1)' : 
                 metrics.maxNestingDepth < 5 ? 'O(n)' : 
                 metrics.maxNestingDepth < 7 ? 'O(n log n)' : 'O(n²)') as any,
      confidence: (metrics.maxNestingDepth < 5 ? 'high' : 
                   metrics.maxNestingDepth < 8 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      description: `Estimated based on nesting depth: ${metrics.maxNestingDepth}`,
      factors: [
        ...(hasDataStructures(code) ? ['Data structures detected'] : []),
        ...(hasRecursion(code) ? ['Recursive calls (stack usage)'] : []),
        ...(metrics.maxNestingDepth > 5 ? ['Deep nesting detected'] : [])
      ]
    }
  };

  // 6. Compose the unified analysis result
  return {
    originalCode: code,
    cyclomaticComplexity: {
      score: (cyclomaticComplexity < 10 ? 'A' : cyclomaticComplexity < 15 ? 'B' : cyclomaticComplexity < 20 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D',
      description: `Cyclomatic Complexity: ${cyclomaticComplexity}`,
    },
    maintainability: {
      score: (maintainabilityScore > 80 ? 'A' : maintainabilityScore > 60 ? 'B' : maintainabilityScore > 40 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D',
      description: `Maintainability Index: ${maintainabilityScore}`,
    },
    reliability: { score: (reliabilityScore > 85 ? 'A' : reliabilityScore > 70 ? 'B' : reliabilityScore > 50 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D', description: `Reliability Score: ${reliabilityScore}` },
    violations: categorizedViolations,
    aiSuggestions,
    correctedCode: '', // TODO: Optionally use GROQ for code correction
    overallGrade,
    metrics,
    testCases,
    complexityAnalysis,
    codeSmells: codeSmellsAnalysis, // Now a full CodeSmellsAnalysis object
    syntaxErrors, // IntelliSense-like syntax error detection
    securityIssues: securityIssues || [], // AI-detected security issues
    performanceIssues: performanceIssues || [], // AI-detected performance issues
    
    // Enhanced syntax analysis metadata
    analysisMetadata: {
      analysisDate: new Date(),
      language,
      codeSize: lines.length < 50 ? 'small' as const : lines.length < 200 ? 'medium' as const : 'large' as const,
      analysisTime: Date.now() - startTime,
      aiAnalysisUsed: syntaxAnalysis.aiAnalysisUsed, // Reflects whether GROQ was used for syntax analysis
      version: '2.1.0-GROQ-Syntax'
    },
    
    // Summary including syntax errors
    summary: {
      overallScore: Math.round(gradeScore),
      strengths: [
        ...(syntaxAnalysis.errors.length === 0 ? ['No syntax errors detected'] : []),
        ...(cyclomaticComplexity < 10 ? ['Low complexity'] : []),
        ...(maintainabilityScore > 70 ? ['Good maintainability'] : [])
      ],
      weaknesses: [
        ...(syntaxAnalysis.errors.length > 0 ? [`${syntaxAnalysis.errors.length} syntax error(s) found`] : []),
        ...(syntaxAnalysis.warnings.length > 0 ? [`${syntaxAnalysis.warnings.length} warning(s) found`] : []),
        ...(cyclomaticComplexity > 15 ? ['High complexity'] : []),
        ...(maintainabilityScore < 50 ? ['Poor maintainability'] : [])
      ],
      quickFixes: [
        ...quickFixes.slice(0, 3), // Top 3 syntax fixes
        ...(cyclomaticComplexity > 15 ? ['Reduce function complexity'] : []),
        ...(categorizedViolations.major > 0 ? ['Fix major violations'] : [])
      ],
      longTermGoals: [
        ...(syntaxAnalysis.suggestions.length > 0 ? ['Address style suggestions'] : []),
        ...(maintainabilityScore < 70 ? ['Improve code maintainability'] : []),
        'Add comprehensive test coverage'
      ],
      priorityLevel: (syntaxAnalysis.errors.length > 0 ? 'critical' : 
                     syntaxAnalysis.warnings.length > 0 ? 'high' :
                     categorizedViolations.major > 0 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'critical'
    },
    
    // Enhanced insights
    insights: {
      codeComplexityLevel: (cyclomaticComplexity < 5 ? 'simple' : 
                           cyclomaticComplexity < 15 ? 'moderate' : 
                           cyclomaticComplexity < 25 ? 'complex' : 'very-complex') as 'simple' | 'moderate' | 'complex' | 'very-complex',
      maintenanceEffort: (maintainabilityScore > 70 ? 'low' : 
                         maintainabilityScore > 50 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
      testCoverage: (testCases.length > 6 ? 'excellent' : 
                    testCases.length > 4 ? 'good' : 
                    testCases.length > 2 ? 'fair' : 'poor') as 'poor' | 'fair' | 'good' | 'excellent',
      readabilityScore: Math.max(0, 100 - (syntaxAnalysis.errors.length * 20) - (syntaxAnalysis.warnings.length * 5)),
      technicalDebt: (syntaxAnalysis.errors.length > 0 ? 'very-high' :
                     syntaxAnalysis.warnings.length > 5 ? 'high' :
                     syntaxAnalysis.warnings.length > 0 ? 'medium' : 'low') as 'low' | 'medium' | 'high' | 'very-high'
    }
  };
};

// Extract variables used in a line of code
function extractVariablesInLine(line: string): string[] {
  const vars: string[] = [];
  
  // Match variable names, avoiding keywords, numbers and punctuation
  const matches = line.match(/\b([a-zA-Z_]\w*)\b/g);
  if (matches) {
    // Filter out language keywords
    const keywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 
                     'return', 'try', 'catch', 'finally', 'throw', 'new', 'delete', 'typeof',
                     'instanceof', 'void', 'null', 'undefined', 'true', 'false', 'let', 'const',
                     'var', 'function', 'class', 'this', 'super', 'import', 'export'];
    return matches.filter(word => !keywords.includes(word));
  }
  
  return vars;
}

// Helper function to determine if a risky operation should be flagged
function shouldFlagRiskyOperation(
  line: string,
  operationId: string,
  boundedLoopVars: Set<string>,
  nullProtectedVars: Set<string>,
  mainFunctionInputs: Set<string>,
  zeroCheckedVars: Set<string>,
  safeNullHandling: boolean
): boolean {
  const variablesInLine = extractVariablesInLine(line);
  
  switch (operationId) {
    case 'json-parse':
      // Flag if JSON.parse is used without try-catch protection
      return !safeNullHandling || !variablesInLine.some(v => nullProtectedVars.has(v));
    
    case 'file-system':
      // Flag if file operations are used without error handling
      return !safeNullHandling;
    
    case 'array-access':
      // Flag if array access might be out of bounds
      return !variablesInLine.some(v => boundedLoopVars.has(v) || nullProtectedVars.has(v));
    
    case 'division':
      // Flag if division might result in division by zero
      return !variablesInLine.some(v => zeroCheckedVars.has(v));
    
    case 'null-reference':
      // Flag if null reference might occur
      return !variablesInLine.some(v => nullProtectedVars.has(v));
    
    case 'regex-operations':
      // Flag if regex operations might throw
      return !safeNullHandling;
    
    case 'type-conversion':
      // Flag if type conversion might fail
      return !safeNullHandling || !variablesInLine.some(v => nullProtectedVars.has(v));
    
    default:
      // Default: flag if not in safe context
      return !safeNullHandling;
  }
}

// Helper functions for complexity analysis
function hasNestedLoops(code: string): boolean {
  const lines = code.split('\n');
  let loopDepth = 0;
  let maxLoopDepth = 0;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.match(/\b(?:for|while|do)\b/)) {
      loopDepth++;
      maxLoopDepth = Math.max(maxLoopDepth, loopDepth);
    }
    if (trimmed.includes('}') && loopDepth > 0) {
      loopDepth--;
    }
  });
  
  return maxLoopDepth > 1;
}

function hasRecursion(code: string): boolean {
  // Simple heuristic: look for function calls that might be recursive
  const functionNameMatch = code.match(/(?:function|def)\s+(\w+)/g);
  if (!functionNameMatch) return false;
  
  const functionNames = functionNameMatch.map(match => 
    match.replace(/(?:function|def)\s+/, '')
  );
  
  return functionNames.some(name => 
    code.includes(`${name}(`) && 
    code.indexOf(`${name}(`) !== code.lastIndexOf(`${name}(`)
  );
}

function hasDataStructures(code: string): boolean {
  // Look for common data structure patterns
  return /(?:new\s+(?:Array|Map|Set|Object)|(?:\[\]|\{\})|(?:push|pop|shift|unshift|splice))/.test(code);
}

// AI-powered test case generation using Groq
async function generateTestCasesFromCode(code: string, language: string): Promise<TestCase[]> {
  try {
    // Note: AI test generation moved to Netlify functions
    // Using static generation for frontend analysis
    console.warn('Using static test case generation in frontend');
    return generateStaticTestCases(code, language);
  } catch (error) {
    console.warn('AI test generation failed, falling back to static generation:', error);
    return generateStaticTestCases(code, language);
  }
}

// AI-powered test case generation using Groq
async function generateTestCasesWithGroq(code: string, language: string): Promise<TestCase[]> {
  const prompt = `Analyze the following ${language} code and generate comprehensive test cases. 

For each test case, provide:
1. A descriptive name
2. A clear description of what is being tested
3. Specific input values (if applicable)
4. Expected output or behavior
5. Test category (normal, edge, error, boundary)

Focus on:
- Normal functionality with typical inputs
- Edge cases (empty, null, zero, maximum values)
- Boundary conditions
- Error handling scenarios
- Performance considerations for large inputs
- Security concerns if applicable

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT: Return the response in the following JSON format:
{
  "testCases": [
    {
      "name": "Test Case Name",
      "description": "Detailed description of what this test verifies",
      "input": "Specific input value or description",
      "expectedOutput": "Expected result or behavior",
      "category": "normal|edge|error|boundary|performance|security"
    }
  ]
}

Generate 5-8 diverse test cases covering different scenarios.`;

  try {
    console.log('Generating AI-powered test cases...');
    const groqResponse = await getGroqResponse(prompt);
    console.log('Groq response received, parsing test cases...');
    const testCases = parseGroqTestCasesResponse(groqResponse);
    console.log(`Successfully generated ${testCases.length} AI test cases`);
    return testCases;
  } catch (error) {
    console.error('Groq API call failed for test case generation:', error);
    throw error;
  }
}

// Parse Groq response and extract test cases
function parseGroqTestCasesResponse(response: string): TestCase[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.testCases || !Array.isArray(parsed.testCases)) {
      throw new Error('Invalid response format');
    }

    return parsed.testCases.map((tc: any) => ({
      name: tc.name || 'Generated Test Case',
      description: tc.description || 'AI-generated test case',
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || 'Expected behavior described',
      category: tc.category || 'normal'
    }));

  } catch (error) {
    console.warn('Failed to parse Groq response, attempting fallback parsing:', error);
    
    // Fallback: try to extract test cases from unstructured text
    return parseUnstructuredTestCases(response);
  }
}

// Fallback parser for unstructured Groq responses
function parseUnstructuredTestCases(response: string): TestCase[] {
  const testCases: TestCase[] = [];
  
  // Try multiple parsing strategies
  
  // Strategy 1: Look for numbered or titled test cases
  const sections = response.split(/(?:Test Case|Test \d+|Case \d+|\d+\.|##?\s*Test)/i);
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the first section (usually intro text)
    
    const lines = section.split('\n').filter(line => line.trim());
    let name = '';
    let description = '';
    let input = '';
    let expectedOutput = '';
    let category = 'normal';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      const lowerTrimmed = trimmed.toLowerCase();
      
      if (lowerTrimmed.includes('name:') || lowerTrimmed.includes('title:')) {
        name = trimmed.replace(/^.*?:/, '').trim();
      } else if (lowerTrimmed.includes('description:') || lowerTrimmed.includes('desc:')) {
        description = trimmed.replace(/^.*?:/, '').trim();
      } else if (lowerTrimmed.includes('input:')) {
        input = trimmed.replace(/^.*?:/, '').trim();
      } else if (lowerTrimmed.includes('expected:') || lowerTrimmed.includes('output:')) {
        expectedOutput = trimmed.replace(/^.*?:/, '').trim();
      } else if (lowerTrimmed.includes('category:') || lowerTrimmed.includes('type:')) {
        category = trimmed.replace(/^.*?:/, '').trim().toLowerCase();
      }
      
      // If no explicit labels, try to infer from content
      if (!name && trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes(':')) {
        name = trimmed;
      }
    });
    
    if (name || description) {
      testCases.push({
        name: name || `AI Generated Test ${index}`,
        description: description || 'AI-generated test case',
        input: input || 'Contextual input',
        expectedOutput: expectedOutput || 'Expected behavior based on code analysis',
        category
      });
    }
  });
  
  // Strategy 2: If no structured test cases found, look for bullet points or numbered lists
  if (testCases.length === 0) {
    const bulletPoints = response.match(/(?:[-*•]\s+|^\d+\.\s+)(.+)$/gm);
    if (bulletPoints && bulletPoints.length > 0) {
      bulletPoints.forEach((point, index) => {
        const cleaned = point.replace(/^[-*•\d.\s]+/, '').trim();
        if (cleaned.length > 10) {
          testCases.push({
            name: `Test Case ${index + 1}`,
            description: cleaned,
            input: 'Dynamic input based on test scenario',
            expectedOutput: 'Expected result based on test description'
          });
        }
      });
    }
  }
  
  // Strategy 3: Extract meaningful sentences as test descriptions
  if (testCases.length === 0) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
    sentences.slice(0, 5).forEach((sentence, index) => {
      testCases.push({
        name: `Test Scenario ${index + 1}`,
        description: sentence.trim(),
        input: 'Relevant input for scenario',
        expectedOutput: 'Expected behavior for scenario'
      });
    });
  }
  
  // Final fallback: return at least one generic test case
  if (testCases.length === 0) {
    testCases.push({
      name: 'AI Analysis Test',
      description: 'Comprehensive test based on AI code analysis',
      input: 'Analyzed input pattern',
      expectedOutput: 'Expected output based on code logic'
    });
  }
  
  return testCases.slice(0, 8); // Limit to 8 test cases max
}

// Helper function to generate sample inputs based on detected patterns
function generateSampleInput(language: string, params: string[], hasNumbers: boolean, hasString: boolean, hasArray: boolean) {
  const samples = {
    normal: '',
    empty: '',
    boundary: '',
    invalid: ''
  };

  if (params.length > 0) {
    // Generate based on parameter analysis
    const normalValues = params.map(param => {
      if (param.includes('int') || param.includes('number') || hasNumbers) return '5';
      if (param.includes('string') || param.includes('str') || hasString) return '"hello"';
      if (param.includes('array') || param.includes('list') || hasArray) return '[1,2,3]';
      if (param.includes('bool')) return 'true';
      return '"value"';
    });
    
    samples.normal = language === 'python' ? normalValues.join(', ') : normalValues.join(', ');
    samples.empty = language === 'python' ? 'None' : 'null';
    samples.boundary = hasNumbers ? '0' : hasArray ? '[]' : '""';
    samples.invalid = hasNumbers ? '"not_a_number"' : hasArray ? 'null' : '123';
  } else {
    // Fallback to detected patterns
    if (hasNumbers) {
      samples.normal = '42';
      samples.empty = '0';
      samples.boundary = '-1';
      samples.invalid = '"not_number"';
    } else if (hasString) {
      samples.normal = '"test input"';
      samples.empty = '""';
      samples.boundary = '"a"';
      samples.invalid = 'null';
    } else if (hasArray) {
      samples.normal = '[1, 2, 3, 4, 5]';
      samples.empty = '[]';
      samples.boundary = '[1]';
      samples.invalid = '"not_array"';
    } else {
      samples.normal = 'valid_input';
      samples.empty = '';
      samples.boundary = 'boundary_case';
      samples.invalid = 'invalid_input';
    }
  }

  return samples;
}

// Helper function to generate expected outputs
function generateExpectedOutput(returnType: string, language: string, testType: string): string {
  if (testType === 'empty') {
    if (returnType === 'void' || returnType === 'None') return 'No output expected';
    if (returnType === 'boolean' || returnType === 'bool') return 'false';
    if (returnType === 'int' || returnType === 'number') return '0';
    if (returnType === 'String' || returnType === 'str') return '""';
    return 'null or empty result';
  }
  
  if (testType === 'invalid') {
    return 'Should throw error or return error indicator';
  }
  
  if (testType === 'boundary') {
    return 'Should handle boundary conditions correctly';
  }
  
  if (testType === 'large') {
    return 'Should process large input efficiently';
  }
  
  // Normal case
  if (returnType === 'void' || returnType === 'None') return 'Function executes without errors';
  if (returnType === 'boolean' || returnType === 'bool') return 'true';
  if (returnType === 'int' || returnType === 'number') return 'positive number';
  if (returnType === 'String' || returnType === 'str') return 'valid string output';
  if (returnType.includes('array') || returnType.includes('list')) return 'array with processed elements';
  
  return 'Expected valid output based on input';
}

// Static fallback test case generation (original heuristic method)
export function generateStaticTestCases(code: string, language: string): TestCase[] {
  const testCases: TestCase[] = [];
  
  // Enhanced language-aware test case generation
  const lines = code.split('\n');
  let functionName = '';
  let functionParams: string[] = [];
  let hasInputs = false;
  let hasLoop = false;
  let hasCondition = false;
  let hasArray = false;
  let hasString = false;
  let hasNumbers = false;
  let returnType = '';
  let isAsync = false;
  
  // Analyze code structure
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Enhanced function detection by language
    if (language === 'javascript' || language === 'typescript') {
      const jsFunction = trimmedLine.match(/(?:function|const|let|var)\s+(\w+)\s*[=:]?\s*(?:async\s+)?\([^)]*\)|(?:async\s+)?(\w+)\s*\([^)]*\)\s*=>/);
      if (jsFunction) {
        functionName = jsFunction[1] || jsFunction[2];
        isAsync = trimmedLine.includes('async');
        const paramMatch = trimmedLine.match(/\(([^)]*)\)/);
        if (paramMatch) {
          functionParams = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
        }
      }
    } else if (language === 'python') {
      const pyFunction = trimmedLine.match(/def\s+(\w+)\s*\([^)]*\)/);
      if (pyFunction) {
        functionName = pyFunction[1];
        const paramMatch = trimmedLine.match(/\(([^)]*)\)/);
        if (paramMatch) {
          functionParams = paramMatch[1].split(',').map(p => p.trim().split(':')[0]).filter(p => p && p !== 'self');
        }
      }
    } else if (language === 'java' || language === 'cpp' || language === 'csharp') {
      const javaFunction = trimmedLine.match(/(?:public|private|protected|static).*?(\w+)\s*\([^)]*\)/);
      if (javaFunction) {
        functionName = javaFunction[1];
        const returnMatch = trimmedLine.match(/(?:public|private|protected|static).*?(int|void|String|boolean|double|float|\w+)\s+\w+/);
        if (returnMatch) {
          returnType = returnMatch[1];
        }
      }
    }
    
    // Detect inputs/parameters
    if (trimmedLine.match(/(?:input|scanf|readline|prompt|argv|args)/)) {
      hasInputs = true;
    }
    
    // Detect loops
    if (trimmedLine.match(/(?:for|while|do)/)) {
      hasLoop = true;
    }
    
    // Detect conditions
    if (trimmedLine.match(/(?:if|switch|case)/)) {
      hasCondition = true;
    }
    
    // Detect data types
    if (trimmedLine.match(/\[|\]|array|Array/)) {
      hasArray = true;
    }
    if (trimmedLine.match(/string|String|".*"|'.*'/)) {
      hasString = true;
    }
    if (trimmedLine.match(/\d+|int|Integer|float|double/)) {
      hasNumbers = true;
    }
  });
  
  // Generate comprehensive test cases based on detected patterns
  if (functionName || hasInputs) {
    // Generate language-specific test cases
    const inputSample = generateSampleInput(language, functionParams, hasNumbers, hasString, hasArray);
    
    // Test Case 1: Happy Path
    testCases.push({
      name: `${functionName || 'Function'} - Happy Path`,
      description: "Test with valid, typical input values",
      input: inputSample.normal,
      expectedOutput: generateExpectedOutput(returnType, language, 'normal'),
      category: 'normal',
      priority: 'high'
    });
    
    // Test Case 2: Edge Cases
    testCases.push({
      name: `${functionName || 'Function'} - Empty Input`,
      description: "Test with empty or null input values",
      input: inputSample.empty,
      expectedOutput: generateExpectedOutput(returnType, language, 'empty'),
      category: 'edge',
      priority: 'high'
    });
    
    // Test Case 3: Boundary Conditions
    if (hasLoop || hasCondition) {
      testCases.push({
        name: `${functionName || 'Function'} - Boundary Values`,
        description: "Test with boundary values (min/max/edge cases)",
        input: inputSample.boundary,
        expectedOutput: generateExpectedOutput(returnType, language, 'boundary'),
        category: 'boundary',
        priority: 'medium'
      });
    }
      
    // Test Case 4: Invalid Input
    testCases.push({
      name: `${functionName || 'Function'} - Invalid Input`,
      description: "Test with invalid or unexpected input types",
      input: inputSample.invalid,
      expectedOutput: generateExpectedOutput(returnType, language, 'invalid'),
      category: 'error',
      priority: 'medium'
    });

    // Test Case 5: Large Input (if numbers or arrays detected)
    if (hasNumbers || hasArray) {
      testCases.push({
        name: `${functionName || 'Function'} - Large Input`,
        description: "Test with large input values",
        input: hasArray ? '[1,2,3,4,5,6,7,8,9,10]' : '1000000',
        expectedOutput: generateExpectedOutput(returnType, language, 'large'),
        category: 'performance',
        priority: 'low'
      });
    }
    
    // Error cases
    if (hasString || hasArray || hasNumbers) {
      testCases.push({
        name: "Invalid Input Test",
        description: "Test with invalid input format",
        input: "invalid_input",
        expectedOutput: "Should handle invalid input with appropriate error handling"
      });
    }
    
    // Type-specific tests
    if (hasArray) {
      testCases.push({
        name: "Array Edge Case Test",
        description: "Test with single element and multiple elements",
        input: "[1]",
        expectedOutput: "Should handle single element arrays correctly"
      });
    }
    
    if (hasString) {
      testCases.push({
        name: "String Edge Case Test",
        description: "Test with special characters and whitespace",
        input: "  test string with spaces  ",
        expectedOutput: "Should handle string edge cases appropriately"
      });
    }
  }
  
  // If no specific patterns detected, provide generic test cases
  if (testCases.length === 0) {
    testCases.push({
      name: "Basic Functionality Test",
      description: "Test basic functionality of the code",
      input: "sample_input",
      expectedOutput: "expected_output"
    });
  }
  
  return testCases;
}
