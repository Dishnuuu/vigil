import type { ProjectFile, SecurityFinding, DependencyVuln, ScanResult, Severity, Category } from '../types';

interface ScanRule {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  cwe: string;
  owasp: string;
  description: string;
  recommendation: string;
  pattern: RegExp;
  languages?: string[];
  fixGenerator: (match: string, lineContent: string) => string;
}

const SAST_RULES: ScanRule[] = [
  // --- SECRET EXPOSURE ---
  {
    id: 'SEC-001',
    category: 'SECRET_EXPOSURE',
    severity: 'CRITICAL',
    title: 'Hardcoded AWS Access Key',
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    description: 'An AWS Access Key ID was detected directly in the source code. Hardcoded credentials can be extracted by unauthorized users or indexed in public repositories.',
    recommendation: 'Move sensitive credentials to secure environment variables or a key vault manager (e.g. AWS Secrets Manager or .env file).',
    pattern: /AKIA[0-9A-Z]{16}/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/AKIA[0-9A-Z]{16}/, 'process.env.AWS_ACCESS_KEY_ID');
    }
  },
  {
    id: 'SEC-002',
    category: 'SECRET_EXPOSURE',
    severity: 'CRITICAL',
    title: 'Hardcoded GitHub Personal Access Token',
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    description: 'A GitHub Personal Access Token (PAT) was detected in the file. Exposed tokens allow attackers to manipulate your repositories and organization settings.',
    recommendation: 'Revoke the token immediately and store access tokens in environment variables.',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/ghp_[a-zA-Z0-9]{36}/, 'process.env.GITHUB_TOKEN');
    }
  },
  {
    id: 'SEC-003',
    category: 'SECRET_EXPOSURE',
    severity: 'HIGH',
    title: 'Hardcoded JWT Secret Key',
    cwe: 'CWE-321: Use of Hard-coded Cryptographic Key',
    owasp: 'A02:2021 - Cryptographic Failures',
    description: 'The secret string used to sign JWT tokens is hardcoded. An attacker can forge arbitrary JWT tokens to impersonate any user or admin.',
    recommendation: 'Load the JWT secret key from environment variables or a secret vault.',
    pattern: /(jwt\.sign\(.*,\s*['"])([^'"]{4,})(['"])/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/(jwt\.sign\(.*,\s*['"])([^'"]+)(['"])/, '$1process.env.JWT_SECRET$3');
    }
  },
  {
    id: 'SEC-004',
    category: 'SECRET_EXPOSURE',
    severity: 'HIGH',
    title: 'Hardcoded Database Credentials',
    cwe: 'CWE-259: Use of Hard-coded Password',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    description: 'Hardcoded database connection password detected.',
    recommendation: 'Use environment configuration (e.g. process.env.DATABASE_URL) to supply database connection strings.',
    pattern: /(postgres|mysql|mongodb(\+srv)?):\/\/[^:]+:([^@]+)@/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/(postgres|mysql|mongodb(\+srv)?):\/\/[^:]+:([^@]+)@/, '$1://${process.env.DB_USER}:${process.env.DB_PASS}@');
    }
  },

  // --- SQL INJECTION ---
  {
    id: 'SQL-001',
    category: 'SQL_INJECTION',
    severity: 'CRITICAL',
    title: 'Unescaped SQL Query String Concatenation',
    cwe: 'CWE-89: SQL Injection',
    owasp: 'A03:2021 - Injection',
    description: 'Constructing SQL queries dynamically by concatenating user inputs without parameterized queries permits arbitrary SQL command execution.',
    recommendation: 'Use parameterized queries or prepared statements (e.g., db.query("SELECT * FROM users WHERE id = ?", [id])).',
    pattern: /(SELECT|INSERT|UPDATE|DELETE).*\+.*req\.(query|body|params)/gi,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/\+.*req\.(query|body|params)\.(\w+)/, ', [$2]');
    }
  },
  {
    id: 'SQL-002',
    category: 'SQL_INJECTION',
    severity: 'CRITICAL',
    title: 'Template Literal SQL Injection',
    cwe: 'CWE-89: SQL Injection',
    owasp: 'A03:2021 - Injection',
    description: 'SQL query built using ES6 template literal variables without parameterization allows database compromise.',
    recommendation: 'Pass arguments as binding parameters in the query driver call.',
    pattern: /db\.query\(\s*`\s*(SELECT|INSERT|UPDATE|DELETE).*\${.*}.*`\s*\)/gi,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/`SELECT \* FROM users WHERE id = \${(\w+)}`/, '"SELECT * FROM users WHERE id = ?", [$1]');
    }
  },

  // --- COMMAND INJECTION ---
  {
    id: 'CMD-001',
    category: 'COMMAND_INJECTION',
    severity: 'CRITICAL',
    title: 'Insecure Command Execution',
    cwe: 'CWE-78: OS Command Injection',
    owasp: 'A03:2021 - Injection',
    description: 'Passing untrusted inputs directly to child process execution functions (exec / os.system) can lead to full remote code execution (RCE).',
    recommendation: 'Use execFile or spawn with argument arrays instead of shell command concatenation.',
    pattern: /(exec|execSync|os\.system|subprocess\.Popen)\s*\([^)]*\+/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/exec\((.*)\+(.*)\)/, 'execFile($1, [$2])');
    }
  },

  // --- XSS ---
  {
    id: 'XSS-001',
    category: 'XSS',
    severity: 'HIGH',
    title: 'Raw HTML Insertion (DOM XSS)',
    cwe: 'CWE-79: Cross-Site Scripting (XSS)',
    owasp: 'A03:2021 - Injection',
    description: 'Direct insertion of un-sanitized content into HTML via innerHTML or dangerouslySetInnerHTML opens the application to Cross-Site Scripting attacks.',
    recommendation: 'Sanitize input using DOMPurify or use safe text nodes (textContent or standard React JSX elements).',
    pattern: /(innerHTML\s*=|dangerouslySetInnerHTML\s*=)/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/dangerouslySetInnerHTML=\{\{\s*__html:\s*(.*?)\s*\}\}/, 'children={DOMPurify.sanitize($1)}');
    }
  },

  // --- INSECURE DESERIALIZATION / EVAL ---
  {
    id: 'EVAL-001',
    category: 'INSECURE_DESERIALIZATION',
    severity: 'CRITICAL',
    title: 'Dangerous Dynamic Code Execution (eval)',
    cwe: 'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code',
    owasp: 'A03:2021 - Injection',
    description: 'Use of eval() executes arbitrary strings as code, giving attackers complete control over application execution context.',
    recommendation: 'Replace eval() with safe alternatives like JSON.parse() or structured logic.',
    pattern: /\beval\s*\([^)]+\)/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/eval\((.*?)\)/, 'JSON.parse($1)');
    }
  },
  {
    id: 'DESER-001',
    category: 'INSECURE_DESERIALIZATION',
    severity: 'HIGH',
    title: 'Insecure Python Pickle Deserialization',
    cwe: 'CWE-502: Deserialization of Untrusted Data',
    owasp: 'A08:2021 - Software and Data Integrity Failures',
    description: 'pickle.loads() can execute arbitrary Python code contained within serialized payloads.',
    recommendation: 'Use safe data format serialization such as JSON or Protocol Buffers.',
    pattern: /pickle\.loads\s*\(/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/pickle\.loads/, 'json.loads');
    }
  },

  // --- WEAK CRYPTOGRAPHY ---
  {
    id: 'CRYPTO-001',
    category: 'WEAK_CRYPTOGRAPHY',
    severity: 'MEDIUM',
    title: 'Insecure Hashing Algorithm (MD5 / SHA-1)',
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
    owasp: 'A02:2021 - Cryptographic Failures',
    description: 'MD5 and SHA-1 algorithms are cryptographically broken and vulnerable to collision attacks.',
    recommendation: 'Upgrade to SHA-256/SHA-512 for generic hashing or Argon2id/bcrypt for password hashing.',
    pattern: /(createHash\s*\(\s*['"](md5|sha1)['"]\)|hashlib\.(md5|sha1)\(\))/gi,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/['"](md5|sha1)['"]/i, "'sha256'");
    }
  },

  // --- SECURITY MISCONFIGURATION ---
  {
    id: 'MISCONFIG-001',
    category: 'SECURITY_MISCONFIG',
    severity: 'MEDIUM',
    title: 'Overly Permissive CORS Policy',
    cwe: 'CWE-942: Permissive Cross-Domain Policy',
    owasp: 'A05:2021 - Security Misconfiguration',
    description: 'Setting Access-Control-Allow-Origin to wildcard "*" allows any external website to read authenticated API responses.',
    recommendation: 'Restrict CORS origins to explicit trusted domain lists.',
    pattern: /Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]/g,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/\*/, 'https://app.yourdomain.com');
    }
  },
  {
    id: 'MISCONFIG-002',
    category: 'SECURITY_MISCONFIG',
    severity: 'HIGH',
    title: 'Disabled SSL/TLS Certificate Verification',
    cwe: 'CWE-295: Improper Certificate Validation',
    owasp: 'A05:2021 - Security Misconfiguration',
    description: 'Disabling SSL verification (rejectUnauthorized: false or verify=False) enables Man-in-the-Middle (MitM) attacks.',
    recommendation: 'Keep SSL certificate validation enabled in production.',
    pattern: /(rejectUnauthorized\s*:\s*false|verify\s*=\s*False)/gi,
    fixGenerator: (_match, lineContent) => {
      return lineContent.replace(/rejectUnauthorized\s*:\s*false/, 'rejectUnauthorized: true')
                        .replace(/verify\s*=\s*False/i, 'verify=True');
    }
  }
];

