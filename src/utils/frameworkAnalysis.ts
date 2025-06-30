// Framework-specific analysis for production environments
// Comprehensive framework support and best practices

export interface FrameworkIssue {
  id: string;
  framework: string;
  category: 'security' | 'performance' | 'maintainability' | 'best-practices' | 'deprecation';
  severity: 'critical' | 'major' | 'minor' | 'info';
  title: string;
  description: string;
  pattern: RegExp;
  suggestion: string;
  example?: string;
  documentationUrl?: string;
}

export const FRAMEWORK_PATTERNS: FrameworkIssue[] = [
  // React Framework Issues
  {
    id: 'react-dangerous-html',
    framework: 'React',
    category: 'security',
    severity: 'major',
    title: 'Dangerous HTML Usage',
    description: 'Using dangerouslySetInnerHTML without proper sanitization',
    pattern: /dangerouslySetInnerHTML\s*:\s*\{\s*__html\s*:\s*(?!DOMPurify|sanitizeHtml)/g,
    suggestion: 'Sanitize HTML content using DOMPurify or similar library before setting innerHTML',
    example: `// Instead of:\n<div dangerouslySetInnerHTML={{__html: userContent}} />\n\n// Use:\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userContent)}} />`,
    documentationUrl: 'https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml'
  },

  {
    id: 'react-deprecated-lifecycle',
    framework: 'React',
    category: 'deprecation',
    severity: 'major',
    title: 'Deprecated Lifecycle Methods',
    description: 'Using deprecated React lifecycle methods',
    pattern: /componentWillMount|componentWillReceiveProps|componentWillUpdate/g,
    suggestion: 'Migrate to modern lifecycle methods or React Hooks',
    example: `// Instead of componentWillMount:\nuseEffect(() => {\n  // initialization logic\n}, []);\n\n// Instead of componentWillReceiveProps:\nuseEffect(() => {\n  // side effect logic\n}, [props.dependency]);`,
    documentationUrl: 'https://reactjs.org/docs/hooks-intro.html'
  },

  {
    id: 'react-key-prop-missing',
    framework: 'React',
    category: 'performance',
    severity: 'minor',
    title: 'Missing Key Prop in Lists',
    description: 'Missing key prop in list items can cause rendering issues',
    pattern: /\.map\s*\(\s*\([^)]*\)\s*=>\s*<[^>]*(?!key\s*=)/g,
    suggestion: 'Add unique key prop to list items for optimal rendering performance',
    example: `// Instead of:\n{items.map(item => <Item data={item} />)}\n\n// Use:\n{items.map(item => <Item key={item.id} data={item} />)}`,
    documentationUrl: 'https://reactjs.org/docs/lists-and-keys.html'
  },

  {
    id: 'react-inline-functions',
    framework: 'React',
    category: 'performance',
    severity: 'minor',
    title: 'Inline Functions in JSX',
    description: 'Inline functions in JSX can cause unnecessary re-renders',
    pattern: /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*[^}]+\}/g,
    suggestion: 'Use useCallback hook or extract functions outside render for better performance',
    example: `// Instead of:\n<button onClick={() => handleClick(id)}>Click</button>\n\n// Use:\nconst handleButtonClick = useCallback(() => handleClick(id), [id]);\n<button onClick={handleButtonClick}>Click</button>`,
    documentationUrl: 'https://reactjs.org/docs/hooks-reference.html#usecallback'
  },

  // Vue.js Framework Issues
  {
    id: 'vue-v-html-xss',
    framework: 'Vue',
    category: 'security',
    severity: 'major',
    title: 'XSS Vulnerability with v-html',
    description: 'Using v-html with user input without sanitization',
    pattern: /v-html\s*=\s*["'][^"']*(?:user|input|data|content)["']/g,
    suggestion: 'Sanitize HTML content before using v-html directive',
    example: `// Instead of:\n<div v-html="userContent"></div>\n\n// Use:\n<div v-html="$sanitize(userContent)"></div>\n// Or use v-text for plain text`,
    documentationUrl: 'https://vuejs.org/v2/guide/syntax.html#Raw-HTML'
  },

  {
    id: 'vue-deprecated-syntax',
    framework: 'Vue',
    category: 'deprecation',
    severity: 'minor',
    title: 'Deprecated Vue Syntax',
    description: 'Using deprecated Vue 2 syntax that should be updated for Vue 3',
    pattern: /\$listeners|\$scopedSlots|\.sync\s*=/g,
    suggestion: 'Update to Vue 3 composition API and modern syntax',
    example: `// Vue 2:\n<child :prop.sync="value" />\n\n// Vue 3:\n<child v-model:prop="value" />`,
    documentationUrl: 'https://v3-migration.vuejs.org/'
  },

  // Angular Framework Issues
  {
    id: 'angular-innerHTML-binding',
    framework: 'Angular',
    category: 'security',
    severity: 'major',
    title: 'Unsafe innerHTML Binding',
    description: 'Using innerHTML binding without sanitization',
    pattern: /\[innerHTML\]\s*=\s*["'][^"']*(?!sanitizer\.sanitize)/g,
    suggestion: 'Use Angular DomSanitizer to sanitize HTML content',
    example: `// Instead of:\n<div [innerHTML]="userContent"></div>\n\n// Use:\nconstructor(private sanitizer: DomSanitizer) {}\nget sanitizedContent() {\n  return this.sanitizer.sanitize(SecurityContext.HTML, this.userContent);\n}\n<div [innerHTML]="sanitizedContent"></div>`,
    documentationUrl: 'https://angular.io/guide/security#sanitization-and-security-contexts'
  },

  {
    id: 'angular-subscribe-leak',
    framework: 'Angular',
    category: 'performance',
    severity: 'major',
    title: 'Observable Subscription Memory Leak',
    description: 'Observable subscriptions not properly unsubscribed',
    pattern: /\.subscribe\s*\([^)]*\)(?!.*unsubscribe|.*takeUntil|.*async)/g,
    suggestion: 'Use takeUntil pattern or async pipe to prevent memory leaks',
    example: `// Instead of:\nngOnInit() {\n  this.service.getData().subscribe(...);\n}\n\n// Use:\nprivate destroy$ = new Subject<void>();\nngOnInit() {\n  this.service.getData()\n    .pipe(takeUntil(this.destroy$))\n    .subscribe(...);\n}\nngOnDestroy() {\n  this.destroy$.next();\n  this.destroy$.complete();\n}`,
    documentationUrl: 'https://angular.io/guide/observables#unsubscribing'
  },

  // Django Framework Issues
  {
    id: 'django-raw-sql',
    framework: 'Django',
    category: 'security',
    severity: 'critical',
    title: 'SQL Injection Risk',
    description: 'Using raw SQL with string formatting instead of parameterized queries',
    pattern: /\.raw\s*\(\s*f?["'][^"']*\{[^}]*\}["']|\.extra\s*\([^)]*%s/g,
    suggestion: 'Use Django ORM or parameterized queries to prevent SQL injection',
    example: `# Instead of:\nUser.objects.raw(f"SELECT * FROM users WHERE id = {user_id}")\n\n# Use:\nUser.objects.raw("SELECT * FROM users WHERE id = %s", [user_id])\n# Or better, use ORM:\nUser.objects.filter(id=user_id)`,
    documentationUrl: 'https://docs.djangoproject.com/en/stable/topics/security/#sql-injection-protection'
  },

  {
    id: 'django-debug-production',
    framework: 'Django',
    category: 'security',
    severity: 'critical',
    title: 'Debug Mode in Production',
    description: 'DEBUG = True in production settings',
    pattern: /DEBUG\s*=\s*True/g,
    suggestion: 'Set DEBUG = False in production and configure proper error handling',
    example: `# In production settings:\nDEBUG = False\nALLOWED_HOSTS = ['yourdomain.com']\n\n# Configure logging for error tracking`,
    documentationUrl: 'https://docs.djangoproject.com/en/stable/howto/deployment/checklist/'
  },

  {
    id: 'django-csrf-exempt',
    framework: 'Django',
    category: 'security',
    severity: 'major',
    title: 'CSRF Protection Disabled',
    description: 'Using @csrf_exempt decorator without proper justification',
    pattern: /@csrf_exempt/g,
    suggestion: 'Use proper CSRF tokens instead of disabling CSRF protection',
    example: `# Instead of @csrf_exempt, ensure CSRF tokens are included:\n# In templates: {% csrf_token %}\n# In AJAX: X-CSRFToken header`,
    documentationUrl: 'https://docs.djangoproject.com/en/stable/ref/csrf/'
  },

  // Spring Boot Framework Issues
  {
    id: 'spring-cors-wildcard',
    framework: 'Spring',
    category: 'security',
    severity: 'major',
    title: 'CORS Wildcard Origin',
    description: 'Using wildcard (*) in CORS origins configuration',
    pattern: /@CrossOrigin\s*\(\s*origins\s*=\s*["']\*["']/g,
    suggestion: 'Specify explicit origins instead of using wildcard',
    example: `// Instead of:\n@CrossOrigin(origins = "*")\n\n// Use:\n@CrossOrigin(origins = {"https://yourdomain.com", "https://app.yourdomain.com"})`,
    documentationUrl: 'https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-cors'
  },

  {
    id: 'spring-sql-injection',
    framework: 'Spring',
    category: 'security',
    severity: 'critical',
    title: 'SQL Injection in JPA Query',
    description: 'Using string concatenation in JPQL queries',
    pattern: /@Query\s*\(\s*["'][^"']*\+[^"']*["']/g,
    suggestion: 'Use parameterized queries with named or positional parameters',
    example: `// Instead of:\n@Query("SELECT u FROM User u WHERE u.name = " + name)\n\n// Use:\n@Query("SELECT u FROM User u WHERE u.name = :name")\nList<User> findByName(@Param("name") String name);`,
    documentationUrl: 'https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods'
  },

  // Express.js Framework Issues
  {
    id: 'express-no-helmet',
    framework: 'Express',
    category: 'security',
    severity: 'major',
    title: 'Missing Security Headers',
    description: 'Express app without security headers middleware',
    pattern: /express\(\)(?![\s\S]*helmet)/g,
    suggestion: 'Use helmet middleware to set security headers',
    example: `const express = require('express');\nconst helmet = require('helmet');\nconst app = express();\n\napp.use(helmet());`,
    documentationUrl: 'https://helmetjs.github.io/'
  },

  {
    id: 'express-trust-proxy',
    framework: 'Express',
    category: 'security',
    severity: 'minor',
    title: 'Trust Proxy Configuration',
    description: 'Missing trust proxy configuration for production',
    pattern: /express\(\)(?![\s\S]*trust\s+proxy)/g,
    suggestion: 'Configure trust proxy setting for production deployment',
    example: `app.set('trust proxy', 1); // trust first proxy\n// or\napp.set('trust proxy', 'loopback'); // trust loopback addresses`,
    documentationUrl: 'https://expressjs.com/en/guide/behind-proxies.html'
  },

  // Laravel Framework Issues
  {
    id: 'laravel-mass-assignment',
    framework: 'Laravel',
    category: 'security',
    severity: 'major',
    title: 'Mass Assignment Vulnerability',
    description: 'Using create() or update() without fillable/guarded protection',
    pattern: /(?:create|update)\s*\(\s*\$request->all\(\)\s*\)/g,
    suggestion: 'Use fillable property in model or validate input explicitly',
    example: `// In Model:\nprotected $fillable = ['name', 'email'];\n\n// Or validate first:\n$validated = $request->validate([\n    'name' => 'required|string',\n    'email' => 'required|email'\n]);\nUser::create($validated);`,
    documentationUrl: 'https://laravel.com/docs/eloquent#mass-assignment'
  },

  {
    id: 'laravel-sql-injection',
    framework: 'Laravel',
    category: 'security',
    severity: 'critical',
    title: 'SQL Injection in Raw Query',
    description: 'Using DB::raw with user input without proper escaping',
    pattern: /DB::raw\s*\(\s*["'][^"']*\$[^"']*["']\s*\)/g,
    suggestion: 'Use parameter binding or Eloquent ORM methods',
    example: `// Instead of:\nDB::select("SELECT * FROM users WHERE name = '$name'");\n\n// Use:\nDB::select("SELECT * FROM users WHERE name = ?", [$name]);\n// Or:\nUser::where('name', $name)->get();`,
    documentationUrl: 'https://laravel.com/docs/database#raw-expressions'
  },

  // Ruby on Rails Framework Issues
  {
    id: 'rails-sql-injection',
    framework: 'Rails',
    category: 'security',
    severity: 'critical',
    title: 'SQL Injection in ActiveRecord',
    description: 'Using string interpolation in ActiveRecord queries',
    pattern: /\.where\s*\(\s*["'][^"']*#\{[^}]*\}["']/g,
    suggestion: 'Use parameterized queries or hash conditions',
    example: `# Instead of:\nUser.where("name = '#{params[:name]}'\")\n\n# Use:\nUser.where("name = ?", params[:name])\n# Or:\nUser.where(name: params[:name])`,
    documentationUrl: 'https://guides.rubyonrails.org/security.html#sql-injection'
  },

  {
    id: 'rails-mass-assignment',
    framework: 'Rails',
    category: 'security',
    severity: 'major',
    title: 'Mass Assignment Vulnerability',
    description: 'Using params directly without strong parameters',
    pattern: /\.create\s*\(\s*params\s*\)|\.update\s*\(\s*params\s*\)/g,
    suggestion: 'Use strong parameters to whitelist allowed attributes',
    example: `# Instead of:\nUser.create(params)\n\n# Use:\ndef user_params\n  params.require(:user).permit(:name, :email)\nend\n\nUser.create(user_params)`,
    documentationUrl: 'https://guides.rubyonrails.org/action_controller_overview.html#strong-parameters'
  },

  // Flask Framework Issues
  {
    id: 'flask-debug-production',
    framework: 'Flask',
    category: 'security',
    severity: 'critical',
    title: 'Debug Mode in Production',
    description: 'Running Flask with debug=True in production',
    pattern: /app\.run\s*\([^)]*debug\s*=\s*True/g,
    suggestion: 'Disable debug mode in production',
    example: `# Instead of:\napp.run(debug=True)\n\n# Use:\napp.run(debug=False)\n# Or use environment variables:\napp.run(debug=os.environ.get('FLASK_DEBUG', False))`,
    documentationUrl: 'https://flask.palletsprojects.com/en/2.0.x/config/'
  },

  {
    id: 'flask-sql-injection',
    framework: 'Flask',
    category: 'security',
    severity: 'critical',
    title: 'SQL Injection in Raw Query',
    description: 'Using string formatting in SQL queries',
    pattern: /cursor\.execute\s*\(\s*f?["'][^"']*\{[^}]*\}["']/g,
    suggestion: 'Use parameterized queries with execute method',
    example: `# Instead of:\ncursor.execute(f"SELECT * FROM users WHERE id = {user_id}")\n\n# Use:\ncursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))\n# Or with SQLAlchemy:\ndb.session.query(User).filter(User.id == user_id).first()`,
    documentationUrl: 'https://flask-sqlalchemy.palletsprojects.com/en/2.x/queries/'
  }
];

export class FrameworkAnalyzer {
  static detectFrameworkIssues(code: string, language: string, framework?: string): FrameworkIssue[] {
    const detectedIssues: FrameworkIssue[] = [];
    
    // Auto-detect framework if not provided
    if (!framework) {
      framework = this.detectFramework(code, language);
    }
    
    if (!framework) return detectedIssues;
    
    // Filter patterns for the detected framework
    const relevantPatterns = FRAMEWORK_PATTERNS.filter(pattern => 
      pattern.framework.toLowerCase() === framework.toLowerCase()
    );
    
    relevantPatterns.forEach(pattern => {
      if (pattern.pattern.test(code)) {
        detectedIssues.push(pattern);
      }
    });
    
    return detectedIssues;
  }
  
  private static detectFramework(code: string, language: string): string | null {
    const frameworkIndicators: { [key: string]: RegExp[] } = {
      'React': [
        /import.*react/i,
        /from\s+['"]react['"]/i,
        /jsx|tsx/i,
        /useState|useEffect|useContext/i
      ],
      'Vue': [
        /import.*vue/i,
        /from\s+['"]vue['"]/i,
        /v-if|v-for|v-model/i,
        /<template>|<script>|<style>/i
      ],
      'Angular': [
        /import.*@angular/i,
        /@Component|@Injectable|@Directive/i,
        /ngOnInit|ngOnDestroy/i
      ],
      'Django': [
        /from\s+django/i,
        /django\.db\.models/i,
        /class.*\(models\.Model\)/i,
        /@csrf_exempt|@require_http_methods/i
      ],
      'Spring': [
        /import.*springframework/i,
        /@RestController|@Controller|@Service/i,
        /@Autowired|@RequestMapping/i
      ],
      'Express': [
        /require\s*\(\s*['"]express['"]/i,
        /app\.get|app\.post|app\.use/i,
        /express\(\)/i
      ],
      'Laravel': [
        /use\s+Illuminate/i,
        /class.*extends.*Controller/i,
        /Route::|Eloquent::/i
      ],
      'Rails': [
        /class.*ApplicationController/i,
        /belongs_to|has_many|has_one/i,
        /ActiveRecord::Base/i
      ],
      'Flask': [
        /from\s+flask/i,
        /Flask\(__name__\)/i,
        /@app\.route/i
      ]
    };
    
    for (const [framework, patterns] of Object.entries(frameworkIndicators)) {
      if (patterns.some(pattern => pattern.test(code))) {
        return framework;
      }
    }
    
    return null;
  }
  
  static getFrameworkBestPractices(framework: string): string[] {
    const bestPractices: { [key: string]: string[] } = {
      'React': [
        'Use functional components with hooks instead of class components',
        'Implement proper error boundaries for production apps',
        'Use React.memo() for expensive components',
        'Avoid inline functions in JSX props',
        'Use useCallback and useMemo for performance optimization',
        'Implement proper prop validation with PropTypes or TypeScript'
      ],
      'Vue': [
        'Use composition API for complex logic',
        'Implement proper component lifecycle management',
        'Use v-text instead of v-html when possible',
        'Implement proper prop validation',
        'Use computed properties for derived state',
        'Implement proper event handling patterns'
      ],
      'Angular': [
        'Use OnPush change detection strategy where appropriate',
        'Implement proper subscription management with takeUntil',
        'Use trackBy functions for ngFor loops',
        'Implement proper error handling with ErrorHandler',
        'Use lazy loading for feature modules',
        'Follow Angular style guide conventions'
      ],
      'Django': [
        'Use Django ORM instead of raw SQL when possible',
        'Implement proper CSRF protection',
        'Use Django forms for input validation',
        'Configure proper security settings',
        'Use select_related and prefetch_related for query optimization',
        'Implement proper logging and error handling'
      ],
      'Spring': [
        'Use dependency injection properly',
        'Implement proper exception handling with @ControllerAdvice',
        'Use @Transactional appropriately',
        'Configure proper security with Spring Security',
        'Use proper HTTP status codes',
        'Implement proper validation with Bean Validation'
      ],
      'Express': [
        'Use helmet for security headers',
        'Implement proper error handling middleware',
        'Use proper logging with winston or similar',
        'Configure CORS properly',
        'Use rate limiting for API endpoints',
        'Implement proper input validation'
      ],
      'Laravel': [
        'Use Eloquent ORM instead of raw queries',
        'Implement proper form validation',
        'Use middleware for authentication and authorization',
        'Configure proper caching strategies',
        'Use queues for background processing',
        'Implement proper error handling and logging'
      ],
      'Rails': [
        'Use strong parameters for mass assignment protection',
        'Implement proper authorization with Pundit or CanCan',
        'Use Rails conventions and RESTful routing',
        'Configure proper caching strategies',
        'Use background jobs for time-consuming tasks',
        'Implement proper error handling and logging'
      ],
      'Flask': [
        'Use application factory pattern',
        'Implement proper error handling',
        'Use SQLAlchemy for database operations',
        'Configure proper logging',
        'Use blueprints for application organization',
        'Implement proper input validation'
      ]
    };
    
    return bestPractices[framework] || [];
  }
  
  static getSecurityChecklist(framework: string): string[] {
    const securityChecklists: { [key: string]: string[] } = {
      'React': [
        'Sanitize HTML content when using dangerouslySetInnerHTML',
        'Validate and sanitize user inputs',
        'Use HTTPS for all external API calls',
        'Implement proper authentication state management',
        'Avoid storing sensitive data in local storage'
      ],
      'Django': [
        'Set DEBUG = False in production',
        'Configure ALLOWED_HOSTS properly',
        'Use CSRF protection',
        'Implement proper user authentication and authorization',
        'Use parameterized queries',
        'Configure secure cookies and sessions'
      ],
      'Spring': [
        'Configure Spring Security properly',
        'Use HTTPS with proper SSL configuration',
        'Implement proper CORS configuration',
        'Use parameterized queries',
        'Configure proper session management',
        'Implement input validation and sanitization'
      ],
      'Express': [
        'Use helmet for security headers',
        'Configure CORS properly',
        'Implement rate limiting',
        'Use HTTPS with proper SSL configuration',
        'Sanitize user inputs',
        'Implement proper session management'
      ]
    };
    
    return securityChecklists[framework] || [];
  }
}

export const getFrameworkPatterns = (framework: string): FrameworkIssue[] => {
  return FRAMEWORK_PATTERNS.filter(pattern => 
    pattern.framework.toLowerCase() === framework.toLowerCase()
  );
};