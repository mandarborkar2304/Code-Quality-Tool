import { TestCase } from '@/types';
import { analyzeCode } from './codeAnalysis';
import { detectLanguage } from './languageDetection';

interface FunctionInfo {
  name: string;
  params: {
    name: string;
    type: string;
  }[];
  returnType: string;
  isAsync: boolean;
}

interface CodePatterns {
  hasInputs: boolean;
  hasLoop: boolean;
  hasCondition: boolean;
  hasArray: boolean;
  hasString: boolean;
  hasNumbers: boolean;
  dataStructures: string[];
}

// Helper function to extract function name from code
function extractFunctionNameFromCode(code: string, language: string): string {
  // Default function name if we can't extract one
  let functionName = 'testFunction';
  
  if (language === 'javascript' || language === 'typescript') {
    const match = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*function|const\s+(\w+)\s*=\s*\(.*\)\s*=>/);
    if (match) {
      functionName = match[1] || match[2] || match[3] || functionName;
    }
  } else if (language === 'python') {
    const match = code.match(/def\s+(\w+)\s*\(/);
    if (match && match[1]) {
      functionName = match[1];
    }
  }
  
  return functionName;
}

// Helper function to extract function parameters from code
function extractFunctionParamsFromCode(code: string, language: string): { name: string; type: string }[] {
  const params: { name: string; type: string }[] = [];
  
  if (language === 'javascript' || language === 'typescript') {
    // Match function parameters in JavaScript/TypeScript
    const paramMatch = code.match(/function\s+\w+\s*\(([^)]*)\)|\(([^)]*)\)\s*=>/);
    if (paramMatch) {
      const paramStr = paramMatch[1] || paramMatch[2] || '';
      const paramList = paramStr.split(',').map(p => p.trim()).filter(Boolean);
      
      paramList.forEach(param => {
        // Handle TypeScript type annotations
        const [name, type] = param.split(':').map(p => p.trim());
        params.push({
          name: name.replace(/^(const|let|var)\s+/, ''),
          type: type || inferTypeFromName(name)
        });
      });
    }
  } else if (language === 'python') {
    // Match function parameters in Python
    const paramMatch = code.match(/def\s+\w+\s*\(([^)]*)\)/);
    if (paramMatch && paramMatch[1]) {
      const paramList = paramMatch[1].split(',').map(p => p.trim()).filter(Boolean);
      
      paramList.forEach(param => {
        // Handle Python type hints
        const [name, type] = param.split(':').map(p => p.trim());
        params.push({
          name: name,
          type: type || inferTypeFromName(name)
        });
      });
    }
  }
  
  return params;
}

