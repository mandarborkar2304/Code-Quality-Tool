// src/utils/enhancedComplexityAnalysis.ts

import { analyzeComplexityWithGroq, ComplexityResult, ComplexityAnalysisRequest } from "@/pages/api/groqComplexityAPI";

export interface EnhancedComplexityAnalysis {
  timeComplexity: {
    notation: string;
    bestCase: string;
    averageCase: string;
    worstCase: string;
    description: string;
    explanation: string;
    factors: string[];
    confidence: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  spaceComplexity: {
    notation: string;
    auxiliary: string;
    total: string;
    description: string;
    explanation: string;
    factors: string[];
    confidence: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  algorithmType: string;
  dataStructures: string[];
  optimizationSuggestions: string[];
  staticAnalysis: {
    loops: number;
    nestedLoops: number;
    recursiveCalls: number;
    dataStructureAllocations: number;
    codeLength: number;
    functionCount: number;
  };
  overallComplexityScore: number; // 0-100
  performanceCategory: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
}

/**
 * Convert Big O notation to grade
 */
function getComplexityGrade(notation: string): 'A' | 'B' | 'C' | 'D' | 'F' {
  const gradeMap: { [key: string]: 'A' | 'B' | 'C' | 'D' | 'F' } = {
    'O(1)': 'A',
    'O(log n)': 'A',
    'O(n)': 'B',
    'O(n log n)': 'B',
    'O(n²)': 'C',
    'O(n³)': 'D',
    'O(2^n)': 'F',
    'O(n!)': 'F',
  };
  
  return gradeMap[notation] || 'C';
}

/**
 * Generate human-readable description for complexity
 */
function generateComplexityDescription(notation: string, type: 'time' | 'space'): string {
  const descriptions: { [key: string]: { time: string; space: string } } = {
    'O(1)': {
      time: 'Constant time - execution time remains the same regardless of input size',
      space: 'Constant space - memory usage is fixed and doesn\'t grow with input size'
    },
    'O(log n)': {
      time: 'Logarithmic time - execution time grows logarithmically with input size',
      space: 'Logarithmic space - memory usage grows logarithmically with input size'
    },
    'O(n)': {
      time: 'Linear time - execution time grows linearly with input size',
      space: 'Linear space - memory usage grows linearly with input size'
    },
    'O(n log n)': {
      time: 'Linearithmic time - execution time grows as n log n (typical of efficient sorting)',
      space: 'Linearithmic space - memory usage grows as n log n'
    },
    'O(n²)': {
      time: 'Quadratic time - execution time grows quadratically (nested loops)',
      space: 'Quadratic space - memory usage grows quadratically (2D arrays)'
    },
    'O(n³)': {
      time: 'Cubic time - execution time grows cubically (triple nested loops)',
      space: 'Cubic space - memory usage grows cubically (3D arrays)'
    },
    'O(2^n)': {
      time: 'Exponential time - execution time doubles with each input increase',
      space: 'Exponential space - memory usage doubles with each input increase'
    },
    'O(n!)': {
      time: 'Factorial time - execution time grows factorially (extremely inefficient)',
      space: 'Factorial space - memory usage grows factorially'
    }
  };
  
  return descriptions[notation]?.[type] || `${type} complexity: ${notation}`;
}

/**
 * Calculate overall complexity score
 */
function calculateComplexityScore(timeGrade: string, spaceGrade: string, confidence: number): number {
  const gradeScores = { 'A': 90, 'B': 75, 'C': 60, 'D': 40, 'F': 20 };
  const timeScore = gradeScores[timeGrade as keyof typeof gradeScores] || 50;
  const spaceScore = gradeScores[spaceGrade as keyof typeof gradeScores] || 50;
  
  // Weight: 60% time complexity, 40% space complexity
  const baseScore = (timeScore * 0.6) + (spaceScore * 0.4);
  
  // Adjust based on AI confidence
  const confidenceMultiplier = confidence / 100;
  
  return Math.round(baseScore * confidenceMultiplier);
}

/**
 * Determine performance category
 */
function getPerformanceCategory(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  if (score >= 35) return 'Poor';
  return 'Critical';
}

/**
 * Enhanced complexity analysis with Groq AI
 */
export async function analyzeComplexity(
  code: string,
  language: string,
  functionName?: string,
  context?: string
): Promise<EnhancedComplexityAnalysis> {
  try {
    // Prepare request for Groq analysis
    const request: ComplexityAnalysisRequest = {
      code,
      language,
      functionName,
      context
    };
    
    // Get AI analysis
    const groqResult: ComplexityResult = await analyzeComplexityWithGroq(request);
    
    // Calculate grades
    const timeGrade = getComplexityGrade(groqResult.timeComplexity.notation);
    const spaceGrade = getComplexityGrade(groqResult.spaceComplexity.notation);
    
    // Calculate overall score
    const avgConfidence = (groqResult.timeComplexity.confidence + groqResult.spaceComplexity.confidence) / 2;
    const overallScore = calculateComplexityScore(timeGrade, spaceGrade, avgConfidence);
    
    // Enhanced static analysis
    const enhancedStaticAnalysis = {
      ...groqResult.staticAnalysis,
      codeLength: code.split('\n').length,
      functionCount: extractFunctionCount(code, language)
    };
    
    return {
      timeComplexity: {
        notation: groqResult.timeComplexity.notation,
        bestCase: groqResult.timeComplexity.bestCase,
        averageCase: groqResult.timeComplexity.averageCase,
        worstCase: groqResult.timeComplexity.worstCase,
        description: generateComplexityDescription(groqResult.timeComplexity.notation, 'time'),
        explanation: groqResult.timeComplexity.explanation,
        factors: groqResult.timeComplexity.factors,
        confidence: groqResult.timeComplexity.confidence,
        grade: timeGrade
      },
      spaceComplexity: {
        notation: groqResult.spaceComplexity.notation,
        auxiliary: groqResult.spaceComplexity.auxiliary,
        total: groqResult.spaceComplexity.total,
        description: generateComplexityDescription(groqResult.spaceComplexity.notation, 'space'),
        explanation: groqResult.spaceComplexity.explanation,
        factors: groqResult.spaceComplexity.factors,
        confidence: groqResult.spaceComplexity.confidence,
        grade: spaceGrade
      },
      algorithmType: groqResult.algorithmType,
      dataStructures: groqResult.dataStructures,
      optimizationSuggestions: groqResult.optimizationSuggestions,
      staticAnalysis: enhancedStaticAnalysis,
      overallComplexityScore: overallScore,
      performanceCategory: getPerformanceCategory(overallScore)
    };
    
  } catch (error) {
    console.error('Enhanced complexity analysis failed:', error);
    
    // Return fallback analysis
    return generateEnhancedFallbackAnalysis(code, language);
  }
}

/**
 * Extract function count from code
 */
function extractFunctionCount(code: string, language: string): number {
  const patterns = {
    javascript: [/function\s+\w+|=\s*function|\w+\s*=\s*\([^)]*\)\s*=>/g],
    python: [/def\s+\w+/g],
    java: [/(?:public|private|protected|static)\s+\w+\s+\w+\s*\(/g],
    cpp: [/\w+\s+\w+\s*\([^)]*\)\s*\{/g],
    csharp: [/(?:public|private|protected|internal)\s+\w+\s+\w+\s*\(/g]
  };
  
  const langPatterns = patterns[language as keyof typeof patterns] || patterns.javascript;
  let count = 0;
  
  langPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

/**
 * Generate enhanced fallback analysis
 */
function generateEnhancedFallbackAnalysis(code: string, language: string): EnhancedComplexityAnalysis {
  // Basic static analysis
  const lines = code.split('\n');
  const codeLength = lines.length;
  const functionCount = extractFunctionCount(code, language);
  
  // Simple pattern matching for fallback
  const hasNestedLoops = /for.*for|while.*while|for.*while|while.*for/s.test(code);
  const hasRecursion = /function.*\w+.*\w+\s*\(/.test(code) && code.split('function').length > 2;
  const hasSorting = /\.sort|Arrays\.sort|Collections\.sort/.test(code);
  
  let timeComplexity = 'O(1)';
  let spaceComplexity = 'O(1)';
  
  if (hasNestedLoops) {
    timeComplexity = 'O(n²)';
  } else if (hasSorting) {
    timeComplexity = 'O(n log n)';
  } else if (code.includes('for') || code.includes('while')) {
    timeComplexity = 'O(n)';
  }
  
  if (hasRecursion) {
    spaceComplexity = 'O(n)';
  }
  
  const timeGrade = getComplexityGrade(timeComplexity);
  const spaceGrade = getComplexityGrade(spaceComplexity);
  const overallScore = calculateComplexityScore(timeGrade, spaceGrade, 50);
  
  return {
    timeComplexity: {
      notation: timeComplexity,
      bestCase: timeComplexity,
      averageCase: timeComplexity,
      worstCase: timeComplexity,
      description: generateComplexityDescription(timeComplexity, 'time'),
      explanation: 'Fallback analysis based on basic pattern matching',
      factors: ['Basic pattern analysis'],
      confidence: 50,
      grade: timeGrade
    },
    spaceComplexity: {
      notation: spaceComplexity,
      auxiliary: spaceComplexity,
      total: spaceComplexity,
      description: generateComplexityDescription(spaceComplexity, 'space'),
      explanation: 'Fallback analysis based on basic pattern matching',
      factors: ['Basic pattern analysis'],
      confidence: 50,
      grade: spaceGrade
    },
    algorithmType: 'Unknown',
    dataStructures: ['Array'],
    optimizationSuggestions: [
      'Consider using more efficient algorithms',
      'Reduce nested loops where possible',
      'Use appropriate data structures'
    ],
    staticAnalysis: {
      loops: (code.match(/for|while/g) || []).length,
      nestedLoops: hasNestedLoops ? 2 : 1,
      recursiveCalls: hasRecursion ? 1 : 0,
      dataStructureAllocations: (code.match(/new\s+\w+|new\s+Array|\[\]/g) || []).length,
      codeLength,
      functionCount
    },
    overallComplexityScore: overallScore,
    performanceCategory: getPerformanceCategory(overallScore)
  };
}

/**
 * Analyze multiple functions in a codebase
 */
export async function analyzeCodebaseComplexity(
  code: string,
  language: string
): Promise<{
  functions: Array<{
    name: string;
    analysis: EnhancedComplexityAnalysis;
  }>;
  overall: {
    averageTimeGrade: string;
    averageSpaceGrade: string;
    totalComplexityScore: number;
    performanceCategory: string;
  };
}> {
  const functions = extractFunctions(code, language);
  const analyses = await Promise.all(
    functions.map(func => 
      analyzeComplexity(func.code, language, func.name, 'Function analysis')
    )
  );
  
  const results = functions.map((func, index) => ({
    name: func.name,
    analysis: analyses[index]
  }));
  
  // Calculate overall metrics
  const avgTimeGrade = calculateAverageGrade(analyses.map(a => a.timeComplexity.grade));
  const avgSpaceGrade = calculateAverageGrade(analyses.map(a => a.spaceComplexity.grade));
  const totalScore = analyses.reduce((sum, a) => sum + a.overallComplexityScore, 0) / analyses.length;
  
  return {
    functions: results,
    overall: {
      averageTimeGrade: avgTimeGrade,
      averageSpaceGrade: avgSpaceGrade,
      totalComplexityScore: Math.round(totalScore),
      performanceCategory: getPerformanceCategory(totalScore)
    }
  };
}

/**
 * Extract functions from code
 */
function extractFunctions(code: string, language: string): Array<{ name: string; code: string }> {
  const functions: Array<{ name: string; code: string }> = [];
  
  // This is a simplified extraction - in practice, you'd want more sophisticated parsing
  const lines = code.split('\n');
  let currentFunction = '';
  let functionName = '';
  let braceCount = 0;
  let inFunction = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect function start
    const funcMatch = trimmed.match(/(?:function\s+(\w+)|def\s+(\w+)|(\w+)\s*=\s*function)/);
    if (funcMatch && !inFunction) {
      functionName = funcMatch[1] || funcMatch[2] || funcMatch[3];
      currentFunction = line + '\n';
      inFunction = true;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    } else if (inFunction) {
      currentFunction += line + '\n';
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      if (braceCount <= 0) {
        functions.push({ name: functionName, code: currentFunction });
        currentFunction = '';
        functionName = '';
        inFunction = false;
        braceCount = 0;
      }
    }
  }
  
  return functions;
}

/**
 * Calculate average grade
 */
function calculateAverageGrade(grades: string[]): string {
  const gradeValues = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
  const valueGrades = ['F', 'D', 'C', 'B', 'A'];
  
  const average = grades.reduce((sum, grade) => sum + gradeValues[grade as keyof typeof gradeValues], 0) / grades.length;
  return valueGrades[Math.round(average)] || 'C';
}