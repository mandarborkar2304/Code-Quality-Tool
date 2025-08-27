import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

/**
 * Keyboard shortcuts help dialog
 */
const KeyboardShortcutsHelp: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-foreground hover:text-white hover:bg-orange-500 font-semibold px-4 py-2 rounded-lg transition-all duration-200"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            <Keyboard className="w-6 h-6" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-4">
            Use these keyboard shortcuts to work more efficiently with the Code Quality Tool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Primary Actions</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['Ctrl', 'Shift', 'Enter']} description="Analyze Code" />
                <ShortcutItem keys={['Ctrl', 'Shift', 'R']} description="Reset Editor" />
                <ShortcutItem keys={['Ctrl', 'Shift', 'S']} description="Run Test Cases" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Monaco Editor</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['Ctrl', 'F']} description="Find" />
                <ShortcutItem keys={['Ctrl', 'H']} description="Replace" />
                <ShortcutItem keys={['Ctrl', 'G']} description="Go to Line" />
                <ShortcutItem keys={['Ctrl', '/']} description="Toggle Comment" />
                <ShortcutItem keys={['Ctrl', 'Z']} description="Undo" />
                <ShortcutItem keys={['Ctrl', 'Y']} description="Redo" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Navigation</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['↑', '↓', '←', '→']} description="Move Cursor" />
                <ShortcutItem keys={['Home', 'End']} description="Line Start/End" />
                <ShortcutItem keys={['Ctrl', 'Home']} description="File Start" />
                <ShortcutItem keys={['Ctrl', 'End']} description="File End" />
                <ShortcutItem keys={['Page Up', 'Page Down']} description="Page Navigation" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Selection & Editing</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['Ctrl', 'A']} description="Select All" />
                <ShortcutItem keys={['Ctrl', 'C']} description="Copy" />
                <ShortcutItem keys={['Ctrl', 'X']} description="Cut" />
                <ShortcutItem keys={['Ctrl', 'V']} description="Paste" />
                <ShortcutItem keys={['Tab', 'Shift+Tab']} description="Indent/Outdent" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Code Folding</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['Ctrl', 'Shift', '[']} description="Fold Region" />
                <ShortcutItem keys={['Ctrl', 'Shift', ']']} description="Unfold Region" />
                <ShortcutItem keys={['Ctrl', 'K', 'Ctrl', '0']} description="Fold All" />
                <ShortcutItem keys={['Ctrl', 'K', 'Ctrl', 'J']} description="Unfold All" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-orange-200 pb-2">Multi-Cursor</h3>
              <div className="space-y-3">
                <ShortcutItem keys={['Alt', 'Click']} description="Add Cursor" />
                <ShortcutItem keys={['Ctrl', 'Alt', '↑']} description="Cursor Above" />
                <ShortcutItem keys={['Ctrl', 'Alt', '↓']} description="Cursor Below" />
                <ShortcutItem keys={['Ctrl', 'D']} description="Select Next Occurrence" />
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Important Notes</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>Conflict-Free Design:</strong> All shortcuts use <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Shift</kbd> modifier to avoid browser conflicts</p>
              <p>• <strong>Mac Users:</strong> Use <kbd className="px-1 py-0.5 rounded bg-muted text-xs">⌘</kbd> (Command) instead of <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd></p>
              <p>• <strong>Mobile:</strong> Some shortcuts may not work on mobile devices - use touch-friendly buttons instead</p>
              <p>• <strong>Focus Required:</strong> Ensure the editor has focus for shortcuts to work properly</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Productivity Tips</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Learn the primary shortcuts first: <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+Enter</kbd>, <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl+Shift+R</kbd></p>
              <p>• Use shortcuts in combination for complex operations</p>
              <p>• Practice shortcuts in small coding sessions to build muscle memory</p>
              <p>• Customize your workflow by combining multiple shortcuts</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

/**
 * Individual keyboard shortcut item
 */
const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            <kbd className="px-2 py-1 rounded bg-muted text-xs font-medium border border-border">{key}</kbd>
            {index < keys.length - 1 && <span className="text-muted-foreground">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;