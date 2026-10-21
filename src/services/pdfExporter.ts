import { jsPDF } from 'jspdf';
import type { Project, ScanResult } from '../types';

export function generateSecurityPDFReport(project: Project, scanResult: ScanResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Color Palette
  const textDark = '#1e293b';
  const textMuted = '#64748b';

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('VIGIL DevSecOps Audit Report', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(6, 182, 212); // cyan
  doc.text('Automated Cloud Security & Code Analysis', 14, 30);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date(scanResult.timestamp).toLocaleString()}`, pageWidth - 14, 25, { align: 'right' });

  // 2. Project Metadata Box
  let y = 50;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(textDark);
  doc.text(`Project Name: ${project.name}`, 20, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textMuted);
  doc.text(`Repository: ${project.githubRepo || 'Local Workspace'} | Branch: ${project.githubBranch || 'main'}`, 20, y + 18);
  doc.text(`Total Files Scanned: ${scanResult.totalFiles} | Total Security Findings: ${scanResult.findings.length}`, 20, y + 25);

  // 3. Security Score Card
  y += 38;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y, 70, 35, 4, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('SECURITY HEALTH SCORE', 20, y + 10);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  let scoreColor = '#22c55e'; // Green
  if (scanResult.securityScore < 70) scoreColor = '#f59e0b'; // Amber
  if (scanResult.securityScore < 50) scoreColor = '#ef4444'; // Red
  doc.setTextColor(scoreColor);
  doc.text(`${scanResult.securityScore} / 100`, 20, y + 24);

  doc.setFontSize(14);
  doc.text(`Grade: ${scanResult.grade}`, 75, y + 24, { align: 'right' });

  // Severity Summary Badges
  const badgeWidth = 25;
  const startX = 90;
  
  const statsList = [
    { label: 'CRITICAL', count: scanResult.stats.critical, color: [239, 68, 68] },
    { label: 'HIGH', count: scanResult.stats.high, color: [249, 115, 22] },
    { label: 'MEDIUM', count: scanResult.stats.medium, color: [234, 179, 8] },
    { label: 'LOW', count: scanResult.stats.low, color: [59, 130, 246] }
  ];

  statsList.forEach((stat, idx) => {
    const bx = startX + idx * (badgeWidth + 3);
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(bx, y, badgeWidth, 35, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${stat.count}`, bx + badgeWidth / 2, y + 18, { align: 'center' });

    doc.setFontSize(7);
    doc.text(stat.label, bx + badgeWidth / 2, y + 28, { align: 'center' });
  });

  // 4. Detailed Vulnerabilities Table Header
  y += 45;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(textDark);
  doc.text('Detailed Security Findings', 14, y);

  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('SEVERITY', 18, y + 5.5);
  doc.text('VULNERABILITY TITLE & CATEGORY', 50, y + 5.5);
  doc.text('FILE & LINE', 145, y + 5.5);
  doc.text('OWASP / CWE', 180, y + 5.5);

  y += 10;
  doc.setFont('helvetica', 'normal');

  scanResult.findings.forEach((finding) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    // Severity indicator badge
    let badgeColor: [number, number, number] = [239, 68, 68];
    if (finding.severity === 'HIGH') badgeColor = [249, 115, 22];
    if (finding.severity === 'MEDIUM') badgeColor = [234, 179, 8];
    if (finding.severity === 'LOW') badgeColor = [59, 130, 246];

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(16, y - 4, 24, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(finding.severity, 28, y, { align: 'center' });

    // Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(finding.title.substring(0, 48), 50, y);

    // File
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${finding.filePath}:${finding.line}`, 145, y);

    // OWASP
    doc.text(finding.owasp.split('-')[0].trim(), 180, y);

    // Code snippet
    y += 5;
    doc.setFillColor(248, 250, 252);
    doc.rect(50, y - 3, pageWidth - 68, 8, 'F');
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(225, 29, 72); // crimson snippet
    const cleanSnippet = finding.snippet.length > 70 ? finding.snippet.substring(0, 70) + '...' : finding.snippet;
    doc.text(`> ${cleanSnippet}`, 52, y + 2);

    y += 10;
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} — Confidential DevSecOps Audit Report (VIGIL Platform)`, pageWidth / 2, 288, { align: 'center' });
  }

  // Trigger download
  doc.save(`Vigil_Security_Report_${project.name.replace(/\s+/g, '_')}.pdf`);
}
