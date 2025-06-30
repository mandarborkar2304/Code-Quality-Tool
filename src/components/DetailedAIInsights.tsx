import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code2,
  Lightbulb,
  Target,
  Clock,
  Shield,
  Zap,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Bug,
  Cpu,
  Lock,
  TrendingUp,
  FileText,
  ArrowRight
} from 'lucide-react';
import { CodeAnalysis } from '@/types';

interface DetailedAIInsightsProps {
  analysis: CodeAnalysis;
  language: string;
  code: string;
}

interface CodeIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability' | 'style' | 'logic';
  severity: 'critical' | 'major' | 'minor' | 'info';
  title: string;
  description: string;
  codeSnippet?: string;
  lineNumber?: number;
  suggestion: string;
  example?: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  tags: string[];
}

const DetailedAIInsights: React.FC<DetailedAIInsightsProps> = ({
  analysis,
  language,
  code
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['critical']));
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Generate detailed issues from analysis
  const detailedIssues = useMemo(() => {
    const issues: CodeIssue[] = [];
    const codeLines = code.split('\n');

    // Process violations
    analysis.violations.lineReferences?.forEach((violation, index) => {
      const lineContent = codeLines[violation.line - 1] || '';
      
      issues.push({
        id: `violation-${index}`,
        type: violation.severity === 'major' ? 'reliability' : 'style',
        severity: violation.severity === 'major' ? 'major' : 'minor',
        title: violation.issue,
        description: `Code quality violation detected on line ${violation.line}`,
        codeSnippet: lineContent.trim(),
        lineNumber: violation.line,
        suggestion: getViolationSuggestion(violation.issue, lineContent, language),
        example: getViolationExample(violation.issue, language),
        impact: violation.severity === 'major' ? 'Affects code reliability and maintainability' : 'Minor style issue',
        effort: violation.severity === 'major' ? 'medium' : 'low',
        tags: ['code-quality', getViolationCategory(violation.issue)]
      });
    });

    // Process reliability issues
    if (analysis.reliability.issues && Array.isArray(analysis.reliability.issues)) {
      analysis.reliability.issues.forEach((issue, index) => {
        const issueText = typeof issue === 'string' ? issue : issue.description || 'Unknown issue';
        const lineNumber = typeof issue === 'object' && issue.line ? issue.line : findIssueInCode(issueText, codeLines);
        
        issues.push({
          id: `reliability-${index}`,
          type: 'reliability',
          severity: getSeverityFromScore(analysis.reliability.percentageScore || 70),
          title: `Reliability Issue: ${issueText}`,
          description: `Potential reliability concern that may affect code execution`,
          codeSnippet: lineNumber ? codeLines[lineNumber - 1]?.trim() : undefined,
          lineNumber,
          suggestion: getReliabilitySuggestion(issueText, language),
          impact: 'May cause runtime errors or unexpected behavior',
          effort: 'medium',
          tags: ['reliability', 'runtime']
        });
      });
    }

    // Process maintainability issues
    if (analysis.maintainability.issues && Array.isArray(analysis.maintainability.issues)) {
      analysis.maintainability.issues.forEach((issue, index) => {
        const issueText = typeof issue === 'string' ? issue : issue.description || 'Unknown issue';
        const lineNumber = findIssueInCode(issueText, codeLines);
        
        issues.push({
          id: `maintainability-${index}`,
          type: 'maintainability',
          severity: getSeverityFromScore(analysis.maintainability.percentageScore || 70),
          title: `Maintainability: ${issueText}`,
          description: `Code structure or design issue affecting maintainability`,
          codeSnippet: lineNumber ? codeLines[lineNumber - 1]?.trim() : undefined,
          lineNumber,
          suggestion: getMaintainabilitySuggestion(issueText, language),
          impact: 'Makes code harder to modify and extend',
          effort: 'high',
          tags: ['maintainability', 'design']
        });
      });
    }

    // Add complexity-based issues
    if (analysis.complexityAnalysis) {
      const complexity = analysis.complexityAnalysis;
      
      if (complexity.timeComplexity.confidence === 'low') {
        issues.push({
          id: 'complexity-time',
          type: 'performance',
          severity: 'major',
          title: 'Complex Time Complexity',
          description: `Time complexity is ${complexity.timeComplexity.notation} which may impact performance`,
          suggestion: 'Consider optimizing algorithm or using more efficient data structures',
          impact: 'Performance degradation with larger inputs',
          effort: 'high',
          tags: ['performance', 'algorithm']
        });
      }
    }

    return issues;
  }, [analysis, code, language]);

  // Group issues by type and severity
  const issueGroups = useMemo(() => {
    const groups = {
      critical: detailedIssues.filter(i => i.severity === 'critical'),
      major: detailedIssues.filter(i => i.severity === 'major'),
      minor: detailedIssues.filter(i => i.severity === 'minor'),
      info: detailedIssues.filter(i => i.severity === 'info')
    };
    return groups;
  }, [detailedIssues]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4 text-red-600" />;
      case 'performance': return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'maintainability': return <Code2 className="h-4 w-4 text-blue-600" />;
      case 'reliability': return <Bug className="h-4 w-4 text-orange-600" />;
      case 'style': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'logic': return <Cpu className="h-4 w-4 text-green-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'major': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const copyCodeSnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Detailed Code Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{issueGroups.critical.length}</div>
              <div className="text-sm text-red-700">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{issueGroups.major.length}</div>
              <div className="text-sm text-orange-700">Major</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{issueGroups.minor.length}</div>
              <div className="text-sm text-yellow-700">Minor</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{issueGroups.info.length}</div>
              <div className="text-sm text-blue-700">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Groups */}
      {Object.entries(issueGroups).map(([severity, issues]) => {
        if (issues.length === 0) return null;

        return (
          <Collapsible
            key={severity}
            open={expandedSections.has(severity)}
            onOpenChange={() => toggleSection(severity)}
          >
            <CollapsibleTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(severity)} variant="outline">
                        {severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{issues.length} Issues</span>
                    </div>
                    {expandedSections.has(severity) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="space-y-3 mt-2">
                {issues.map((issue) => (
                  <Card key={issue.id} className="border-l-4 border-l-orange-400">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getTypeIcon(issue.type)}
                          <div className="flex-1">
                            <div className="font-medium">{issue.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {issue.description}
                            </div>
                            {issue.lineNumber && (
                              <Badge variant="outline" className="mt-2">
                                Line {issue.lineNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getEffortColor(issue.effort)}>
                            {issue.effort} effort
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Code Snippet */}
                      {issue.codeSnippet && (
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">
                              Code at line {issue.lineNumber}:
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyCodeSnippet(issue.codeSnippet!)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-white p-2 rounded border block">
                            {issue.codeSnippet}
                          </code>
                        </div>
                      )}

                      {/* Suggestion */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-green-800 text-sm">Suggestion</div>
                            <div className="text-sm text-green-700 mt-1">{issue.suggestion}</div>
                          </div>
                        </div>
                      </div>

                      {/* Example */}
                      {issue.example && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-blue-800 text-sm">Better Approach</div>
                              <code className="text-sm font-mono bg-white p-2 rounded border block mt-2">
                                {issue.example}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Impact */}
                      <div className="text-sm">
                        <span className="font-medium text-muted-foreground">Impact: </span>
                        <span className="text-muted-foreground">{issue.impact}</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {issue.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {detailedIssues.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No detailed issues found in your code!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper functions
function getViolationSuggestion(issue: string, codeSnippet: string, language: string): string {
  // Add specific suggestions based on issue type and language
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('variable') && lowerIssue.includes('unused')) {
    return 'Remove unused variables or use them in your code logic';
  }
  if (lowerIssue.includes('function') && lowerIssue.includes('complex')) {
    return 'Break down complex functions into smaller, single-purpose functions';
  }
  if (lowerIssue.includes('naming')) {
    return 'Use descriptive, clear variable and function names that explain their purpose';
  }
  if (lowerIssue.includes('indentation')) {
    return 'Maintain consistent indentation throughout your code';
  }
  
  return 'Review and improve this code section based on best practices';
}

function getViolationExample(issue: string, language: string): string | undefined {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('variable') && lowerIssue.includes('unused')) {
    return language === 'javascript' 
      ? 'const result = processData(input); // Use the variable'
      : 'result = process_data(input)  # Use the variable';
  }
  
  return undefined;
}

function getViolationCategory(issue: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('variable') || lowerIssue.includes('function')) return 'naming';
  if (lowerIssue.includes('complex')) return 'complexity';
  if (lowerIssue.includes('indent') || lowerIssue.includes('format')) return 'formatting';
  
  return 'general';
}

function getSeverityFromScore(score: number): 'critical' | 'major' | 'minor' | 'info' {
  if (score < 50) return 'critical';
  if (score < 70) return 'major';
  if (score < 85) return 'minor';
  return 'info';
}

function findIssueInCode(issue: string, codeLines: string[]): number | undefined {
  // Simple heuristic to find line numbers based on issue content
  const keywords = issue.toLowerCase().split(' ').filter(word => word.length > 3);
  
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i].toLowerCase();
    if (keywords.some(keyword => line.includes(keyword))) {
      return i + 1;
    }
  }
  
  return undefined;
}

function getReliabilitySuggestion(issue: string, language: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('null') || lowerIssue.includes('undefined')) {
    return 'Add null/undefined checks before accessing properties or methods';
  }
  if (lowerIssue.includes('error') || lowerIssue.includes('exception')) {
    return 'Implement proper error handling with try-catch blocks';
  }
  
  return 'Add defensive programming practices to improve reliability';
}

function getMaintainabilitySuggestion(issue: string, language: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('duplicate')) {
    return 'Extract duplicate code into reusable functions or modules';
  }
  if (lowerIssue.includes('long') || lowerIssue.includes('complex')) {
    return 'Split long functions into smaller, focused functions';
  }
  
  return 'Refactor code to improve readability and maintainability';
}

export default DetailedAIInsights;