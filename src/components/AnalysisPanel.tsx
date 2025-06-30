
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CodeAnalysisDisplay from "./CodeAnalysisDisplay";

interface AnalysisPanelProps {
  analysis: CodeAnalysis | null;
  language: string;
  onApplyCorrection: (code: string) => void;
}

const AnalysisPanel = ({ analysis, language, onApplyCorrection }: AnalysisPanelProps) => {
  return (
    <Card className="h-full flex flex-col border-orange-200 bg-white dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3 border-b border-orange-100 flex-shrink-0">
        <CardTitle className="text-lg text-foreground font-semibold">Code Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
        <div className="h-full analysis-panel-scroll custom-scrollbar px-6 pb-6 max-w-full">
          <CodeAnalysisDisplay 
            analysis={analysis} 
            language={language}
            onApplyCorrection={onApplyCorrection} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisPanel;
