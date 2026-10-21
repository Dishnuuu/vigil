import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  Plus, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  X, 
  RefreshCw,
  FilePlus
} from 'lucide-react';
import type { Project, ProjectFile, SecurityFinding } from '../types';

interface CodeEditorProps {
  project: Project;
  activeFile: ProjectFile;
  onSelectFile: (file: ProjectFile) => void;
  onUpdateFileContent: (path: string, content: string) => void;
  onAddFile: (name: string) => void;
  findings: SecurityFinding[];
  onOpenAIFix: (finding: SecurityFinding) => void;
  onRunScan: () => void;
  isScanning: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  project,
  activeFile,
  onSelectFile,
  onUpdateFileContent,
  onAddFile,
  findings,
  onOpenAIFix,
  onRunScan,
  isScanning
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Findings for the active file
  const activeFileFindings = findings.filter(f => f.filePath === activeFile.path);

  // Line numbers array
  const lines = activeFile.content.split('\n');

  const handleAddFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[620px]">
      
      {/* Left Sidebar: File Tree Explorer */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Project Files</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Add New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {project.files.map((file) => {
              const fileFindingCount = findings.filter(f => f.filePath === file.path).length;
              const isActive = file.path === activeFile.path;

              return (
                <button
                  key={file.path}
                  onClick={() => onSelectFile(file)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>

                  {fileFindingCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {fileFindingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rescan & Status Info */}
        <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="w-full btn-primary text-xs justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Rescanning...' : 'Rescan Active Code'}
          </button>
        </div>
      </div>

      {/* Main Workspace: Online Code Editor */}
      <div className="lg:col-span-3 glass-panel flex flex-col overflow-hidden">
        
        {/* Editor Tab Bar */}
        <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200">{activeFile.path}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
              {activeFile.language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeFileFindings.length > 0 ? (
              <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                {activeFileFindings.length} Security Issue(s)
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                Clean File
              </span>
            )}
          </div>
        </div>

        {/* Interactive Editor Area */}
        <div className="flex-1 flex bg-slate-950 font-mono text-xs overflow-auto relative min-h-[380px]">
          
          {/* Line Numbers & Vulnerability Highlight Margin */}
          <div className="py-4 bg-slate-900/70 border-r border-slate-800 text-slate-600 select-none text-right font-mono min-w-[45px] pr-3">
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const hasVuln = activeFileFindings.some(f => f.line === lineNum);
              return (
                <div 
                  key={idx} 
                  className={`leading-6 ${hasVuln ? 'text-rose-400 font-bold bg-rose-500/20 px-1 rounded' : ''}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          {/* Code Textarea */}
          <textarea
            value={activeFile.content}
            onChange={(e) => onUpdateFileContent(activeFile.path, e.target.value)}
            className="flex-1 p-4 bg-transparent text-slate-200 leading-6 resize-none focus:outline-none font-mono selection:bg-cyan-500/30"
            spellCheck={false}
          />
        </div>

        {/* Bottom Panel: Vulnerabilities for Active File */}
        {activeFileFindings.length > 0 && (
          <div className="bg-slate-900/95 border-t border-slate-800 p-4 max-h-48 overflow-y-auto space-y-2">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-4 h-4" />
              Detected Vulnerabilities in {activeFile.name}
            </h4>

            {activeFileFindings.map(finding => (
              <div key={finding.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-mono font-bold">Line {finding.line}:</span>
                    <span className="font-semibold text-slate-200">{finding.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{finding.recommendation}</p>
                </div>

                <button
                  onClick={() => onOpenAIFix(finding)}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  AI Fix
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add New File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-cyan-400" />
                Add New Source File
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFileSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">File Name (e.g. src/auth.js)</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="src/utils.py"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
