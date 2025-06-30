// src/pages/api/groqComplexityAPI.ts

export interface ComplexityResult {
  timeComplexity: {
    notation: string;
    bestCase: string;
    averageCase: string;
    worstCase: string;
    explanation: string;
    factors: string[];
    confidence: number; // 0-100
  };
  spaceComplexity: {
    notation: string;
    auxiliary: string;
    total: string;
    explanation: string;
    factors: string[];
    confidence: number; // 0-100
  };
  algorithmType: string;
  dataStructures: string[];
  optimizationSuggestions: string[];
  staticAnalysis: {
    loops: number;
    nestedLoops: number;
    recursiveCalls: number;
    dataStructureAllocations: number;
  };
}

export interface ComplexityAnalysisRequest {
  code: string;
  language: string;
  functionName?: string;
  context?: string;
}

/**
 * Perform static analysis to gather basic metrics
 */
function performStaticAnalysis(code: string, language: string) {
  const lines = code.split('\n');
  
  // Count loops
  const loopPatterns = [
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bdo\s*\{/g,
    /\.forEach\s*\(/g,
    /\.map\s*\(/g,
    /\.filter\s*\(/g,
    /\.reduce\s*\(/g,
    /\bfor\s+\w+\s+in\s+/g, // Python for loops
  ];
  
  let totalLoops = 0;
  loopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) totalLoops += matches.length;
  });
  
  // Estimate nested loops
  let nestedLoops = 0;
  let currentDepth = 0;
  let maxDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (loopPatterns.some(pattern => pattern.test(trimmed))) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    if (trimmed.includes('}') && currentDepth > 0) {
      currentDepth--;
    }
  }
  nestedLoops = maxDepth;
  
  // Count recursive calls
  const functionNames = extractFunctionNames(code, language);
  let recursiveCalls = 0;
  
  functionNames.forEach(funcName => {
    const funcCallCount = (code.match(new RegExp(`\\b${funcName}\\s*\\(`, 'g')) || []).length;
    if (funcCallCount > 1) {
      recursiveCalls++;
    }
  });
  
  // Count data structure allocations
  const allocPatterns = [
    /new\s+(?:Array|ArrayList|Vector|List|HashMap|HashSet|TreeMap|TreeSet)/g,
    /\[\s*\]/g,
    /\{\s*\}/g,
    /dict\s*\(/g,
    /list\s*\(/g,
    /set\s*\(/g,
  ];
  
  let dataStructureAllocations = 0;
  allocPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) dataStructureAllocations += matches.length;
  });
  
  return {
    loops: totalLoops,
    nestedLoops,
    recursiveCalls,
    dataStructureAllocations
  };
}

/**
 * Extract function names from code
 */
function extractFunctionNames(code: string, language: string): string[] {
  const names: string[] = [];
  
  const patterns = {
    javascript: [
      /function\s+(\w+)\s*\(/g,
      /(\w+)\s*=\s*function/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /(\w+)\s*\([^)]*\)\s*\{/g,
    ],
    python: [
      /def\s+(\w+)\s*\(/g,
    ],
    java: [
      /(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/g,
    ],
    cpp: [
      /\w+\s+(\w+)\s*\([^)]*\)\s*\{/g,
    ],
    csharp: [
      /(?:public|private|protected|internal|static|\s)+\w+\s+(\w+)\s*\(/g,
    ]
  };
  
  const langPatterns = patterns[language as keyof typeof patterns] || patterns.javascript;
  
  langPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      names.push(match[1]);
    }
  });
  
  return [...new Set(names)];
}

/**
 * Analyze code complexity using Groq AI
 */
export async function analyzeComplexityWithGroq(request: ComplexityAnalysisRequest): Promise<ComplexityResult> {
  try {
    // Call the Netlify function
    const response = await fetch("/.netlify/functions/groq-complexity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const analysisResult = await response.json();
    return analysisResult;
    
  } catch (error) {
    console.error("Groq complexity analysis failed:", error);
    
    // Perform static analysis for fallback
    const staticAnalysis = performStaticAnalysis(request.code, request.language);
    
    // Return fallback analysis
    return generateFallbackComplexityAnalysis(request.code, request.language, staticAnalysis);
  }
}

/**
 * Generate fallback complexity analysis when Groq fails
 */
function generateFallbackComplexityAnalysis(
  code: string, 
  language: string, 
  staticAnalysis: any
): ComplexityResult {
  // Basic complexity estimation based on static analysis
  let timeComplexity = "O(1)";
  let spaceComplexity = "O(1)";
  
  if (staticAnalysis.nestedLoops >= 3) {
    timeComplexity = "O(n³)";
  } else if (staticAnalysis.nestedLoops >= 2) {
    timeComplexity = "O(n²)";
  } else if (staticAnalysis.loops > 0 || staticAnalysis.recursiveCalls > 0) {
    timeComplexity = "O(n)";
  }
  
  if (staticAnalysis.recursiveCalls > 0) {
    spaceComplexity = "O(n)";
  } else if (staticAnalysis.dataStructureAllocations > 0) {
    spaceComplexity = "O(n)";
  }
  
  // Check for common patterns
  const hasSorting = /\.sort\s*\(|Arrays\.sort|Collections\.sort|sorted\s*\(/i.test(code);
  const hasBinarySearch = /binary.*search|while.*mid|left.*right.*middle/i.test(code);
  
  if (hasSorting && timeComplexity === "O(n)") {
    timeComplexity = "O(n log n)";
  }
  
  if (hasBinarySearch && timeComplexity === "O(1)") {
    timeComplexity = "O(log n)";
  }
  
  return {
    timeComplexity: {
      notation: timeComplexity,
      bestCase: timeComplexity,
      averageCase: timeComplexity,
      worstCase: timeComplexity,
      explanation: `Estimated based on static analysis. ${staticAnalysis.nestedLoops} nested loops detected.`,
      factors: [`${staticAnalysis.loops} loops`, `${staticAnalysis.recursiveCalls} recursive calls`],
      confidence: 60
    },
    spaceComplexity: {
      notation: spaceComplexity,
      auxiliary: spaceComplexity,
      total: spaceComplexity,
      explanation: `Estimated based on data structure allocations and recursion depth.`,
      factors: [`${staticAnalysis.dataStructureAllocations} data structures`, `${staticAnalysis.recursiveCalls} recursive calls`],
      confidence: 55
    },
    algorithmType: "Unknown",
    dataStructures: ["Array"],
    optimizationSuggestions: [
      "Consider reducing nested loops if possible",
      "Use more efficient data structures",
      "Consider iterative approaches instead of recursion"
    ],
    staticAnalysis
  };
}

/**
 * Batch analyze multiple code segments
 */
export async function batchAnalyzeComplexity(requests: ComplexityAnalysisRequest[]): Promise<ComplexityResult[]> {
  const results = await Promise.allSettled(
    requests.map(request => analyzeComplexityWithGroq(request))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to analyze code segment ${index}:`, result.reason);
      return generateFallbackComplexityAnalysis(
        requests[index].code, 
        requests[index].language,
        performStaticAnalysis(requests[index].code, requests[index].language)
      );
    }
  });
}

/**
 * Validate complexity analysis result
 */
export function validateComplexityResult(result: ComplexityResult): boolean {
  const validNotations = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2^n)', 'O(n!)'];
  
  return (
    validNotations.includes(result.timeComplexity.notation) &&
    validNotations.includes(result.spaceComplexity.notation) &&
    result.timeComplexity.confidence >= 0 &&
    result.timeComplexity.confidence <= 100 &&
    result.spaceComplexity.confidence >= 0 &&
    result.spaceComplexity.confidence <= 100
  );
}