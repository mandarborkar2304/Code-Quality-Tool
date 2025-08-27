# Code Quality Tool Information

## Summary
A web-based code quality analysis tool built with React and TypeScript. The application provides real-time syntax analysis, complexity metrics, and AI-powered recommendations for code improvements. It uses GROQ API for AI analysis and is deployed on Netlify with serverless functions.

## Structure
- **src/**: Main application source code containing React components, utilities, and pages
- **netlify/**: Serverless functions for backend processing using GROQ API
- **public/**: Static assets for the web application
- **docs/**: Documentation files describing architecture and features
- **.vscode/**: VS Code configuration files
- **.zencoder/**: Project metadata and documentation

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.5.3
**Build System**: Vite 5.4.1
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **React**: v18.3.1 - UI framework
- **Monaco Editor**: v4.7.0 - Code editor component
- **GROQ SDK**: v0.25.0 - AI model integration
- **Radix UI**: Various UI component primitives
- **TanStack Query**: v5.56.2 - Data fetching library
- **Tailwind CSS**: v3.4.11 - Utility-first CSS framework
- **React Router**: v6.26.2 - Client-side routing

**Development Dependencies**:
- **ESLint**: v9.9.0 - Code linting
- **SWC**: Via @vitejs/plugin-react-swc - Fast compilation
- **TypeScript ESLint**: v8.0.1 - TypeScript linting
- **Lovable Tagger**: v1.1.7 - Component tagging for development

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Netlify Deployment
**Configuration**: netlify.toml
**Build Command**: npm run build
**Publish Directory**: dist
**Functions Directory**: netlify/functions

## Serverless Functions
**Framework**: Netlify Functions
**API Integration**: GROQ AI models
**Main Functions**:
- Code syntax analysis
- Complexity analysis
- Test generation
- Comprehensive code analysis
- Improvement suggestions

## Main Components
**Entry Point**: src/main.tsx
**Core Components**:
- **CodeEditor**: Monaco-based code editor
- **AnalysisPanel**: Displays code analysis results
- **AIRecommendations**: Shows AI-generated suggestions
- **ComplexityDisplay**: Visualizes code complexity metrics
- **SyntaxErrorsDisplay**: Shows syntax errors in real-time

## Testing
**Target Framework**: Playwright
The project uses Playwright for end-to-end testing of the web application. Tests focus on:
- Code editor functionality and syntax highlighting
- Error display and tooltip behavior
- Test case generation and execution
- UI responsiveness and button interactions
- Analysis panel functionality

**Testing Strategy**:
- Manual testing for development workflow
- Built-in validation via TypeScript and ESLint
- E2E tests for critical user flows
- Real-time syntax analysis validation