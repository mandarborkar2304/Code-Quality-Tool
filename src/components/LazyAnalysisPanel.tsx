import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CodeAnalysis } from '@/types';

// Lazy load the AnalysisPanel component
const AnalysisPanel = React.lazy(() => import('@/components/AnalysisPanel'));

interface LazyAnalysisPanelProps {
  analysis: CodeAnalysis | null;
  language: string;
  onApplyCorrection?: (code: string) => void;
  syntaxErrors?: { line: number; message: string }[];
}

/**
 * Lazy-loaded Analysis Panel with loading state
 */
const LazyAnalysisPanel: React.FC<LazyAnalysisPanelProps> = ({ 
  analysis, 
  language,
  onApplyCorrection = () => {}, // Default no-op function
  syntaxErrors = []
}) => {
  return (
    <Suspense fallback={<AnalysisLoading />}>
      <AnalysisPanel 
        analysis={analysis} 
        language={language} 
        onApplyCorrection={onApplyCorrection}
        syntaxErrors={syntaxErrors}
      />
    </Suspense>
  );
};

/**
 * Loading state for the analysis panel
 */
const AnalysisLoading: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-muted-foreground text-center">
        Loading analysis panel...
      </p>
    </div>
  );
};

export default LazyAnalysisPanel;