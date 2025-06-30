# Code Quality Tool - Agent Instructions

## Commands
- **Build**: `npm run build` (production), `npm run build:dev` (development)
- **Lint**: `npm run lint` (ESLint check)
- **Dev**: `npm run dev` (development server with Vite)
- **Preview**: `npm run preview` (preview production build)

## Architecture
- **Frontend**: React 18 + TypeScript + Vite SPA
- **UI**: shadcn/ui components + Radix UI + Tailwind CSS with custom design system
- **Backend**: Netlify Functions (serverless) for AI analysis via Groq SDK
- **AI Integration**: Groq API for code analysis through secure server-side functions
- **State**: TanStack React Query for data fetching, React Router for navigation

## Code Style
- **Import paths**: Use `@/*` alias for src imports (configured in tsconfig.json)
- **Components**: Functional components with TypeScript, use shadcn/ui patterns
- **Error handling**: Try-catch with console.error, graceful fallbacks for AI analysis
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Types**: Strict interfaces for AI analysis results, optional chaining for safety
- **ESLint**: TypeScript-eslint with React hooks rules, unused vars disabled
