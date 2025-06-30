// Frontend client that calls Netlify functions instead of Groq directly
// This keeps the API key secure on the server side

// Configuration for different AI models
const AI_MODELS = {
  FAST: 'compound-beta-mini',
  BALANCED: 'compound-beta-mini',
  QUALITY: 'compound-beta-mini'
} as const;

interface GroqConfig {
  maxTokens?: number;
  temperature?: number;
  model?: keyof typeof AI_MODELS;
  systemPrompt?: string;
}

// Basic Groq response function that calls Netlify functions
export const getGroqResponse = async (prompt: string, config: GroqConfig = {}): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/groq-recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: prompt,
        language: 'general', // You can make this configurable
        config
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || 'No recommendations found.';
  } catch (err: any) {
    console.error('Netlify function error:', err);
    return 'AI analysis encountered an error.';
  }
};

// Dedicated GROQ function for syntax analysis
export const getGroqSyntaxAnalysis = async (code: string, language: string, config: GroqConfig = {}): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/groq-syntax-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        config: {
          ...config,
          maxTokens: config.maxTokens || 2000,
          temperature: config.temperature || 0.1,
          model: config.model || 'BALANCED'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.analysis || '{"errors": [], "warnings": [], "suggestions": []}';
  } catch (err: any) {
    console.error('GROQ syntax analysis error:', err);
    // Return empty analysis structure on error
    return '{"errors": [], "warnings": [], "suggestions": []}';
  }
};

// Comprehensive AI-driven code analysis
export interface AICodeAnalysisResult {
  // Core metrics (AI-evaluated)
  complexity: {
    cyclomaticComplexity: number;
    timeComplexity: string;
    spaceComplexity: string;
    maintainabilityIndex: number;
    readabilityScore: number;
  };
  
  // Quality assessment
  quality: {
    overallScore: number; // 0-100
    codeSmells: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line?: number;
      suggestion: string;
    }>;
    violations: Array<{
      category: string;
      severity: 'minor' | 'major';
      description: string;
      line?: number;
      impact: string;
    }>;
  };
  
  // Security & Performance
  security: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    line?: number;
  }>;
  
  performance: Array<{
    issue: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
    optimization: string;
    line?: number;
  }>;
  
  // Actionable insights
  recommendations: {
    immediate: string[]; // Quick fixes
    shortTerm: string[]; // 1-2 days
    longTerm: string[]; // Major refactoring
  };
  
  // Summary
  summary: {
    strengths: string[];
    weaknesses: string[];
    priorityLevel: 'low' | 'medium' | 'high' | 'critical';
    estimatedFixTime: string;
  };
}

export const getComprehensiveCodeAnalysis = async (
  code: string, 
  language: string
): Promise<AICodeAnalysisResult> => {
  try {
    console.log('🤖 Starting AI-powered comprehensive analysis...');
    
    const response = await fetch('/.netlify/functions/groq-comprehensive-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.analysis) {
      // Validate and set defaults for required fields
      const result = validateAnalysisResult(data.analysis);
      console.log('✅ AI analysis completed successfully');
      return result;
    } else {
      throw new Error('No analysis data received');
    }

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    throw new Error(`AI analysis failed: ${error}`);
  }
};

// Validate and normalize AI analysis response
function validateAnalysisResult(parsed: any): AICodeAnalysisResult {
  try {
    
    // Validate and set defaults for required fields
    return {
      complexity: {
        cyclomaticComplexity: parsed.complexity?.cyclomaticComplexity || 5,
        timeComplexity: parsed.complexity?.timeComplexity || 'O(n)',
        spaceComplexity: parsed.complexity?.spaceComplexity || 'O(1)',
        maintainabilityIndex: parsed.complexity?.maintainabilityIndex || 70,
        readabilityScore: parsed.complexity?.readabilityScore || 75,
      },
      quality: {
        overallScore: parsed.quality?.overallScore || 70,
        codeSmells: Array.isArray(parsed.quality?.codeSmells) ? parsed.quality.codeSmells : [],
        violations: Array.isArray(parsed.quality?.violations) ? parsed.quality.violations : [],
      },
      security: Array.isArray(parsed.security) ? parsed.security : [],
      performance: Array.isArray(parsed.performance) ? parsed.performance : [],
      recommendations: {
        immediate: Array.isArray(parsed.recommendations?.immediate) ? parsed.recommendations.immediate : [],
        shortTerm: Array.isArray(parsed.recommendations?.shortTerm) ? parsed.recommendations.shortTerm : [],
        longTerm: Array.isArray(parsed.recommendations?.longTerm) ? parsed.recommendations.longTerm : [],
      },
      summary: {
        strengths: Array.isArray(parsed.summary?.strengths) ? parsed.summary.strengths : ['Code structure is readable'],
        weaknesses: Array.isArray(parsed.summary?.weaknesses) ? parsed.summary.weaknesses : [],
        priorityLevel: parsed.summary?.priorityLevel || 'medium',
        estimatedFixTime: parsed.summary?.estimatedFixTime || '2-4 hours',
      }
    };
    
  } catch (error) {
    console.warn('Failed to validate AI response, using fallback analysis:', error);
    
    // Fallback analysis with basic defaults
    return {
      complexity: {
        cyclomaticComplexity: 5,
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        maintainabilityIndex: 70,
        readabilityScore: 75,
      },
      quality: {
        overallScore: 70,
        codeSmells: [],
        violations: [],
      },
      security: [],
      performance: [],
      recommendations: {
        immediate: ['Review AI feedback'],
        shortTerm: ['Address identified issues'],
        longTerm: ['Consider code refactoring'],
      },
      summary: {
        strengths: ['Code is analyzable'],
        weaknesses: [],
        priorityLevel: 'medium',
        estimatedFixTime: '1-3 hours',
      }
    };
  }
}

// Generate test cases using AI
export const getTestCaseRecommendations = async (code: string, language: string): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/groq-test-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Test case generation error:', error);
    return 'Failed to generate test cases.';
  }
};
