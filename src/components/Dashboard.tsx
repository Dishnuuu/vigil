import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  PackageSearch, 
  AlertTriangle, 
  ArrowUpRight, 
  Sparkles, 
  FileCode2,
  Activity
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import type { Project, ScanResult, SecurityFinding } from '../types';

interface DashboardProps {
  project: Project;
  scanResult?: ScanResult;
  onSelectFinding: (finding: SecurityFinding) => void;
  onGoToEditor: () => void;
  onOpenAIFix: (finding: SecurityFinding) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  project,
  scanResult,
  onSelectFinding,
  onGoToEditor,
  onOpenAIFix
}) => {
  if (!scanResult) {
    return (
      <div className="glass-panel p-12 text-center max-w-xl mx-auto my-12">
        <ShieldCheck className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">No Security Scan Performed Yet</h2>
        <p className="text-sm text-slate-400 mb-6">Run automated SAST and secret analysis to view executive metrics and vulnerability reports.</p>
      </div>
    );
  }

  const { stats, securityScore, grade, findings, dependencies } = scanResult;

  // Chart Data Preparation
  const pieData = [
    { name: 'Critical', value: stats.critical, color: '#f43f5e' },
    { name: 'High', value: stats.high, color: '#f59e0b' },
    { name: 'Medium', value: stats.medium, color: '#eab308' },
    { name: 'Low', value: stats.low, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // OWASP Categories Breakdown
  const categoryCounts: Record<string, number> = {};
  findings.forEach(f => {
    const owaspShort = f.owasp.split('-')[0].trim();
    categoryCounts[owaspShort] = (categoryCounts[owaspShort] || 0) + 1;
  });

  const barData = Object.keys(categoryCounts).map(cat => ({
    category: cat,
    count: categoryCounts[cat]
  }));

  // Historical score mock trend
  const trendData = [
    { scan: 'Scan 1', score: Math.max(30, securityScore - 20) },
    { scan: 'Scan 2', score: Math.max(40, securityScore - 12) },
    { scan: 'Scan 3', score: Math.max(50, securityScore - 5) },
    { scan: 'Latest Scan', score: securityScore }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner & Security Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Security Health Score Card */}
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Health Score</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Grade: {grade}
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <h2 className={`text-5xl font-black font-heading ${
                securityScore >= 80 ? 'gradient-text-emerald' :
                securityScore >= 60 ? 'text-amber-400' : 'gradient-text-rose'
              }`}>
                {securityScore}
              </h2>
              <span className="text-xl font-bold text-slate-500">/ 100</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {securityScore >= 80 
                ? 'Excellent security posture. Minor recommendations remaining.' 
                : 'Action required! Critical vulnerabilities or secrets exposed.'}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Project: <strong className="text-slate-200">{project.name}</strong></span>
            <span>{scanResult.totalFiles} Files Scanned</span>
          </div>
        </div>

        {/* 4 Stat Counters Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="glass-panel p-5 flex flex-col justify-between glass-card-interactive">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Critical</span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-rose-400">{stats.critical}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Urgent Remediation</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.critical * 33)}%` }} />
            </div>
          </div>

          <div className="glass-panel p-5 flex flex-col justify-between glass-card-interactive">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">High Risk</span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-amber-400">{stats.high}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">High Priority</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, stats.high * 25)}%` }} />
            </div>
          </div>

          <div className="glass-panel p-5 flex flex-col justify-between glass-card-interactive">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Secrets Leak</span>
              <KeyRound className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-cyan-300">{stats.secrets}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">API / JWT Keys</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.min(100, stats.secrets * 50)}%` }} />
            </div>
          </div>

          <div className="glass-panel p-5 flex flex-col justify-between glass-card-interactive">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Outdated CVE</span>
              <PackageSearch className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="my-3">
              <div className="text-3xl font-black text-indigo-300">{dependencies.length}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Dependencies</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, dependencies.length * 33)}%` }} />
            </div>
          </div>

        </div>

      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Severity Distribution Donut */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Severity Distribution
          </h3>
          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No vulnerabilities detected!</p>
            )}
          </div>
        </div>

        {/* OWASP Top 10 Breakdown Bar */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            OWASP Categories
          </h3>
          <div className="h-48 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 flex h-full items-center justify-center">Clean scan!</p>
            )}
          </div>
        </div>

        {/* Security Score Trend Line */}
        <div className="glass-panel p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Security Score History
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="scan" stroke="#64748b" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Live Findings Feed */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-slate-100">Live Security Findings Stream</h3>
          </div>
          <button onClick={onGoToEditor} className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1">
            Open Interactive Editor <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {findings.slice(0, 5).map(finding => (
            <div 
              key={finding.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    finding.severity === 'CRITICAL' ? 'badge-critical' :
                    finding.severity === 'HIGH' ? 'badge-high' :
                    finding.severity === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {finding.severity}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">{finding.title}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{finding.owasp}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{finding.filePath}:{finding.line}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400 truncate max-w-md">{finding.snippet}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => onOpenAIFix(finding)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  1-Click AI Fix
                </button>

                <button
                  onClick={() => onSelectFinding(finding)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  View Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
