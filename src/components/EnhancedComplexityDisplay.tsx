import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Clock, 
  HardDrive, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  BarChart3,
  Cpu,
  Database,
  Zap,
  Brain,
  Target,
  RefreshCw
} from 'lucide-react';
import { analyzeComplexity, EnhancedComplexityAnalysis } from '@/utils/enhancedComplexityAnalysis';

interface EnhancedComplexityDisplayProps {
  code: string;
  language: string;
  functionName?: string;
  triggerAnalysis?: boolean; // New prop to control when analysis runs
  analysisTimestamp?: number; // Add timestamp to trigger analysis only when needed
}

const EnhancedComplexityDisplay: React.FC<EnhancedComplexityDisplayProps> = ({
  code,
  language,
  functionName,
  triggerAnalysis = false,
  analysisTimestamp
}) => {
  const [analysis, setAnalysis] = useState<EnhancedComplexityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState(new Set(['overview']));

  useEffect(() => {
    // Only run analysis when analysisTimestamp changes (i.e., when analysis is triggered)
    if (code.trim() && (analysisTimestamp || triggerAnalysis)) {
      performAnalysis();
    }
  }, [analysisTimestamp]); // Only depend on analysisTimestamp to prevent unnecessary API calls

  const performAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeComplexity(code, language, functionName);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze complexity. Please try again.');
      console.error('Complexity analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getGradeColor = (grade: string) => {
    const colors = {
      'A': 'bg-green-500',
      'B': 'bg-blue-500', 
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'F': 'bg-red-500'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-500';
  };

  const getPerformanceCategoryColor = (category: string) => {
    const colors = {
      'Excellent': 'text-green-600 bg-green-50 border-green-200',
      'Good': 'text-blue-600 bg-blue-50 border-blue-200',
      'Fair': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Poor': 'text-orange-600 bg-orange-50 border-orange-200',
      'Critical': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Complexity Analysis
            <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-medium">Analyzing code complexity...</p>
              <p className="text-sm text-muted-foreground">Using AI to determine accurate time and space complexity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Complexity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-600 mb-2">{error}</p>
            <Button onClick={performAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Complexity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Add some code to analyze its complexity...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Complexity Analysis
              {functionName && (
                <Badge variant="outline" className="ml-2">
                  {functionName}
                </Badge>
              )}
            </div>
            <Badge 
              className={`${getPerformanceCategoryColor(analysis.performanceCategory)} border`}
              variant="outline"
            >
              {analysis.performanceCategory}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar smooth-scroll">
          {/* Overview Section */}
          <Collapsible 
            open={expandedSections.has('overview')}
            onOpenChange={() => toggleSection('overview')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Complexity Overview</span>
                </div>
                {expandedSections.has('overview') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 space-y-4">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <span className="text-lg font-semibold">Overall Complexity Score</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analysis.overallComplexityScore}/100
                  </div>
                  <Progress value={analysis.overallComplexityScore} className="w-full max-w-xs mx-auto" />
                </div>

                {/* Time and Space Complexity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time Complexity */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Time Complexity</span>
                      </div>
                      <Badge className={`${getGradeColor(analysis.timeComplexity.grade)} text-white`}>
                        Grade {analysis.timeComplexity.grade}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysis.timeComplexity.notation}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Best:</span>
                          <div className="font-medium">{analysis.timeComplexity.bestCase}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Average:</span>
                          <div className="font-medium">{analysis.timeComplexity.averageCase}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Worst:</span>
                          <div className="font-medium">{analysis.timeComplexity.worstCase}</div>
                        </div>
                      </div>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`text-xs ${getConfidenceColor(analysis.timeComplexity.confidence)}`}>
                            Confidence: {analysis.timeComplexity.confidence}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>AI confidence in this analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Space Complexity */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Space Complexity</span>
                      </div>
                      <Badge className={`${getGradeColor(analysis.spaceComplexity.grade)} text-white`}>
                        Grade {analysis.spaceComplexity.grade}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.spaceComplexity.notation}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Auxiliary:</span>
                          <div className="font-medium">{analysis.spaceComplexity.auxiliary}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <div className="font-medium">{analysis.spaceComplexity.total}</div>
                        </div>
                      </div>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`text-xs ${getConfidenceColor(analysis.spaceComplexity.confidence)}`}>
                            Confidence: {analysis.spaceComplexity.confidence}%
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>AI confidence in this analysis</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Detailed Analysis Section */}
          <Collapsible 
            open={expandedSections.has('details')}
            onOpenChange={() => toggleSection('details')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Detailed Analysis</span>
                </div>
                {expandedSections.has('details') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 space-y-4">
                {/* Algorithm Type and Data Structures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Algorithm Type
                    </h4>
                    <Badge variant="outline" className="text-sm">
                      {analysis.algorithmType}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-600" />
                      Data Structures
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.dataStructures.map((structure, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {structure}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Explanations */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-blue-600">Time Complexity Explanation</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {analysis.timeComplexity.description}
                    </p>
                    <p className="text-sm">
                      {analysis.timeComplexity.explanation}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Space Complexity Explanation</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {analysis.spaceComplexity.description}
                    </p>
                    <p className="text-sm">
                      {analysis.spaceComplexity.explanation}
                    </p>
                  </div>
                </div>

                {/* Contributing Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Time Complexity Factors</h4>
                    <ul className="text-sm space-y-1">
                      {analysis.timeComplexity.factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Space Complexity Factors</h4>
                    <ul className="text-sm space-y-1">
                      {analysis.spaceComplexity.factors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Static Analysis Section */}
          <Collapsible 
            open={expandedSections.has('static')}
            onOpenChange={() => toggleSection('static')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Static Analysis Metrics</span>
                </div>
                {expandedSections.has('static') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.staticAnalysis.loops}
                    </div>
                    <div className="text-sm text-muted-foreground">Loops</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysis.staticAnalysis.nestedLoops}
                    </div>
                    <div className="text-sm text-muted-foreground">Max Nesting</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysis.staticAnalysis.recursiveCalls}
                    </div>
                    <div className="text-sm text-muted-foreground">Recursive Calls</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.staticAnalysis.dataStructureAllocations}
                    </div>
                    <div className="text-sm text-muted-foreground">Data Structures</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {analysis.staticAnalysis.codeLength}
                    </div>
                    <div className="text-sm text-muted-foreground">Lines of Code</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {analysis.staticAnalysis.functionCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Functions</div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Optimization Suggestions */}
          <Collapsible 
            open={expandedSections.has('optimization')}
            onOpenChange={() => toggleSection('optimization')}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Optimization Suggestions</span>
                  <Badge variant="outline" className="ml-2">
                    {analysis.optimizationSuggestions.length} Tips
                  </Badge>
                </div>
                {expandedSections.has('optimization') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4">
                <div className="space-y-3">
                  {analysis.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-yellow-800">{suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default EnhancedComplexityDisplay;