const KNOWN_VULN_DEPENDENCIES: Record<string, DependencyVuln> = {
  'lodash': {
    packageName: 'lodash',
    installedVersion: '4.17.15',
    fixedVersion: '4.17.21',
    cve: 'CVE-2021-23337',
    severity: 'HIGH',
    description: 'Command injection vulnerability in template function via variable names.'
  },
  'log4j': {
    packageName: 'log4j',
    installedVersion: '2.14.1',
    fixedVersion: '2.17.1',
    cve: 'CVE-2021-44228',
    severity: 'CRITICAL',
    description: 'Log4Shell: Remote code execution vulnerability in Apache Log4j JNDI features.'
  },
  'express': {
    packageName: 'express',
    installedVersion: '4.16.0',
    fixedVersion: '4.17.3',
    cve: 'CVE-2022-24999',
    severity: 'MEDIUM',
    description: 'Open redirect vulnerability in qs component.'
  },
  'axios': {
    packageName: 'axios',
    installedVersion: '0.18.0',
    fixedVersion: '0.21.1',
    cve: 'CVE-2020-28168',
    severity: 'HIGH',
    description: 'Server-side request forgery (SSRF) bypass through redirect handling.'
  },
  'flask': {
    packageName: 'flask',
    installedVersion: '1.1.2',
    fixedVersion: '2.0.1',
    cve: 'CVE-2021-30139',
    severity: 'HIGH',
    description: 'Improper cookie validation allows session hijacking.'
  }
};

