import { ComplexityAnalysis, ComplexityGrade, CodeSmell, CodeSmellsAnalysis } from '@/types/complexityTypes';

// Helper function for comprehensive loop analysis
function analyzeLoopComplexity(code: string, language: string): {
  complexity: ComplexityGrade;
  factors: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const result = { complexity: 'O(1)' as ComplexityGrade, factors: [] as string[], confidence: 'high' as const };
  
  // Check for specific algorithmic patterns
  if (hasBinarySearch(code, language)) {
    result.complexity = 'O(log n)';
    result.factors.push('Binary search pattern detected');
    result.confidence = 'high';
  }
  
  if (hasMergeSort(code, language)) {
    result.complexity = 'O(n log n)';
    result.factors.push('Merge sort or divide-and-conquer pattern detected');
    result.confidence = 'medium' as const;
  }
  
  if (hasMatrixOperations(code, language)) {
    result.complexity = 'O(n³)';
    result.factors.push('Matrix multiplication or 3D operations detected');
    result.confidence = 'medium' as const;
  }
  
  return result;
}

// Extract loop variables for better analysis
function extractLoopVariables(code: string, language: string): string[] {
  const variables: string[] = [];
  const lines = code.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Language-specific loop variable extraction
    if (language === 'javascript' || language === 'typescript') {
      const forMatch = trimmed.match(/for\s*\(\s*(?:let|var|const)?\s*(\w+)/);
      const forOfMatch = trimmed.match(/for\s*\(\s*(?:let|var|const)?\s*(\w+)\s+of/);
      const forInMatch = trimmed.match(/for\s*\(\s*(?:let|var|const)?\s*(\w+)\s+in/);
      
      if (forMatch) variables.push(forMatch[1]);
      if (forOfMatch) variables.push(forOfMatch[1]);
      if (forInMatch) variables.push(forInMatch[1]);
    } else if (language === 'python') {
      const forMatch = trimmed.match(/for\s+(\w+)\s+in/);
      if (forMatch) variables.push(forMatch[1]);
    } else if (language === 'java' || language === 'cpp' || language === 'csharp') {
      const forMatch = trimmed.match(/for\s*\(\s*\w+\s+(\w+)/);
      if (forMatch) variables.push(forMatch[1]);
    }
  });
  
  return [...new Set(variables)]; // Remove duplicates
}

// Enhanced algorithmic pattern detection
function hasBinarySearch(code: string, language: string): boolean {
  const patterns = [
    /while.*<.*middle|mid/i,
    /left.*right.*middle/i,
    /start.*end.*mid/i,
    /binary.*search/i,
    /log.*search/i
  ];
  
  return patterns.some(pattern => pattern.test(code));
}

function hasMergeSort(code: string, language: string): boolean {
  const patterns = [
    /merge.*sort/i,
    /divide.*conquer/i,
    /merge.*left.*right/i,
    /split.*merge/i
  ];
  
  return patterns.some(pattern => pattern.test(code));
}

function hasMatrixOperations(code: string, language: string): boolean {
  const patterns = [
    /matrix.*multiply/i,
    /\[.*\]\[.*\]\[.*\]/,
    /3.*dimensional/i,
    /cube.*operation/i
  ];
  
  return patterns.some(pattern => pattern.test(code));
}

// Enhanced Time Complexity Analysis
export const analyzeTimeComplexity = (code: string, language: string): ComplexityAnalysis['timeComplexity'] => {
  const lines = code.split('\n');
  let maxComplexity: ComplexityGrade = 'O(1)';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  // Comprehensive loop analysis
  const loopAnalysis = analyzeLoopComplexity(code, language);
  if (loopAnalysis.complexity !== 'O(1)') {
    maxComplexity = loopAnalysis.complexity;
    factors.push(...loopAnalysis.factors);
    confidence = loopAnalysis.confidence;
  }
  
  // Enhanced nested loop analysis with variable tracking
  const nestedLoopDepth = calculateNestedLoopDepth(code);
  const loopVariables = extractLoopVariables(code, language);
  
  if (nestedLoopDepth >= 4) {
    maxComplexity = 'O(n⁴)';
    factors.push(`Quartic complexity detected (${nestedLoopDepth}-level nested loops)`);
    confidence = 'high';
  } else if (nestedLoopDepth >= 3) {
    maxComplexity = 'O(n³)';
    factors.push(`Cubic complexity from ${nestedLoopDepth}-level nested loops`);
    factors.push(`Loop variables: ${loopVariables.join(', ')}`);
  } else if (nestedLoopDepth === 2) {
    maxComplexity = 'O(n²)';
    factors.push('Quadratic complexity from nested loops');
    if (loopVariables.length > 0) {
      factors.push(`Independent variables: ${loopVariables.join(', ')}`);
    }
  } else if (nestedLoopDepth === 1) {
    maxComplexity = 'O(n)';
    factors.push('Linear complexity from single loops');
  }
  
  // Check for recursive patterns
  const recursionDepth = analyzeRecursion(code, language);
  if (recursionDepth.isExponential) {
    maxComplexity = 'O(2^n)';
    factors.push('Exponential recursion detected (e.g., naive Fibonacci)');
    confidence = 'medium';
  } else if (recursionDepth.isRecursive) {
    if (maxComplexity === 'O(1)') {
      maxComplexity = 'O(n)' as ComplexityGrade;
    }
    factors.push('Recursive calls detected');
  }
  
  // Check for sorting algorithms
  if (hasSortingOperations(code, language)) {
    if (maxComplexity === 'O(1)' || maxComplexity === 'O(n)') {
      maxComplexity = 'O(n log n)';
      factors.push('Sorting operations detected');
    }
  }
  
  // Check for logarithmic patterns
  if (hasBinarySearch(code, language) || hasDivideConquer(code, language)) {
    if (maxComplexity === 'O(1)') {
      maxComplexity = 'O(log n)';
      factors.push('Binary search or divide-and-conquer pattern detected');
    }
  }
  
  return {
    notation: maxComplexity,
    confidence,
    description: generateTimeComplexityDescription(maxComplexity, factors),
    factors
  };
};

// Space Complexity Analysis  
export const analyzeSpaceComplexity = (code: string, language: string): ComplexityAnalysis['spaceComplexity'] => {
  let maxComplexity: ComplexityGrade = 'O(1)';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  const factors: string[] = [];
  
  // Check for data structure allocations
  const dataStructures = analyzeDataStructureUsage(code, language);
  if (dataStructures.hasDynamicArrays || dataStructures.hasLists) {
    maxComplexity = 'O(n)';
    factors.push('Dynamic arrays or lists allocated');
  }
  
  if (dataStructures.has2DArrays) {
    maxComplexity = 'O(n²)';
    factors.push('2D arrays or matrices allocated');
  }
  
  // Check recursion stack depth
  const recursionInfo = analyzeRecursion(code, language);
  if (recursionInfo.isRecursive) {
    if (recursionInfo.isExponential) {
      maxComplexity = 'O(2^n)';
      factors.push('Exponential recursive calls (high stack usage)');
    } else if (maxComplexity === 'O(1)') {
      maxComplexity = 'O(n)' as ComplexityGrade;
      factors.push('Recursive calls (linear stack usage)');
    }
  }
  
  // Check for memoization
  if (hasMemoization(code, language)) {
    if (maxComplexity === 'O(1)') {
      maxComplexity = 'O(n)' as ComplexityGrade;
    }
    factors.push('Memoization detected (additional space for caching)');
  }
  
  return {
    notation: maxComplexity,
    confidence,
    description: generateSpaceComplexityDescription(maxComplexity, factors),
    factors
  };
};

// Code Smells Detection
export const detectCodeSmells = (code: string, language: string): CodeSmellsAnalysis => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  // Deep nesting detection
  const nestingIssues = detectDeepNesting(code);
  smells.push(...nestingIssues);
  
  // Long method detection
  const longMethodIssues = detectLongMethods(code, language);
  smells.push(...longMethodIssues);
  
  // Magic numbers detection
  const magicNumberIssues = detectMagicNumbers(code, language);
  smells.push(...magicNumberIssues);
  
  // Unused variables detection
  const unusedVarIssues = detectUnusedVariables(code, language);
  smells.push(...unusedVarIssues);
  
  // Duplicate code detection
  const duplicateCodeIssues = detectDuplicateCode(code);
  smells.push(...duplicateCodeIssues);
  
  // Dead code detection
  const deadCodeIssues = detectDeadCode(code);
  smells.push(...deadCodeIssues);
  
  // Categorize smells
  const categories = categorizeSmells(smells);
  
  return {
    smells,
    totalCount: smells.length,
    majorCount: smells.filter(s => s.severity === 'major').length,
    minorCount: smells.filter(s => s.severity === 'minor').length,
    categories
  };
};

// Helper functions
const calculateNestedLoopDepth = (code: string): number => {
  const lines = code.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/\b(for|while|do)\b.*[{(]/) || 
        trimmed.match(/\.forEach|\.map|\.filter|\.reduce/)) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    if (trimmed.includes('}') && currentDepth > 0) {
      currentDepth--;
    }
  }
  
  return maxDepth;
};

