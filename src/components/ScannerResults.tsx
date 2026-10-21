import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  FileCode, 
  Search,
  Check
} from 'lucide-react';
import type { ScanResult, SecurityFinding, Severity, Category } from '../types';

interface ScannerResultsProps {
  scanResult?: ScanResult;
  onOpenAIFix: (finding: SecurityFinding) => void;
  onGoToEditor: (filePath: string) => void;
}

export const ScannerResults: React.FC<ScannerResultsProps> = ({
  scanResult,
  onOpenAIFix,
  onGoToEditor
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!scanResult) {
    return (
      <div className="glass-panel p-12 text-center max-w-xl mx-auto my-12">
        <ShieldCheck className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Security Results Available</h2>
        <p className="text-xs text-slate-400">Run a security scan to inspect static findings and CVE reports.</p>
      </div>
    );
  }

  const { findings } = scanResult;

  // Filter Findings
  const filteredFindings = findings.filter(f => {
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q) ||
        f.cwe.toLowerCase().includes(q) ||
        f.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header & Filter Controls Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          <div>
            <h2 className="text-lg font-bold text-slate-100">SAST & Secret Security Findings</h2>
            <p className="text-xs text-slate-400">
              Showing {filteredFindings.length} of {findings.length} findings across {scanResult.totalFiles} files
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Severity Dropdown */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="SECRET_EXPOSURE">Secret Exposure</option>
            <option value="SQL_INJECTION">SQL Injection</option>
            <option value="XSS">XSS</option>
            <option value="COMMAND_INJECTION">Command Injection</option>
            <option value="INSECURE_DESERIALIZATION">Deserialization</option>
            <option value="WEAK_CRYPTOGRAPHY">Weak Cryptography</option>
            <option value="DEPENDENCY_VULNERABILITY">Dependencies</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-200">No findings matched your filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the severity or search filters.</p>
          </div>
        ) : (
          filteredFindings.map(finding => (
            <div 
              key={finding.id}
              className="glass-panel p-5 space-y-3 glass-card-interactive"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    finding.severity === 'CRITICAL' ? 'badge-critical' :
                    finding.severity === 'HIGH' ? 'badge-high' :
                    finding.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {finding.severity}
                  </span>

                  <h3 className="text-sm font-bold text-slate-100">{finding.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px] border border-slate-800">
                    {finding.cwe}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono text-[10px] border border-slate-800">
                    {finding.owasp}
                  </span>
                </div>
              </div>

              {/* Description & Impact */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.description}
              </p>

              {/* Vulnerable Code Snippet */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-900 pb-1 mb-1">
                  <span className="flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    {finding.filePath} : Line {finding.line}
                  </span>
                  <button 
                    onClick={() => onGoToEditor(finding.filePath)}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Open in Editor →
                  </button>
                </div>
                <div className="text-rose-400 bg-rose-950/30 p-2 rounded">
                  <code>{finding.snippet}</code>
                </div>
              </div>

              {/* Recommendation & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-200">Fix Guidance: </strong>
                  {finding.recommendation}
                </div>

                <button
                  onClick={() => onOpenAIFix(finding)}
                  className="btn-primary text-xs self-end sm:self-auto shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  1-Click AI Auto-Fix
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
