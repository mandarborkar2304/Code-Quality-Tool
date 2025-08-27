import React, { lazy, Suspense } from "react";
import { EditorProvider, useEditor } from "@/context/EditorContext";
import Header from "@/components/Header";
import SimpleCodeEditor from "@/components/SimpleCodeEditor";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Brain, RefreshCw, TestTube, AlertCircle, Loader2 } from "lucide-react";
import ResponsiveLayout from "@/components/ResponsiveLayout";
import { programmingLanguages } from "@/data/languages";

// Lazy load the analysis panel
const LazyAnalysisPanel = lazy(() => import("@/components/LazyAnalysisPanel"));

// Loading component for the analysis panel
const AnalysisLoading = () => (
  <div className="h-full flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin mr-2" />
    <span>Loading analysis...</span>
  </div>
);

/**
 * Editor page with context-based state management and responsive layout
 */
const EditorWithContext: React.FC = () => {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
};

/**
 * Editor content component that uses the editor context
 */
const EditorContent: React.FC = () => {
  const {
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
  } = useEditor();

  // Editor component
  const editorComponent = (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LanguageSelector
              languages={programmingLanguages}
              selected={selectedLanguage}
              onSelect={setSelectedLanguage}
              code={code}
              autoDetect={true}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1"
              data-test-id="reset-button"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
              <span className="ml-1 text-xs opacity-60">(Ctrl+R)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkCodeSyntax}
              disabled={!code.trim()}
              className="gap-1"
              data-test-id="syntax-check-button"
            >
              <AlertCircle className="h-4 w-4" />
              Check Syntax
              <span className="ml-1 text-xs opacity-60">(Ctrl+S)</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const testButton = document.querySelector('[data-test-id="generate-tests-button"]');
                if (testButton) {
                  (testButton as HTMLButtonElement).click();
                }
              }}
              disabled={!code.trim()}
              className="gap-1"
              data-test-id="generate-tests-button"
            >
              <TestTube className="h-4 w-4" />
              Generate Tests
              <span className="ml-1 text-xs opacity-60">(Ctrl+T)</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleComprehensiveAnalysis}
              disabled={isAnalyzing || !code.trim()}
              className="gap-1"
              data-test-id="analyze-code-button"
            >
              <Brain className="h-4 w-4" />
              Analyze Code
              <span className="ml-1 text-xs opacity-60">(Ctrl+Enter)</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <SimpleCodeEditor
          code={code}
          language={selectedLanguage}
          onCodeChange={setCode}
          onSyntaxErrorsChange={() => {}}
          data-test-id="simple-code-editor"
        />
      </div>
    </div>
  );

  // Analysis component
  const analysisComponent = analysis ? (
    <Suspense fallback={<AnalysisLoading />}>
      <LazyAnalysisPanel 
        analysis={analysis}
        language={selectedLanguage.id}
        onApplyCorrection={(newCode) => setCode(newCode)}
      />
    </Suspense>
  ) : (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h3 className="text-lg font-medium mb-2">No Analysis Yet</h3>
        <p className="text-muted-foreground mb-4">
          Enter your code and click "Analyze Code" to get a comprehensive analysis of your code quality, performance, and security.
        </p>
        <Button 
          onClick={handleComprehensiveAnalysis}
          disabled={isAnalyzing || !code.trim()}
        >
          Analyze Code
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-orange-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <div className="flex-1 bg-white dark:bg-gray-950 rounded-lg shadow-lg overflow-hidden border">
          <ResponsiveLayout
            editor={editorComponent}
            analysis={analysisComponent}
          />
        </div>
      </main>
    </div>
  );
};

export default EditorWithContext;