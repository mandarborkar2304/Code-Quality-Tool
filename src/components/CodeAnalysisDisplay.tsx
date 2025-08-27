import React, { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Brain,
  Code2,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewSection from "./OverviewSection";
import ComplexityDisplay from "./ComplexityDisplay";
import CodeSmellsDisplay from "./CodeSmellsDisplay";

import EnhancedAIInsights from "./EnhancedAIInsights";
import SyntaxErrorsDisplay from "./SyntaxErrorsDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CodeAnalysisDisplayProps {
  analysis: CodeAnalysis | null;
  language: string;
  onApplyCorrection: (code: string) => void;
  syntaxErrors?: { line: number; message: string; column?: number }[];
  onSyntaxErrorClick?: (lineNumber: number, column?: number) => void;
  isAnalyzing: boolean;
  onReanalyze: () => Promise<void>;
}


const CodeAnalysisDisplay = ({
  analysis,
  language,
  onApplyCorrection,
  syntaxErrors = [],
  onSyntaxErrorClick,
  isAnalyzing,
  onReanalyze,
}: CodeAnalysisDisplayProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Add analysisTimestamp to track when analysis was last run - use a stable reference
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | undefined>();

  // Update timestamp when analysis changes and switch to syntax tab if there are errors
  React.useEffect(() => {
    if (analysis) {
      setAnalysisTimestamp(Date.now());
      if (analysis.syntaxErrors && analysis.syntaxErrors.length > 0) {
        setActiveTab("syntax");
      }
    }
  }, [analysis?.originalCode, analysis?.cyclomaticComplexity, analysis?.violations, analysis?.syntaxErrors]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Code2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No analysis available. Submit your code to get detailed insights.</p>
        </div>
      </div>
    );
  }

  const handleApplyCorrection = () => {
    if (analysis.correctedCode) {
      onApplyCorrection(analysis.correctedCode);
    }
  };



  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="syntax" className="text-xs">
            <Code2 className="h-3 w-3 mr-1" />
            Syntax
            {syntaxErrors && syntaxErrors.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                {syntaxErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="violations" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="complexity" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Complexity
          </TabsTrigger>
          <TabsTrigger value="smells" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Code Smells
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4 overflow-auto custom-scrollbar smooth-scroll">
          <TabsContent value="overview" className="mt-0">
            <OverviewSection analysis={analysis} />
          </TabsContent>

          <TabsContent value="syntax" className="mt-0">
            <SyntaxErrorsDisplay 
              analysis={{
                ...analysis,
                syntaxErrors: syntaxErrors.map(e => ({ ...e, severity: 'error', type: 'syntax', column: e.column || 1 }))
              }}
              onApplyFix={(lineNumber, fix) => {
                // Handle syntax error fixes - could integrate with code editor
                console.log(`Apply fix at line ${lineNumber}: ${fix}`);
              }}
              onErrorClick={(error) => onSyntaxErrorClick(error.line, error.column)}
              onReanalyze={onReanalyze}
              isAnalyzing={isAnalyzing}
            />
          </TabsContent>

          <TabsContent value="violations" className="mt-0">
            <div className="space-y-4">
              {["major", "minor"].map((severity) => {
                const issues = analysis.violations.lineReferences?.filter(
                  (v) => v.severity === severity
                ) || [];

                if (issues.length === 0) return null;

                return (
                  <details key={severity} className="border rounded">
                    <summary className="px-4 py-2 cursor-pointer bg-muted hover:bg-muted/80 rounded-t flex justify-between items-center">
                      <span className="font-medium capitalize">{severity} Violations</span>
                      <Badge
                        className={
                          severity === "major"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {issues.length} Issues
                      </Badge>
                    </summary>
                    <div className="p-4 space-y-2">
                      {issues.map((ref, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded border bg-muted/10"
                        >
                          <Badge variant="outline" className="text-xs shrink-0">
                            Line {ref.line}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{ref.issue}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })}

              {(!analysis.violations.lineReferences ||
                analysis.violations.lineReferences.length === 0) && (
                <Card>
                  <CardContent className="flex justify-center items-center h-32 text-muted-foreground text-sm">
                    No line-level violations found.
                  </CardContent>
                </Card>
              )}

              {analysis.violations.details?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Additional Issue Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.violations.details.map((detail, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 rounded border bg-muted/10"
                        >
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="complexity" className="mt-0">
            {analysis.complexityAnalysis ? (
              <ComplexityDisplay 
                analysis={analysis.complexityAnalysis}
                code={analysis.originalCode}
                language={language}
                analysisTimestamp={analysisTimestamp}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Complexity analysis not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="smells" className="mt-0">
            {analysis.codeSmells ? (
              <CodeSmellsDisplay analysis={analysis.codeSmells} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Code smells analysis not available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>



          <TabsContent value="ai-insights" className="mt-0">
            <EnhancedAIInsights
              analysis={analysis}
              language={language}
              code={analysis.originalCode}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CodeAnalysisDisplay;
