export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Category = 
  | 'SECRET_EXPOSURE'
  | 'SQL_INJECTION'
  | 'XSS'
  | 'COMMAND_INJECTION'
  | 'INSECURE_DESERIALIZATION'
  | 'WEAK_CRYPTOGRAPHY'
  | 'DEPENDENCY_VULNERABILITY'
  | 'PATH_TRAVERSAL'
  | 'SECURITY_MISCONFIG';

export interface SecurityFinding {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  severity: Severity;
  category: Category;
  title: string;
  cwe: string;
  owasp: string;
  description: string;
  snippet: string;
  recommendation: string;
  fixedSnippet?: string;
  status: 'OPEN' | 'FIXED' | 'IGNORED';
}

export interface DependencyVuln {
  packageName: string;
  installedVersion: string;
  fixedVersion: string;
  cve: string;
  severity: Severity;
  description: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'json' | 'html' | 'css' | 'plaintext';
  content: string;
}

export interface ScanResult {
  scanId: string;
  timestamp: string;
  securityScore: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  totalFiles: number;
  findings: SecurityFinding[];
  dependencies: DependencyVuln[];
  stats: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    secrets: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: ProjectFile[];
  lastScan?: ScanResult;
  githubRepo?: string;
  githubBranch?: string;
  createdAt: string;
}

export interface GitHubConfig {
  connected: boolean;
  username: string;
  token: string;
  repo: string;
  branch: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'Security Engineer' | 'Lead Developer' | 'DevSecOps Admin';
  avatar: string;
}
