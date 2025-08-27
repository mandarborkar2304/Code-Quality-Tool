import { useState } from "react";
import { Code2, Info, HelpCircle, X, Brain, TestTube, Zap, Shield, Palette, Smartphone } from "lucide-react";
import iMochaLogo from "../assets/imocha-logo-rbg.png";
import { ThemeToggle } from "./ThemeToggle";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
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
            className="w-auto h-16 rounded-lg dark:bg-white dark:p-1"
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Info className="w-6 h-6" />
                Code Quality Tool Overview
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-4">
                A comprehensive AI-powered code analysis platform designed to help developers improve their code quality, performance, and maintainability.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Core Features</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Brain className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">AI-Powered Code Analysis</h4>
                      <p className="text-sm text-muted-foreground">Comprehensive analysis of code structure, complexity, and quality using advanced AI algorithms.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Code2 className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Professional Monaco Editor</h4>
                      <p className="text-sm text-muted-foreground">Advanced code editing experience with IntelliSense, syntax highlighting, and real-time error detection.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <TestTube className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Intelligent Test Execution</h4>
                      <p className="text-sm text-muted-foreground">Execute provided test cases to validate your code against various scenarios.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Performance Insights</h4>
                      <p className="text-sm text-muted-foreground">Identify potential performance bottlenecks and get optimization recommendations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Security Analysis</h4>
                      <p className="text-sm text-muted-foreground">Detect common security vulnerabilities and get best practice recommendations.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Palette className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Theme Support</h4>
                      <p className="text-sm text-muted-foreground">Light and dark themes with automatic system preference detection.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <Smartphone className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">Responsive Design</h4>
                      <p className="text-sm text-muted-foreground">Optimized for desktop, tablet, and mobile devices with adaptive layouts.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-3">Supported Languages</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['Python', 'Java', 'JavaScript', 'TypeScript', 'C++', 'C', 'C#', 'Go', 'Shell', 'Plain Text'].map((lang) => (
                    <div key={lang} className="bg-muted px-3 py-1 rounded text-center text-sm font-medium text-foreground">
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-3">Recent Improvements</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Enhanced Monaco Editor integration with better height management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Conflict-free keyboard shortcuts for better productivity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Improved error visualization with detailed tooltips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Better responsive design and mobile experience</span>
                  </div>
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
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <HelpCircle className="w-6 h-6" />
                How to Use Code Quality Tool
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-4">
                Follow these simple steps to analyze your code and improve its quality using our advanced AI-powered platform.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Language Selection & Auto-Detection</h4>
                    <p className="text-sm text-muted-foreground mt-1">Choose your programming language from the dropdown or let our AI automatically detect it with confidence scoring.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Code Input & Editing</h4>
                    <p className="text-sm text-muted-foreground mt-1">Use the professional Monaco Editor to write, paste, or edit your code with real-time syntax highlighting and error detection.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Run Analysis</h4>
                    <p className="text-sm text-muted-foreground mt-1">Click "Analyze Code" or use <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+Enter</kbd> to start comprehensive AI-powered analysis.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Review Analysis Results</h4>
                    <p className="text-sm text-muted-foreground mt-1">Examine detailed analysis including quality scores, performance insights, security findings, and AI-powered improvement suggestions.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Run Tests</h4>
                    <p className="text-sm text-muted-foreground mt-1">Switch to the "Test Cases" tab to run provided tests and validate your code against various scenarios.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full font-bold text-sm">
                    6
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Apply Improvements</h4>
                    <p className="text-sm text-muted-foreground mt-1">Use the AI recommendations to refactor and improve your code quality, performance, and maintainability.</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Keyboard Shortcuts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+Enter</kbd> - Analyze Code</li>
                    <li>• <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+R</kbd> - Reset Editor</li>
                    <li>• <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+S</kbd> - Run Tests</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Tips for Best Results</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Write complete, compilable code for best analysis</li>
                    <li>• Use clear structure and meaningful names</li>
                    <li>• Let AI auto-detect your language</li>
                    <li>• Run analysis after each significant change</li>
                  </ul>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp />
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>
    </header>
  );
};

export default Header;