export function performSecurityScan(files: ProjectFile[]): ScanResult {
  const findings: SecurityFinding[] = [];
  const dependencies: DependencyVuln[] = [];
  let totalFilesScanned = 0;

  files.forEach(file => {
    totalFilesScanned++;
    const lines = file.content.split('\n');

    // 1. Dependency Scanner for package.json or requirements.txt
    if (file.name.toLowerCase() === 'package.json') {
      try {
        const pkg = JSON.parse(file.content);
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        Object.keys(allDeps).forEach(depName => {
          if (KNOWN_VULN_DEPENDENCIES[depName]) {
            dependencies.push(KNOWN_VULN_DEPENDENCIES[depName]);
            // Also create a finding
            const vuln = KNOWN_VULN_DEPENDENCIES[depName];
            findings.push({
              id: `DEP-${Math.random().toString(36).substring(2, 9)}`,
              filePath: file.path,
              line: 1,
              severity: vuln.severity,
              category: 'DEPENDENCY_VULNERABILITY',
              title: `Vulnerable Dependency: ${vuln.packageName} (${vuln.cve})`,
              cwe: 'CWE-1395: Dependency on Vulnerable Third-Party Component',
              owasp: 'A06:2021 - Vulnerable and Outdated Components',
              description: vuln.description,
              snippet: `"${vuln.packageName}": "${allDeps[depName]}"`,
              recommendation: `Upgrade ${vuln.packageName} to version ${vuln.fixedVersion} or higher.`,
              fixedSnippet: `"${vuln.packageName}": "^${vuln.fixedVersion}"`,
              status: 'OPEN'
            });
          }
        });
      } catch (e) {
        // invalid json skip
      }
    }

    if (file.name.toLowerCase() === 'requirements.txt') {
      lines.forEach((lineStr, lineIdx) => {
        Object.keys(KNOWN_VULN_DEPENDENCIES).forEach(depName => {
          if (lineStr.toLowerCase().includes(depName)) {
            const vuln = KNOWN_VULN_DEPENDENCIES[depName];
            dependencies.push(vuln);
            findings.push({
              id: `DEP-${Math.random().toString(36).substring(2, 9)}`,
              filePath: file.path,
              line: lineIdx + 1,
              severity: vuln.severity,
              category: 'DEPENDENCY_VULNERABILITY',
              title: `Vulnerable Python Package: ${vuln.packageName} (${vuln.cve})`,
              cwe: 'CWE-1395: Dependency on Vulnerable Third-Party Component',
              owasp: 'A06:2021 - Vulnerable and Outdated Components',
              description: vuln.description,
              snippet: lineStr,
              recommendation: `Upgrade ${vuln.packageName} to ${vuln.fixedVersion}.`,
              fixedSnippet: `${vuln.packageName}>=${vuln.fixedVersion}`,
              status: 'OPEN'
            });
          }
        });
      });
    }

    // 2. SAST & Secret Scanner Rules
    lines.forEach((lineContent, lineIndex) => {
      SAST_RULES.forEach(rule => {
        // Reset regex state
        rule.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = rule.pattern.exec(lineContent)) !== null) {
          const matchedText = match[0];
          const fixedSnippet = rule.fixGenerator(matchedText, lineContent);

          findings.push({
            id: `${rule.id}-${Math.random().toString(36).substring(2, 7)}`,
            filePath: file.path,
            line: lineIndex + 1,
            column: match.index + 1,
            severity: rule.severity,
            category: rule.category,
            title: rule.title,
            cwe: rule.cwe,
            owasp: rule.owasp,
            description: rule.description,
            snippet: lineContent.trim(),
            recommendation: rule.recommendation,
            fixedSnippet: fixedSnippet.trim(),
            status: 'OPEN'
          });
        }
      });
    });
  });

  // Count severity stats
  const stats = {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length,
    secrets: findings.filter(f => f.category === 'SECRET_EXPOSURE').length,
  };

  // Calculate Security Health Score (100 base)
  let penalty = (stats.critical * 25) + (stats.high * 15) + (stats.medium * 5) + (stats.low * 2);
  let score = Math.max(0, Math.min(100, 100 - penalty));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    scanId: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    securityScore: score,
    grade,
    totalFiles: totalFilesScanned,
    findings,
    dependencies,
    stats
  };
}
