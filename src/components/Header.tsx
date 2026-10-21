import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileCode, 
  LayoutDashboard, 
  Download, 
  Upload, 
  RefreshCw
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import type { Project, ScanResult, UserProfile } from '../types';

interface HeaderProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (proj: Project) => void;
  activeTab: 'dashboard' | 'editor' | 'findings';
  onSelectTab: (tab: 'dashboard' | 'editor' | 'findings') => void;
  scanResult?: ScanResult;
  onRunScan: () => void;
  onImportZip: () => void;
  onExportPDF: () => void;
  onOpenGitHub: () => void;
  onOpenAuth: () => void;
  user: UserProfile;
  isScanning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  activeTab,
  onSelectTab,
  scanResult,
  onRunScan,
  onImportZip,
  onExportPDF,
  onOpenGitHub,
  onOpenAuth,
  user,
  isScanning
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-heading">VIGIL</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                DevSecOps Cloud
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Automated Code Security & Vulnerability Analysis</p>
          </div>
        </div>

        {/* Project Switcher & Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          
          {/* Project Dropdown */}
          <div className="relative border-r border-slate-800 pr-2 mr-1 hidden lg:block">
            <select
              value={activeProject.id}
              onChange={(e) => {
                const found = projects.find(p => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-transparent text-xs font-medium text-slate-200 py-1.5 px-3 rounded-lg border border-slate-700/60 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Executive Dashboard
          </button>

          <button
            onClick={() => onSelectTab('editor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'editor' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Code Editor
          </button>

          <button
            onClick={() => onSelectTab('findings')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'findings' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Security Findings
            {scanResult && scanResult.findings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {scanResult.findings.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2">
          
          {/* Security Score Health Badge */}
          {scanResult && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400">Security Score:</span>
              <span className={`text-xs font-extrabold ${
                scanResult.securityScore >= 80 ? 'text-emerald-400' :
                scanResult.securityScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {scanResult.securityScore}/100 ({scanResult.grade})
              </span>
            </div>
          )}

          {/* Run Scan Button */}
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="btn-primary text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Code...' : 'Run Scan'}
          </button>

          {/* ZIP Import */}
          <button
            onClick={onImportZip}
            className="btn-secondary text-xs"
            title="Upload Source Code ZIP"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload ZIP</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={onExportPDF}
            className="btn-secondary text-xs"
            title="Download PDF Audit Report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>

          {/* GitHub Sync */}
          <button
            onClick={onOpenGitHub}
            className="btn-secondary text-xs"
            title="GitHub Repository Sync"
          >
            <GithubIcon className="w-3.5 h-3.5 text-slate-200" />
            <span className="hidden sm:inline">GitHub Sync</span>
          </button>

          {/* User Profile */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-2 border-l border-slate-800 ml-1"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-300">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};
