import React, { useState } from 'react';
import { 
  X, 
  Check, 
  GitBranch, 
  GitCommit, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import type { GitHubConfig, Project } from '../types';
import { pushProjectToGitHub, type CommitLog } from '../services/githubService';

interface GitHubModalProps {
  project: Project;
  config: GitHubConfig;
  onSaveConfig: (cfg: GitHubConfig) => void;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  project,
  config,
  onSaveConfig,
  onClose
}) => {
  const [token, setToken] = useState(config.token || '');
  const [username, setUsername] = useState(config.username || 'vigil-dev');
  const [repo, setRepo] = useState(config.repo || project.githubRepo || 'org/repo-name');
  const [branch, setBranch] = useState(config.branch || project.githubBranch || 'main');
  const [commitMessage, setCommitMessage] = useState('security: remediated vulnerabilities via Vigil DevSecOps AI');
  
  const [isPushing, setIsPushing] = useState(false);
  const [logs, setLogs] = useState<CommitLog[]>([]);
  const [pushedSuccess, setPushedSuccess] = useState(false);

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPushing(true);

    const updatedConfig: GitHubConfig = {
      connected: true,
      token,
      username,
      repo,
      branch
    };
    onSaveConfig(updatedConfig);

    const result = await pushProjectToGitHub(project, updatedConfig, commitMessage);
    setLogs(prev => [result.log, ...prev]);
    setIsPushing(false);
    setPushedSuccess(true);
    setTimeout(() => setPushedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-xl w-full p-6 space-y-5 border-slate-700">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-white">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">1-Click GitHub Synchronization</h3>
              <p className="text-xs text-slate-400">Push verified, security-scanned code directly to GitHub</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handlePush} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">GitHub Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Target Branch</label>
              <div className="relative">
                <GitBranch className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Repository Identifier</label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="username/repository-name"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">GitHub Personal Access Token (PAT)</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Commit Message</label>
            <div className="relative">
              <GitCommit className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-8 pr-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {pushedSuccess ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Code Successfully Pushed to GitHub!
              </span>
            ) : (
              <span className="text-xs text-slate-400">Status: Verified & Scan Checked</span>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-xs">
                Close
              </button>

              <button
                type="submit"
                disabled={isPushing}
                className="btn-primary text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                {isPushing ? 'Pushing to GitHub...' : 'Commit & Push Code'}
              </button>
            </div>
          </div>
        </form>

        {/* Push Logs */}
        {logs.length > 0 && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Sync Log History</div>
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between text-slate-300">
                <span>[{log.timestamp}] {log.message}</span>
                <span className="text-emerald-400 font-bold">{log.status}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
