import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CodeAnalysis, ProgrammingLanguage } from '@/types';
import { SyntaxAnalysisResult, SyntaxError } from '@/utils/syntaxAnalyzer';
import { realtimeSyntaxAnalyzer } from '@/utils/realtimeSyntaxAnalyzer';
import { fetchComprehensiveAnalysis } from '@/pages/api/groqComprehensiveAnalysisAPI';
import { programmingLanguages } from '@/data/languages';
import { suggestLanguage } from '@/utils/languageDetection';
import { useToast } from '@/hooks/use-toast';
import { 
  handleError, 
  createApiError, 
  createAnalysisError, 
  createSyntaxError,
  tryCatch
} from '@/utils/errorHandling';
import { debounce } from '@/utils/apiUtils';

interface EditorContextType {
  // Code state
  code: string;
  setCode: (code: string) => void;
  
  // Language state
  selectedLanguage: ProgrammingLanguage;
  setSelectedLanguage: (language: ProgrammingLanguage) => void;
  
  // Analysis state
  analysis: CodeAnalysis | null;
  isAnalyzing: boolean;
  handleComprehensiveAnalysis: () => Promise<void>;
  
  // Syntax state
  syntaxErrors: SyntaxError[];
  checkCodeSyntax: () => Promise<void>;
  
  // UI state
  handleReset: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: React.ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  // State
  const [code, setCode] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(programmingLanguages[0]);
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
  
  // Hooks
  const { toast } = useToast();
  
  // Reset the editor
  const handleReset = useCallback(() => {
    setCode('');
    setAnalysis(null);
    setSyntaxErrors([]);
    toast({
      title: "Reset Complete",
      description: "All code has been cleared.",
    });
  }, [toast]);
  
  // Check syntax
  const checkCodeSyntax = useCallback(async () => {
    if (!code.trim()) return;
    
    toast({
      title: "Checking Syntax",
      description: "Analyzing code for syntax errors...",
    });
    
    const result = await tryCatch(
      async () => {
        const syntaxResult = await realtimeSyntaxAnalyzer.analyze(code, selectedLanguage);
        if (!syntaxResult || syntaxResult.hasErrors) {
          throw createSyntaxError(
            "Syntax check failed to produce results",
            { language: selectedLanguage.id }
          );
        }
        return syntaxResult;
      },
      { errors: [], isValid: false, totalErrors: 0, totalWarnings: 0 } // Fallback value
    );
    
    if (result) {
      setSyntaxErrors(result.errors || []);
      
      if (result.errors && result.errors.length > 0) {
        toast({
          title: "Syntax Check Complete",
          description: `Found ${result.errors.length} syntax issues`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Syntax Check Complete",
          description: "No syntax errors found",
          variant: "default",
        });
      }
    }
  }, [code, selectedLanguage.id, toast]);
  
  // Comprehensive analysis
  const handleComprehensiveAnalysis = useCallback(async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const analysis = await tryCatch(
        async () => {
          const result = await fetchComprehensiveAnalysis(code, selectedLanguage.id);
          if (!result) {
            throw createAnalysisError(
              "Analysis failed to produce results", 
              { language: selectedLanguage.id }
            );
          }
          return result;
        },
        null // Fallback value if analysis fails
      );
      
      if (analysis) {
        setAnalysis(analysis);
        toast({
          title: "Comprehensive Analysis Complete",
          description: "Your code has been comprehensively analyzed.",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, selectedLanguage.id, toast]);
  
  // Auto-detect language on code change (debounced)
  useEffect(() => {
    if (!code.trim()) return;
    
    const detectLanguage = debounce(() => {
      const detection = suggestLanguage(code);
      if (
        detection.detectedLanguage &&
        detection.detectedLanguage.id !== selectedLanguage.id &&
        detection.confidence > 60
      ) {
        setSelectedLanguage(detection.detectedLanguage);
        toast({
          title: "Language Auto-Detected",
          description: `Automatically switched to ${detection.detectedLanguage.name} (${detection.confidence}% confidence)`,
          duration: 3000
        });
      }
    }, 300);
    
    detectLanguage();
  }, [code, selectedLanguage.id, toast]);
  
  // Context value
  const value: EditorContextType = {
    code,
    setCode,
    selectedLanguage,
    setSelectedLanguage,
    analysis,
    isAnalyzing,
    handleComprehensiveAnalysis,
    syntaxErrors,
    checkCodeSyntax,
    handleReset
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};