const analyzeRecursion = (code: string, language: string): { isRecursive: boolean; isExponential: boolean } => {
  const lines = code.split('\n');
  let isRecursive = false;
  let isExponential = false;
  
  // Find function names
  const functionNames = extractFunctionNames(code, language);
  
  for (const funcName of functionNames) {
    const funcCallCount = (code.match(new RegExp(`\\b${funcName}\\s*\\(`, 'g')) || []).length;
    
    if (funcCallCount > 1) {
      isRecursive = true;
      
      // Check for exponential patterns (multiple recursive calls in same function)
      const funcBody = extractFunctionBody(code, funcName);
      const recursiveCallsInBody = (funcBody.match(new RegExp(`\\b${funcName}\\s*\\(`, 'g')) || []).length;
      
      if (recursiveCallsInBody > 1) {
        isExponential = true;
      }
    }
  }
  
  return { isRecursive, isExponential };
};

const hasSortingOperations = (code: string, language: string): boolean => {
  const sortPatterns = [
    /\.sort\s*\(/,
    /Arrays\.sort/,
    /Collections\.sort/,
    /sorted\s*\(/,
    /\bsort\s*\(/,
    /quicksort|mergesort|heapsort|bubblesort/i
  ];
  
  return sortPatterns.some(pattern => pattern.test(code));
};



const hasDivideConquer = (code: string, language: string): boolean => {
  const patterns = [
    /divide.*conquer|conquer.*divide/i,
    /mid.*\/.*2/i
  ];

  return patterns.some(pattern => pattern.test(code));
};

const analyzeDataStructureUsage = (code: string, language: string) => {
  const dynamicArrayPatterns = [
    /new\s+(?:Array|ArrayList|Vector|List)/,
    /\[\s*\]/,
    /\.push\s*\(|\.append\s*\(/,
    /list\s*\(/,
    /array\s*\(/
  ];
  
  const twoDArrayPatterns = [
    /\[\s*\]\s*\[\s*\]/,
    /new\s+\w+\s*\[\s*\w*\s*\]\s*\[\s*\w*\s*\]/,
    /matrix|grid/i
  ];
  
  return {
    hasDynamicArrays: dynamicArrayPatterns.some(p => p.test(code)),
    hasLists: /(?:List|ArrayList|Vector|Array)/.test(code),
    has2DArrays: twoDArrayPatterns.some(p => p.test(code))
  };
};

const hasMemoization = (code: string, language: string): boolean => {
  const memoPatterns = [
    /memo|cache|dp\[|memo\[/i,
    /HashMap|Map|Dictionary/,
    /@lru_cache|@cache/,
    /memoize/i
  ];
  
  return memoPatterns.some(pattern => pattern.test(code));
};

const extractFunctionNames = (code: string, language: string): string[] => {
  const names: string[] = [];
  const patterns = [
    /function\s+(\w+)\s*\(/g,
    /(\w+)\s*=\s*function/g,
    /def\s+(\w+)\s*\(/g,
    /public\s+(?:static\s+)?\w+\s+(\w+)\s*\(/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      names.push(match[1]);
    }
  });
  
  return names;
};

const extractFunctionBody = (code: string, funcName: string): string => {
  const regex = new RegExp(`(?:function\\s+${funcName}|def\\s+${funcName}|\\w+\\s+${funcName})\\s*\\([^)]*\\)\\s*\\{([^}]+)\\}`, 's');
  const match = code.match(regex);
  return match ? match[1] : '';
};

// Code smell detection functions
const detectDeepNesting = (code: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  let currentDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    currentDepth += openBraces - closeBraces;
    
    if (currentDepth > 4) {
      smells.push({
        type: 'deep-nesting',
        severity: 'major',
        description: `Excessive nesting depth (${currentDepth} levels)`,
        line: i + 1,
        suggestion: 'Extract nested logic into separate methods',
        impact: 'Reduces code readability and maintainability'
      });
    }
  }
  
  return smells;
};

const detectLongMethods = (code: string, language: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  let inFunction = false;
  let functionStart = 0;
  let braceCount = 0;
  let functionName = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!inFunction && (line.includes('function') || line.includes('def ') || 
        line.match(/public\s+\w+\s+\w+\s*\(/))) {
      inFunction = true;
      functionStart = i;
      braceCount = 0;
      
      const nameMatch = line.match(/(?:function\s+|def\s+|public\s+\w+\s+)(\w+)/);
      functionName = nameMatch ? nameMatch[1] : 'unknown';
    }
    
    if (inFunction) {
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && line.includes('}')) {
        const methodLength = i - functionStart + 1;
        
        if (methodLength > 50) {
          smells.push({
            type: 'long-method',
            severity: 'major',
            description: `Method '${functionName}' is too long (${methodLength} lines)`,
            line: functionStart + 1,
            suggestion: 'Break down into smaller, focused methods',
            impact: 'Large methods are harder to understand and test'
          });
        } else if (methodLength > 30) {
          smells.push({
            type: 'long-method',
            severity: 'minor',
            description: `Method '${functionName}' is moderately long (${methodLength} lines)`,
            line: functionStart + 1,
            suggestion: 'Consider breaking into smaller methods',
            impact: 'Method complexity affects maintainability'
          });
        }
        
        inFunction = false;
      }
    }
  }
  
  return smells;
};

const detectMagicNumbers = (code: string, language: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip structurally irrelevant lines
    if (/^\s*(else|}|{|case\s+[^:]*:|default:)/.test(line)) {
      continue;
    }

    // Skip constants and common acceptable numbers
    if (line.includes('const') || line.includes('final') || line.includes('static')) {
      continue;
    }

    const magicNumbers = line.match(/\b(?!0|1|2|10|100|1000)\d{2,}\b/g);

    if (magicNumbers) {
      for (const number of magicNumbers) {
        smells.push({
          type: 'magic-numbers',
          severity: 'minor',
          description: `Magic number '${number}' found`,
          line: i + 1,
          suggestion: 'Replace with named constant',
          impact: 'Magic numbers reduce code readability'
        });
      }
    }
  }

  return smells;
};

const detectUnusedVariables = (code: string, language: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const variableDeclarations = new Map<string, number>();
  const variableUsages = new Set<string>();
  
  const lines = code.split('\n');
  
  // Find variable declarations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const declMatches = line.match(/(?:let|const|var|int|String|double|float)\s+(\w+)/g);
    
    if (declMatches) {
      for (const match of declMatches) {
        const varName = match.split(/\s+/).pop();
        if (varName) {
          variableDeclarations.set(varName, i + 1);
        }
      }
    }
  }
  
  // Find variable usages
  for (const line of lines) {
    for (const varName of variableDeclarations.keys()) {
      if (line.includes(varName) && !line.includes(`${varName} =`) && !line.includes(`${varName}:`)) {
        variableUsages.add(varName);
      }
    }
  }
  
  // Check for unused variables
  for (const [varName, lineNumber] of variableDeclarations) {
    if (!variableUsages.has(varName)) {
      smells.push({
        type: 'unused-variables',
        severity: 'minor',
        description: `Unused variable '${varName}'`,
        line: lineNumber,
        suggestion: 'Remove unused variable declaration',
        impact: 'Unused variables create code clutter'
      });
    }
  }
  
  return smells;
};

const detectDuplicateCode = (code: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  const blockSize = 3;
  const blocks = new Map<string, number[]>();
  
  // Extract code blocks
  for (let i = 0; i <= lines.length - blockSize; i++) {
    const block = lines.slice(i, i + blockSize)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
    
    if (block.length > 20) {
      if (!blocks.has(block)) {
        blocks.set(block, []);
      }
      blocks.get(block)!.push(i + 1);
    }
  }
  
  // Find duplicates
  for (const [block, lineNumbers] of blocks) {
    if (lineNumbers.length > 1) {
      smells.push({
        type: 'duplicate-code',
        severity: 'major',
        description: `Duplicate code block found at lines: ${lineNumbers.join(', ')}`,
        line: lineNumbers[0],
        suggestion: 'Extract duplicated code into a reusable method',
        impact: 'Code duplication increases maintenance burden'
      });
    }
  }
  
  return smells;
};

const detectDeadCode = (code: string): CodeSmell[] => {
  const smells: CodeSmell[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    if ((line.includes('return') || line.includes('break') || line.includes('continue')) &&
        !line.includes('//') &&
        nextLine !== '}' &&
        !nextLine.startsWith('//') &&
        nextLine !== '') {
      
      smells.push({
        type: 'dead-code',
        severity: 'minor',
        description: 'Unreachable code after control flow statement',
        line: i + 2,
        suggestion: 'Remove unreachable code',
        impact: 'Dead code confuses readers and increases file size'
      });
    }
  }
  
  return smells;
};

const categorizeSmells = (smells: CodeSmell[]): { [key: string]: CodeSmell[] } => {
  const categories: { [key: string]: CodeSmell[] } = {};
  
  for (const smell of smells) {
    const category = getCategoryName(smell.type);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(smell);
  }
  
  return categories;
};

const getCategoryName = (type: CodeSmell['type']): string => {
  switch (type) {
    case 'deep-nesting':
    case 'long-method':
    case 'large-class':
      return 'Structural Issues';
    case 'duplicate-code':
    case 'dead-code':
      return 'Code Quality';
    case 'magic-numbers':
    case 'unused-variables':
      return 'Maintainability';
    default:
      return 'General';
  }
};

const generateTimeComplexityDescription = (complexity: ComplexityGrade, factors: string[]): string => {
  const descriptions = {
    'O(1)': 'Constant time - excellent performance',
    'O(log n)': 'Logarithmic time - very efficient for large inputs',
    'O(n)': 'Linear time - performance scales with input size',
    'O(n log n)': 'Linearithmic time - typical for efficient sorting algorithms',
    'O(n²)': 'Quadratic time - may become slow for large inputs',
    'O(n³)': 'Cubic time - performance degrades quickly with input size',
    'O(2^n)': 'Exponential time - avoid for large inputs',
    'O(n!)': 'Factorial time - only suitable for very small inputs'
  };
  
  return descriptions[complexity] || 'Unknown complexity';
};

const generateSpaceComplexityDescription = (complexity: ComplexityGrade, factors: string[]): string => {
  const descriptions = {
    'O(1)': 'Constant space - minimal memory usage',
    'O(log n)': 'Logarithmic space - efficient memory usage',
    'O(n)': 'Linear space - memory scales with input size',
    'O(n log n)': 'Linearithmic space - moderate memory usage',
    'O(n²)': 'Quadratic space - significant memory requirements',
    'O(n³)': 'Cubic space - high memory usage',
    'O(2^n)': 'Exponential space - very high memory requirements',
    'O(n!)': 'Factorial space - extreme memory usage'
  };
  
  return descriptions[complexity] || 'Unknown space complexity';
};
