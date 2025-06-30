import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronRight, Lightbulb, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CodeAnalysis } from "@/types";

interface SyntaxErrorsDisplayProps {
  analysis: CodeAnalysis;
  onApplyFix?: (lineNumber: number, fix: string) => void;
}

const SyntaxErrorsDisplay = ({ analysis, onApplyFix }: SyntaxErrorsDisplayProps) => {
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    errors: true,
    warnings: false,
    suggestions: false
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Parse syntax errors from the analysis
  const syntaxErrors = analysis.syntaxErrors || [];
  
  // Categorize syntax issues
  const categorizedIssues = {
    errors: syntaxErrors.filter(error => error.toLowerCase().includes('error')),
    warnings: syntaxErrors.filter(error => 
      error.toLowerCase().includes('warning') || 
      error.toLowerCase().includes('potential') ||
      error.toLowerCase().includes('consider')
    ),
    suggestions: syntaxErrors.filter(error => 
      error.toLowerCase().includes('suggestion') || 
      error.toLowerCase().includes('style') ||
      error.toLowerCase().includes('prefer')
    )
  };

  // Extract line numbers and messages from error strings
  const parseErrorString = (errorStr: string) => {
    const lineMatch = errorStr.match(/Line (\d+)/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;
    const message = errorStr.replace(/Line \d+[:\-\s]*/, '').trim();
    const severity = errorStr.toLowerCase().includes('error') ? 'error' :
                    errorStr.toLowerCase().includes('warning') ? 'warning' : 'info';
    return { lineNumber, message, severity };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const renderIssueCategory = (
    categoryName: string,
    issues: string[],
    icon: React.ReactNode,
    colorClass: string
  ) => {
    if (issues.length === 0) return null;

    return (
      <Collapsible 
        open={expandedCategories[categoryName]} 
        onOpenChange={() => toggleCategory(categoryName)}
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className={`w-full justify-between p-4 h-auto ${colorClass} hover:opacity-80`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium capitalize">{categoryName}</span>
              <Badge variant="secondary" className="ml-2">
                {issues.length}
              </Badge>
            </div>
            {expandedCategories[categoryName] ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-2 p-4">
          {issues.map((issue, index) => {
            const { lineNumber, message, severity } = parseErrorString(issue);
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${getSeverityColor(severity)} hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {lineNumber && (
                        <Badge variant="outline" className="text-xs">
                          Line {lineNumber}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      {message}
                    </p>
                    
                    {/* Quick fix suggestions */}
                    {(message.includes('Missing semicolon') || 
                      message.includes('Unclosed') || 
                      message.includes('Use ===')) && (
                      <div className="flex items-center gap-2 mt-2">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-muted-foreground">
                          {message.includes('Missing semicolon') && 'Quick fix: Add semicolon'}
                          {message.includes('Unclosed') && 'Quick fix: Add closing bracket'}
                          {message.includes('Use ===') && 'Quick fix: Replace == with ==='}
                        </span>
                        {onApplyFix && lineNumber && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-auto h-6 text-xs"
                            onClick={() => onApplyFix(lineNumber, message)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Fix
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const totalIssues = syntaxErrors.length;
  const errorCount = categorizedIssues.errors.length;
  const warningCount = categorizedIssues.warnings.length;
  const suggestionCount = categorizedIssues.suggestions.length;

  if (totalIssues === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">No Syntax Issues Detected</h3>
              <p className="text-sm text-green-600">
                Your code follows proper syntax rules and best practices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Syntax Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{suggestionCount}</div>
              <div className="text-sm text-muted-foreground">Suggestions</div>
            </div>
          </div>
          
          {/* AI Analysis Status */}
          {analysis.analysisMetadata?.aiAnalysisUsed && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800">AI-Powered Analysis</span>
                <Badge variant="secondary" className="ml-auto">
                  GROQ
                </Badge>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Advanced syntax analysis powered by AI for more accurate detection
              </p>
            </div>
          )}
          
          {analysis.summary?.priorityLevel && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Priority Level:</span>
                <Badge 
                  variant={analysis.summary.priorityLevel === 'critical' ? 'destructive' : 
                          analysis.summary.priorityLevel === 'high' ? 'default' : 'secondary'}
                >
                  {analysis.summary.priorityLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Categories */}
      <div className="space-y-2">
        {renderIssueCategory(
          'errors', 
          categorizedIssues.errors,
          <AlertTriangle className="h-4 w-4" />,
          'bg-red-50 border-red-200 text-red-800'
        )}
        
        {renderIssueCategory(
          'warnings', 
          categorizedIssues.warnings,
          <AlertCircle className="h-4 w-4" />,
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        )}
        
        {renderIssueCategory(
          'suggestions', 
          categorizedIssues.suggestions,
          <Info className="h-4 w-4" />,
          'bg-blue-50 border-blue-200 text-blue-800'
        )}
      </div>

      {/* Quick Actions */}
      {analysis.summary?.quickFixes && analysis.summary.quickFixes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Quick Fixes Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.summary.quickFixes.slice(0, 3).map((fix, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                  <span>{fix}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SyntaxErrorsDisplay;