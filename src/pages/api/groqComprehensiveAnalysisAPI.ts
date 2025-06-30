// src/pages/api/groqComprehensiveAnalysisAPI.ts
import { CodeAnalysis, CodeQualityRating, CodeViolations, TestCase } from "@/types";
import { AICodeAnalysisResult } from "@/utils/GroqClient";
import { getCodeMetrics } from "@/utils/codeMetrics";
import { analyzeTimeComplexity, analyzeSpaceComplexity, detectCodeSmells } from "@/utils/complexityAnalysis";
import { generateStaticTestCases } from "@/utils/codeAnalysis";

// Transform AICodeAnalysisResult to CodeAnalysis format
function transformToCodeAnalysis(aiResult: AICodeAnalysisResult, originalCode: string, language: string): CodeAnalysis {
  // Generate additional analysis data using local functions to ensure completeness
  const metrics = getCodeMetrics(originalCode, language);
  const complexityAnalysis = {
    timeComplexity: analyzeTimeComplexity(originalCode, language),
    spaceComplexity: analyzeSpaceComplexity(originalCode, language)
  };
  const codeSmells = detectCodeSmells(originalCode, language);
  const testCases = generateStaticTestCases(originalCode, language);

  // Transform violations
  const violations: CodeViolations = {
    major: aiResult.quality.violations.filter(v => v.severity === 'major').length,
    minor: aiResult.quality.violations.filter(v => v.severity === 'minor').length,
    details: aiResult.quality.violations.map(v => v.description),
    lineReferences: aiResult.quality.violations.map(v => ({
      line: v.line || 0,
      issue: v.description,
      severity: v.severity
    })),
    total: aiResult.quality.violations.length,
    summary: `Found ${aiResult.quality.violations.length} violations`
  };

  // Create quality ratings
  const cyclomaticComplexity: CodeQualityRating = {
    score: aiResult.complexity.cyclomaticComplexity > 10 ? 'D' : 
           aiResult.complexity.cyclomaticComplexity > 7 ? 'C' : 
           aiResult.complexity.cyclomaticComplexity > 4 ? 'B' : 'A',
    description: `Cyclomatic Complexity: ${aiResult.complexity.cyclomaticComplexity}`
  };

  const maintainability: CodeQualityRating = {
    score: aiResult.complexity.maintainabilityIndex > 80 ? 'A' :
           aiResult.complexity.maintainabilityIndex > 60 ? 'B' :
           aiResult.complexity.maintainabilityIndex > 40 ? 'C' : 'D',
    description: `Maintainability Index: ${aiResult.complexity.maintainabilityIndex}`
  };

  const reliability: CodeQualityRating = {
    score: aiResult.quality.overallScore > 85 ? 'A' :
           aiResult.quality.overallScore > 70 ? 'B' :
           aiResult.quality.overallScore > 50 ? 'C' : 'D',
    description: `Quality Score: ${aiResult.quality.overallScore}`
  };

  // Create AI suggestions summary
  const aiSuggestions = [
    ...aiResult.recommendations.immediate.map(r => `Immediate: ${r}`),
    ...aiResult.recommendations.shortTerm.map(r => `Short-term: ${r}`),
    ...aiResult.recommendations.longTerm.map(r => `Long-term: ${r}`)
  ].join('\n');

  return {
    originalCode,
    cyclomaticComplexity,
    maintainability,
    reliability,
    violations,
    aiSuggestions,
    overallGrade: reliability.score,
    metrics,
    testCases,
    complexityAnalysis,
    codeSmells,
    syntaxErrors: [], // No syntax errors from AI currently
    securityIssues: aiResult.security.map(s => s.description),
    performanceIssues: aiResult.performance.map(p => p.description),
    summary: {
      overallScore: aiResult.quality.overallScore,
      strengths: aiResult.summary.strengths,
      weaknesses: aiResult.summary.weaknesses,
      quickFixes: aiResult.recommendations.immediate,
      longTermGoals: aiResult.recommendations.longTerm,
      priorityLevel: aiResult.summary.priorityLevel
    },
    analysisMetadata: {
      analysisDate: new Date(),
      language,
      codeSize: originalCode.split('\n').length > 100 ? 'large' : 
                originalCode.split('\n').length > 50 ? 'medium' : 'small',
      aiAnalysisUsed: true,
      version: '2.0.0'
    }
  };
}

export const fetchComprehensiveAnalysis = async (code: string, language: string): Promise<CodeAnalysis | null> => {
  try {
    const res = await fetch("/.netlify/functions/groq-comprehensive-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) {
      throw new Error(`Analysis failed with status: ${res.status}`);
    }

    const data = await res.json();
    console.log('Comprehensive analysis response:', data);
    
    const aiResult = data.analysis;
    
    if (!aiResult) {
      console.warn('No analysis result received from API');
      // Fallback to local analysis if API fails
      const { analyzeCode } = await import('@/utils/codeAnalysis');
      return await analyzeCode(code, language);
    }
    
    return transformToCodeAnalysis(aiResult, code, language);
  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    // Fallback to local analysis
    const { analyzeCode } = await import('@/utils/codeAnalysis');
    return await analyzeCode(code, language);
  }
};
