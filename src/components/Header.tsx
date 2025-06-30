import { useState } from "react";
import { Code2, Info, HelpCircle, X } from "lucide-react";
import iMochaLogo from "../assets/imocha-logo-rbg.png";
import { ThemeToggle } from "./ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-gray-800 border-b-2 border-orange-200 dark:border-gray-700 py-3 px-6 flex items-center justify-between shadow-md z-10">
      <div className="flex items-center gap-3">
        {/* iMocha Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={iMochaLogo} 
            alt="iMocha Logo" 
            className="w-auto h-12 rounded-lg"
          />
          <div>
            <h1 className="font-bold text-xl text-orange-600 tracking-tight">Code Quality Tool</h1>
          </div>
        </div>
      </div>
      
      <nav className="flex items-center gap-4">
        {/* Overview Modal */}
        <Dialog open={overviewOpen} onOpenChange={setOverviewOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-foreground hover:text-white hover:bg-orange-500 font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              <Info className="w-4 h-4 mr-2" />
              Overview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Info className="w-6 h-6" />
                Code Quality Tool Overview
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-4">
                A comprehensive code analysis platform designed to help developers improve their code quality.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Key Features</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Cyclomatic Complexity Analysis</h4>
                      <p className="text-sm text-muted-foreground">Measures code complexity to identify areas that may be difficult to maintain.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Code Smells Detection</h4>
                      <p className="text-sm text-muted-foreground">Identifies potential issues and anti-patterns in your code.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">Performance Metrics</h4>
                      <p className="text-sm text-muted-foreground">Analyzes performance characteristics and suggests optimizations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-foreground">AI-Powered Recommendations</h4>
                      <p className="text-sm text-muted-foreground">Get intelligent suggestions for improving code quality and maintainability.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-3">Supported Languages</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'TypeScript'].map((lang) => (
                    <div key={lang} className="bg-muted px-3 py-1 rounded text-center text-sm font-medium text-foreground">
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* How to Use Modal */}
        <Dialog open={howToUseOpen} onOpenChange={setHowToUseOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-foreground hover:text-white hover:bg-orange-500 font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              How to Use?
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                How to Use Code Quality Tool
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-4">
                Follow these simple steps to analyze your code and improve its quality.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Select Programming Language</h4>
                    <p className="text-sm text-muted-foreground mt-1">Choose your programming language from the dropdown menu to get language-specific analysis.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Paste Your Code</h4>
                    <p className="text-sm text-muted-foreground mt-1">Copy and paste your code into the input area. The tool accepts complete functions, classes, or code snippets.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Click Analyze</h4>
                    <p className="text-sm text-muted-foreground mt-1">Press the "Analyze Code Quality" button to start the comprehensive analysis process.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Review Results</h4>
                    <p className="text-sm text-muted-foreground mt-1">Examine the detailed analysis results including complexity metrics, code smells, and improvement suggestions.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Apply Improvements</h4>
                    <p className="text-sm text-gray-600 mt-1">Use the AI-powered recommendations to refactor and improve your code quality.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Tips for Best Results:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Provide complete, compilable code snippets</li>
                  <li>• Include relevant context and dependencies</li>
                  <li>• Focus on one function or class at a time for detailed analysis</li>
                  <li>• Review all suggestions before implementing changes</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>
    </header>
  );
};

export default Header;
