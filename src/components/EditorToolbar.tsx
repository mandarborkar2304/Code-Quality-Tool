import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Code,
  RefreshCw,
  Play,
  Brain,
  AlertCircle,
  Loader2,
  Save,
  FileCode,
  FilePlus,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
  tooltip?: string;
  shortcut?: string;
}

interface EditorToolbarProps {
  actions: ToolbarAction[];
  className?: string;
  rightContent?: React.ReactNode;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  actions,
  className,
  rightContent
}) => {
  return (
    <div className={cn('flex items-center justify-between p-2 border-b', className)}>
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          {actions.map((action) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn('gap-1', action.className)}
                >
                  {action.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    action.icon
                  )}
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{action.tooltip || action.label}</p>
                {action.shortcut && (
                  <p className="text-xs text-muted-foreground mt-1">{action.shortcut}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      {rightContent && <div className="flex items-center">{rightContent}</div>}
    </div>
  );
};

// Predefined actions for common editor operations
export const createResetAction = (onReset: () => void, isDisabled = false): ToolbarAction => ({
  id: 'reset',
  label: 'Reset',
  icon: <RefreshCw className="h-4 w-4" />,
  onClick: onReset,
  disabled: isDisabled,
  variant: 'outline',
  tooltip: 'Reset code to default',
  shortcut: 'Ctrl+R'
});

export const createAnalyzeAction = (
  onAnalyze: () => void,
  isAnalyzing = false
): ToolbarAction => ({
  id: 'analyze',
  label: isAnalyzing ? 'Analyzing...' : 'Analyze Code',
  icon: <Code className="h-4 w-4" />,
  onClick: onAnalyze,
  disabled: isAnalyzing,
  loading: isAnalyzing,
  variant: 'default',
  className: 'bg-primary',
  tooltip: 'Analyze code for quality and issues',
  shortcut: 'Ctrl+Shift+A'
});

export const createSyntaxCheckAction = (
  onSyntaxCheck: () => void,
  isChecking = false
): ToolbarAction => ({
  id: 'syntax-check',
  label: isChecking ? 'Checking...' : 'Check Syntax',
  icon: <CheckCircle2 className="h-4 w-4" />,
  onClick: onSyntaxCheck,
  disabled: isChecking,
  loading: isChecking,
  variant: 'outline',
  tooltip: 'Check code for syntax errors',
  shortcut: 'Ctrl+S'
});

export const createGenerateTestsAction = (
  onGenerateTests: () => void,
  isGenerating = false
): ToolbarAction => ({
  id: 'generate-tests',
  label: isGenerating ? 'Generating...' : 'Generate Tests',
  icon: <Brain className="h-4 w-4" />,
  onClick: onGenerateTests,
  disabled: isGenerating,
  loading: isGenerating,
  variant: 'outline',
  tooltip: 'Generate intelligent test cases',
  shortcut: 'Ctrl+G'
});

export const createRunTestsAction = (
  onRunTests: () => void,
  isRunning = false,
  disabled = false
): ToolbarAction => ({
  id: 'run-tests',
  label: isRunning ? 'Running...' : 'Run Tests',
  icon: <Play className="h-4 w-4" />,
  onClick: onRunTests,
  disabled: isRunning || disabled,
  loading: isRunning,
  variant: 'outline',
  tooltip: 'Execute all test cases',
  shortcut: 'Ctrl+T'
});

export const createAddFileAction = (onAddFile: () => void): ToolbarAction => ({
  id: 'add-file',
  label: 'Add File',
  icon: <FilePlus className="h-4 w-4" />,
  onClick: onAddFile,
  variant: 'outline',
  tooltip: 'Add a new code file',
  shortcut: 'Ctrl+N'
});

export const createRemoveFileAction = (
  onRemoveFile: () => void,
  isDisabled = false
): ToolbarAction => ({
  id: 'remove-file',
  label: 'Remove File',
  icon: <FileCode className="h-4 w-4" />,
  onClick: onRemoveFile,
  disabled: isDisabled,
  variant: 'outline',
  tooltip: 'Remove current code file',
  shortcut: 'Ctrl+Shift+D'
});