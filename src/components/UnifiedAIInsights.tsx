import { useState } from "react";
import { Brain, Filter, AlertTriangle, Lightbulb, Shield, Zap, Target, Clock } from "lucide-react";
import { CodeAnalysis } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnifiedAIInsightsProps {
  analysis: CodeAnalysis;
  language: string;
  onApplyCorrection: (code: string) => void;
}

interface Insight {
  id: string;
  type: 'improvement' | 'recommendation' | 'security' | 'performance' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: string;
  actionable?: boolean;
  line?: number;
}

const UnifiedAIInsights = ({ analysis, language, onApplyCorrection }: UnifiedAIInsightsProps) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['improvement', 'recommendation', 'security', 'performance', 'quality']);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['low', 'medium', 'high', 'critical']);

  // Combine all insights from different sources
  const getAllInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // From code smells
    if (analysis.codeSmells?.smells) {
      analysis.codeSmells.smells.forEach((smell, index) => {
        insights.push({
          id: `smell-${index}`,
          type: 'improvement',
          severity: smell.severity as any,
          title: smell.type,
          description: smell.description,
          category: 'Code Quality',
          line: smell.line
        });
      });
    }

    // From security issues
    if (analysis.securityIssues) {
      analysis.securityIssues.forEach((issue, index) => {
        insights.push({
          id: `security-${index}`,
          type: 'security',
          severity: 'high',
          title: 'Security Issue',
          description: issue,
          category: 'Security',
          actionable: true
        });
      });
    }

    // From performance issues
    if (analysis.performanceIssues) {
      analysis.performanceIssues.forEach((issue, index) => {
        insights.push({
          id: `performance-${index}`,
          type: 'performance',
          severity: 'medium',
          title: 'Performance Issue',
          description: issue,
          category: 'Performance'
        });
      });
    }

    // From AI suggestions
    if (analysis.aiSuggestions) {
      const suggestions = analysis.aiSuggestions.split('\n').filter(s => s.trim());
      suggestions.forEach((suggestion, index) => {
        const severity = suggestion.toLowerCase().includes('critical') ? 'critical' :
                        suggestion.toLowerCase().includes('immediate') ? 'high' :
                        suggestion.toLowerCase().includes('short-term') ? 'medium' : 'low';
        
        insights.push({
          id: `ai-${index}`,
          type: 'recommendation',
          severity: severity as any,
          title: 'AI Recommendation',
          description: suggestion.replace(/^(Immediate|Short-term|Long-term):\s*/, ''),
          category: 'AI Analysis',
          actionable: true
        });
      });
    }

    // From summary weaknesses
    if (analysis.summary?.weaknesses) {
      analysis.summary.weaknesses.forEach((weakness, index) => {
        insights.push({
          id: `weakness-${index}`,
          type: 'improvement',
          severity: 'medium',
          title: 'Area for Improvement',
          description: weakness,
          category: 'Code Quality'
        });
      });
    }

    return insights;
  };

  const insights = getAllInsights();
  
  // Filter insights based on selected types and severities
  const filteredInsights = insights.filter(insight => 
    selectedTypes.includes(insight.type) && 
    selectedSeverities.includes(insight.severity)
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'improvement': return <Target className="h-4 w-4" />;
      case 'recommendation': return <Brain className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'quality': return <Lightbulb className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'improvement': return 'text-blue-600';
      case 'recommendation': return 'text-purple-600';
      case 'security': return 'text-red-600';
      case 'performance': return 'text-green-600';
      case 'quality': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleSeverity = (severity: string) => {
    setSelectedSeverities(prev => 
      prev.includes(severity) 
        ? prev.filter(s => s !== severity)
        : [...prev, severity]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Areas of Improvement</h3>
          <Badge variant="outline" className="ml-2">
            {filteredInsights.length} insights
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {['improvement', 'recommendation', 'security', 'performance', 'quality'].map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => toggleType(type)}
              >
                <div className="flex items-center gap-2">
                  <span className={getTypeColor(type)}>
                    {getTypeIcon(type)}
                  </span>
                  <span className="capitalize">{type}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Severity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {['critical', 'high', 'medium', 'low'].map(severity => (
              <DropdownMenuCheckboxItem
                key={severity}
                checked={selectedSeverities.includes(severity)}
                onCheckedChange={() => toggleSeverity(severity)}
              >
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getSeverityColor(severity)}`}>
                    {severity}
                  </Badge>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Insights list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No insights match your current filters.</p>
              <p className="text-sm mt-1">Try adjusting your filter settings.</p>
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map((insight) => (
            <Card key={insight.id} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 ${getTypeColor(insight.type)}`}>
                      {getTypeIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <Badge className={`text-xs ${getSeverityColor(insight.severity)}`}>
                          {insight.severity}
                        </Badge>
                        {insight.line && (
                          <Badge variant="outline" className="text-xs">
                            Line {insight.line}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {insight.category}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UnifiedAIInsights;