// Helper function to infer return type from code
function inferReturnTypeFromCode(code: string, language: string): string {
  // Default to 'any' if we can't determine the return type
  let returnType = 'any';
  
  if (language === 'typescript') {
    // Try to find TypeScript return type annotation
    const match = code.match(/function\s+\w+\s*\([^)]*\)\s*:\s*(\w+)/);
    if (match && match[1]) {
      returnType = match[1];
    }
  }
  
  // Infer from return statements if no explicit type
  if (returnType === 'any') {
    if (code.includes('return true') || code.includes('return false')) {
      returnType = 'boolean';
    } else if (code.match(/return\s+['"]/) || code.includes('String')) {
      returnType = 'string';
    } else if (code.match(/return\s+\d/) || code.includes('Math.') || code.includes('Number')) {
      returnType = 'number';
    } else if (code.includes('return [') || code.includes('Array')) {
      returnType = 'array';
    } else if (code.includes('return {') || code.includes('Object')) {
      returnType = 'object';
    }
  }
  
  return returnType;
}

// Helper function to infer type from parameter name
function inferTypeFromName(name: string): string {
  name = name.toLowerCase();
  
  if (name.includes('id') || name.includes('index') || name.includes('count') || 
      name.includes('num') || name.includes('size') || name.includes('length')) {
    return 'number';
  } else if (name.includes('name') || name.includes('text') || name.includes('str') || 
           name.includes('message') || name.includes('label')) {
    return 'string';
  } else if (name.includes('is') || name.includes('has') || name.includes('should') || 
           name.includes('can') || name.includes('enable')) {
    return 'boolean';
  } else if (name.includes('arr') || name.includes('list') || name.includes('items') || 
           name.includes('elements')) {
    return 'array';
  } else if (name.includes('obj') || name.includes('options') || name.includes('config') || 
           name.includes('props') || name.includes('params')) {
    return 'object';
  }
  
  return 'any';
}

// Helper function to detect data structures used in code
function detectDataStructures(code: string): string[] {
  const structures: string[] = [];
  
  if (code.includes('[]') || code.includes('Array') || code.includes('map(') || 
      code.includes('filter(') || code.includes('reduce(')) {
    structures.push('Array');
  }
  
  if (code.includes('{}') || code.includes('Object.') || 
      code.match(/\w+\s*:\s*\w+/) || code.match(/\w+\.\w+/)) {
    structures.push('Object');
  }
  
  if (code.includes('Map(') || code.includes('new Map')) {
    structures.push('Map');
  }
  
  if (code.includes('Set(') || code.includes('new Set')) {
    structures.push('Set');
  }
  
  if (code.includes('Promise') || code.includes('async') || code.includes('then(')) {
    structures.push('Promise');
  }
  
  return structures;
}

export async function generateIntelligentTestCases(code: string, language: string): Promise<TestCase[]> {
  // Use available functions to analyze code
  const analysisResult = await analyzeCode(code, language);
  
  // Extract function information and patterns from analysis result
  const functionInfo: FunctionInfo = {
    name: extractFunctionNameFromCode(code, language),
    params: extractFunctionParamsFromCode(code, language),
    returnType: inferReturnTypeFromCode(code, language),
    isAsync: code.includes('async')
  };
  
  // Detect patterns from code
  const patterns: CodePatterns = {
    hasInputs: functionInfo.params.length > 0,
    hasLoop: code.includes('for') || code.includes('while') || code.includes('forEach'),
    hasCondition: code.includes('if') || code.includes('switch') || code.includes('?'),
    hasArray: code.includes('[]') || code.includes('Array') || code.includes('map('),
    hasString: code.includes('"') || code.includes('\'') || code.includes('String'),
    hasNumbers: /\d+/.test(code) || code.includes('Number'),
    dataStructures: detectDataStructures(code)
  };
  
  // Generate test cases based on static analysis
  const staticTests = generateStaticTestCases(functionInfo, patterns, language);

  // Generate test cases based on I/O inference
  const ioTests = generateIOBasedTests(functionInfo, patterns);

  // Generate edge cases and boundary tests
  const edgeCases = generateEdgeCases(functionInfo, patterns);

  // Combine and deduplicate test cases
  const allTests = [...staticTests, ...ioTests, ...edgeCases];
  const uniqueTests = deduplicateTests(allTests);

  return uniqueTests.slice(0, 10); // Limit to 10 test cases
}

function generateStaticTestCases(functionInfo: FunctionInfo, patterns: CodePatterns, language: string): TestCase[] {
  const testCases: TestCase[] = [];

  // Happy path test
  testCases.push({
    name: `${functionInfo.name} - Happy Path`,
    description: 'Test with valid, typical input values',
    input: generateTypicalInput(functionInfo.params, language),
    expectedOutput: generateExpectedOutput(functionInfo.returnType, 'typical'),
    category: 'functional'
  });

  // Add tests based on detected patterns
  if (patterns.hasLoop) {
    testCases.push({
      name: 'Loop Boundary Test',
      description: 'Test with empty and single-element collections',
      input: generateEmptyInput(functionInfo.params, language),
      expectedOutput: generateExpectedOutput(functionInfo.returnType, 'empty'),
      category: 'boundary'
    });
  }

  if (patterns.hasCondition) {
    testCases.push({
      name: 'Condition Coverage Test',
      description: 'Test branch conditions',
      input: generateBoundaryInput(functionInfo.params, language),
      expectedOutput: generateExpectedOutput(functionInfo.returnType, 'boundary'),
      category: 'conditional'
    });
  }

  return testCases;
}

function generateIOBasedTests(functionInfo: FunctionInfo, patterns: CodePatterns): TestCase[] {
  const testCases: TestCase[] = [];

  // Generate tests based on parameter types and data structures
  functionInfo.params.forEach(param => {
    if (param.type.includes('array') || patterns.hasArray) {
      testCases.push({
        name: `Array Processing Test - ${param.name}`,
        description: 'Test array processing with various sizes',
        input: generateArrayInput(param.type),
        expectedOutput: generateExpectedOutput(functionInfo.returnType, 'array'),
        category: 'data-structure'
      });
    }

    if (param.type.includes('string') || patterns.hasString) {
      testCases.push({
        name: `String Processing Test - ${param.name}`,
        description: 'Test string handling with special characters',
        input: generateStringInput(),
        expectedOutput: generateExpectedOutput(functionInfo.returnType, 'string'),
        category: 'data-structure'
      });
    }
  });

  return testCases;
}

function generateEdgeCases(functionInfo: FunctionInfo, patterns: CodePatterns): TestCase[] {
  const testCases: TestCase[] = [];

  // Add error cases
  testCases.push({
    name: 'Invalid Input Test',
    description: 'Test with invalid input format',
    input: generateInvalidInput(functionInfo.params),
    expectedOutput: 'Should handle invalid input appropriately',
    category: 'error'
  });

  // Add performance test cases
  if (patterns.hasLoop || patterns.hasArray) {
    testCases.push({
      name: 'Performance Test',
      description: 'Test with large input size',
      input: generateLargeInput(functionInfo.params),
      expectedOutput: generateExpectedOutput(functionInfo.returnType, 'large'),
      category: 'performance'
    });
  }

  return testCases;
}

// Helper functions for input generation
function generateTypicalInput(params: FunctionInfo['params'], language: string): string {
  return params.map(param => {
    if (param.type.includes('number')) return '42';
    if (param.type.includes('string')) return '"test"';
    if (param.type.includes('array')) return '[1, 2, 3]';
    if (param.type.includes('boolean')) return 'true';
    return 'null';
  }).join(', ');
}

function generateEmptyInput(params: FunctionInfo['params'], language: string): string {
  return params.map(param => {
    if (param.type.includes('array')) return '[]';
    if (param.type.includes('string')) return '""';
    if (param.type.includes('number')) return '0';
    if (param.type.includes('boolean')) return 'false';
    return 'null';
  }).join(', ');
}

function generateBoundaryInput(params: FunctionInfo['params'], language: string): string {
  return params.map(param => {
    if (param.type.includes('number')) return '-1';
    if (param.type.includes('array')) return '[1]';
    if (param.type.includes('string')) return '"a"';
    if (param.type.includes('boolean')) return 'false';
    return 'null';
  }).join(', ');
}

function generateArrayInput(type: string): string {
  return '[1, 2, 3, 4, 5]';
}

function generateStringInput(): string {
  return '"Hello, World! 123"';
}

function generateInvalidInput(params: FunctionInfo['params']): string {
  return params.map(() => 'invalid_input').join(', ');
}

function generateLargeInput(params: FunctionInfo['params']): string {
  return params.map(param => {
    if (param.type.includes('array')) return '[' + Array(100).fill(1).join(',') + ']';
    if (param.type.includes('string')) return '"' + 'a'.repeat(1000) + '"';
    if (param.type.includes('number')) return '1000000';
    return 'null';
  }).join(', ');
}

function generateExpectedOutput(returnType: string, testType: string): string {
  switch (testType) {
    case 'typical':
      return 'Expected output for typical input';
    case 'empty':
      return returnType.includes('array') ? '[]' : 'null';
    case 'boundary':
      return 'Expected output for boundary case';
    case 'array':
      return 'Processed array output';
    case 'string':
      return 'Processed string output';
    case 'large':
      return 'Expected output for large input';
    default:
      return 'Expected output based on input';
  }
}

function deduplicateTests(tests: TestCase[]): TestCase[] {
  const seen = new Set<string>();
  return tests.filter(test => {
    const key = `${test.input}-${test.expectedOutput}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}