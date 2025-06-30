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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  Building
} from 'lucide-react';
import { CodeAnalysis } from '@/types';
import { ProductionAnalyzer, PRODUCTION_ISSUE_TYPES, getLanguageByExtension, getSupportedLanguages } from '@/utils/productionAnalysis';

interface EnhancedAIInsightsProps {
  analysis: CodeAnalysis;
  language: string;
  code: string;
}

interface DetailedIssue {
  id: string;
  type: 'security' | 'performance' | 'maintainability' | 'reliability' | 'style' | 'logic' | 'scalability' | 'architecture';
  category?: string;
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
  fixAction?: string;
}

interface ImprovementArea {
  category: string;
  issues: DetailedIssue[];
  priority: 'high' | 'medium' | 'low';
  description: string;
  totalImpact: string;
}

const EnhancedAIInsights: React.FC<EnhancedAIInsightsProps> = ({
  analysis,
  language,
  code
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set(['high-priority']));
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Generate detailed issues from analysis with comprehensive production-level detection
  const detailedIssues = useMemo(() => {
    const issues: DetailedIssue[] = [];
    const codeLines = code.split('\n');

    // Use production analyzer for comprehensive issue detection
    const productionIssues = ProductionAnalyzer.detectIssues(code, language);
    
    productionIssues.forEach((issue, index) => {
      const issueType = PRODUCTION_ISSUE_TYPES[issue.type];
      
      issues.push({
        id: `production-${index}`,
        type: issueType?.category || 'logic',
        severity: issue.severity as DetailedIssue['severity'],
        title: issueType?.description || issue.type,
        description: `Production-level issue detected: ${issue.suggestion}`,
        codeSnippet: issue.line ? getCodeContext(codeLines, issue.line, 2) : issue.snippet,
        lineNumber: issue.line,
        suggestion: issue.suggestion,
        example: generateProductionExample(issue.type, language),
        impact: issueType?.impact || 'May affect production stability',
        effort: determineEffortLevel(issueType?.severity || 'minor'),
        tags: [issue.severity, issueType?.subcategory || 'general', issueType?.category || 'general'],
        fixAction: issueType?.remediation || 'Apply best practices for this issue'
      });
    });

    // Process violations from analysis with specific line references
    analysis.violations.lineReferences?.forEach((violation, index) => {
      const lineContent = codeLines[violation.line - 1] || '';
      const contextLines = getCodeContext(codeLines, violation.line, 2);
      
      issues.push({
        id: `violation-${index}`,
        type: mapViolationToType(violation.issue),
        severity: violation.severity === 'major' ? 'major' : 'minor',
        title: `Code Quality: ${violation.issue}`,
        description: `Found on line ${violation.line}: ${violation.issue}`,
        codeSnippet: contextLines,
        lineNumber: violation.line,
        suggestion: generateSpecificSuggestion(violation.issue, lineContent, language),
        example: generateCodeExample(violation.issue, language),
        impact: violation.severity === 'major' ? 'High - Affects code reliability' : 'Medium - Style and readability issue',
        effort: violation.severity === 'major' ? 'medium' : 'low',
        tags: [violation.severity, 'code-quality', getViolationTag(violation.issue)],
        fixAction: generateFixAction(violation.issue, lineContent)
      });
    });

    // Process reliability issues with code analysis
    if (analysis.reliability.issues && Array.isArray(analysis.reliability.issues)) {
      analysis.reliability.issues.forEach((issue, index) => {
        const issueText = typeof issue === 'string' ? issue : issue.description || 'Unknown issue';
        const lineNumber = findProblemInCode(issueText, codeLines);
        const contextLines = lineNumber ? getCodeContext(codeLines, lineNumber, 2) : undefined;
        
        issues.push({
          id: `reliability-${index}`,
          type: 'reliability',
          severity: getSeverityFromReliabilityScore(analysis.reliability.percentageScore || 70),
          title: `Reliability Risk: ${issueText}`,
          description: `Potential runtime issue that could cause failures`,
          codeSnippet: contextLines,
          lineNumber,
          suggestion: generateReliabilitySuggestion(issueText, language),
          impact: 'High - May cause runtime errors or crashes',
          effort: 'medium',
          tags: ['reliability', 'runtime-safety', getReliabilityTag(issueText)],
          fixAction: `Add error handling and validation for: ${issueText}`
        });
      });
    }

    // Process maintainability issues
    if (analysis.maintainability.issues && Array.isArray(analysis.maintainability.issues)) {
      analysis.maintainability.issues.forEach((issue, index) => {
        const issueText = typeof issue === 'string' ? issue : issue.description || 'Unknown issue';
        const lineNumber = findProblemInCode(issueText, codeLines);
        const contextLines = lineNumber ? getCodeContext(codeLines, lineNumber, 3) : undefined;
        
        issues.push({
          id: `maintainability-${index}`,
          type: 'maintainability',
          severity: getSeverityFromScore(analysis.maintainability.percentageScore || 70),
          title: `Maintainability: ${issueText}`,
          description: `Code structure issue affecting long-term maintainability`,
          codeSnippet: contextLines,
          lineNumber,
          suggestion: generateMaintainabilitySuggestion(issueText, language),
          impact: 'Medium - Makes future changes more difficult',
          effort: 'high',
          tags: ['maintainability', 'refactoring', getMaintainabilityTag(issueText)],
          fixAction: `Refactor to improve: ${issueText}`
        });
      });
    }

    // Add complexity-based issues if available
    if (analysis.complexityAnalysis) {
      const complexity = analysis.complexityAnalysis;
      
      // Find complex functions/methods
      const complexFunctions = findComplexFunctions(code, language);
      complexFunctions.forEach((func, index) => {
        issues.push({
          id: `complexity-func-${index}`,
          type: 'performance',
          severity: 'major',
          title: `High Complexity Function: ${func.name}`,
          description: `Function has high cyclomatic complexity (${func.complexity})`,
          codeSnippet: func.snippet,
          lineNumber: func.line,
          suggestion: 'Break down this function into smaller, single-purpose functions',
          example: generateSimplificationExample(func.name, language),
          impact: 'High - Reduces code maintainability and increases bug risk',
          effort: 'high',
          tags: ['complexity', 'refactoring', 'performance'],
          fixAction: `Split ${func.name} into smaller functions`
        });
      });
    }

    // Add performance-specific issues
    const performanceIssues = detectPerformanceIssues(code, language);
    performanceIssues.forEach((issue, index) => {
      issues.push({
        id: `performance-${index}`,
        type: 'performance',
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        codeSnippet: issue.codeSnippet,
        lineNumber: issue.lineNumber,
        suggestion: issue.suggestion,
        example: issue.example,
        impact: 'Medium to High - May affect application performance',
        effort: issue.effort,
        tags: ['performance', 'optimization'],
        fixAction: issue.fixAction
      });
    });

    return issues;
  }, [analysis, code, language]);

  // Group issues by improvement areas
  const improvementAreas = useMemo(() => {
    const areas: { [key: string]: ImprovementArea } = {};

    detailedIssues.forEach(issue => {
      const category = getImprovementCategory(issue.type);
      
      if (!areas[category]) {
        areas[category] = {
          category,
          issues: [],
          priority: 'medium',
          description: getCategoryDescription(category),
          totalImpact: ''
        };
      }
      
      areas[category].issues.push(issue);
    });

    // Calculate priority and impact for each area
    Object.values(areas).forEach(area => {
      const criticalCount = area.issues.filter(i => i.severity === 'critical').length;
      const majorCount = area.issues.filter(i => i.severity === 'major').length;
      
      if (criticalCount > 0 || majorCount > 2) {
        area.priority = 'high';
      } else if (majorCount > 0) {
        area.priority = 'medium';
      } else {
        area.priority = 'low';
      }
      
      area.totalImpact = `${area.issues.length} issues found`;
    });

    return Object.values(areas).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [detailedIssues]);

  // Filter issues based on selected filters
  const filteredIssues = useMemo(() => {
    return detailedIssues.filter(issue => {
      const typeMatch = selectedTypes.includes('all') || selectedTypes.includes(issue.type);
      const severityMatch = selectedSeverity === 'all' || issue.severity === selectedSeverity;
      return typeMatch && severityMatch;
    });
  }, [detailedIssues, selectedTypes, selectedSeverity]);

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
      case 'scalability': return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      case 'architecture': return <Building className="h-4 w-4 text-teal-600" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6 h-full overflow-auto custom-scrollbar smooth-scroll pr-2 max-w-full">
      {/* Header with Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Enhanced Code Analysis & Improvement Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {filteredIssues.filter(i => i.severity === 'critical').length}
              </div>
              <div className="text-sm text-red-700">Critical Issues</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {filteredIssues.filter(i => i.severity === 'major').length}
              </div>
              <div className="text-sm text-orange-700">Major Issues</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredIssues.filter(i => i.severity === 'minor').length}
              </div>
              <div className="text-sm text-yellow-700">Minor Issues</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {improvementAreas.length}
              </div>
              <div className="text-sm text-blue-700">Improvement Areas</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2">
            <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
              <Filter className="h-3 w-3" />
              Filters:
            </Badge>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2 py-1 border rounded text-sm flex-shrink-0 min-w-[120px]"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="info">Info</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      <Tabs defaultValue="areas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="areas">By Improvement Area</TabsTrigger>
          <TabsTrigger value="all-issues">All Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="areas" className="space-y-4">
          {improvementAreas.map((area) => (
            <Collapsible
              key={area.category}
              open={expandedSections.has(area.category)}
              onOpenChange={() => toggleSection(area.category)}
            >
              <CollapsibleTrigger asChild>
                <Card className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(area.priority)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={`${area.priority === 'high' ? 'bg-red-100 text-red-800' : area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {area.priority.toUpperCase()} PRIORITY
                          </Badge>
                          <h3 className="font-semibold text-lg">{area.category}</h3>
                        </div>
                        <Badge variant="outline">{area.issues.length} issues</Badge>
                      </div>
                      {expandedSections.has(area.category) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="space-y-3 mt-2">
                  {area.issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onCopy={copyToClipboard} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="all-issues" className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onCopy={copyToClipboard} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredIssues.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Excellent Code Quality!</h3>
              <p className="text-muted-foreground">No significant issues found in your code.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Issue Card Component
const IssueCard: React.FC<{ issue: DetailedIssue; onCopy: (text: string) => void }> = ({ issue, onCopy }) => {
  return (
    <Card className="border-l-4 border-l-orange-400 max-w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getTypeIcon(issue.type)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="font-medium break-words">{issue.title}</h4>
                <Badge className={getSeverityColor(issue.severity)} variant="outline">
                  {issue.severity}
                </Badge>
                {issue.lineNumber && (
                  <Badge variant="secondary" className="text-xs">
                    Line {issue.lineNumber}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {issue.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`${issue.effort === 'low' ? 'text-green-600' : issue.effort === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
            {issue.effort} effort
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Code Snippet */}
        {issue.codeSnippet && (
          <div className="bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                Code Context {issue.lineNumber ? `(around line ${issue.lineNumber})` : ''}:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(issue.codeSnippet!)}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <pre className="text-sm font-mono bg-white p-3 rounded border analysis-code-block whitespace-pre">
              <code>{issue.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Suggestion */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-green-800 text-sm mb-1">Suggested Fix</div>
              <div className="text-sm text-green-700">{issue.suggestion}</div>
              {issue.fixAction && (
                <div className="text-xs text-green-600 mt-2 font-medium">
                  Action: {issue.fixAction}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Example */}
        {issue.example && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-blue-800 text-sm mb-2">Better Approach</div>
                <pre className="text-sm font-mono bg-white p-2 rounded border analysis-code-block whitespace-pre">
                  <code>{issue.example}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Impact */}
        <div className="text-sm">
          <span className="font-medium text-muted-foreground">Impact: </span>
          <span className="text-muted-foreground">{issue.impact}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions (implementations)
function getCodeContext(lines: string[], lineNumber: number, contextSize: number): string {
  const start = Math.max(0, lineNumber - contextSize - 1);
  const end = Math.min(lines.length, lineNumber + contextSize);
  
  return lines.slice(start, end)
    .map((line, index) => {
      const actualLineNumber = start + index + 1;
      const prefix = actualLineNumber === lineNumber ? '>' : ' ';
      return `${prefix} ${actualLineNumber.toString().padStart(3)}: ${line}`;
    })
    .join('\n');
}

function mapViolationToType(issue: string): DetailedIssue['type'] {
  const lowerIssue = issue.toLowerCase();
  if (lowerIssue.includes('security') || lowerIssue.includes('vulnerable')) return 'security';
  if (lowerIssue.includes('performance') || lowerIssue.includes('slow')) return 'performance';
  if (lowerIssue.includes('complex') || lowerIssue.includes('maintain')) return 'maintainability';
  if (lowerIssue.includes('error') || lowerIssue.includes('exception')) return 'reliability';
  if (lowerIssue.includes('style') || lowerIssue.includes('format')) return 'style';
  return 'logic';
}

function generateSpecificSuggestion(issue: string, codeSnippet: string, language: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('unused variable')) {
    return `Remove the unused variable or use it in your logic. In ${language}, unused variables can indicate dead code.`;
  }
  if (lowerIssue.includes('complex function')) {
    return `Break this function into smaller, single-purpose functions. Consider extracting repeated logic into separate methods.`;
  }
  if (lowerIssue.includes('magic number')) {
    return `Replace magic numbers with named constants. Use ${language === 'javascript' ? 'const' : language === 'python' ? 'constant variables' : 'final/const variables'}.`;
  }
  if (lowerIssue.includes('deep nesting')) {
    return `Reduce nesting levels by using early returns, guard clauses, or extracting nested logic into separate functions.`;
  }
  
  return `Review and improve this code section following ${language} best practices and coding standards.`;
}

function generateCodeExample(issue: string, language: string): string | undefined {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('unused variable') && language === 'javascript') {
    return `// Instead of:\n// let unusedVar = getValue();\n\n// Use:\nconst result = getValue();\nconsole.log(result);`;
  }
  
  if (lowerIssue.includes('magic number')) {
    return language === 'javascript' 
      ? `// Instead of: if (age > 18)\n// Use:\nconst ADULT_AGE = 18;\nif (age > ADULT_AGE)`
      : `# Instead of: if age > 18\n# Use:\nADULT_AGE = 18\nif age > ADULT_AGE:`;
  }
  
  return undefined;
}

// Additional helper functions for production analysis...
function generateProductionExample(issueType: string, language: string): string | undefined {
  const examples: { [key: string]: { [key: string]: string } } = {
    'code-injection': {
      javascript: `// Instead of: eval(userInput)\n// Use: JSON.parse(userInput) // for data only`,
      python: `# Instead of: exec(user_input)\n# Use: ast.literal_eval(user_input) # for safe evaluation`,
      default: 'Use safe alternatives to dynamic code execution'
    },
    'xss-vulnerability': {
      javascript: `// Instead of: element.innerHTML = userInput\n// Use: element.textContent = userInput`,
      php: `// Instead of: echo $_GET['input'];\n// Use: echo htmlspecialchars($_GET['input'], ENT_QUOTES, 'UTF-8');`,
      default: 'Always sanitize and escape user input'
    },
    'sql-injection': {
      javascript: `// Instead of: "SELECT * FROM users WHERE id = " + userId\n// Use: prepared statement with parameters`,
      python: `# Instead of: f"SELECT * FROM users WHERE id = {user_id}"\n# Use: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`,
      java: `// Instead of: "SELECT * FROM users WHERE id = " + userId\n// Use: PreparedStatement with setParameter`,
      default: 'Use parameterized queries or prepared statements'
    },
    'n-plus-one-query': {
      default: `// Instead of querying in loop:\n// Use: batch loading or JOIN operations\n// Example: SELECT * FROM table WHERE id IN (1,2,3,4,5)`
    },
    'inefficient-loop': {
      javascript: `// Instead of: for(let i = 0; i < array.length; i++)\n// Use: const len = array.length; for(let i = 0; i < len; i++)`,
      python: `# Instead of: for i in range(len(items))\n# Use: for i, item in enumerate(items):`,
      default: 'Cache loop conditions and avoid repeated calculations'
    }
  };

  return examples[issueType]?.[language] || examples[issueType]?.default;
}

function determineEffortLevel(severity: string): DetailedIssue['effort'] {
  switch (severity) {
    case 'critical': return 'high';
    case 'major': return 'medium';
    case 'minor': return 'low';
    default: return 'low';
  }
}

function findProblemInCode(issue: string, codeLines: string[]): number | undefined {
  const keywords = issue.toLowerCase().split(' ').filter(word => word.length > 3);
  
  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i].toLowerCase();
    if (keywords.some(keyword => line.includes(keyword))) {
      return i + 1;
    }
  }
  
  return undefined;
}

function getSeverityFromReliabilityScore(score: number): DetailedIssue['severity'] {
  if (score < 40) return 'critical';
  if (score < 60) return 'major';
  if (score < 80) return 'minor';
  return 'info';
}

function getSeverityFromScore(score: number): DetailedIssue['severity'] {
  if (score < 50) return 'critical';
  if (score < 70) return 'major';
  if (score < 85) return 'minor';
  return 'info';
}

function getViolationTag(issue: string): string {
  const lowerIssue = issue.toLowerCase();
  if (lowerIssue.includes('variable')) return 'variables';
  if (lowerIssue.includes('function')) return 'functions';
  if (lowerIssue.includes('complex')) return 'complexity';
  return 'general';
}

function getReliabilityTag(issue: string): string {
  const lowerIssue = issue.toLowerCase();
  if (lowerIssue.includes('null') || lowerIssue.includes('undefined')) return 'null-safety';
  if (lowerIssue.includes('error') || lowerIssue.includes('exception')) return 'error-handling';
  return 'general';
}

function getMaintainabilityTag(issue: string): string {
  const lowerIssue = issue.toLowerCase();
  if (lowerIssue.includes('duplicate')) return 'duplication';
  if (lowerIssue.includes('long') || lowerIssue.includes('complex')) return 'complexity';
  return 'structure';
}

function findComplexFunctions(code: string, language: string) {
  // Simplified complexity detection - in real implementation, use AST parsing
  const functions: Array<{name: string, complexity: number, line: number, snippet: string}> = [];
  const lines = code.split('\n');
  
  // Basic pattern matching for functions
  const functionPattern = language === 'javascript' 
    ? /function\s+(\w+)\s*\(/
    : language === 'python'
    ? /def\s+(\w+)\s*\(/
    : /(?:public|private|protected)?\s*\w+\s+(\w+)\s*\(/;
  
  lines.forEach((line, index) => {
    const match = line.match(functionPattern);
    if (match) {
      // Simple complexity heuristic based on conditionals and loops
      const functionCode = extractFunctionCode(lines, index);
      const complexity = calculateSimpleComplexity(functionCode);
      
      if (complexity > 5) {
        functions.push({
          name: match[1],
          complexity,
          line: index + 1,
          snippet: functionCode.slice(0, 200) + (functionCode.length > 200 ? '...' : '')
        });
      }
    }
  });
  
  return functions;
}

function extractFunctionCode(lines: string[], startLine: number): string {
  // Simple extraction - get next 10 lines or until next function
  const endLine = Math.min(startLine + 10, lines.length);
  return lines.slice(startLine, endLine).join('\n');
}

function calculateSimpleComplexity(code: string): number {
  // Count decision points
  const patterns = [/if\s*\(/g, /for\s*\(/g, /while\s*\(/g, /case\s+/g, /catch\s*\(/g];
  let complexity = 1; // Base complexity
  
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  });
  
  return complexity;
}

function detectPerformanceIssues(code: string, language: string): Array<Omit<DetailedIssue, 'id' | 'type'>> {
  const issues: Array<Omit<DetailedIssue, 'id' | 'type'>> = [];
  const lines = code.split('\n');
  
  // Detect nested loops
  lines.forEach((line, index) => {
    if (line.includes('for') && code.slice(code.indexOf(line)).includes('for')) {
      const snippet = getCodeContext(lines, index + 1, 2);
      issues.push({
        severity: 'major',
        title: 'Nested Loops Detected',
        description: 'Nested loops can lead to O(n²) or worse time complexity',
        codeSnippet: snippet,
        lineNumber: index + 1,
        suggestion: 'Consider using more efficient algorithms or data structures',
        impact: 'High - Exponential performance degradation with input size',
        effort: 'medium',
        tags: ['nested-loops', 'time-complexity'],
        fixAction: 'Optimize algorithm to reduce nested iterations'
      });
    }
  });
  
  return issues;
}

function generateSimplificationExample(functionName: string, language: string): string {
  return language === 'javascript' 
    ? `// Break down ${functionName}:\nfunction ${functionName}() {\n  validateInput();\n  processData();\n  returnResult();\n}`
    : `# Break down ${functionName}:\ndef ${functionName}():\n    validate_input()\n    process_data()\n    return_result()`;
}

function getImprovementCategory(type: string): string {
  switch (type) {
    case 'security': return 'Security & Safety';
    case 'performance': return 'Performance Optimization';
    case 'maintainability': return 'Code Maintainability';
    case 'reliability': return 'Reliability & Error Handling';
    case 'style': return 'Code Style & Standards';
    case 'logic': return 'Logic & Algorithm';
    default: return 'General Improvements';
  }
}

function getCategoryDescription(category: string): string {
  switch (category) {
    case 'Security & Safety': return 'Issues that could pose security risks or safety concerns';
    case 'Performance Optimization': return 'Areas where code performance can be improved';
    case 'Code Maintainability': return 'Structural improvements for better long-term maintenance';
    case 'Reliability & Error Handling': return 'Potential runtime issues and error handling improvements';
    case 'Code Style & Standards': return 'Style and formatting issues for better readability';
    case 'Logic & Algorithm': return 'Algorithmic and logical improvements';
    default: return 'General code quality improvements';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'security': return <Shield className="h-4 w-4 text-red-600" />;
    case 'performance': return <Zap className="h-4 w-4 text-yellow-600" />;
    case 'maintainability': return <Code2 className="h-4 w-4 text-blue-600" />;
    case 'reliability': return <Bug className="h-4 w-4 text-orange-600" />;
    case 'style': return <FileText className="h-4 w-4 text-purple-600" />;
    case 'logic': return <Cpu className="h-4 w-4 text-green-600" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'major': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'minor': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function generateReliabilitySuggestion(issue: string, language: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('null') || lowerIssue.includes('undefined')) {
    return language === 'javascript' 
      ? 'Add null/undefined checks: if (value != null) { ... }'
      : 'Add null checks: if value is not None: ...';
  }
  if (lowerIssue.includes('error') || lowerIssue.includes('exception')) {
    return language === 'javascript'
      ? 'Implement try-catch blocks for error handling'
      : 'Use try-except blocks for proper error handling';
  }
  
  return 'Add defensive programming practices and input validation';
}

function generateMaintainabilitySuggestion(issue: string, language: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('duplicate')) {
    return 'Extract duplicate code into reusable functions or modules';
  }
  if (lowerIssue.includes('long') || lowerIssue.includes('complex')) {
    return 'Break down large functions into smaller, focused functions with single responsibilities';
  }
  
  return 'Refactor code structure to improve readability and maintainability';
}

function generateFixAction(issue: string, codeSnippet: string): string {
  const lowerIssue = issue.toLowerCase();
  
  if (lowerIssue.includes('unused')) {
    return 'Remove unused variable or implement its usage';
  }
  if (lowerIssue.includes('complex')) {
    return 'Refactor into smaller functions';
  }
  if (lowerIssue.includes('magic number')) {
    return 'Replace with named constant';
  }
  
  return 'Apply best practices fix';
}

export default EnhancedAIInsights;