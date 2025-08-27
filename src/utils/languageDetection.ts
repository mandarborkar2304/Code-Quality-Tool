// Enhanced Language Detection System
// Intelligently detects programming language from code patterns

import { ProgrammingLanguage } from '@/types';
import { programmingLanguages } from '@/data/languages';

export interface LanguageDetectionResult {
  detectedLanguage: ProgrammingLanguage;
  confidence: number;
  alternativeLanguages: Array<{ language: ProgrammingLanguage; confidence: number }>;
  reason: string;
}

export interface LanguagePattern {
  keywords: string[];
  imports: string[];
  syntax: RegExp[];
  fileExtensions: string[];
  specificPatterns: RegExp[];
  weight: number;
}

// Language-specific patterns for detection
// Now with more granular, robust, and fall-resistant rules, and Groq-powered dynamic rule loading
// import Groq from 'groq-sdk';
// const groq = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY });

// NOTE: The Groq SDK and API key usage must be handled server-side or via a secure API route.
// Do NOT use process.env or import.meta.env for secrets in frontend code.
// If you need dynamic language rules from Groq, fetch them from your backend API instead.

const languagePatterns: Record<string, LanguagePattern> = {
  javascript: {
    keywords: [
      'function', 'var', 'let', 'const', 'class', 'extends', 'import', 'export', 'async', 'await',
      'yield', 'constructor', 'super', 'this', 'prototype', 'static', 'get', 'set', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'with', 'try', 'catch', 'finally', 'throw', 'switch', 'case', 'default', 'break', 'continue', 'do', 'while', 'for', 'if', 'else', 'return', 'debugger', 'void', 'null', 'undefined', 'true', 'false'
    ],
    imports: ['import', 'require', 'module.exports', 'export default', 'export const', 'export function'],
    syntax: [
      /function\s+\w+\s*\(/,
      /=>\s*{/,
      /console\.log\(/,
      /\.addEventListener\(/,
      /document\./,
      /window\./,
      /\/\/.*/, // single-line comment
      /\/\*[\s\S]*?\*\//, // multi-line comment
      /\bPromise\b/, // Promises
      /\basync\b.*\bawait\b/
    ],
    fileExtensions: ['.js', '.mjs', '.cjs'],
    specificPatterns: [
      /\$\(/,  // jQuery
      /React\./,  // React
      /useState\(/,  // React hooks
      /process\.env/,
      /module\.exports/,
      /require\(.+\)/,
      /export\s+(default|const|function|class)/
    ],
    weight: 1.0
  },
  typescript: {
    keywords: [
      'interface', 'type', 'enum', 'namespace', 'implements', 'extends', 'public', 'private', 'protected', 'readonly', 'abstract', 'declare', 'as', 'any', 'unknown', 'never', 'void', 'number', 'string', 'boolean', 'symbol', 'bigint', 'infer', 'keyof', 'typeof', 'asserts', 'is', 'from', 'global', 'module', 'require', 'import', 'export', 'const', 'let', 'var', 'function', 'class', 'extends', 'super', 'this', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'yield', 'await', 'static', 'get', 'set'
    ],
    imports: ['import', 'export', 'from', 'require'],
    syntax: [
      /:\s*(string|number|boolean|void|any|unknown|never|symbol|bigint)/,
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /function\s+\w+\s*\([^)]*\)\s*:\s*\w+/,
      /\w+\s*:\s*\w+(\[\])?/,
      /readonly\s+\w+/,
      /abstract\s+class/,
      /declare\s+(module|global|function|const|let|var|class|interface|type)/
    ],
    fileExtensions: ['.ts', '.tsx', '.d.ts'],
    specificPatterns: [
      /React\.FC/,
      /useState<\w+>/,
      /as\s+\w+/,
      /implements\s+\w+/,
      /enum\s+\w+/,
      /namespace\s+\w+/,
      /type\s+\w+\s*=/,
      /interface\s+\w+/,
      /import\s+type\s+\{.*\}/
    ],
    weight: 1.0
  },
  python: {
    keywords: [
      'def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'lambda', 'return', 'yield', 'global', 'nonlocal', 'assert', 'del', 'pass', 'break', 'continue', 'raise', 'True', 'False', 'None', 'self', 'print', 'in', 'is', 'not', 'and', 'or'
    ],
    imports: ['import', 'from'],
    syntax: [
      /def\s+\w+\s*\(/,
      /class\s+\w+\s*\(?\w*\)?:/,
      /print\(.+\)/,
      /#.*$/, // single-line comment
      /"""[\s\S]*?"""/, // multi-line string
      /\bself\b/,
      /:\s*\w+\s*=\s*\w+/ // type hints
    ],
    fileExtensions: ['.py'],
    specificPatterns: [
      /if __name__ == ['"]__main__['"]:/,
      /@\w+/, // decorators
      /except\s+\w+\s+as\s+\w+/, // exception handling
      /with\s+open\(.+\)\s+as\s+\w+:/
    ],
    weight: 1.0
  },
  java: {
    keywords: [
      'public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'import', 'package', 'static', 'final', 'void', 'int', 'double', 'float', 'char', 'boolean', 'new', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws', 'this', 'super', 'synchronized', 'volatile', 'transient', 'abstract', 'native', 'strictfp', 'enum', 'assert', 'instanceof', 'null', 'true', 'false'
    ],
    imports: ['import', 'package'],
    syntax: [
      /public\s+class\s+\w+/,
      /static\s+void\s+main\s*\(/,
      /System\.out\.println\(/,
      /\/\/.*/, // single-line comment
      /\/\*[\s\S]*?\*\//, // multi-line comment
      /@\w+/, // annotations
      /extends\s+\w+/,
      /implements\s+\w+/
    ],
    fileExtensions: ['.java'],
    specificPatterns: [
      /package\s+\w+(\.\w+)*/,
      /import\s+\w+(\.\w+)*;/,
      /throws\s+\w+/,
      /@Override/
    ],
    weight: 1.0
  },
  c: {
    keywords: [
      'int', 'float', 'double', 'char', 'void', 'struct', 'union', 'enum', 'typedef', 'const', 'volatile', 'static', 'extern', 'register', 'auto', 'signed', 'unsigned', 'short', 'long', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'goto', 'return', 'sizeof', 'NULL', 'printf', 'scanf', 'main'
    ],
    imports: ['#include'],
    syntax: [
      /#include\s+<\w+\.h>/,
      /int\s+main\s*\(/,
      /printf\(.+\)/,
      /\/\/.*/, // single-line comment
      /\/\*[\s\S]*?\*\//, // multi-line comment
      /->/ // struct pointer access
    ],
    fileExtensions: ['.c', '.h'],
    specificPatterns: [
      /#define\s+\w+/,
      /typedef\s+struct/,
      /scanf\(.+\)/
    ],
    weight: 1.0
  },
  cpp: {
    keywords: [
      'int', 'float', 'double', 'char', 'void', 'struct', 'union', 'enum', 'typedef', 'const', 'volatile', 'static', 'extern', 'register', 'auto', 'signed', 'unsigned', 'short', 'long', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'goto', 'return', 'sizeof', 'NULL', 'cout', 'cin', 'endl', 'namespace', 'using', 'std', 'class', 'public', 'private', 'protected', 'virtual', 'override', 'template', 'typename', 'this', 'new', 'delete', 'try', 'catch', 'throw', 'operator', 'friend', 'explicit', 'mutable', 'constexpr', 'noexcept', 'static_cast', 'dynamic_cast', 'reinterpret_cast', 'const_cast', 'typeid', 'main'
    ],
    imports: ['#include', 'using namespace'],
    syntax: [
      /#include\s+<\w+\.h>/,
      /int\s+main\s*\(/,
      /std::cout/,
      /std::cin/,
      /\/\/.*/, // single-line comment
      /\/\*[\s\S]*?\*\//, // multi-line comment
      /->/ // struct pointer access
    ],
    fileExtensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    specificPatterns: [
      /#define\s+\w+/,
      /typedef\s+struct/,
      /cin\s*>>/,
      /cout\s*<</,
      /using\s+namespace\s+std/,
      /template\s*<.*>/
    ],
    weight: 1.0
  },
  // Add more languages and rules as needed
};

// Optionally, load/extend language rules from Groq
// Disabled Groq-powered rule loading in frontend. If needed, fetch from backend API instead.
export async function loadGroqLanguageRules() {
  // No-op in browser. Implement server-side if needed.
}
// ...existing code...
// The block above was duplicated and broken, causing TypeScript parse errors. It is now removed.

/**
 * Detects programming language from code content
 */
export function detectLanguage(code: string): LanguageDetectionResult {
  if (!code || code.trim().length === 0) {
    return {
      detectedLanguage: programmingLanguages.find(lang => lang.id === 'javascript') || programmingLanguages[0],
      confidence: 0,
      alternativeLanguages: [],
      reason: 'No code provided'
    };
  }

  const scores: Record<string, { score: number; reasons: string[] }> = {};
  
  // Initialize scores for all languages
  Object.keys(languagePatterns).forEach(langKey => {
    scores[langKey] = { score: 0, reasons: [] };
  });

  // Analyze each language pattern
  Object.entries(languagePatterns).forEach(([langKey, pattern]) => {
    let langScore = 0;
    const reasons: string[] = [];

    // Check keywords
    pattern.keywords.forEach(keyword => {
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = code.match(keywordRegex);
      if (matches) {
        const keywordScore = matches.length * 2;
        langScore += keywordScore;
        reasons.push(`Found "${keyword}" keyword (${matches.length} times)`);
      }
    });

    // Check imports
    pattern.imports.forEach(importPattern => {
      const importRegex = new RegExp(`\\b${importPattern}\\b`, 'gi');
      const matches = code.match(importRegex);
      if (matches) {
        const importScore = matches.length * 3;
        langScore += importScore;
        reasons.push(`Found "${importPattern}" import (${matches.length} times)`);
      }
    });

    // Check syntax patterns
    pattern.syntax.forEach((syntaxRegex, index) => {
      const matches = code.match(syntaxRegex);
      if (matches) {
        const syntaxScore = matches.length * 4;
        langScore += syntaxScore;
        reasons.push(`Matched syntax pattern ${index + 1} (${matches.length} times)`);
      }
    });

    // Check specific patterns
    pattern.specificPatterns.forEach((specificRegex, index) => {
      const matches = code.match(specificRegex);
      if (matches) {
        const specificScore = matches.length * 5;
        langScore += specificScore;
        reasons.push(`Matched specific pattern ${index + 1} (${matches.length} times)`);
      }
    });

    // Apply language weight
    langScore *= pattern.weight;

    scores[langKey] = {
      score: langScore,
      reasons
    };
  });

  // Find the language with highest score
  const sortedLanguages = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .filter(([_, data]) => data.score > 0);

  if (sortedLanguages.length === 0) {
    return {
      detectedLanguage: programmingLanguages.find(lang => lang.id === 'javascript') || programmingLanguages[0],
      confidence: 0,
      alternativeLanguages: [],
      reason: 'No language patterns matched'
    };
  }

  const [topLanguageKey, topLanguageData] = sortedLanguages[0];
  const topLanguage = programmingLanguages.find(lang => lang.id === topLanguageKey);

  if (!topLanguage) {
    return {
      detectedLanguage: programmingLanguages.find(lang => lang.id === 'javascript') || programmingLanguages[0],
      confidence: 0,
      alternativeLanguages: [],
      reason: 'Language not found in database'
    };
  }

  // Calculate confidence (0-100) - More aggressive scoring
  const codeLength = code.split('\n').length;
  const maxPossibleScore = Math.max(20, codeLength * 10); // More lenient scoring
  let confidence = Math.min(100, Math.round((topLanguageData.score / maxPossibleScore) * 100));
  
  // Boost confidence for strong indicators
  if (topLanguageData.score > 20) confidence = Math.min(100, confidence + 20);
  if (topLanguageData.score > 50) confidence = Math.min(100, confidence + 30);

  // Get alternative languages
  const alternativeLanguages = sortedLanguages
    .slice(1, 4) // Top 3 alternatives
    .map(([langKey, data]) => {
      const lang = programmingLanguages.find(l => l.id === langKey);
      return lang ? {
        language: lang,
        confidence: Math.min(100, Math.round((data.score / maxPossibleScore) * 100))
      } : null;
    })
    .filter(Boolean) as Array<{ language: ProgrammingLanguage; confidence: number }>;

  return {
    detectedLanguage: topLanguage,
    confidence,
    alternativeLanguages,
    reason: `Detected based on: ${topLanguageData.reasons.slice(0, 3).join(', ')}`
  };
}

/**
 * Detects language from file extension
 */
export function detectLanguageFromExtension(filename: string): ProgrammingLanguage | null {
  const extension = filename.substring(filename.lastIndexOf('.'));
  
  for (const lang of programmingLanguages) {
    if (lang.fileExtension === extension) {
      return lang;
    }
  }
  
  return null;
}

/**
 * Suggests language based on code content and context
 */
export function suggestLanguage(code: string, filename?: string): LanguageDetectionResult {
  // First try file extension if provided
  if (filename) {
    const langFromExtension = detectLanguageFromExtension(filename);
    if (langFromExtension) {
      return {
        detectedLanguage: langFromExtension,
        confidence: 95,
        alternativeLanguages: [],
        reason: `Detected from file extension: ${langFromExtension.fileExtension}`
      };
    }
  }
  // Fall back to content analysis
  return detectLanguage(code);
}