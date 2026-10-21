import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CodeEditor } from './components/CodeEditor';
import { ScannerResults } from './components/ScannerResults';
import { AIRemediationModal } from './components/AIRemediationModal';
import { GitHubModal } from './components/GitHubModal';
import { AuthModal } from './components/AuthModal';

import type { Project, ProjectFile, ScanResult, SecurityFinding, GitHubConfig, UserProfile } from './types';
import { DEFAULT_PROJECTS } from './data/defaultProjects';
import { performSecurityScan } from './services/scannerEngine';
import { generateSecurityPDFReport } from './services/pdfExporter';

export function App() {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(DEFAULT_PROJECTS[0]);
  const [activeFile, setActiveFile] = useState<ProjectFile>(DEFAULT_PROJECTS[0].files[0]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'findings'>('dashboard');
  const [scanResult, setScanResult] = useState<ScanResult | undefined>(undefined);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Modals state
  const [selectedFindingForAI, setSelectedFindingForAI] = useState<SecurityFinding | null>(null);
  const [showGitHubModal, setShowGitHubModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // GitHub Config & User
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    connected: false,
    username: 'vigil-lead',
    token: '',
    repo: 'vigil-org/ecommerce-node-api',
    branch: 'main'
  });

  const [user, setUser] = useState<UserProfile>({
    name: 'THAMJEED TV',
    email: 'thamjeed@iet.edu',
    role: 'Security Engineer',
    avatar: ''
  });

  const zipInputRef = useRef<HTMLInputElement>(null);

  // Run initial scan on load
  useEffect(() => {
    runScanForProject(activeProject);
  }, []);

  // When active project changes, switch active file & scan
  const handleSelectProject = (proj: Project) => {
    setActiveProject(proj);
    if (proj.files.length > 0) {
      setActiveFile(proj.files[0]);
    }
    runScanForProject(proj);
  };

  const runScanForProject = (proj: Project) => {
    setIsScanning(true);
    setTimeout(() => {
      const result = performSecurityScan(proj.files);
      setScanResult(result);
      // update project last scan
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, lastScan: result } : p));
      setActiveProject(prev => prev.id === proj.id ? { ...prev, lastScan: result } : prev);
      setIsScanning(false);
    }, 400);
  };

  // Update Code File Content
  const handleUpdateFileContent = (filePath: string, newContent: string) => {
    const updatedFiles = activeProject.files.map(f => 
      f.path === filePath ? { ...f, content: newContent } : f
    );
    const updatedProj = { ...activeProject, files: updatedFiles };
    
    setActiveProject(updatedProj);
    setActiveFile(prev => prev.path === filePath ? { ...prev, content: newContent } : prev);
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  // Add New File
  const handleAddFile = (fileName: string) => {
    const lang = fileName.endsWith('.py') ? 'python' :
                 fileName.endsWith('.json') ? 'json' :
                 fileName.endsWith('.java') ? 'java' : 'javascript';

    const newFile: ProjectFile = {
      path: fileName,
      name: fileName.split('/').pop() || fileName,
      language: lang as any,
      content: `// New file created in Vigil DevSecOps platform\n`
    };

    const updatedFiles = [...activeProject.files, newFile];
    const updatedProj = { ...activeProject, files: updatedFiles };
    setActiveProject(updatedProj);
    setActiveFile(newFile);
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    runScanForProject(updatedProj);
  };

  // Apply AI Security Patch
  const handleApplyAIFix = (finding: SecurityFinding, patchedCode: string) => {
    const targetFile = activeProject.files.find(f => f.path === finding.filePath);
    if (!targetFile) return;

    const fileLines = targetFile.content.split('\n');
    if (finding.line > 0 && finding.line <= fileLines.length) {
      fileLines[finding.line - 1] = patchedCode;
    }
    const newContent = fileLines.join('\n');
    handleUpdateFileContent(finding.filePath, newContent);

    // Rescan project
    setTimeout(() => {
      runScanForProject({
        ...activeProject,
        files: activeProject.files.map(f => f.path === finding.filePath ? { ...f, content: newContent } : f)
      });
    }, 200);
  };

  // ZIP File Import Handler
  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const extractedFiles: ProjectFile[] = [];

      for (const relativePath of Object.keys(zipContent.files)) {
        const zipObj = zipContent.files[relativePath];
        if (!zipObj.dir && !relativePath.includes('node_modules/') && !relativePath.includes('.git/')) {
          const content = await zipObj.async('string');
          const ext = relativePath.split('.').pop() || '';
          let lang: any = 'javascript';
          if (ext === 'py') lang = 'python';
          else if (ext === 'json') lang = 'json';
          else if (ext === 'java') lang = 'java';
          else if (ext === 'html') lang = 'html';
          else if (ext === 'css') lang = 'css';
          else if (ext === 'go') lang = 'go';

          extractedFiles.push({
            path: relativePath,
            name: relativePath.split('/').pop() || relativePath,
            language: lang,
            content
          });
        }
      }

      if (extractedFiles.length > 0) {
        const newProj: Project = {
          id: `proj-zip-${Date.now()}`,
          name: file.name.replace('.zip', ''),
          description: `Uploaded ZIP project containing ${extractedFiles.length} files.`,
          createdAt: new Date().toISOString(),
          files: extractedFiles
        };

        setProjects(prev => [newProj, ...prev]);
        handleSelectProject(newProj);
      }
    } catch (err) {
      alert('Failed to parse uploaded ZIP file. Please ensure it is a valid zip archive.');
    }
  };

  const handleExportPDF = () => {
    if (!scanResult) return;
    generateSecurityPDFReport(activeProject, scanResult);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Hidden File Input for ZIP Upload */}
      <input
        type="file"
        ref={zipInputRef}
        onChange={handleZipFileChange}
        accept=".zip"
        className="hidden"
      />

      {/* Navigation Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        scanResult={scanResult}
        onRunScan={() => runScanForProject(activeProject)}
        onImportZip={() => zipInputRef.current?.click()}
        onExportPDF={handleExportPDF}
        onOpenGitHub={() => setShowGitHubModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        user={user}
        isScanning={isScanning}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 px-4 pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            project={activeProject}
            scanResult={scanResult}
            onSelectFinding={(f) => {
              const file = activeProject.files.find(pf => pf.path === f.filePath);
              if (file) setActiveFile(file);
              setActiveTab('editor');
            }}
            onGoToEditor={() => setActiveTab('editor')}
            onOpenAIFix={(f) => setSelectedFindingForAI(f)}
          />
        )}

        {activeTab === 'editor' && (
          <CodeEditor
            project={activeProject}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onUpdateFileContent={handleUpdateFileContent}
            onAddFile={handleAddFile}
            findings={scanResult?.findings || []}
            onOpenAIFix={(f) => setSelectedFindingForAI(f)}
            onRunScan={() => runScanForProject(activeProject)}
            isScanning={isScanning}
          />
        )}

        {activeTab === 'findings' && (
          <ScannerResults
            scanResult={scanResult}
            onOpenAIFix={(f) => setSelectedFindingForAI(f)}
            onGoToEditor={(path) => {
              const file = activeProject.files.find(pf => pf.path === path);
              if (file) setActiveFile(file);
              setActiveTab('editor');
            }}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {selectedFindingForAI && (
        <AIRemediationModal
          finding={selectedFindingForAI}
          onClose={() => setSelectedFindingForAI(null)}
          onApplyFix={handleApplyAIFix}
        />
      )}

      {showGitHubModal && (
        <GitHubModal
          project={activeProject}
          config={githubConfig}
          onSaveConfig={setGithubConfig}
          onClose={() => setShowGitHubModal(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          user={user}
          onSaveUser={setUser}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Platform Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 bg-slate-950/60">
        VIGIL DevSecOps Cloud Platform — Cloud-Based Secure Code Analysis & DevSecOps Platform
      </footer>

    </div>
  );
}

export default App;
