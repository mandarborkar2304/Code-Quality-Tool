// src/pages/api/improvementAPI.ts

import { CodeAnalysis } from "@/types";

interface EnhancedImprovement {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  oneLineFix: string;
  detailedRecommendation: string;
  codeExample?: string;
  estimatedTime: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  relatedIssues: string[];
}

export const fetchAIImprovements = async (analysis: CodeAnalysis): Promise<EnhancedImprovement[]> => {
  try {
    const res = await fetch("/.netlify/functions/groq-improvements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const improvements = data.improvements || [];
    
    // Ensure all improvements have the required enhanced fields
    return improvements.map((improvement: any) => ({
      type: improvement.type || 'medium',
      category: improvement.category || 'General',
      title: improvement.title || 'Code Improvement',
      description: improvement.description || 'Consider improving this aspect of your code.',
      impact: improvement.impact || 'Moderate impact on code quality.',
      oneLineFix: improvement.oneLineFix || 'Review and refactor the identified issue.',
      detailedRecommendation: improvement.detailedRecommendation || improvement.description || 'Review the code for potential improvements.',
      codeExample: improvement.codeExample,
      estimatedTime: improvement.estimatedTime || '15-30 minutes',
      difficultyLevel: improvement.difficultyLevel || 'medium',
      relatedIssues: improvement.relatedIssues || []
    }));
    
  } catch (err) {
    console.error("Failed to fetch AI improvements:", err);
    
    // Return enhanced fallback improvements based on analysis
    return generateFallbackImprovements(analysis);
  }
};

/**
 * Generate fallback improvements based on analysis data
 */
function generateFallbackImprovements(analysis: CodeAnalysis): EnhancedImprovement[] {
  const improvements: EnhancedImprovement[] = [];
  
  // Check cyclomatic complexity
  if (analysis.cyclomaticComplexity?.score === 'D' || analysis.cyclomaticComplexity?.score === 'C') {
    improvements.push({
      type: 'high',
      category: 'Code Complexity',
      title: 'High Cyclomatic Complexity Detected',
      description: 'Your code has high cyclomatic complexity, making it harder to test and maintain.',
      impact: 'High complexity increases bug risk and makes code harder to understand and modify.',
      oneLineFix: 'Break down large functions into smaller, focused functions with single responsibilities.',
      detailedRecommendation: 'Reduce cyclomatic complexity by:\n1. Extracting nested logic into separate functions\n2. Using early returns to reduce nesting\n3. Replacing complex conditionals with polymorphism\n4. Breaking large functions into smaller, single-purpose functions\n5. Using guard clauses to handle edge cases early',
      codeExample: `// Before (high complexity)
function processUser(user) {
  if (user) {
    if (user.active) {
      if (user.permissions) {
        // complex logic
      }
    }
  }
}

// After (reduced complexity)
function processUser(user) {
  if (!user) return;
  if (!user.active) return;
  if (!user.permissions) return;
  
  processActiveUser(user);
}`,
      estimatedTime: '30-60 minutes',
      difficultyLevel: 'medium',
      relatedIssues: ['Code maintainability', 'Testing difficulty', 'Bug susceptibility']
    });
  }
  
  // Check maintainability
  if (analysis.maintainability?.score === 'D' || analysis.maintainability?.score === 'C') {
    improvements.push({
      type: 'medium',
      category: 'Maintainability',
      title: 'Poor Code Maintainability',
      description: 'Your code has low maintainability scores, making future changes difficult.',
      impact: 'Low maintainability leads to slower development and higher bug rates.',
      oneLineFix: 'Add meaningful comments, improve variable names, and extract reusable functions.',
      detailedRecommendation: 'Improve maintainability by:\n1. Using descriptive variable and function names\n2. Adding clear comments for complex logic\n3. Following consistent coding style\n4. Removing duplicate code\n5. Organizing code into logical modules\n6. Using consistent error handling patterns',
      codeExample: `// Before
function calc(a, b, c) {
  return a * b + c; // unclear purpose
}

// After
function calculateTotalPrice(basePrice, taxRate, shippingCost) {
  // Calculate total price including tax and shipping
  return basePrice * taxRate + shippingCost;
}`,
      estimatedTime: '45-90 minutes',
      difficultyLevel: 'easy',
      relatedIssues: ['Code readability', 'Team collaboration', 'Future modifications']
    });
  }
  
  // Check violations
  if (analysis.violations && (analysis.violations.major > 3 || analysis.violations.minor > 10)) {
    improvements.push({
      type: 'critical',
      category: 'Code Quality',
      title: 'Multiple Code Quality Violations',
      description: 'Several code quality violations have been detected that should be addressed.',
      impact: 'Code violations can lead to bugs, security issues, and maintenance problems.',
      oneLineFix: 'Review and fix the highest priority violations first, focusing on critical issues.',
      detailedRecommendation: 'Address code violations systematically:\n1. Fix critical violations immediately\n2. Address major violations in the next development cycle\n3. Set up automated code quality checks\n4. Establish coding standards for the team\n5. Use linting tools to catch issues early\n6. Implement code review processes',
      codeExample: `// Example fixes for common violations:

// Fix: Use === instead of ==
if (value === "test") { /* better */ }

// Fix: Handle potential null/undefined
if (data && data.property) { /* safer */ }

// Fix: Use const/let instead of var
const userName = "john"; // better scoping`,
      estimatedTime: '1-3 hours',
      difficultyLevel: 'medium',
      relatedIssues: ['Bug prevention', 'Code consistency', 'Team standards']
    });
  }
  
  // Check syntax errors
  if (analysis.syntaxErrors && analysis.syntaxErrors.length > 0) {
    improvements.push({
      type: 'critical',
      category: 'Syntax',
      title: 'Syntax Errors Detected',
      description: 'Your code contains syntax errors that prevent proper execution.',
      impact: 'Syntax errors will cause runtime failures and prevent code execution.',
      oneLineFix: 'Fix all syntax errors immediately - they prevent code from running.',
      detailedRecommendation: 'Address syntax errors by:\n1. Using an IDE with syntax highlighting\n2. Running code through a linter\n3. Testing code frequently during development\n4. Using TypeScript for better error detection\n5. Setting up pre-commit hooks to catch errors\n6. Following language-specific best practices',
      estimatedTime: '5-15 minutes',
      difficultyLevel: 'easy',
      relatedIssues: ['Code execution', 'Development workflow', 'Error prevention']
    });
  }
  
  // Always include a general recommendation if no specific issues found
  if (improvements.length === 0) {
    improvements.push({
      type: 'low',
      category: 'Best Practices',
      title: 'Code Quality Looks Good',
      description: 'Your code appears to follow good practices. Consider these enhancements.',
      impact: 'Following best practices improves long-term code quality and team productivity.',
      oneLineFix: 'Add comprehensive tests and documentation to complete the quality picture.',
      detailedRecommendation: 'Continue improving by:\n1. Adding unit tests for all functions\n2. Writing comprehensive documentation\n3. Implementing automated testing\n4. Setting up continuous integration\n5. Regular code reviews with team members\n6. Staying updated with language best practices',
      codeExample: `// Add tests for your functions
test('calculateTotal should return correct sum', () => {
  expect(calculateTotal(10, 5)).toBe(15);
});

// Add JSDoc comments
/**
 * Calculates the total of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 */
function calculateTotal(a, b) {
  return a + b;
}`,
      estimatedTime: '2-4 hours',
      difficultyLevel: 'medium',
      relatedIssues: ['Test coverage', 'Documentation', 'Code reliability']
    });
  }
  
  return improvements;
}
