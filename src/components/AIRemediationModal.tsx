import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  FileCode,
  Copy,
  Check
} from 'lucide-react';
import type { SecurityFinding } from '../types';
import { generateAIFix, type AIFixResult } from '../services/aiFixEngine';

interface AIRemediationModalProps {
  finding: SecurityFinding;
  onClose: () => void;
  onApplyFix: (finding: SecurityFinding, patchedCode: string) => void;
}

export const AIRemediationModal: React.FC<AIRemediationModalProps> = ({
  finding,
  onClose,
  onApplyFix
}) => {
  const [aiFix] = useState<AIFixResult>(() => generateAIFix(finding));
  const [isApplying, setIsApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyFix(finding, aiFix.patchedCode);
      setIsApplying(false);
      onClose();
    }, 800);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(aiFix.patchedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 p-6 border-cyan-500/30">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">AI Remediation & Patch Generator</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Vigil AI Core
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated security refactoring engine</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vulnerability Context Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-200">{finding.title}</div>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5">
              {finding.filePath} : Line {finding.line} | {finding.owasp}
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            finding.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'
          }`}>
            {finding.severity}
          </span>
        </div>

        {/* AI Root Cause Analysis */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Root Cause & Exploit Impact
          </h4>
          <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
            {aiFix.explanation}
          </p>
        </div>

        {/* Code Diff Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              Proposed Code Patch Diff
            </h4>
            <button 
              onClick={copyCode}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Fixed Code'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {/* Unsafe Original */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 rounded border border-rose-500/20 inline-block">
                Original Unsafe Code
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/50 text-rose-300 min-h-[90px] overflow-x-auto">
                <code>{finding.snippet}</code>
              </div>
            </div>

            {/* AI Refactored Patch */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 inline-block">
                AI Secure Refactored Code
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/50 text-emerald-300 min-h-[90px] overflow-x-auto">
                <code>{aiFix.patchedCode}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Security Impact Banner */}
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          <div>
            <strong>Expected Security Outcome: </strong>
            {aiFix.securityImpact}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button onClick={onClose} className="btn-secondary text-xs">
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className="btn-primary text-xs"
          >
            <Sparkles className={`w-3.5 h-3.5 text-cyan-300 ${isApplying ? 'animate-spin' : ''}`} />
            {isApplying ? 'Applying Security Patch...' : 'Apply AI Patch & Rescan'}
          </button>
        </div>

      </div>
    </div>
  );
};
