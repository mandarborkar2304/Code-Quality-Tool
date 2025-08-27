import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Code, BarChart } from 'lucide-react';

interface ResponsiveLayoutProps {
  editor: React.ReactNode;
  analysis: React.ReactNode;
}

/**
 * Responsive layout component that adapts to screen size
 * On mobile, it shows either the editor or analysis panel with a toggle
 * On desktop, it shows both side by side
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ editor, analysis }) => {
  // Check if we're on a mobile device
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // State to track which panel is visible on mobile
  const [activePanel, setActivePanel] = useState<'editor' | 'analysis'>('editor');
  
  // Reset to editor view when switching between mobile and desktop
  useEffect(() => {
    if (!isMobile) {
      setActivePanel('editor');
    }
  }, [isMobile]);
  
  // If we're on desktop, show both panels side by side
  if (!isMobile) {
    return (
      <div className="flex flex-row h-full">
        <div className="flex-1 min-w-0">{editor}</div>
        <div className="w-[450px] border-l">{analysis}</div>
      </div>
    );
  }
  
  // On mobile, show either editor or analysis with a toggle
  return (
    <div className="flex flex-col h-full">
      {/* Mobile panel toggle */}
      <div className="flex items-center justify-center border-b p-2 bg-muted/30">
        <div className="flex rounded-md overflow-hidden">
          <Button
            variant={activePanel === 'editor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePanel('editor')}
            className="rounded-r-none flex items-center gap-1"
          >
            <Code className="h-4 w-4" />
            Editor
          </Button>
          <Button
            variant={activePanel === 'analysis' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActivePanel('analysis')}
            className="rounded-l-none flex items-center gap-1"
          >
            <BarChart className="h-4 w-4" />
            Analysis
          </Button>
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {activePanel === 'editor' ? (
          <div className="h-full">{editor}</div>
        ) : (
          <div className="h-full overflow-auto">{analysis}</div>
        )}
      </div>
      
      {/* Quick toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
        onClick={() => setActivePanel(activePanel === 'editor' ? 'analysis' : 'editor')}
      >
        {activePanel === 'editor' ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ResponsiveLayout;