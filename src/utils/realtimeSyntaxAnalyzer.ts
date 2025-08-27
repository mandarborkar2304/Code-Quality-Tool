// Real-time Syntax Analysis System
// Provides granular, language-specific syntax error detection

import { SyntaxError, SyntaxAnalysisResult } from './syntaxAnalyzer';
import { ProgrammingLanguage } from '@/types';

export interface RealtimeSyntaxAnalyzer {
  analyze(code: string, language: ProgrammingLanguage): Promise<SyntaxAnalysisResult>;
  analyzeIncremental(code: string, changes: CodeChange[], language: ProgrammingLanguage): Promise<SyntaxAnalysisResult>;
  validateSyntax(code: string, language: ProgrammingLanguage): Promise<boolean>;
}

export interface CodeChange {
  range: { start: number; end: number };
  text: string;
  type: 'insert' | 'delete' | 'replace';
}

/**
 * Production-grade, Groq-powered real-time syntax analyzer.
 * All analysis is performed by the Groq Netlify function backend.
 */
export class RealtimeSyntaxAnalyzerImpl implements RealtimeSyntaxAnalyzer {
  private cache: Map<string, SyntaxAnalysisResult> = new Map();

  async analyze(code: string, language: ProgrammingLanguage): Promise<SyntaxAnalysisResult> {
    const cacheKey = `${language.id}:${this.hashCode(code)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    const result = await this.callGroqSyntaxAnalysisAPI(code, language);
    this.cache.set(cacheKey, result);
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    return result;
  }

  async analyzeIncremental(code: string, changes: CodeChange[], language: ProgrammingLanguage): Promise<SyntaxAnalysisResult> {
    // For now, just call the full analysis
    return this.analyze(code, language);
  }

  async validateSyntax(code: string, language: ProgrammingLanguage): Promise<boolean> {
    const result = await this.analyze(code, language);
    return !result.hasErrors;
  }

  /**
   * Calls the Groq Netlify function for syntax analysis.
   * Expects the backend to return SyntaxAnalysisResult shape.
   */
  private async callGroqSyntaxAnalysisAPI(code: string, language: ProgrammingLanguage): Promise<SyntaxAnalysisResult> {
    try {
      const response = await fetch('/api/groqComprehensiveAnalysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      if (!response.ok) {
        throw new Error('Groq API error');
      }
      const data = await response.json();
      return {
        errors: data.errors || [],
        warnings: data.warnings || [],
        suggestions: data.suggestions || [],
        hasErrors: (data.errors && data.errors.length > 0) || false,
        hasWarnings: (data.warnings && data.warnings.length > 0) || false,
        analysisTime: data.analysisTime || 0,
        aiAnalysisUsed: true
      };
    } catch (error) {
      return {
        errors: [{
          line: 1,
          column: 1,
          message: 'Failed to analyze code: ' + (error as Error).message,
          severity: 'error',
          type: 'syntax',
          code: 'GROQ_API_ERROR'
        }],
        warnings: [],
        suggestions: [],
        hasErrors: true,
        hasWarnings: false,
        analysisTime: 0,
        aiAnalysisUsed: true
      };
    }
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

export const realtimeSyntaxAnalyzer = new RealtimeSyntaxAnalyzerImpl();