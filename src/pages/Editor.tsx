import { useState } from "react";
import { CodeAnalysis, ProgrammingLanguage } from "@/types";
import { analyzeCode } from "@/utils/codeAnalysis";
import { programmingLanguages } from "@/data/languages";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import EditorPanel from "@/components/EditorPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import { fetchComprehensiveAnalysis } from "./api/groqComprehensiveAnalysisAPI";

// Utility to get default instructions for a language (mirrors CodeEditor)
function getDefaultInstructions(langId: string) {
  if (langId === "python" || langId === "python3") {
    return "# Start by importing necessary modules\n# Use proper indentation for blocks\n\n";
  } else if (langId === "pythonml" || langId === "pytorch" || langId === "tensorflow") {
    return "# Import data science libraries (numpy, pandas, etc.)\n# Initialize models with appropriate parameters\n\n";
  } else if (langId === "java" || langId === "java19") {
    return "// Define a class with proper access modifiers\n// Include a main method to run your program\n\n";
  } else if (langId === "javascript" || langId === "nodejs") {
    return "// Initialize variables with const or let\n// Use modern ES6+ syntax when possible\n\n";
  } else if (langId === "c" || langId === "cpp" || langId === "csharp") {
    return "// Include necessary header files\n// Remember to free allocated memory\n\n";
  } else if (langId === "go") {
    return "// Import required packages\n// Define proper error handling\n\n";
  } else if (langId === "shell" || langId === "bash") {
    return "#!/bin/bash\n# Use proper file permissions\n# Handle command errors with proper exit codes\n\n";
  } else {
    return "// Write your code here\n// Follow best practices for this language\n\n";
  }
}

const Editor = () => {
  const [code, setCode] = useState("");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(programmingLanguages[5]);
  
  // Remove HTML/CSS/JS decoupling - keep only the main code editor

  const handleAnalyzeCode = async () => {
    const codeToAnalyze = code;

    // Prevent sending only default instructions
    if (
      !codeToAnalyze.trim() ||
      codeToAnalyze.trim() === getDefaultInstructions(selectedLanguage.id).trim()
    ) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeCode(codeToAnalyze, selectedLanguage.id);
      setAnalysis(analysis);
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });
    } catch (err: any) {
      let errorMsg = "There was an error analyzing your code.";
      if (err && err.message) {
        errorMsg = err.message;
      } else if (err && err.response) {
        try {
          const data = await err.response.json();
          errorMsg = data.message || errorMsg;
        } catch {}
      }
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add a handler for comprehensive analysis
  const handleComprehensiveAnalysis = async () => {
    const codeToAnalyze = code;

    if (
      !codeToAnalyze.trim() ||
      codeToAnalyze.trim() === getDefaultInstructions(selectedLanguage.id).trim()
    ) {
      toast({
        title: "Empty Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await fetchComprehensiveAnalysis(codeToAnalyze, selectedLanguage.id);
      setAnalysis(analysis);
      toast({
        title: "Comprehensive Analysis Complete",
        description: "Your code has been comprehensively analyzed.",
      });
    } catch (err: any) {
      let errorMsg = "There was an error analyzing your code.";
      if (err && err.message) {
        errorMsg = err.message;
      } else if (err && err.response) {
        try {
          const data = await err.response.json();
          errorMsg = data.message || errorMsg;
        } catch {}
      }
      toast({
        title: "Comprehensive Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setAnalysis(null);
    toast({
      title: "Reset Complete",
      description: "All code has been cleared.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-1 p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.03]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 via-orange-500/3 to-orange-400/5"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] min-h-0">
          {/* Editor Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 p-4 overflow-hidden min-h-0">
            <EditorPanel
              code={code}
              setCode={setCode}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              isAnalyzing={isAnalyzing}
              onReset={handleReset}
              analysisResults={analysis}
              onAnalyze={handleAnalyzeCode}
              onComprehensiveAnalyze={handleComprehensiveAnalysis}
            />
          </div>

          {/* Analysis Panel */}
          <div className="flex-1 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-xl shadow-lg border border-orange-200 dark:border-gray-700 overflow-hidden min-h-0">
            <AnalysisPanel
              analysis={analysis}
              language={selectedLanguage.id}
              onApplyCorrection={setCode}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Editor;
