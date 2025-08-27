import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

import VantaBackground from "@/components/VantaBackground";
import Editor from "./pages/Editor";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        {/* Vanta animated background for the whole app */}
        <VantaBackground effect="DOTS" />
        {/* Main app content above Vanta background, wrapped in error boundary */}
        <ErrorBoundary>
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
            <Editor />
            <Toaster />
            <Sonner />
          </div>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
