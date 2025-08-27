# Code Quality Tool

A comprehensive code analysis platform designed to help developers improve their code quality, performance, and maintainability. Built with modern web technologies and featuring an intuitive Monaco Editor integration.

## Features

### Core Functionality
- **Comprehensive Code Analysis**: Deep analysis of code structure, complexity, and quality using AI-powered insights
- **Real-time Syntax Checking**: Instant syntax validation across multiple programming languages with detailed error reporting
- **Intelligent Test Generation**: Automatic generation of comprehensive test cases based on code functionality
- **Performance Insights**: Identification of potential performance bottlenecks and optimization opportunities
- **Security Analysis**: Detection of common security vulnerabilities and best practice recommendations
- **AI-Powered Refactoring**: Smart suggestions for code improvements and refactoring opportunities

### Advanced Editor Features
- **Monaco Editor Integration**: Professional-grade code editing experience with IntelliSense, syntax highlighting, and error squiggles
- **Multi-language Support**: Support for Python, Java, JavaScript, TypeScript, C++, C, C#, Go, Shell, and more
- **Language Auto-Detection**: Intelligent detection of programming language with confidence scoring
- **Enhanced Error Visualization**: Rich error highlighting with hover tooltips and detailed error information
- **Responsive Layout**: Optimized for both desktop and mobile devices with adaptive panels

### User Experience
- **Modern UI Design**: Clean, intuitive interface with orange accent colors and professional styling
- **Keyboard Shortcuts**: Efficient workflow with conflict-free keyboard shortcuts
- **Theme Support**: Dark/Light mode support with automatic system preference detection
- **Real-time Feedback**: Immediate feedback on code quality and syntax issues
- **Toast Notifications**: User-friendly success and error messages

### Technical Features
- **API Caching**: Efficient caching system to reduce redundant API calls
- **Request Queue**: Smart request management to prevent rate limiting
- **Error Handling**: Robust error handling with user-friendly messages and recovery options
- **Context-based State Management**: Centralized state management for better performance
- **Responsive Design**: Mobile-first design with adaptive layouts

## Architecture

The application follows a modern React architecture with the following key components:

### Frontend
- **React 18**: Latest React features with hooks and modern patterns
- **TypeScript**: Type-safe JavaScript for better developer experience and code quality
- **Tailwind CSS**: Utility-first CSS framework for consistent and responsive styling
- **shadcn/ui**: High-quality component library for consistent UI elements
- **Monaco Editor**: Professional code editor with advanced features

### State Management
- **React Context API**: Context-based state management for global state
- **Custom Hooks**: Reusable logic encapsulated in custom hooks
- **Local State**: Component-level state management where appropriate

### API Integration
- **Fetch API**: Modern API for making HTTP requests
- **Request Queue**: Queue system for managing API requests and preventing conflicts
- **Caching Layer**: TTL-based cache for API responses to improve performance

### Error Handling
- **Typed Errors**: Custom error types for different error categories
- **Error Boundaries**: React error boundaries for graceful error handling
- **Toast Notifications**: User-friendly error messages with actionable information

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd code-quality-tool
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Basic Usage
1. **Language Selection**: Choose your programming language from the dropdown or let the tool auto-detect it
2. **Code Input**: Enter or paste your code in the Monaco Editor
3. **Analysis**: Click "Analyze Code" to get comprehensive AI-powered analysis
4. **Review Results**: Examine the analysis results and apply suggested improvements
5. **Test Generation**: Generate and run test cases to validate your code

### Advanced Features
- **Syntax Checking**: Real-time syntax validation with detailed error reporting
- **Test Cases**: Switch to the "Test Cases" tab to generate and manage test scenarios
- **Error Navigation**: Click on syntax errors to jump directly to the problematic line
- **Theme Switching**: Toggle between light and dark themes using the theme switcher

### Keyboard Shortcuts
- **Ctrl+Shift+Enter / Cmd+Shift+Enter**: Analyze code (conflict-free)
- **Ctrl+Shift+R / Cmd+Shift+R**: Reset editor (conflict-free)
- **Ctrl+Shift+S / Cmd+Shift+S**: Run test cases (when in test cases tab)

### Mobile Usage
On mobile devices, the interface automatically adapts with:
- Responsive panels that stack vertically
- Touch-friendly controls and buttons
- Optimized layouts for small screens

## Project Structure

```
code-quality-tool/
├── public/                  # Static assets and images
├── src/
│   ├── assets/              # Images, logos, and other assets
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base UI components (shadcn/ui)
│   │   ├── MonacoCodeEditor/ # Monaco Editor integration
│   │   ├── SimpleCodeEditor/ # Editor wrapper component
│   │   └── ...              # Feature-specific components
│   ├── context/             # React context providers
│   ├── data/                # Static data and configurations
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries and helpers
│   ├── pages/               # Page components and API routes
│   │   └── api/             # API route handlers
│   ├── styles/              # Global styles and CSS
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions and helpers
├── .env                     # Environment variables
├── vite.config.ts           # Vite configuration
├── package.json             # Project dependencies
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Key Components

### Editor Components
- **MonacoCodeEditor**: Direct integration with Monaco Editor with advanced features
- **SimpleCodeEditor**: Wrapper component with additional functionality
- **LanguageSelector**: Language selection with auto-detection capabilities
- **ResponsiveLayout**: Adaptive layout for different screen sizes

### Analysis Components
- **AnalysisPanel**: Displays comprehensive code analysis results
- **CodeAnalysisDisplay**: Visualizes different aspects of code analysis
- **TestCaseDisplay**: Manages and displays test cases
- **SyntaxErrorDisplay**: Shows syntax errors with navigation capabilities

### Context Providers
- **EditorContext**: Manages editor state, code, and analysis results
- **ThemeProvider**: Handles theme switching and system preferences

### Utility Functions
- **apiUtils**: API request handling and management
- **apiCache**: Intelligent caching system for API responses
- **errorHandling**: Comprehensive error handling utilities
- **languageDetection**: Advanced language detection algorithms

## Recent Updates

### Latest Features
- **Enhanced Monaco Editor**: Improved container height management and spacing
- **Conflict-Free Shortcuts**: Updated keyboard shortcuts to avoid browser conflicts
- **Better Error Visualization**: Rich error highlighting with detailed tooltips
- **Improved Layout**: Fixed container borders and height constraints
- **Mobile Optimization**: Better responsive design and mobile experience

### Technical Improvements
- **Container Height Fixes**: Resolved Monaco Editor height and spacing issues
- **CSS Optimization**: Cleaner, more efficient CSS with better specificity
- **Layout Improvements**: Enhanced flexbox layout for better content distribution
- **Border Styling**: Improved container borders with proper orange accent colors

## Deployment

The application is ready for deployment on various platforms:

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Technologies Used

This project is built with cutting-edge technologies:

- **Vite**: Fast build tool and development server
- **React 18**: Latest React features and patterns
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Monaco Editor**: Professional code editing experience
- **Next-themes**: Theme management and switching

## Contributing

We welcome contributions! Please see our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
