export interface TestCase {
  name: string;
  description: string;
  input: string;
  expectedOutput: string;
  category?: 'functional' | 'boundary' | 'conditional' | 'data-structure' | 'error' | 'performance';
  priority?: 'high' | 'medium' | 'low';
  passed?: boolean;
  actualOutput?: string;
  executionDetails?: string;
  expectedExceptionType?: string | null;
  expectedExceptionMessage?: string | null;
  actualExceptionType?: string | null;
  actualExceptionMessage?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestResult {
  passed: boolean;
  actualOutput: string;
  executionTime: number;
  memoryUsage: number;
  coverage: CodeCoverage;
  error: string | null;
  analysisDetails: TestAnalysisDetails;
}

export interface CodeCoverage {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestAnalysisDetails {
  outputDifferences: OutputDifference[];
  performance: PerformanceMetrics;
  suggestions: string[];
}

export interface OutputDifference {
  type: 'length' | 'case' | 'whitespace' | 'content';
  message?: string;
  actual?: any;
  expected?: any;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
}

export interface TestSuite {
  name: string;
  description?: string;
  language: string;
  testCases: TestCase[];
  coverage?: CodeCoverage;
  executionSummary?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    executionTime: number;
  };
}

export interface TestExecutionConfig {
  timeout: number;
  memoryLimit: number;
  inputFormat: 'stdin' | 'function' | 'file';
  outputFormat: 'stdout' | 'return' | 'file';
  sandboxOptions?: {
    isolationLevel: 'process' | 'container' | 'vm';
    networkAccess: boolean;
    fileSystemAccess: boolean;
    allowedModules?: string[];
  };
}

export interface TestGenerationConfig {
  maxTestCases: number;
  categories: Array<TestCase['category']>;
  priorities: Array<TestCase['priority']>;
  includeEdgeCases: boolean;
  includePerformanceTests: boolean;
  customPatterns?: {
    input?: RegExp[];
    output?: RegExp[];
  };
}

export interface TestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    coverage: CodeCoverage;
  };
  testResults: Array<{
    testCase: TestCase;
    result: TestResult;
  }>;
  performance: {
    slowestTests: Array<{
      testCase: TestCase;
      executionTime: number;
    }>;
    memoryUsage: {
      peak: number;
      average: number;
    };
  };
  recommendations: Array<{
    type: 'performance' | 'coverage' | 'reliability';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}