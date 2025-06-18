import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react";
import { CodeAnalysis } from "@/types";
import { fetchAIRecommendations } from "@/pages/api/aiRecommendationsAPI";
import { generateCodeInsights } from "@/utils/quality/insights";

interface AIRecommendationsProps {
  analysis: CodeAnalysis;
  language: string;
  onApplyCorrection: (code: string) => void;
}

interface FormattedInsight {
  type: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  impact: string;
  tag: string;
}

interface RawInsight {
  line?: number;
  rule: string;
  suggestion: string;
  category: string;
  tag?: string;
}

const AIRecommendations = ({
  analysis,
  language,
  onApplyCorrection,
}: AIRecommendationsProps) => {
  const [insights, setInsights] = useState<FormattedInsight[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const determineType = (issue: string): FormattedInsight["type"] => {
    if (/null|exception|crash|throw/i.test(issue)) return "critical";
    if (/nesting|duplicate|loop|magic number/i.test(issue)) return "high";
    if (/comment|structure|naming/i.test(issue)) return "medium";
    return "low";
  };

  const getTypeBadge = (type: FormattedInsight["type"]) => {
    const styles = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      <Badge className={styles[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: FormattedInsight["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "high":
        return <Target className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatInsights = (): FormattedInsight[] => {
    const raw = generateCodeInsights(analysis.violations) as RawInsight[];
    return raw.map((item) => ({
      type: determineType(item.suggestion),
      category: item.category,
      title: item.rule,
      description: `${item.line ? `Line ${item.line}: ` : ""}${item.suggestion}`,
      impact: "Improves code quality and maintainability",
      tag: item.tag || "Maintainability",
    }));
  };

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        const ruleBased = generateCodeInsights(analysis.violations);
        if (ruleBased.length > 0) {
          setInsights(formatInsights());
        } else {
          const fallback = await fetchAIRecommendations(analysis, language);
          setInsights([
            {
              type: "low",
              category: "General",
              title: "AI Suggestion",
              description: fallback,
              impact: "General code insight",
              tag: "Maintainability",
            },
          ]);
        }
      } catch {
        setInsights([
          {
            type: "low",
            category: "Error",
            title: "Fetch Failed",
            description: "⚠️ Failed to generate AI recommendations.",
            impact: "Try again later",
            tag: "General",
          },
        ]);
      }
    };
    getRecommendations();
  }, [analysis, language]);

  const grouped = insights.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FormattedInsight[]>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader onClick={() => setCollapsed(!collapsed)} className="cursor-pointer">
          <CardTitle className="text-sm flex items-center gap-2 w-full">
            <Brain className="h-4 w-4 text-purple-600" />
            AI Insights
            <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
              {insights.length}
            </Badge>
            <ChevronRight
              className={`ml-auto h-4 w-4 transform transition-transform duration-200 ${
                !collapsed ? "rotate-90" : ""
              }`}
            />
          </CardTitle>
        </CardHeader>

        {!collapsed && (
          <CardContent className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-muted-foreground">Fetching AI insights...</div>
            ) : (
              Object.entries(grouped).map(([category, items], idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{category}</span>
                    <div className="flex gap-2">
                      {[...new Set(items.map((i) => i.tag))].map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {items.map((improvement, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(improvement.type)}
                          <span className="font-medium text-sm">{improvement.title}</span>
                        </div>
                        {getTypeBadge(improvement.type)}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {improvement.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="font-medium">Impact:</span>
                          <span>{improvement.impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {analysis.correctedCode && !collapsed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Suggested Code Fix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The AI model generated an improved version of your code. You can apply it below.
            </p>
            <Button
              onClick={() => onApplyCorrection(analysis.correctedCode!)}
              size="sm"
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Apply Suggested Fix
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendations;
