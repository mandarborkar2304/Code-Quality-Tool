// src/utils/quality/insights.ts

import { CodeViolations } from "@/types";

export interface Recommendation {
  line?: number;
  category: string;
  rule: string;
  suggestion: string;
}

const ruleMap: Record<string, string> = {
  // Runtime safety
  "null pointer": "Ensure the variable is checked for null before use.",
  "array index": "Verify the array index is within valid bounds.",
  "missing return": "Ensure all code paths return a value when required.",
  "division by zero": "Add a check to prevent division by zero.",
  "missing try": "Wrap risky code with try-catch blocks to prevent runtime crashes.",
  "infinite loop": "Ensure loop conditions will eventually become false to avoid infinite loops.",

  // Maintainability
  "magic number": "Replace magic numbers with named constants for better code clarity.",
  "unused variable": "Remove unused variables to reduce clutter and improve readability.",
  "duplicate code": "Refactor duplicated logic into reusable functions.",
  "long function": "Break large functions into smaller, focused units.",
  "long parameter list": "Group related parameters into objects or classes to simplify function signatures.",
  "deep nesting": "Consider refactoring nested blocks into separate functions to improve readability.",

  // Style & readability
  "missing documentation": "Add function or class-level documentation to improve code understanding.",
  "bad naming": "Rename variables or functions to be more descriptive and intuitive.",
  "unclear logic": "Refactor complex or unclear logic into smaller, named helper methods.",
  "dead code": "Remove unreachable or obsolete code to keep the codebase clean.",

  // Structural issues
  "too many return statements": "Simplify logic to reduce the number of exit points.",
  "missing break": "Add break statements to prevent unintended fallthrough in switch cases.",
  "complex condition": "Decompose complex conditional expressions into clearly named boolean variables.",
  "spaghetti code": "Refactor tangled control flow into clearer modules or layers.",

  // Exception handling
  "empty catch": "Avoid silent failures; log or handle errors inside catch blocks.",
  "broad catch": "Catch specific exceptions to avoid masking real issues.",

  // Concurrency
  "unsynchronized access": "Use proper locking or synchronization to prevent race conditions.",
  "sleep in loop": "Avoid using sleep inside loops — use proper wait/notify mechanisms instead.",
};

export function generateCodeInsights(violations: CodeViolations): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Line-level violations
  violations.lineReferences?.forEach((violation) => {
    const rule = violation.issue.toLowerCase();
    const matchedKey = Object.keys(ruleMap).find((key) => rule.includes(key));
    const suggestion = matchedKey
      ? ruleMap[matchedKey]
      : `Review and improve this "${violation.issue}" issue for better code quality.`;

    recommendations.push({
      line: violation.line,
      category: "General",
      rule: violation.issue,
      suggestion,
    });
  });

  // Category-level violations
  violations.categories?.forEach((cat) => {
    cat.violations.forEach((v) => {
      const rule = v.issue.toLowerCase();
      const matchedKey = Object.keys(ruleMap).find((key) => rule.includes(key));
      const suggestion = matchedKey
        ? ruleMap[matchedKey]
        : `Review and improve this "${v.issue}" issue in ${cat.category} category.`;

      recommendations.push({
        line: undefined,
        category: cat.category,
        rule: v.issue,
        suggestion,
      });
    });
  });

  return recommendations;
}
