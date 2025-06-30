// Production-level code analysis utilities
// Comprehensive language support and issue detection

export interface ProductionLanguage {
  id: string;
  name: string;
  version?: string;
  framework?: string;
  category: 'system' | 'web' | 'mobile' | 'data' | 'functional' | 'scripting';
  fileExtensions: string[];
  commonFrameworks: string[];
  vulnerabilityPatterns: RegExp[];
  performancePatterns: RegExp[];
  maintainabilityPatterns: RegExp[];
  securityRisks: string[];
}

export const PRODUCTION_LANGUAGES: ProductionLanguage[] = [
  // JavaScript/TypeScript Ecosystem
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'web',
    fileExtensions: ['.js', '.mjs', '.cjs'],
    commonFrameworks: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Nuxt.js'],
    vulnerabilityPatterns: [
      /eval\s*\(/g,
      /innerHTML\s*=/g,
      /document\.write\s*\(/g,
      /setTimeout\s*\(\s*["'].*["']/g,
      /setInterval\s*\(\s*["'].*["']/g,
      /new\s+Function\s*\(/g,
      /\.dangerouslySetInnerHTML/g,
    ],
    performancePatterns: [
      /for\s*\(\s*var\s+\w+\s*=\s*0\s*;.*\.length\s*;/g, // Array.length in loop condition
      /\$\(\s*["'].*["']\s*\)\.each/g, // jQuery each loops
      /document\.getElementById.*in.*for/g, // DOM queries in loops
      /JSON\.parse.*in.*for/g, // JSON parsing in loops
    ],
    maintainabilityPatterns: [
      /function.*\{[\s\S]{500,}/g, // Large functions
      /if\s*\(.*\)\s*\{[\s\S]*if\s*\(.*\)\s*\{[\s\S]*if\s*\(/g, // Deep nesting
      /var\s+\w+\s*=\s*function/g, // Function declarations with var
    ],
    securityRisks: ['XSS', 'Prototype Pollution', 'Code Injection', 'CSRF', 'Insecure Deserialization']
  },
  
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'web',
    fileExtensions: ['.ts', '.tsx'],
    commonFrameworks: ['React', 'Angular', 'Vue', 'Node.js', 'NestJS', 'Next.js'],
    vulnerabilityPatterns: [
      /any\[\]/g, // Unsafe any type usage
      /as\s+any/g, // Type assertions to any
      /@ts-ignore/g, // Suppressing TypeScript errors
      /eval\s*\(/g,
      /innerHTML\s*=/g,
    ],
    performancePatterns: [
      /interface.*extends.*extends.*extends/g, // Deep interface inheritance
      /type.*=.*&.*&.*&/g, // Complex intersection types
    ],
    maintainabilityPatterns: [
      /interface\s+\w+\s*\{[\s\S]{200,}\}/g, // Large interfaces
      /class.*\{[\s\S]{800,}\}/g, // Large classes
    ],
    securityRisks: ['Type Confusion', 'XSS', 'Prototype Pollution', 'Unsafe Type Assertions']
  },

  // Python Ecosystem
  {
    id: 'python',
    name: 'Python',
    category: 'data',
    fileExtensions: ['.py', '.pyx', '.pyw'],
    commonFrameworks: ['Django', 'Flask', 'FastAPI', 'NumPy', 'Pandas', 'TensorFlow', 'PyTorch'],
    vulnerabilityPatterns: [
      /eval\s*\(/g,
      /exec\s*\(/g,
      /input\s*\(/g, // Python 2 input()
      /pickle\.loads?\s*\(/g,
      /yaml\.load\s*\(/g,
      /subprocess\.call.*shell\s*=\s*True/g,
      /os\.system\s*\(/g,
    ],
    performancePatterns: [
      /for\s+\w+\s+in\s+range\s*\(\s*len\s*\(/g, // Using range(len()) instead of enumerate
      /\+\s*=.*str/g, // String concatenation in loops
      /\.append\s*\(.*\)\s*$.*for.*in/gm, // List comprehension vs append
    ],
    maintainabilityPatterns: [
      /def\s+\w+\s*\([^)]*\):\s*[\s\S]{300,}(?=def|\Z)/g, // Large functions
      /class.*:\s*[\s\S]{1000,}(?=class|\Z)/g, // Large classes
      /if.*elif.*elif.*elif/g, // Long elif chains
    ],
    securityRisks: ['Code Injection', 'Deserialization', 'Path Traversal', 'SQL Injection', 'LDAP Injection']
  },

  // Java Ecosystem
  {
    id: 'java',
    name: 'Java',
    category: 'system',
    fileExtensions: ['.java'],
    commonFrameworks: ['Spring', 'Spring Boot', 'Hibernate', 'Maven', 'Gradle', 'Android SDK'],
    vulnerabilityPatterns: [
      /Runtime\.getRuntime\(\)\.exec/g,
      /ProcessBuilder.*start\(\)/g,
      /Class\.forName/g,
      /ObjectInputStream/g,
      /ScriptEngineManager/g,
      /Cipher\.getInstance\s*\(\s*"[^"]*ECB/g, // ECB mode encryption
    ],
    performancePatterns: [
      /new\s+String\s*\(/g, // Unnecessary String constructor
      /\+.*String.*\+.*in.*for/g, // String concatenation in loops
      /Vector\s*</g, // Using Vector instead of ArrayList
      /Hashtable\s*</g, // Using Hashtable instead of HashMap
    ],
    maintainabilityPatterns: [
      /public\s+.*\{[\s\S]{500,}^\s*\}/gm, // Large methods
      /class.*\{[\s\S]{2000,}^\}/gm, // Large classes
      /catch\s*\([^)]*\)\s*\{\s*\}/g, // Empty catch blocks
    ],
    securityRisks: ['Deserialization', 'XML External Entity', 'SQL Injection', 'LDAP Injection', 'Expression Language Injection']
  },

  // C# Ecosystem
  {
    id: 'csharp',
    name: 'C#',
    category: 'system',
    fileExtensions: ['.cs'],
    commonFrameworks: ['.NET', 'ASP.NET', 'Entity Framework', 'Xamarin', 'Unity', 'Blazor'],
    vulnerabilityPatterns: [
      /Process\.Start/g,
      /Assembly\.Load/g,
      /Type\.GetType/g,
      /BinaryFormatter/g,
      /XmlDocument\.Load/g,
      /SqlCommand.*\+/g, // SQL concatenation
    ],
    performancePatterns: [
      /new\s+List<.*>\(\).*Add.*in.*for/g, // List.Add in loops without capacity
      /string.*\+.*\+.*in.*for/g, // String concatenation in loops
      /foreach.*\.ToList\(\)/g, // Unnecessary ToList() calls
    ],
    maintainabilityPatterns: [
      /public.*\{[\s\S]{400,}^\s*\}/gm, // Large methods
      /class.*\{[\s\S]{1500,}^\}/gm, // Large classes
      /catch\s*\([^)]*\)\s*\{\s*\}/g, // Empty catch blocks
    ],
    securityRisks: ['Deserialization', 'XML External Entity', 'LDAP Injection', 'Command Injection', 'Path Traversal']
  },

  // Go
  {
    id: 'go',
    name: 'Go',
    category: 'system',
    fileExtensions: ['.go'],
    commonFrameworks: ['Gin', 'Echo', 'Fiber', 'Kubernetes', 'Docker', 'gRPC'],
    vulnerabilityPatterns: [
      /exec\.Command/g,
      /os\/exec/g,
      /unsafe\./g,
      /sql\.[^P].*\+/g, // SQL concatenation without prepared statements
    ],
    performancePatterns: [
      /for.*range.*{[\s\S]*append/g, // Append in range loop without preallocation
      /make\s*\(\s*\[\]/g, // Slice without capacity
    ],
    maintainabilityPatterns: [
      /func.*\{[\s\S]{300,}^\}/gm, // Large functions
      /if.*{[\s\S]*if.*{[\s\S]*if.*{/g, // Deep nesting
    ],
    securityRisks: ['Command Injection', 'Path Traversal', 'Memory Safety', 'Race Conditions']
  },

  // Rust
  {
    id: 'rust',
    name: 'Rust',
    category: 'system',
    fileExtensions: ['.rs'],
    commonFrameworks: ['Tokio', 'Actix', 'Rocket', 'Serde', 'Diesel'],
    vulnerabilityPatterns: [
      /unsafe\s*\{/g,
      /std::process::Command/g,
      /transmute/g,
    ],
    performancePatterns: [
      /\.clone\(\).*in.*for/g, // Unnecessary cloning in loops
      /String::from.*\+/g, // String concatenation instead of format!
    ],
    maintainabilityPatterns: [
      /fn.*\{[\s\S]{400,}^\}/gm, // Large functions
      /impl.*\{[\s\S]{800,}^\}/gm, // Large impl blocks
    ],
    securityRisks: ['Memory Safety (in unsafe blocks)', 'Integer Overflow', 'Panic in Production']
  },

  // PHP
  {
    id: 'php',
    name: 'PHP',
    category: 'web',
    fileExtensions: ['.php', '.phtml'],
    commonFrameworks: ['Laravel', 'Symfony', 'CodeIgniter', 'WordPress', 'Drupal'],
    vulnerabilityPatterns: [
      /eval\s*\(/g,
      /exec\s*\(/g,
      /system\s*\(/g,
      /shell_exec\s*\(/g,
      /\$_GET.*echo/g,
      /\$_POST.*echo/g,
      /mysql_query.*\$_/g, // Direct SQL with user input
      /serialize.*unserialize/g,
    ],
    performancePatterns: [
      /foreach.*\$_GET/g,
      /foreach.*\$_POST/g,
      /mysql_query.*in.*for/g, // Database queries in loops
    ],
    maintainabilityPatterns: [
      /function.*\{[\s\S]{400,}^\}/gm, // Large functions
      /class.*\{[\s\S]{1000,}^\}/gm, // Large classes
      /global\s+\$/g, // Global variables
    ],
    securityRisks: ['SQL Injection', 'XSS', 'File Inclusion', 'Command Injection', 'Deserialization']
  },

  // Ruby
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'web',
    fileExtensions: ['.rb'],
    commonFrameworks: ['Rails', 'Sinatra', 'Hanami', 'Grape'],
    vulnerabilityPatterns: [
      /eval\s*\(/g,
      /system\s*\(/g,
      /`.*\#\{/g, // Command injection through string interpolation
      /Marshal\.load/g,
      /YAML\.load/g,
    ],
    performancePatterns: [
      /\.each.*\.each/g, // Nested each loops
      /\[.*\]\.each/g, // Array creation for single iteration
    ],
    maintainabilityPatterns: [
      /def.*[\s\S]{300,}^end/gm, // Large methods
      /class.*[\s\S]{1000,}^end/gm, // Large classes
    ],
    securityRisks: ['Command Injection', 'Deserialization', 'Mass Assignment', 'SQL Injection']
  },

  // Swift
  {
    id: 'swift',
    name: 'Swift',
    category: 'mobile',
    fileExtensions: ['.swift'],
    commonFrameworks: ['SwiftUI', 'UIKit', 'Vapor', 'Perfect'],
    vulnerabilityPatterns: [
      /NSString.*cString/g,
      /UnsafeMutablePointer/g,
      /force.*unwrap.*!/g,
    ],
    performancePatterns: [
      /\+.*String.*\+.*in.*for/g, // String concatenation in loops
      /\.count.*in.*for/g, // Array count in loop condition
    ],
    maintainabilityPatterns: [
      /func.*\{[\s\S]{300,}^\}/gm, // Large functions
      /class.*\{[\s\S]{800,}^\}/gm, // Large classes
    ],
    securityRisks: ['Memory Safety', 'Integer Overflow', 'Force Unwrapping', 'Keychain Security']
  },

  // Kotlin
  {
    id: 'kotlin',
    name: 'Kotlin',
    category: 'mobile',
    fileExtensions: ['.kt', '.kts'],
    commonFrameworks: ['Android SDK', 'Spring Boot', 'Ktor'],
    vulnerabilityPatterns: [
      /Runtime\.getRuntime\(\)\.exec/g,
      /Class\.forName/g,
      /!!.*nullable/g, // Force non-null assertion
    ],
    performancePatterns: [
      /\+.*String.*\+.*in.*for/g, // String concatenation in loops
      /listOf.*\.add/g, // Immutable list with add operations
    ],
    maintainabilityPatterns: [
      /fun.*\{[\s\S]{300,}^\}/gm, // Large functions
      /class.*\{[\s\S]{800,}^\}/gm, // Large classes
    ],
    securityRisks: ['Null Pointer Exception', 'SQL Injection', 'Android Security', 'Deserialization']
  },

  // C/C++
  {
    id: 'cpp',
    name: 'C++',
    category: 'system',
    fileExtensions: ['.cpp', '.cc', '.cxx', '.c'],
    commonFrameworks: ['Qt', 'Boost', 'STL', 'OpenCV'],
    vulnerabilityPatterns: [
      /gets\s*\(/g,
      /strcpy\s*\(/g,
      /strcat\s*\(/g,
      /sprintf\s*\(/g,
      /system\s*\(/g,
      /malloc.*free/g, // Manual memory management
    ],
    performancePatterns: [
      /std::endl/g, // Using endl instead of \n
      /new.*delete.*in.*for/g, // Dynamic allocation in loops
    ],
    maintainabilityPatterns: [
      /\{[\s\S]{500,}^\}/gm, // Large functions
      /class.*\{[\s\S]{1000,}^\}/gm, // Large classes
    ],
    securityRisks: ['Buffer Overflow', 'Memory Leaks', 'Use After Free', 'Integer Overflow', 'Format String']
  }
];

export interface ProductionIssueType {
  category: 'security' | 'performance' | 'maintainability' | 'reliability' | 'scalability' | 'architecture';
  subcategory: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  description: string;
  impact: string;
  remediation: string;
  cweId?: string; // Common Weakness Enumeration ID
  owaspCategory?: string; // OWASP Top 10 category
}

export const PRODUCTION_ISSUE_TYPES: { [key: string]: ProductionIssueType } = {
  // Security Issues
  'sql-injection': {
    category: 'security',
    subcategory: 'Injection Flaws',
    severity: 'critical',
    description: 'SQL queries constructed with user input without proper sanitization',
    impact: 'Complete database compromise, data theft, data manipulation',
    remediation: 'Use parameterized queries or prepared statements',
    cweId: 'CWE-89',
    owaspCategory: 'A03:2021 - Injection'
  },
  
  'xss-vulnerability': {
    category: 'security',
    subcategory: 'Cross-Site Scripting',
    severity: 'major',
    description: 'User input rendered without proper escaping',
    impact: 'Session hijacking, credential theft, malicious code execution',
    remediation: 'Implement proper input validation and output encoding',
    cweId: 'CWE-79',
    owaspCategory: 'A03:2021 - Injection'
  },

  'insecure-deserialization': {
    category: 'security',
    subcategory: 'Deserialization',
    severity: 'critical',
    description: 'Unsafe deserialization of untrusted data',
    impact: 'Remote code execution, privilege escalation',
    remediation: 'Avoid deserializing untrusted data, use safe serialization formats',
    cweId: 'CWE-502',
    owaspCategory: 'A08:2021 - Software and Data Integrity Failures'
  },

  // Performance Issues
  'n-plus-one-query': {
    category: 'performance',
    subcategory: 'Database Performance',
    severity: 'major',
    description: 'Database queries executed in loops causing performance degradation',
    impact: 'Poor application performance, increased server load',
    remediation: 'Use eager loading, batch queries, or caching strategies'
  },

  'memory-leak': {
    category: 'performance',
    subcategory: 'Memory Management',
    severity: 'major',
    description: 'Objects not properly released from memory',
    impact: 'Application crashes, degraded performance, resource exhaustion',
    remediation: 'Implement proper cleanup, use weak references, monitor memory usage'
  },

  'inefficient-algorithm': {
    category: 'performance',
    subcategory: 'Algorithm Efficiency',
    severity: 'major',
    description: 'Algorithm with suboptimal time or space complexity',
    impact: 'Poor scalability, increased processing time',
    remediation: 'Optimize algorithm, use appropriate data structures'
  },

  // Maintainability Issues
  'code-duplication': {
    category: 'maintainability',
    subcategory: 'Code Quality',
    severity: 'minor',
    description: 'Duplicated code blocks that should be refactored',
    impact: 'Increased maintenance burden, higher chance of bugs',
    remediation: 'Extract common functionality into reusable functions or classes'
  },

  'high-complexity': {
    category: 'maintainability',
    subcategory: 'Complexity',
    severity: 'major',
    description: 'Functions or classes with high cyclomatic complexity',
    impact: 'Difficult to understand, test, and maintain',
    remediation: 'Break down into smaller, focused functions'
  },

  'tight-coupling': {
    category: 'maintainability',
    subcategory: 'Architecture',
    severity: 'major',
    description: 'Components with high interdependence',
    impact: 'Difficult to modify, test, and reuse components',
    remediation: 'Implement dependency injection, use interfaces'
  },

  // Reliability Issues
  'error-handling-missing': {
    category: 'reliability',
    subcategory: 'Error Handling',
    severity: 'major',
    description: 'Missing or inadequate error handling',
    impact: 'Application crashes, poor user experience, data loss',
    remediation: 'Implement comprehensive error handling and logging'
  },

  'race-condition': {
    category: 'reliability',
    subcategory: 'Concurrency',
    severity: 'major',
    description: 'Potential race conditions in concurrent code',
    impact: 'Data corruption, inconsistent state, unpredictable behavior',
    remediation: 'Use proper synchronization mechanisms'
  },

  'resource-leak': {
    category: 'reliability',
    subcategory: 'Resource Management',
    severity: 'major',
    description: 'Resources not properly closed or released',
    impact: 'Resource exhaustion, application instability',
    remediation: 'Use try-with-resources, proper cleanup patterns'
  },

  // Scalability Issues
  'blocking-operation': {
    category: 'scalability',
    subcategory: 'Async/Concurrent Programming',
    severity: 'major',
    description: 'Blocking operations that prevent scalability',
    impact: 'Poor concurrent performance, thread starvation',
    remediation: 'Use asynchronous programming patterns'
  },

  'inefficient-caching': {
    category: 'scalability',
    subcategory: 'Caching',
    severity: 'minor',
    description: 'Missing or inefficient caching strategies',
    impact: 'Increased load on backend systems, poor response times',
    remediation: 'Implement appropriate caching strategies'
  },

  // Architecture Issues
  'monolithic-design': {
    category: 'architecture',
    subcategory: 'System Design',
    severity: 'minor',
    description: 'Monolithic architecture that could benefit from modularization',
    impact: 'Difficult to scale, deploy, and maintain',
    remediation: 'Consider microservices or modular architecture'
  },

  'missing-monitoring': {
    category: 'architecture',
    subcategory: 'Observability',
    severity: 'minor',
    description: 'Insufficient logging and monitoring',
    impact: 'Difficult to debug and monitor production issues',
    remediation: 'Implement comprehensive logging, metrics, and monitoring'
  }
};

// Language-based issue detection
export class ProductionAnalyzer {
  static detectIssues(code: string, language: string): Array<{
    type: string;
    line?: number;
    snippet: string;
    suggestion: string;
    severity: string;
  }> {
    const lang = PRODUCTION_LANGUAGES.find(l => l.id === language);
    if (!lang) return [];

    const issues: Array<{
      type: string;
      line?: number;
      snippet: string;
      suggestion: string;
      severity: string;
    }> = [];

    const lines = code.split('\n');

    // Security vulnerability detection
    lang.vulnerabilityPatterns.forEach((pattern, index) => {
      lines.forEach((line, lineIndex) => {
        if (pattern.test(line)) {
          const issueType = this.getSecurityIssueType(pattern, language);
          issues.push({
            type: issueType,
            line: lineIndex + 1,
            snippet: line.trim(),
            suggestion: this.getSecuritySuggestion(issueType, language),
            severity: 'critical'
          });
        }
      });
    });

    // Performance issue detection
    lang.performancePatterns.forEach((pattern, index) => {
      lines.forEach((line, lineIndex) => {
        if (pattern.test(line)) {
          const issueType = this.getPerformanceIssueType(pattern, language);
          issues.push({
            type: issueType,
            line: lineIndex + 1,
            snippet: line.trim(),
            suggestion: this.getPerformanceSuggestion(issueType, language),
            severity: 'major'
          });
        }
      });
    });

    // Maintainability issue detection
    lang.maintainabilityPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const issueType = this.getMaintainabilityIssueType(pattern, language);
          issues.push({
            type: issueType,
            snippet: match.substring(0, 100) + '...',
            suggestion: this.getMaintainabilitySuggestion(issueType, language),
            severity: 'minor'
          });
        });
      }
    });

    return issues;
  }

  private static getSecurityIssueType(pattern: RegExp, language: string): string {
    const patternStr = pattern.source;
    
    if (patternStr.includes('eval') || patternStr.includes('exec')) return 'code-injection';
    if (patternStr.includes('innerHTML') || patternStr.includes('write')) return 'xss-vulnerability';
    if (patternStr.includes('sql') || patternStr.includes('query')) return 'sql-injection';
    if (patternStr.includes('pickle') || patternStr.includes('serialize')) return 'insecure-deserialization';
    if (patternStr.includes('system') || patternStr.includes('Command')) return 'command-injection';
    
    return 'security-vulnerability';
  }

  private static getPerformanceIssueType(pattern: RegExp, language: string): string {
    const patternStr = pattern.source;
    
    if (patternStr.includes('length') || patternStr.includes('count')) return 'inefficient-loop';
    if (patternStr.includes('query') || patternStr.includes('for')) return 'n-plus-one-query';
    if (patternStr.includes('String') || patternStr.includes('str')) return 'string-concatenation';
    if (patternStr.includes('new') || patternStr.includes('malloc')) return 'memory-allocation';
    
    return 'performance-issue';
  }

  private static getMaintainabilityIssueType(pattern: RegExp, language: string): string {
    const patternStr = pattern.source;
    
    if (patternStr.includes('function') || patternStr.includes('def') || patternStr.includes('func')) return 'large-function';
    if (patternStr.includes('class')) return 'large-class';
    if (patternStr.includes('if')) return 'deep-nesting';
    if (patternStr.includes('catch') || patternStr.includes('except')) return 'empty-catch';
    
    return 'maintainability-issue';
  }

  private static getSecuritySuggestion(issueType: string, language: string): string {
    const suggestions: { [key: string]: { [key: string]: string } } = {
      'code-injection': {
        javascript: 'Avoid using eval(). Use JSON.parse() for data or safer alternatives.',
        python: 'Avoid eval() and exec(). Use ast.literal_eval() for safe evaluation.',
        php: 'Avoid eval(). Use proper parsing or validation instead.'
      },
      'xss-vulnerability': {
        javascript: 'Use textContent instead of innerHTML, or sanitize HTML properly.',
        php: 'Use htmlspecialchars() or similar escaping functions.',
        default: 'Sanitize and escape all user input before rendering.'
      },
      'sql-injection': {
        javascript: 'Use parameterized queries or ORM methods.',
        python: 'Use parameterized queries with execute() method.',
        java: 'Use PreparedStatement instead of Statement.',
        php: 'Use PDO with prepared statements.',
        default: 'Use parameterized queries, never concatenate user input.'
      }
    };

    return suggestions[issueType]?.[language] || suggestions[issueType]?.default || 'Follow security best practices for this pattern.';
  }

  private static getPerformanceSuggestion(issueType: string, language: string): string {
    const suggestions: { [key: string]: { [key: string]: string } } = {
      'inefficient-loop': {
        javascript: 'Cache array.length outside the loop condition.',
        python: 'Use enumerate() instead of range(len()).',
        default: 'Optimize loop conditions and avoid repeated calculations.'
      },
      'string-concatenation': {
        javascript: 'Use template literals or Array.join() for multiple concatenations.',
        python: 'Use f-strings or join() for multiple string operations.',
        java: 'Use StringBuilder for multiple string concatenations.',
        default: 'Use efficient string building methods for multiple concatenations.'
      },
      'n-plus-one-query': {
        default: 'Use eager loading, batch queries, or JOIN operations to reduce database calls.'
      }
    };

    return suggestions[issueType]?.[language] || suggestions[issueType]?.default || 'Optimize this pattern for better performance.';
  }

  private static getMaintainabilitySuggestion(issueType: string, language: string): string {
    const suggestions: { [key: string]: string } = {
      'large-function': 'Break this large function into smaller, focused functions with single responsibilities.',
      'large-class': 'Consider splitting this large class into smaller, more focused classes.',
      'deep-nesting': 'Reduce nesting by using early returns, guard clauses, or extracting nested logic.',
      'empty-catch': 'Handle exceptions properly - log errors, provide fallbacks, or re-throw if necessary.'
    };

    return suggestions[issueType] || 'Refactor this code to improve maintainability.';
  }

  // Framework-specific analysis
  static getFrameworkSpecificIssues(code: string, language: string, framework?: string): Array<{
    type: string;
    description: string;
    suggestion: string;
    severity: string;
  }> {
    const issues: Array<{
      type: string;
      description: string;
      suggestion: string;
      severity: string;
    }> = [];

    if (!framework) return issues;

    // React-specific issues
    if (framework.toLowerCase().includes('react')) {
      if (code.includes('componentWillMount') || code.includes('componentWillReceiveProps')) {
        issues.push({
          type: 'deprecated-lifecycle',
          description: 'Using deprecated React lifecycle methods',
          suggestion: 'Migrate to modern lifecycle methods or hooks',
          severity: 'major'
        });
      }

      if (code.includes('dangerouslySetInnerHTML')) {
        issues.push({
          type: 'dangerous-html',
          description: 'Using dangerouslySetInnerHTML without proper sanitization',
          suggestion: 'Sanitize HTML content or use safer alternatives',
          severity: 'major'
        });
      }
    }

    // Django-specific issues
    if (framework.toLowerCase().includes('django')) {
      if (code.includes('raw(') || code.includes('extra(')) {
        issues.push({
          type: 'raw-sql-django',
          description: 'Using raw SQL in Django without proper escaping',
          suggestion: 'Use Django ORM methods or properly escape raw SQL',
          severity: 'major'
        });
      }
    }

    // Spring-specific issues
    if (framework.toLowerCase().includes('spring')) {
      if (code.includes('@CrossOrigin(origins = "*")')) {
        issues.push({
          type: 'cors-wildcard',
          description: 'Using wildcard in CORS origins',
          suggestion: 'Specify explicit origins instead of using wildcard',
          severity: 'major'
        });
      }
    }

    return issues;
  }
}

// Export utilities for enhanced analysis
export const getLanguageByExtension = (filename: string): ProductionLanguage | undefined => {
  const extension = filename.substring(filename.lastIndexOf('.'));
  return PRODUCTION_LANGUAGES.find(lang => lang.fileExtensions.includes(extension));
};

export const getSupportedLanguages = (): ProductionLanguage[] => {
  return PRODUCTION_LANGUAGES;
};

export const getSecurityRisksForLanguage = (languageId: string): string[] => {
  const lang = PRODUCTION_LANGUAGES.find(l => l.id === languageId);
  return lang?.securityRisks || [];
};