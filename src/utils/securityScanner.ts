// Production-level security scanner
// Comprehensive security vulnerability detection

export interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'injection' | 'authentication' | 'sensitive-data' | 'xml' | 'access-control' | 'security-config' | 'xss' | 'deserialization' | 'logging' | 'validation';
  cweId: string;
  owaspCategory?: string;
  pattern: RegExp;
  suggestion: string;
  example: string;
  references: string[];
}

export const SECURITY_VULNERABILITIES: SecurityVulnerability[] = [
  // OWASP Top 10 2021 - A01: Broken Access Control
  {
    id: 'broken-access-control-1',
    title: 'Missing Authorization Check',
    description: 'Functions or endpoints without proper authorization checks',
    severity: 'critical',
    category: 'access-control',
    cweId: 'CWE-862',
    owaspCategory: 'A01:2021 - Broken Access Control',
    pattern: /@app\.route.*\n.*def.*(?!.*@login_required|.*@auth\.required|.*authenticate|.*authorize)/gs,
    suggestion: 'Implement proper authorization checks using decorators or middleware',
    example: `# Add authorization decorator:\n@app.route('/admin')\n@login_required\n@admin_required\ndef admin_panel():\n    # admin logic`,
    references: ['https://owasp.org/Top10/A01_2021-Broken_Access_Control/']
  },

  {
    id: 'path-traversal',
    title: 'Path Traversal Vulnerability',
    description: 'File operations using user input without validation',
    severity: 'high',
    category: 'access-control',
    cweId: 'CWE-22',
    owaspCategory: 'A01:2021 - Broken Access Control',
    pattern: /(?:open|readFile|writeFile|createReadStream|createWriteStream)\s*\([^)]*(?:\$_GET|\$_POST|request\.|params\.|query\.)/g,
    suggestion: 'Validate and sanitize file paths, use whitelist of allowed paths',
    example: `# Instead of:\nwith open(f"files/{user_filename}", 'r') as f:\n\n# Use:\nimport os\nsafe_path = os.path.join('files', os.path.basename(user_filename))\nif os.path.commonpath([safe_path, 'files']) == 'files':\n    with open(safe_path, 'r') as f:`,
    references: ['https://owasp.org/www-community/attacks/Path_Traversal']
  },

  // OWASP Top 10 2021 - A02: Cryptographic Failures
  {
    id: 'weak-crypto-algorithm',
    title: 'Weak Cryptographic Algorithm',
    description: 'Usage of weak or deprecated cryptographic algorithms',
    severity: 'high',
    category: 'sensitive-data',
    cweId: 'CWE-327',
    owaspCategory: 'A02:2021 - Cryptographic Failures',
    pattern: /(?:MD5|SHA1|DES|3DES|RC4|ECB)\s*\(/g,
    suggestion: 'Use strong cryptographic algorithms like AES-256, SHA-256, or bcrypt',
    example: `# Instead of:\nhashlib.md5(password.encode()).hexdigest()\n\n# Use:\nimport bcrypt\nbcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())`,
    references: ['https://owasp.org/Top10/A02_2021-Cryptographic_Failures/']
  },

  {
    id: 'hardcoded-secrets',
    title: 'Hardcoded Secrets',
    description: 'API keys, passwords, or secrets hardcoded in source code',
    severity: 'critical',
    category: 'sensitive-data',
    cweId: 'CWE-798',
    owaspCategory: 'A02:2021 - Cryptographic Failures',
    pattern: /(?:password|secret|key|token|api_key)\s*=\s*["'][^"']{8,}["']/gi,
    suggestion: 'Store secrets in environment variables or secure vault services',
    example: `# Instead of:\nAPI_KEY = "sk-1234567890abcdef"\n\n# Use:\nimport os\nAPI_KEY = os.environ.get('API_KEY')\nif not API_KEY:\n    raise ValueError("API_KEY environment variable not set")`,
    references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password']
  },

  {
    id: 'insecure-random',
    title: 'Insecure Random Number Generation',
    description: 'Using predictable random number generators for security purposes',
    severity: 'medium',
    category: 'sensitive-data',
    cweId: 'CWE-338',
    owaspCategory: 'A02:2021 - Cryptographic Failures',
    pattern: /(?:Math\.random|random\.randint|rand\(\))/g,
    suggestion: 'Use cryptographically secure random number generators',
    example: `# Instead of:\nimport random\ntoken = random.randint(1000, 9999)\n\n# Use:\nimport secrets\ntoken = secrets.randbelow(9000) + 1000\n# Or:\ntoken = secrets.token_urlsafe(32)`,
    references: ['https://docs.python.org/3/library/secrets.html']
  },

  // OWASP Top 10 2021 - A03: Injection
  {
    id: 'sql-injection-basic',
    title: 'SQL Injection Vulnerability',
    description: 'SQL queries constructed with string concatenation or formatting',
    severity: 'critical',
    category: 'injection',
    cweId: 'CWE-89',
    owaspCategory: 'A03:2021 - Injection',
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*(?:\+|\%s|\%d|f["'].*\{.*\}["']|\$\{|\#\{)/gi,
    suggestion: 'Use parameterized queries or prepared statements',
    example: `# Instead of:\nquery = f"SELECT * FROM users WHERE id = {user_id}"\n\n# Use:\nquery = "SELECT * FROM users WHERE id = %s"\ncursor.execute(query, (user_id,))`,
    references: ['https://owasp.org/www-community/attacks/SQL_Injection']
  },

  {
    id: 'command-injection',
    title: 'Command Injection Vulnerability',
    description: 'System commands executed with user input',
    severity: 'critical',
    category: 'injection',
    cweId: 'CWE-78',
    owaspCategory: 'A03:2021 - Injection',
    pattern: /(?:system|exec|shell_exec|passthru|eval|os\.system|subprocess\.call).*(?:\$_GET|\$_POST|request\.|params\.|input\()/g,
    suggestion: 'Validate input and use safe alternatives like subprocess with shell=False',
    example: `# Instead of:\nos.system(f"ping {user_host}")\n\n# Use:\nimport subprocess\nresult = subprocess.run(['ping', '-c', '1', user_host], \n                       capture_output=True, text=True, timeout=5)`,
    references: ['https://owasp.org/www-community/attacks/Command_Injection']
  },

  {
    id: 'ldap-injection',
    title: 'LDAP Injection Vulnerability',
    description: 'LDAP queries constructed with unsanitized user input',
    severity: 'high',
    category: 'injection',
    cweId: 'CWE-90',
    owaspCategory: 'A03:2021 - Injection',
    pattern: /ldap.*search.*(?:\+|f["'].*\{.*\}["']|\$\{)/gi,
    suggestion: 'Escape LDAP special characters and use parameterized LDAP queries',
    example: `# Escape LDAP special characters:\ndef escape_ldap(text):\n    return text.replace('\\\\', '\\\\5c').replace('*', '\\\\2a')\n        .replace('(', '\\\\28').replace(')', '\\\\29')\n        .replace('\\0', '\\\\00')`,
    references: ['https://owasp.org/www-community/attacks/LDAP_Injection']
  },

  {
    id: 'xss-reflected',
    title: 'Cross-Site Scripting (XSS)',
    description: 'User input rendered without proper escaping',
    severity: 'high',
    category: 'xss',
    cweId: 'CWE-79',
    owaspCategory: 'A03:2021 - Injection',
    pattern: /(?:innerHTML|outerHTML|document\.write).*(?:\$_GET|\$_POST|request\.|params\.|echo)/g,
    suggestion: 'Escape HTML entities and use textContent instead of innerHTML',
    example: `// Instead of:\nelement.innerHTML = userInput;\n\n// Use:\nelement.textContent = userInput;\n// Or if HTML is needed:\nelement.innerHTML = DOMPurify.sanitize(userInput);`,
    references: ['https://owasp.org/www-community/attacks/xss/']
  },

  // OWASP Top 10 2021 - A04: Insecure Design
  {
    id: 'missing-rate-limiting',
    title: 'Missing Rate Limiting',
    description: 'API endpoints without rate limiting protection',
    severity: 'medium',
    category: 'security-config',
    cweId: 'CWE-770',
    owaspCategory: 'A04:2021 - Insecure Design',
    pattern: /@app\.route.*\n.*def.*(?!.*rate_limit|.*limiter|.*throttle)/gs,
    suggestion: 'Implement rate limiting to prevent abuse and DoS attacks',
    example: `# Using Flask-Limiter:\nfrom flask_limiter import Limiter\nlimiter = Limiter(app, key_func=get_remote_address)\n\n@app.route('/api/login')\n@limiter.limit("5 per minute")\ndef login():`,
    references: ['https://owasp.org/Top10/A04_2021-Insecure_Design/']
  },

  // OWASP Top 10 2021 - A05: Security Misconfiguration
  {
    id: 'debug-mode-production',
    title: 'Debug Mode Enabled in Production',
    description: 'Debug mode or verbose error reporting enabled',
    severity: 'high',
    category: 'security-config',
    cweId: 'CWE-489',
    owaspCategory: 'A05:2021 - Security Misconfiguration',
    pattern: /(?:DEBUG\s*=\s*True|debug\s*=\s*true|app\.run.*debug\s*=\s*True)/gi,
    suggestion: 'Disable debug mode in production and configure proper error handling',
    example: `# Instead of:\nDEBUG = True\n\n# Use environment-based config:\nDEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'`,
    references: ['https://owasp.org/Top10/A05_2021-Security_Misconfiguration/']
  },

  {
    id: 'default-credentials',
    title: 'Default or Weak Credentials',
    description: 'Usage of default or weak credentials',
    severity: 'critical',
    category: 'authentication',
    cweId: 'CWE-521',
    owaspCategory: 'A05:2021 - Security Misconfiguration',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'](?:admin|password|123456|root|test|guest|user)["']/gi,
    suggestion: 'Use strong, unique credentials and enforce password policies',
    example: `# Use environment variables for credentials:\nDB_PASSWORD = os.environ.get('DB_PASSWORD')\nif not DB_PASSWORD:\n    raise ValueError("DB_PASSWORD must be set")`,
    references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password']
  },

  // OWASP Top 10 2021 - A06: Vulnerable and Outdated Components
  {
    id: 'outdated-dependencies',
    title: 'Potentially Outdated Dependencies',
    description: 'Import statements that may indicate outdated libraries',
    severity: 'medium',
    category: 'security-config',
    cweId: 'CWE-1104',
    owaspCategory: 'A06:2021 - Vulnerable and Outdated Components',
    pattern: /(?:import|require|from).*(?:jquery.*1\.|flask.*0\.|django.*[12]\.|express.*3\.)/gi,
    suggestion: 'Regularly update dependencies and use dependency vulnerability scanners',
    example: `# Use tools like:\n# pip-audit (Python)\n# npm audit (Node.js)\n# bundle audit (Ruby)\n# Update regularly:\npip install --upgrade package_name`,
    references: ['https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/']
  },

  // OWASP Top 10 2021 - A07: Identification and Authentication Failures
  {
    id: 'weak-session-config',
    title: 'Weak Session Configuration',
    description: 'Insecure session configuration',
    severity: 'high',
    category: 'authentication',
    cweId: 'CWE-384',
    owaspCategory: 'A07:2021 - Identification and Authentication Failures',
    pattern: /session.*(?:httponly\s*=\s*false|secure\s*=\s*false|samesite\s*=\s*none)/gi,
    suggestion: 'Configure secure session settings with HttpOnly, Secure, and SameSite flags',
    example: `# Secure session configuration:\napp.config['SESSION_COOKIE_SECURE'] = True\napp.config['SESSION_COOKIE_HTTPONLY'] = True\napp.config['SESSION_COOKIE_SAMESITE'] = 'Lax'`,
    references: ['https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/']
  },

  {
    id: 'missing-mfa',
    title: 'Missing Multi-Factor Authentication',
    description: 'Authentication without multi-factor authentication for sensitive operations',
    severity: 'medium',
    category: 'authentication',
    cweId: 'CWE-308',
    owaspCategory: 'A07:2021 - Identification and Authentication Failures',
    pattern: /(?:login|authenticate|signin).*(?!.*mfa|.*2fa|.*totp|.*otp)/gi,
    suggestion: 'Implement multi-factor authentication for sensitive operations',
    example: `# Implement TOTP-based 2FA:\nimport pyotp\n\ndef verify_totp(user, token):\n    totp = pyotp.TOTP(user.secret_key)\n    return totp.verify(token)`,
    references: ['https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html']
  },

  // OWASP Top 10 2021 - A08: Software and Data Integrity Failures
  {
    id: 'insecure-deserialization',
    title: 'Insecure Deserialization',
    description: 'Deserializing untrusted data without validation',
    severity: 'critical',
    category: 'deserialization',
    cweId: 'CWE-502',
    owaspCategory: 'A08:2021 - Software and Data Integrity Failures',
    pattern: /(?:pickle\.loads?|yaml\.load|unserialize|ObjectInputStream)/g,
    suggestion: 'Avoid deserializing untrusted data or use safe serialization formats',
    example: `# Instead of:\nimport pickle\ndata = pickle.loads(user_input)\n\n# Use JSON for simple data:\nimport json\ndata = json.loads(user_input)\n\n# Or validate pickle data:\nclass SafeUnpickler(pickle.Unpickler):\n    def find_class(self, module, name):\n        if module == "builtins" and name in safe_builtins:\n            return getattr(builtins, name)\n        raise pickle.UnpicklingError("global '%s.%s' is forbidden" %\n                                   (module, name))`,
    references: ['https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/']
  },

  // OWASP Top 10 2021 - A09: Security Logging and Monitoring Failures
  {
    id: 'insufficient-logging',
    title: 'Insufficient Security Logging',
    description: 'Missing security event logging',
    severity: 'medium',
    category: 'logging',
    cweId: 'CWE-778',
    owaspCategory: 'A09:2021 - Security Logging and Monitoring Failures',
    pattern: /(?:login|authentication|authorization|access).*(?!.*log|.*audit)/gi,
    suggestion: 'Implement comprehensive security logging for audit trails',
    example: `# Add security logging:\nimport logging\nsecurity_logger = logging.getLogger('security')\n\ndef login(username, password):\n    try:\n        # authentication logic\n        security_logger.info(f"Successful login for user: {username}")\n    except AuthenticationError:\n        security_logger.warning(f"Failed login attempt for user: {username}")`,
    references: ['https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/']
  },

  {
    id: 'log-injection',
    title: 'Log Injection Vulnerability',
    description: 'User input logged without sanitization',
    severity: 'medium',
    category: 'logging',
    cweId: 'CWE-117',
    owaspCategory: 'A09:2021 - Security Logging and Monitoring Failures',
    pattern: /log.*(?:\+|f["'].*\{.*\}["']).*(?:request\.|params\.|input)/g,
    suggestion: 'Sanitize user input before logging to prevent log injection',
    example: `# Instead of:\nlogger.info(f"User input: {user_input}")\n\n# Use:\nimport re\nsafe_input = re.sub(r'[\\r\\n]', '', user_input)\nlogger.info("User input: %s", safe_input)`,
    references: ['https://owasp.org/www-community/attacks/Log_Injection']
  },

  // OWASP Top 10 2021 - A10: Server-Side Request Forgery (SSRF)
  {
    id: 'ssrf-vulnerability',
    title: 'Server-Side Request Forgery (SSRF)',
    description: 'HTTP requests to URLs controlled by user input',
    severity: 'high',
    category: 'injection',
    cweId: 'CWE-918',
    owaspCategory: 'A10:2021 - Server-Side Request Forgery (SSRF)',
    pattern: /(?:requests\.get|urllib\.request|fetch|axios\.get).*(?:request\.|params\.|input)/g,
    suggestion: 'Validate and whitelist allowed URLs, use URL parsing to prevent SSRF',
    example: `# Instead of:\nresponse = requests.get(user_url)\n\n# Use URL validation:\nfrom urllib.parse import urlparse\n\ndef is_safe_url(url):\n    parsed = urlparse(url)\n    return (parsed.scheme in ['http', 'https'] and\n            parsed.hostname not in ['localhost', '127.0.0.1'] and\n            not parsed.hostname.startswith('192.168.') and\n            not parsed.hostname.startswith('10.'))\n\nif is_safe_url(user_url):\n    response = requests.get(user_url, timeout=5)`,
    references: ['https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/']
  }
];

export class SecurityScanner {
  static scanCode(code: string, language: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    SECURITY_VULNERABILITIES.forEach(vuln => {
      if (vuln.pattern.test(code)) {
        vulnerabilities.push(vuln);
      }
    });
    
    return vulnerabilities;
  }
  
  static getSecurityScore(vulnerabilities: SecurityVulnerability[]): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    summary: string;
  } {
    let totalScore = 100;
    
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': totalScore -= 25; break;
        case 'high': totalScore -= 15; break;
        case 'medium': totalScore -= 8; break;
        case 'low': totalScore -= 3; break;
        case 'info': totalScore -= 1; break;
      }
    });
    
    totalScore = Math.max(0, totalScore);
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (totalScore >= 90) grade = 'A';
    else if (totalScore >= 80) grade = 'B';
    else if (totalScore >= 70) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    else grade = 'F';
    
    const critical = vulnerabilities.filter(v => v.severity === 'critical').length;
    const high = vulnerabilities.filter(v => v.severity === 'high').length;
    const medium = vulnerabilities.filter(v => v.severity === 'medium').length;
    
    let summary = '';
    if (critical > 0) {
      summary = `${critical} critical vulnerabilities require immediate attention`;
    } else if (high > 0) {
      summary = `${high} high-severity issues need to be addressed`;
    } else if (medium > 0) {
      summary = `${medium} medium-severity issues found`;
    } else if (vulnerabilities.length > 0) {
      summary = `${vulnerabilities.length} minor security issues detected`;
    } else {
      summary = 'No major security vulnerabilities detected';
    }
    
    return { score: totalScore, grade, summary };
  }
  
  static getComplianceReport(vulnerabilities: SecurityVulnerability[]): {
    owasp: { [category: string]: number };
    cwe: { [id: string]: number };
    recommendations: string[];
  } {
    const owasp: { [category: string]: number } = {};
    const cwe: { [id: string]: number } = {};
    
    vulnerabilities.forEach(vuln => {
      if (vuln.owaspCategory) {
        owasp[vuln.owaspCategory] = (owasp[vuln.owaspCategory] || 0) + 1;
      }
      cwe[vuln.cweId] = (cwe[vuln.cweId] || 0) + 1;
    });
    
    const recommendations = [
      'Implement automated security testing in CI/CD pipeline',
      'Regular security code reviews and penetration testing',
      'Keep dependencies updated and monitor for vulnerabilities',
      'Implement proper logging and monitoring for security events',
      'Use static application security testing (SAST) tools',
      'Implement dynamic application security testing (DAST)',
      'Follow secure coding guidelines and standards',
      'Implement security training for development team'
    ];
    
    return { owasp, cwe, recommendations };
  }
  
  static getPriorityVulnerabilities(vulnerabilities: SecurityVulnerability[]): SecurityVulnerability[] {
    return vulnerabilities
      .filter(vuln => vuln.severity === 'critical' || vuln.severity === 'high')
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }
}

export const getVulnerabilityByCategory = (category: string): SecurityVulnerability[] => {
  return SECURITY_VULNERABILITIES.filter(vuln => vuln.category === category);
};

export const getVulnerabilityBySeverity = (severity: string): SecurityVulnerability[] => {
  return SECURITY_VULNERABILITIES.filter(vuln => vuln.severity === severity);
};