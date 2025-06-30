export interface CodeQualityRating {
  score: 'A' | 'B' | 'C' | 'D';
  description: string;
  reason?: string;
  issues?: string[] | ReliabilityIssue[]; // Updated to allow ReliabilityIssue[] type
  improvements?: string[];
  // Enhanced user-friendly properties
  percentageScore?: number; // 0-100 numerical score
  emoji?: string; // Visual indicator (🎉, ⚠️, ❌, etc.)
  severity?: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  recommendations?: string[]; // Specific actionable recommendations
}

export interface CodeViolations {
  major: number;
  minor: number;
  details: string[];
  lineReferences?: { line: number; issue: string; severity: 'major' | 'minor' }[]; // References to specific lines with severity
  categories?: { 
    category: string;
    violations: { issue: string; severity: 'major' | 'minor'; impact: number }[];
  }[];
  // Enhanced user-friendly properties
  total?: number; // Total violation count
  reportMarkdown?: string; // Formatted markdown report
  summary?: string; // Human-readable summary
  priorityIssues?: string[]; // Most critical issues to fix first
}

// Import new complexity types
import { ComplexityAnalysis, CodeSmellsAnalysis } from './complexityTypes';

export interface CodeAnalysis {
  originalCode: string;
  cyclomaticComplexity: CodeQualityRating;
  maintainability: CodeQualityRating;
  reliability: CodeQualityRating;
  violations: CodeViolations;
  aiSuggestions: string;
  correctedCode?: string;
  overallGrade?: 'A' | 'B' | 'C' | 'D'; // Overall code quality grade
  metrics?: MetricsResult;
  testCases: TestCase[]; // Added TestCase array to the CodeAnalysis interface
  
  // New complexity analysis
  complexityAnalysis?: ComplexityAnalysis;
  
  // New code smells detection
  codeSmells?: CodeSmellsAnalysis;
  
  // AI-enhanced analysis results
  syntaxErrors?: string[]; // AI-detected syntax errors
  securityIssues?: string[]; // AI-detected security issues  
  performanceIssues?: string[]; // AI-detected performance issues
  
  // Enhanced user-friendly properties
  analysisMetadata?: {
    analysisDate: Date;
    language: string;
    codeSize: 'small' | 'medium' | 'large'; // Based on LOC
    analysisTime?: number; // Time taken in milliseconds
    aiAnalysisUsed: boolean; // Whether AI analysis was successfully used
    version: string; // Analysis tool version
  };
  
  summary?: {
    overallScore: number; // 0-100 numerical score
    strengths: string[]; // What the code does well
    weaknesses: string[]; // Areas that need improvement
    quickFixes: string[]; // Easy fixes that can be done immediately
    longTermGoals: string[]; // Bigger refactoring suggestions
    priorityLevel: 'low' | 'medium' | 'high' | 'critical'; // Overall priority for fixes
  };
  
  insights?: {
    codeComplexityLevel: 'simple' | 'moderate' | 'complex' | 'very-complex';
    maintenanceEffort: 'low' | 'medium' | 'high';
    testCoverage: 'poor' | 'fair' | 'good' | 'excellent';
    readabilityScore: number; // 0-100
    technicalDebt: 'low' | 'medium' | 'high' | 'very-high';
  };
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  fileExtension: string;
  icon?: React.ReactNode;
}

export interface TestCase {
  name?: string;
  description?: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
  actualOutput?: string;
  executionDetails?: string;
  category?: string; // AI-generated test category (normal, edge, error, boundary, performance, security)
  // Enhanced user-friendly properties
  priority?: 'high' | 'medium' | 'low'; // Test priority
  difficulty?: 'easy' | 'medium' | 'hard'; // Implementation difficulty
  automated?: boolean; // Whether this test can be automated
  estimatedTime?: string; // Estimated time to implement
  tags?: string[]; // Test tags for categorization
}

// Add the missing types that are imported in codeMetrics.ts
export type ScoreGrade = 'A' | 'B' | 'C' | 'D';

export interface MetricsResult {
  linesOfCode: number;  
  codeLines: number;
  commentLines: number;
  commentPercentage: number;
  functionCount: number;  
  averageFunctionLength: number;
  maxNestingDepth: number;
  cyclomaticComplexity: number;
}

// Enhanced ReliabilityIssue interface with all required properties
export interface ReliabilityIssue {
  type: 'critical' | 'major' | 'minor';
  description: string;
  impact: number;
  category: 'runtime' | 'exception' | 'structure' | 'readability';
  line?: number;
  // Adding the missing properties
  codeContext?: string;
  pattern?: string;
}

// Re-export complexity types
export * from './complexityTypes';
