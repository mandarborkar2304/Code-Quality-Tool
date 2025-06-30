// src/components/AreaOfImprovements.tsx

import { useEffect, useState } from "react";
import { CodeAnalysis } from "@/types";
import { fetchAIImprovements } from "@/pages/api/imporvementAPI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Code, 
  ChevronDown, 
  ChevronRight, 
  Copy,
  ExternalLink
} from "lucide-react";

interface AreaOfImprovementsProps {
  analysis: CodeAnalysis;
}

interface Improvement {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  // Enhanced fields for detailed recommendations
  oneLineFix: string;
  detailedRecommendation: string;
  codeExample?: string;
  estimatedTime: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  relatedIssues: string[];
}

const AreaOfImprovements = ({ analysis }: AreaOfImprovementsProps) => {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadImprovements = async () => {
      setLoading(true);
      const aiImprovements = await fetchAIImprovements(analysis);
      setImprovements(aiImprovements);
      setLoading(false);
    };

    loadImprovements();
  }, [analysis]);

  const getTypeIcon = (type: Improvement['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeBadge = (type: Improvement['type']) => {
    const styles = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <Badge className={styles[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getDifficultyBadge = (difficulty: Improvement['difficultyLevel']) => {
    const styles = {
      easy: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hard: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge variant="outline" className={styles[difficulty]}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </Badge>
    );
  };

  const toggleOpen = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm">Generating improvements...</p>
        </CardContent>
      </Card>
    );
  }

  if (improvements.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <Lightbulb className="mx-auto h-8 w-8 mb-2 text-green-600" />
            <p className="text-muted-foreground">Great job! No major improvements needed.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Areas of Improvement
          <Badge variant="outline" className="ml-auto">
            {improvements.length} Issues Found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {improvements.map((improvement, index) => (
            <Collapsible
              key={index}
              open={openItems.has(index)}
              onOpenChange={() => toggleOpen(index)}
            >
              <div className="border rounded-lg overflow-hidden">
                {/* Header Section */}
                <CollapsibleTrigger asChild>
                  <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon(improvement.type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 mb-1">
                            {improvement.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {improvement.description}
                          </p>
                          
                          {/* One-line fix */}
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-blue-800 mb-1">
                              <Target className="h-3 w-3" />
                              Quick Fix
                            </div>
                            <p className="text-sm text-blue-700">
                              {improvement.oneLineFix}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTypeBadge(improvement.type)}
                            {getDifficultyBadge(improvement.difficultyLevel)}
                            <Badge variant="outline" className="text-xs">
                              {improvement.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {improvement.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(improvement.oneLineFix);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {openItems.has(index) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="border-t bg-gray-50">
                    <div className="p-4 space-y-4">
                      {/* Detailed Recommendation */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Detailed Recommendation
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {improvement.detailedRecommendation}
                        </p>
                      </div>

                      {/* Code Example */}
                      {improvement.codeExample && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Example
                          </h4>
                          <div className="bg-gray-900 rounded-md p-3 overflow-x-auto">
                            <pre className="text-sm text-green-400 font-mono">
                              {improvement.codeExample}
                            </pre>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => copyToClipboard(improvement.codeExample || '')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Code
                          </Button>
                        </div>
                      )}

                      {/* Impact and Related Issues */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-2">
                            Impact Analysis
                          </h4>
                          <p className="text-sm text-gray-600">
                            {improvement.impact}
                          </p>
                        </div>
                        
                        {improvement.relatedIssues.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-900 mb-2">
                              Related Issues
                            </h4>
                            <div className="space-y-1">
                              {improvement.relatedIssues.map((issue, idx) => (
                                <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {issue}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => copyToClipboard(improvement.detailedRecommendation)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Recommendation
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(`${improvement.title}: ${improvement.oneLineFix}`)}
                        >
                          Copy Summary
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AreaOfImprovements;
