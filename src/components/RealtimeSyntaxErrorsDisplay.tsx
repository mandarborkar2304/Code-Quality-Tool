// Real-time Syntax Errors Display Component
// Shows granular, language-specific syntax errors in real-time

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Zap, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ProgrammingLanguage } from '@/types';
import { realtimeSyntaxAnalyzer } from '@/utils/realtimeSyntaxAnalyzer';
import { SyntaxError, SyntaxAnalysisResult } from '@/utils/syntaxAnalyzer';

interface RealtimeSyntaxErrorsDisplayProps {
  code: string;
  language: ProgrammingLanguage;
  onErrorClick?: (error: SyntaxError) => void;
  className?: string;
}

export function RealtimeSyntaxErrorsDisplay({
  code,
  language,
  onErrorClick,
  className
}: RealtimeSyntaxErrorsDisplayProps) {
  const [analysisResult, setAnalysisResult] = useState<SyntaxAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  // Debounce analysis
  useEffect(() => {
    if (!code || code.trim().length === 0) {
      setAnalysisResult(null);
      return;
    }

    setIsAnalyzing(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await realtimeSyntaxAnalyzer.analyze(code, language);
        setAnalysisResult(result);
        setLastAnalysisTime(Date.now());
      } catch (error) {
        console.error('Real-time syntax analysis error:', error);
        setAnalysisResult(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [code, language]);

  const filteredIssues = useMemo(() => {
    if (!analysisResult) return [];

    const allIssues = [
      ...(showErrors ? analysisResult.errors : []),
      ...(showWarnings ? analysisResult.warnings : []),
      ...(showSuggestions ? analysisResult.suggestions : [])
    ];

    if (selectedSeverity === 'all') {
      return allIssues;
    }

    return allIssues.filter(issue => issue.severity === selectedSeverity);
  }, [analysisResult, showErrors, showWarnings, showSuggestions, selectedSeverity]);

  const getIssueIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30';
      case 'info':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30';
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900/20 dark:hover:bg-gray-900/30';
    }
  };

  const getSeverityBadgeColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getTypeBadgeColor = (type: 'syntax' | 'semantic' | 'style') => {
    switch (type) {
      case 'syntax':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case 'semantic':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 'style':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const handleIssueClick = (issue: SyntaxError) => {
    if (onErrorClick) {
      onErrorClick(issue);
    }
  };

  const clearFilter = () => {
    setSelectedSeverity('all');
    setShowErrors(true);
    setShowWarnings(true);
    setShowSuggestions(true);
  };

  const errorCount = analysisResult?.errors.length || 0;
  const warningCount = analysisResult?.warnings.length || 0;
  const suggestionCount = analysisResult?.suggestions.length || 0;
  const totalCount = errorCount + warningCount + suggestionCount;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Real-time Syntax Analysis
            {isAnalyzing && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <Badge variant="outline" className="text-sm">
                {totalCount} issues
              </Badge>
            )}
            {analysisResult && (
              <Badge variant="outline" className="text-xs">
                {analysisResult.analysisTime}ms
              </Badge>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={showErrors ? "default" : "outline"}
              onClick={() => setShowErrors(!showErrors)}
              className="h-7 text-xs"
            >
              {showErrors ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Errors ({errorCount})
            </Button>
            <Button
              size="sm"
              variant={showWarnings ? "default" : "outline"}
              onClick={() => setShowWarnings(!showWarnings)}
              className="h-7 text-xs"
            >
              {showWarnings ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Warnings ({warningCount})
            </Button>
            <Button
              size="sm"
              variant={showSuggestions ? "default" : "outline"}
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="h-7 text-xs"
            >
              {showSuggestions ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Suggestions ({suggestionCount})
            </Button>
          </div>
          
          {totalCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilter}
              className="h-7 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!analysisResult && !isAnalyzing && (
          <div className="text-center text-muted-foreground py-8">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start typing to see real-time syntax analysis</p>
          </div>
        )}

        {analysisResult && totalCount === 0 && (
          <div className="text-center text-green-600 dark:text-green-400 py-8">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-medium">No syntax issues found!</p>
            <p className="text-sm opacity-80">Your code looks clean.</p>
          </div>
        )}

        {filteredIssues.length > 0 && (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredIssues.map((issue, index) => (
                <div
                  key={`${issue.line}-${issue.column}-${index}`}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    getIssueColor(issue.severity)
                  )}
                  onClick={() => handleIssueClick(issue)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIssueIcon(issue.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-xs", getSeverityBadgeColor(issue.severity))}>
                          {issue.severity}
                        </Badge>
                        <Badge className={cn("text-xs", getTypeBadgeColor(issue.type))}>
                          {issue.type}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          Line {issue.line}:{issue.column}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-foreground mb-1">
                        {issue.message}
                      </p>
                      
                      {issue.code && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Code: <span className="font-mono">{issue.code}</span>
                        </div>
                      )}
                      
                      {issue.quickFix && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mt-2">
                          💡 Quick fix: {issue.quickFix}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Analysis summary */}
        {analysisResult && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Language: <strong>{language.name}</strong></span>
                <span>Analysis time: <strong>{analysisResult.analysisTime}ms</strong></span>
              </div>
              <div className="flex items-center gap-2">
                {analysisResult.aiAnalysisUsed && (
                  <Badge variant="outline" className="text-xs">
                    AI Enhanced
                  </Badge>
                )}
                <span className="text-xs">
                  Last updated: {new Date(lastAnalysisTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}