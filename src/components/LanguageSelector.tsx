
import { useState, useEffect } from "react";
import { Check, ChevronDown, Code, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ProgrammingLanguage } from "@/types";
import { detectLanguage, LanguageDetectionResult } from "@/utils/languageDetection";

interface LanguageSelectorProps {
  languages: ProgrammingLanguage[];
  selected: ProgrammingLanguage;
  onSelect: (language: ProgrammingLanguage) => void;
  code?: string;
  autoDetect?: boolean;
  onAutoDetect?: (result: LanguageDetectionResult) => void;
}

export function LanguageSelector({ 
  languages = [], 
  selected, 
  onSelect, 
  code = "",
  autoDetect = false,
  onAutoDetect
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showDetectionPanel, setShowDetectionPanel] = useState(false);

  // Ensure we have a valid languages array
  const validLanguages = Array.isArray(languages) ? languages : [];
  
  // Filter languages based on search query
  const filteredLanguages = validLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-detect language when code changes
  useEffect(() => {
    if (autoDetect && code && code.trim().length > 10) {
      setIsDetecting(true);
      
      // Debounce detection
      const timeoutId = setTimeout(() => {
        const result = detectLanguage(code);
        setDetectionResult(result);
        setIsDetecting(false);
        
        // Always call onAutoDetect with the result
        if (onAutoDetect) {
          onAutoDetect(result);
        }
        
        // Show detection panel if confidence is high and different from current
        if (result.confidence > 70 && result.detectedLanguage.id !== selected.id) {
          setShowDetectionPanel(true);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setDetectionResult(null);
      setShowDetectionPanel(false);
    }
  }, [code, autoDetect, onAutoDetect, selected.id]);

  const handleAutoSwitch = () => {
    if (detectionResult) {
      onSelect(detectionResult.detectedLanguage);
      setShowDetectionPanel(false);
    }
  };

  const handleDismissAutoDetection = () => {
    setShowDetectionPanel(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return "High";
    if (confidence >= 60) return "Medium";
    return "Low";
  };
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-muted text-foreground border-primary/20 hover:border-primary/50"
          >
            <div className="flex items-center gap-2">
              <Code size={18} className="text-primary" />
              {selected?.name || "Select language"}
              {isDetecting && <Zap size={14} className="text-yellow-500 animate-pulse" />}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-background border border-border">
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search language..."
              className="h-9"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {/* Auto-detection results */}
              {detectionResult && detectionResult.confidence > 0 && (
                <CommandGroup heading="Auto-detected">
                  <CommandItem
                    key={`detected-${detectionResult.detectedLanguage.id}`}
                    value={detectionResult.detectedLanguage.name}
                    onSelect={() => {
                      onSelect(detectionResult.detectedLanguage);
                      setOpen(false);
                      setSearchQuery("");
                      setShowDetectionPanel(false);
                    }}
                    className="flex items-center gap-2 aria-selected:bg-accent border-l-4 border-l-blue-500"
                  >
                    <Zap size={16} className="text-blue-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{detectionResult.detectedLanguage.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-1 py-0",
                            getConfidenceColor(detectionResult.confidence)
                          )}
                        >
                          {detectionResult.confidence}%
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {detectionResult.reason}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selected?.id === detectionResult.detectedLanguage.id ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                  {/* Alternative languages */}
                  {detectionResult.alternativeLanguages.map((alt) => (
                    <CommandItem
                      key={`alt-${alt.language.id}`}
                      value={alt.language.name}
                      onSelect={() => {
                        onSelect(alt.language);
                        setOpen(false);
                        setSearchQuery("");
                        setShowDetectionPanel(false);
                      }}
                      className="flex items-center gap-2 aria-selected:bg-accent ml-4 border-l-2 border-l-gray-300"
                    >
                      <Info size={14} className="text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{alt.language.name}</span>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {alt.confidence}%
                          </Badge>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected?.id === alt.language.id ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {/* All languages */}
              {filteredLanguages.length === 0 ? (
                <CommandEmpty>No languages found.</CommandEmpty>
              ) : (
                <CommandGroup heading="All Languages" className="max-h-64 overflow-y-auto scrollbar-thin">
                  {filteredLanguages.map((language) => (
                    <CommandItem
                      key={language.id}
                      value={language.name}
                      onSelect={() => {
                        onSelect(language);
                        setOpen(false);
                        setSearchQuery("");
                        setShowDetectionPanel(false);
                      }}
                      className="flex items-center gap-2 aria-selected:bg-accent"
                    >
                      <Code size={16} className="text-primary" />
                      {language.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected?.id === language.id ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Auto-detection notification panel */}
      {showDetectionPanel && detectionResult && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Zap size={16} className="text-blue-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Language Auto-Detected
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Detected <strong>{detectionResult.detectedLanguage.name}</strong> with{" "}
                <span className={cn(
                  "font-medium",
                  detectionResult.confidence >= 80 ? "text-green-600" : 
                  detectionResult.confidence >= 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {getConfidenceText(detectionResult.confidence)} confidence ({detectionResult.confidence}%)
                </span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {detectionResult.reason}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAutoSwitch}
              className="text-xs h-7 bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700"
            >
              Switch to {detectionResult.detectedLanguage.name}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismissAutoDetection}
              className="text-xs h-7 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              Keep {selected.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
