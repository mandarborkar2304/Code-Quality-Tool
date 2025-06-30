
import React, { useState } from "react";
import { ComplexityAnalysis } from "@/types/complexityTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Database, TrendingUp, TrendingDown, Brain, BarChart3 } from "lucide-react";
import EnhancedComplexityDisplay from "./EnhancedComplexityDisplay";

interface ComplexityDisplayProps {
  analysis: ComplexityAnalysis;
  code?: string;
  language?: string;
  functionName?: string;
  analysisTimestamp?: number; // Add timestamp to control when analysis runs
}

const ComplexityDisplay = ({ analysis, code, language, functionName, analysisTimestamp }: ComplexityDisplayProps) => {
  const getComplexityColor = (notation: string) => {
    switch (notation) {
      case 'O(1)':
      case 'O(log n)':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'O(n)':
      case 'O(n log n)':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'O(n²)':
      case 'O(n³)':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'O(2^n)':
      case 'O(n!)':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3 text-yellow-600" />;
      case 'low':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Only show AI Analysis - removed basic analysis for efficiency */}
      {code && language ? (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Brain className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">AI-Powered Complexity Analysis</h3>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Enhanced Analysis
            </span>
          </div>
          <EnhancedComplexityDisplay 
            code={code}
            language={language}
            functionName={functionName}
            analysisTimestamp={analysisTimestamp}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">AI Complexity Analysis</h3>
          <p className="text-muted-foreground mb-4">
            Detailed complexity analysis will appear here after running code analysis.
          </p>
          <p className="text-sm text-muted-foreground">
            Our AI will analyze time complexity, space complexity, and provide optimization suggestions.
          </p>
        </div>
      )}
    </div>
  );
};

// Basic complexity view component
const BasicComplexityView = ({ analysis }: { analysis: ComplexityAnalysis }) => {
  const getComplexityColor = (notation: string) => {
    switch (notation) {
      case 'O(1)':
      case 'O(log n)':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'O(n)':
      case 'O(n log n)':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'O(n²)':
      case 'O(n³)':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'O(2^n)':
      case 'O(n!)':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3 text-yellow-600" />;
      case 'low':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Time Complexity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Time Complexity
            <Badge variant="outline" className="ml-auto">Basic</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={`${getComplexityColor(analysis.timeComplexity.notation)} font-mono`}>
              {analysis.timeComplexity.notation}
            </Badge>
            <div className="flex items-center gap-1">
              {getConfidenceIcon(analysis.timeComplexity.confidence)}
              <span className="text-xs text-muted-foreground">
                {analysis.timeComplexity.confidence}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {analysis.timeComplexity.description}
          </p>
          
          {analysis.timeComplexity.factors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Analysis factors:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {analysis.timeComplexity.factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-500 mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Space Complexity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-600" />
            Space Complexity
            <Badge variant="outline" className="ml-auto">Basic</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={`${getComplexityColor(analysis.spaceComplexity.notation)} font-mono`}>
              {analysis.spaceComplexity.notation}
            </Badge>
            <div className="flex items-center gap-1">
              {getConfidenceIcon(analysis.spaceComplexity.confidence)}
              <span className="text-xs text-muted-foreground">
                {analysis.spaceComplexity.confidence}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {analysis.spaceComplexity.description}
          </p>
          
          {analysis.spaceComplexity.factors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Analysis factors:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {analysis.spaceComplexity.factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-purple-500 mt-1">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplexityDisplay;
