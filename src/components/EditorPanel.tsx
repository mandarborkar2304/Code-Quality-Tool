import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ProgrammingLanguage } from "@/types";
import { Code, Brain, RefreshCw, FilePlus, File } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { programmingLanguages } from "@/data/languages";
import { detectCodeLanguage } from "@/utils/codeExecution";
import { useToast } from "@/hooks/use-toast";
import { CodeAnalysis } from "@/types";
import TabsCodeEditor, { CodeFile } from "@/components/TabsCodeEditor";

interface EditorPanelProps {
  code: string;
  setCode: (code: string) => void;
  selectedLanguage: ProgrammingLanguage;
  setSelectedLanguage: (language: ProgrammingLanguage) => void;
  isAnalyzing: boolean;
  onReset: () => void;
  analysisResults: CodeAnalysis | null;
  onAnalyze: () => void; // Basic analysis function
  onComprehensiveAnalyze: () => void; // Comprehensive analysis function
}

const EditorPanel = ({
  code,
  setCode,
  selectedLanguage,
  setSelectedLanguage,
  isAnalyzing,
  onReset,
  analysisResults,
  onAnalyze,
  onComprehensiveAnalyze
}: EditorPanelProps) => {
  const { toast } = useToast();
  const [hasLanguageMismatch, setHasLanguageMismatch] = useState(false);
  
  // Simplified: Create single file for the selected language
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('main');
  const [fileCounter, setFileCounter] = useState<number>(1);
  
  // Setup initial file based on selected language
  useEffect(() => {
    const fileName = `main${selectedLanguage.fileExtension}`;
    const newFiles: CodeFile[] = [
      { id: 'main', name: fileName, language: selectedLanguage, content: code }
    ];
    
    setFiles(newFiles);
    setActiveFileId('main');
  }, [selectedLanguage.id]);
  
  // Update file content when code changes
  useEffect(() => {
    setFiles(prev => prev.map(file => 
      file.id === 'main' ? { ...file, content: code } : file
    ));
  }, [code]);
  
  // Handle file content changes - simplified
  const handleFileContentChange = (fileId: string, newContent: string) => {
    if (fileId === 'main') {
      setCode(newContent);
    } else {
      // For additional files 
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, content: newContent } : file
      ));
    }
  };
  
  // Add a new file
  const handleAddFile = () => {
    const newFileId = `file-${fileCounter}`;
    const newFileName = `new-file-${fileCounter}${selectedLanguage.fileExtension}`;
    
    const newFile: CodeFile = {
      id: newFileId,
      name: newFileName,
      language: selectedLanguage,
      content: ''
    };
    
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
    setFileCounter(prev => prev + 1);
    
    toast({
      title: "File Added",
      description: `Created new file: ${newFileName}`,
    });
  };
  
  // Remove a file
  const handleRemoveFile = (fileId: string) => {
    // Don't remove main file or html/css/js files in web mode
    if (fileId === 'main' || (selectedLanguage.id === 'web' && ['html', 'css', 'js'].includes(fileId))) {
      toast({
        title: "Cannot Remove File",
        description: "This is a required file for the current language.",
        variant: "destructive"
      });
      return;
    }
    
    // Find next active file
    const fileIndex = files.findIndex(file => file.id === fileId);
    let nextActiveId = activeFileId;
    
    if (activeFileId === fileId) {
      if (fileIndex > 0) {
        nextActiveId = files[fileIndex - 1].id;
      } else if (files.length > 1) {
        nextActiveId = files[1].id;
      } else {
        nextActiveId = 'main';
      }
    }
    
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setActiveFileId(nextActiveId);
    
    toast({
      title: "File Removed",
      description: `Removed file: ${files.find(file => file.id === fileId)?.name}`,
    });
  };

  useEffect(() => {
    if (code.trim() && selectedLanguage.id !== 'web') {
      const detectedLang = detectCodeLanguage(code);
      if (detectedLang && detectedLang !== selectedLanguage.id) {
        setHasLanguageMismatch(true);
        toast({
          title: "Language Mismatch Detected",
          description: `Selected compiler is ${selectedLanguage.name}, but code appears to be ${detectedLang}. Please verify your input.`,
          variant: "destructive"
        });
      } else {
        setHasLanguageMismatch(false);
      }
    }
  }, [code, selectedLanguage, toast]);

  const handleAnalyzeClick = () => {
    if (hasLanguageMismatch) {
      toast({
        title: "Cannot Analyze Code",
        description: "Please resolve the language mismatch before analyzing.",
        variant: "destructive"
      });
      return;
    }
    onComprehensiveAnalyze();
  };

  const handleLanguageChange = (language: ProgrammingLanguage) => {
    setSelectedLanguage(language);
    setHasLanguageMismatch(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center pb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold flex items-center text-orange-600">
            <Code className="h-5 w-5 mr-2 text-orange-500" />
            Code Editor
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-42">
            <LanguageSelector languages={programmingLanguages} selected={selectedLanguage} onSelect={handleLanguageChange} />
          </div>
          <Button variant="outline" size="sm" className="gap-1 h-8 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={handleAddFile}>
            <FilePlus className="h-3 w-3" />
            Add File
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-8 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={onReset}>
            <RefreshCw className="h-3 w-3" />
            Reset
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            disabled={isAnalyzing || hasLanguageMismatch} 
            onClick={onComprehensiveAnalyze} 
            className="gap-1 h-8 mx-[8px] bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isAnalyzing ? <>
                <span className="animate-spin h-3 w-3 border-2 border-t-transparent border-r-transparent rounded-full border-white"></span>
                Analyzing
              </> : <>
                <Brain className="h-3 w-3 text-white" />
                Analyze Code Quality
              </>}
          </Button>
        </div>
      </div>
      <Separator className="bg-orange-200 mb-4" />
      <div className="flex-1 min-h-0 h-[calc(100vh-8rem)]">
        <TabsCodeEditor 
          files={files}
          activeFileId={activeFileId}
          onActiveFileChange={setActiveFileId}
          onFileContentChange={handleFileContentChange}
          onRemoveFile={handleRemoveFile}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
