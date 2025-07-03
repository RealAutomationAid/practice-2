'use client'

import React, { useState } from 'react'
import { FileText, Download, Eye, Printer, CheckCircle, Bug, AlertTriangle, Clock, CheckCheck, XCircle, Zap, TrendingUp, Users, Calendar, Globe, Monitor } from 'lucide-react'
import { BugReportExtended } from './types'
import toast from 'react-hot-toast'

interface HTMLBugReportProps {
  bugs: BugReportExtended[]
  className?: string
}

export function HTMLBugReport({ bugs, className = '' }: HTMLBugReportProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getReportStats = () => {
    const total = bugs.length
    const open = bugs.filter(bug => bug.status === 'open').length
    const inProgress = bugs.filter(bug => bug.status === 'in_progress').length
    const resolved = bugs.filter(bug => bug.status === 'resolved').length
    const closed = bugs.filter(bug => bug.status === 'closed').length

    const severityBreakdown = {
      critical: bugs.filter(bug => bug.severity === 'critical').length,
      high: bugs.filter(bug => bug.severity === 'high').length,
      medium: bugs.filter(bug => bug.severity === 'medium').length,
      low: bugs.filter(bug => bug.severity === 'low').length
    }

    const priorityBreakdown = {
      urgent: bugs.filter(bug => bug.priority === 'urgent').length,
      high: bugs.filter(bug => bug.priority === 'high').length,
      medium: bugs.filter(bug => bug.priority === 'medium').length,
      low: bugs.filter(bug => bug.priority === 'low').length
    }

    const environments = bugs.reduce((acc, bug) => {
      if (bug.environment) {
        acc[bug.environment] = (acc[bug.environment] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const browsers = bugs.reduce((acc, bug) => {
      if (bug.browser) {
        acc[bug.browser] = (acc[bug.browser] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const reporters = bugs.reduce((acc, bug) => {
      if (bug.reporter_name) {
        acc[bug.reporter_name] = (acc[bug.reporter_name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const recentBugs = bugs.filter(bug => {
      if (!bug.created_at) return false
      const bugDate = new Date(bug.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return bugDate >= weekAgo
    }).length

    return { 
      total, open, inProgress, resolved, closed, 
      severityBreakdown, priorityBreakdown, 
      environments, browsers, reporters, recentBugs 
    }
  }

  const generateHTMLReport = () => {
    const stats = getReportStats()
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    })

    const chartData = {
      severityData: Object.entries(stats.severityBreakdown).map(([key, value]) => `["${key}", ${value}]`).join(','),
      statusData: `["Open", ${stats.open}], ["In Progress", ${stats.inProgress}], ["Resolved", ${stats.resolved}], ["Closed", ${stats.closed}]`,
      environmentData: Object.entries(stats.environments).slice(0, 5).map(([key, value]) => `["${key}", ${value}]`).join(','),
      browserData: Object.entries(stats.browsers).slice(0, 5).map(([key, value]) => `["${key}", ${value}]`).join(',')
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bug Report Dashboard - ${reportDate}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary-50: #eff6ff;
            --primary-100: #dbeafe;
            --primary-500: #3b82f6;
            --primary-600: #2563eb;
            --primary-700: #1d4ed8;
            --success-50: #f0fdf4;
            --success-500: #22c55e;
            --success-600: #16a34a;
            --warning-50: #fffbeb;
            --warning-500: #f59e0b;
            --warning-600: #d97706;
            --error-50: #fef2f2;
            --error-500: #ef4444;
            --error-600: #dc2626;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
        }

        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }

        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: var(--gray-700); 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 2rem; 
        }

        /* Header Styles */
        .header { 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            color: var(--gray-800);
            padding: 2.5rem; 
            border-radius: 20px; 
            margin-bottom: 2rem; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header h1 { 
            font-size: 3rem; 
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-subtitle {
            font-size: 1.125rem;
            color: var(--gray-600);
            font-weight: 500;
        }

        .header-meta {
            display: flex;
            gap: 2rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }

        .header-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--gray-50);
            padding: 0.75rem 1rem;
            border-radius: 12px;
            font-weight: 600;
            color: var(--gray-700);
        }

        /* Stats Grid */
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 1.5rem; 
            margin-bottom: 3rem; 
        }

        .stat-card { 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 2rem; 
            border-radius: 20px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--accent-color);
        }

        .stat-card.total { --accent-color: var(--primary-500); }
        .stat-card.open { --accent-color: var(--error-500); }
        .stat-card.progress { --accent-color: var(--warning-500); }
        .stat-card.resolved { --accent-color: var(--success-500); }
        .stat-card.closed { --accent-color: var(--gray-500); }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .stat-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--accent-color);
            color: white;
        }

        .stat-number { 
            font-size: 3rem; 
            font-weight: 800; 
            color: var(--gray-800);
            line-height: 1;
        }

        .stat-label { 
            color: var(--gray-600); 
            font-size: 1rem; 
            font-weight: 600;
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            margin-top: 0.5rem;
        }

        .stat-change {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--success-600);
            margin-top: 0.5rem;
        }

        /* Charts Section */
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .chart-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .chart-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .chart-container {
            position: relative;
            height: 300px;
        }

        /* Bug List Styles */
        .bugs-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            margin-bottom: 2rem;
        }

        .bugs-header {
            background: var(--gray-50);
            padding: 2rem;
            border-bottom: 1px solid var(--gray-200);
        }

        .bugs-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--gray-800);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .bug-item {
            padding: 2rem;
            border-bottom: 1px solid var(--gray-100);
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .bug-item:hover {
            background: var(--gray-50);
        }

        .bug-item:last-child {
            border-bottom: none;
        }

        .bug-main {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 2rem;
            margin-bottom: 1.5rem;
        }

        .bug-content {
            min-width: 0;
        }

        .bug-title { 
            font-weight: 700; 
            font-size: 1.25rem; 
            color: var(--gray-800);
            margin-bottom: 0.75rem;
            line-height: 1.4;
        }

        .bug-description { 
            color: var(--gray-600); 
            font-size: 1rem; 
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .bug-badges {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            align-items: center;
        }

        .badge { 
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem; 
            border-radius: 12px; 
            font-size: 0.875rem; 
            font-weight: 600;
            text-transform: capitalize;
            border: 1px solid;
        }

        /* Severity badges with icons */
        .badge.severity-critical { 
            background: var(--error-50); 
            color: var(--error-700);
            border-color: var(--error-200);
        }
        .badge.severity-high { 
            background: var(--warning-50); 
            color: var(--warning-700);
            border-color: var(--warning-200);
        }
        .badge.severity-medium { 
            background: var(--primary-50); 
            color: var(--primary-700);
            border-color: var(--primary-200);
        }
        .badge.severity-low { 
            background: var(--success-50); 
            color: var(--success-700);
            border-color: var(--success-200);
        }

        /* Status badges with icons */
        .badge.status-open { 
            background: var(--error-50); 
            color: var(--error-700);
            border-color: var(--error-200);
        }
        .badge.status-in_progress { 
            background: var(--warning-50); 
            color: var(--warning-700);
            border-color: var(--warning-200);
        }
        .badge.status-resolved { 
            background: var(--success-50); 
            color: var(--success-700);
            border-color: var(--success-200);
        }
        .badge.status-closed { 
            background: var(--gray-50); 
            color: var(--gray-700);
            border-color: var(--gray-200);
        }

        /* Priority badges */
        .badge.priority-urgent { 
            background: var(--error-50); 
            color: var(--error-700);
            border-color: var(--error-200);
        }
        .badge.priority-high { 
            background: var(--warning-50); 
            color: var(--warning-700);
            border-color: var(--warning-200);
        }
        .badge.priority-medium { 
            background: var(--primary-50); 
            color: var(--primary-700);
            border-color: var(--primary-200);
        }
        .badge.priority-low { 
            background: var(--success-50); 
            color: var(--success-700);
            border-color: var(--success-200);
        }

        .bug-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1.5rem;
            padding: 1.5rem;
            background: var(--gray-50);
            border-radius: 12px;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .meta-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--gray-500);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .meta-value {
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--gray-700);
        }

        .bug-details {
            margin-top: 1.5rem;
            padding: 1.5rem;
            background: var(--gray-50);
            border-radius: 12px;
            display: none;
        }

        .bug-details.expanded {
            display: block;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .detail-section {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid var(--gray-200);
        }

        .detail-title {
            font-weight: 700;
            color: var(--gray-800);
            margin-bottom: 1rem;
            font-size: 1rem;
        }

        .detail-content {
            color: var(--gray-600);
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .detail-section.full-width {
            grid-column: 1 / -1;
        }

        .attachments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .attachment-item {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-radius: 8px;
            padding: 0.75rem;
            text-align: center;
        }

        .attachment-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 6px;
            cursor: pointer;
            transition: opacity 0.2s ease;
        }

        .attachment-image:hover {
            opacity: 0.8;
        }

        .attachment-video {
            width: 100%;
            height: 120px;
            border-radius: 6px;
        }

        .attachment-file {
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 6px;
            transition: background-color 0.2s ease;
        }

        .attachment-file:hover {
            background: var(--gray-100);
        }

        .file-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .attachment-label {
            margin-top: 0.5rem;
            font-size: 0.75rem;
            color: var(--gray-600);
            font-weight: 500;
        }

        .expand-toggle {
            background: var(--primary-500);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
        }

        .expand-toggle:hover {
            background: var(--primary-600);
            transform: translateY(-1px);
        }

        /* Footer */
        .footer { 
            margin-top: 4rem; 
            padding: 3rem; 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            text-align: center; 
            color: var(--gray-600);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .footer h3 {
            color: var(--gray-800);
            font-weight: 700;
            margin-bottom: 1rem;
        }

        /* Responsive Design */
        @media (max-width: 768px) { 
            .container {
                padding: 1rem;
            }
            
            .header {
                padding: 1.5rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .stats-grid { 
                grid-template-columns: 1fr;
            }
            
            .charts-section {
                grid-template-columns: 1fr;
            }
            
            .bug-main {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .bug-meta {
                grid-template-columns: 1fr;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
            }
            
            .container {
                max-width: none;
                padding: 1rem;
            }
            
            .stat-card, .chart-card, .bugs-section {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid var(--gray-200);
            }
        }

        /* Interactive Elements */
        .interactive-legend {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 1rem;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--gray-600);
        }

        .legend-color {
            width: 1rem;
            height: 1rem;
            border-radius: 4px;
        }

        /* Animation for smooth interactions */
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
    <script>
        // Interactive functionality
        function toggleBugDetails(bugId) {
            const details = document.getElementById('details-' + bugId);
            const button = document.getElementById('toggle-' + bugId);
            
            if (details.classList.contains('expanded')) {
                details.classList.remove('expanded');
                button.textContent = 'Show Details';
            } else {
                details.classList.add('expanded');
                button.textContent = 'Hide Details';
                details.classList.add('fade-in');
            }
        }

        // Initialize charts when page loads
        window.addEventListener('load', function() {
            // Severity Distribution Chart
            const severityCtx = document.getElementById('severityChart');
            if (severityCtx) {
                new Chart(severityCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Critical', 'High', 'Medium', 'Low'],
                        datasets: [{
                            data: [${stats.severityBreakdown.critical}, ${stats.severityBreakdown.high}, ${stats.severityBreakdown.medium}, ${stats.severityBreakdown.low}],
                            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20
                                }
                            }
                        }
                    }
                });
            }

            // Status Distribution Chart
            const statusCtx = document.getElementById('statusChart');
            if (statusCtx) {
                new Chart(statusCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                        datasets: [{
                            data: [${stats.open}, ${stats.inProgress}, ${stats.resolved}, ${stats.closed}],
                            backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#6b7280'],
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: '#f3f4f6'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
            }
        });
    </script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🐛 Bug Report Dashboard</h1>
            <div class="header-subtitle">Comprehensive Bug Analysis & Tracking Report</div>
            <div class="header-meta">
                <div class="header-meta-item">
                    <span>📅</span>
                    Generated: ${reportDate}
                </div>
                <div class="header-meta-item">
                    <span>📊</span>
                    Total Issues: ${stats.total}
                </div>
                <div class="header-meta-item">
                    <span>🔥</span>
                    Active Issues: ${stats.open + stats.inProgress}
                </div>
                <div class="header-meta-item">
                    <span>📈</span>
                    This Week: ${stats.recentBugs} new
                </div>
            </div>
        </header>

        <!-- Statistics Overview -->
        <section class="stats-grid">
            <div class="stat-card total">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Issues</div>
                        <div class="stat-change">All time</div>
                    </div>
                    <div class="stat-icon">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="stat-card open">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">${stats.open}</div>
                        <div class="stat-label">Open Issues</div>
                        <div class="stat-change">Needs attention</div>
                    </div>
                    <div class="stat-icon">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="stat-card progress">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">${stats.inProgress}</div>
                        <div class="stat-label">In Progress</div>
                        <div class="stat-change">Being worked on</div>
                    </div>
                    <div class="stat-icon">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="stat-card resolved">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">${stats.resolved}</div>
                        <div class="stat-label">Resolved</div>
                        <div class="stat-change">Ready for testing</div>
                    </div>
                    <div class="stat-icon">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="stat-card closed">
                <div class="stat-header">
                    <div>
                        <div class="stat-number">${stats.closed}</div>
                        <div class="stat-label">Closed</div>
                        <div class="stat-change">Completed</div>
                    </div>
                    <div class="stat-icon">
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </section>

        <!-- Charts Section -->
        <section class="charts-section">
            <div class="chart-card">
                <div class="chart-title">
                    🎯 Severity Distribution
                </div>
                <div class="chart-container">
                    <canvas id="severityChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <div class="chart-title">
                    📊 Status Overview
                </div>
                <div class="chart-container">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
        </section>

        <!-- Bug Details Section -->
        <section class="bugs-section">
            <div class="bugs-header">
                <div class="bugs-title">
                    🐛 Bug Details (${bugs.length} items)
                </div>
            </div>
            
            ${bugs.map(bug => `
                <div class="bug-item">
                    <div class="bug-main">
                        <div class="bug-content">
                            <h3 class="bug-title">${bug.title || 'Untitled Bug'}</h3>
                            <div class="bug-description">${bug.description || 'No description provided'}</div>
                            
                            <div class="bug-badges">
                                <span class="badge severity-${bug.severity || 'medium'}">
                                    ${bug.severity === 'critical' ? '🔥' : bug.severity === 'high' ? '⚠️' : bug.severity === 'medium' ? '📋' : '🟢'} 
                                    ${(bug.severity || 'medium').charAt(0).toUpperCase() + (bug.severity || 'medium').slice(1)} Severity
                                </span>
                                <span class="badge priority-${bug.priority || 'medium'}">
                                    ${bug.priority === 'urgent' ? '🚨' : bug.priority === 'high' ? '⭐' : bug.priority === 'medium' ? '📝' : '⬇️'} 
                                    ${(bug.priority || 'medium').charAt(0).toUpperCase() + (bug.priority || 'medium').slice(1)} Priority
                                </span>
                                <span class="badge status-${bug.status || 'open'}">
                                    ${bug.status === 'open' ? '🔴' : bug.status === 'in_progress' ? '🟡' : bug.status === 'resolved' ? '🟢' : '⚫'} 
                                    ${(bug.status || 'open').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                            </div>
                        </div>
                        
                        <div>
                            <button class="expand-toggle" id="toggle-${bug.id}" onclick="toggleBugDetails('${bug.id}')">
                                Show Details
                            </button>
                        </div>
                    </div>
                    
                    <div class="bug-meta">
                        <div class="meta-item">
                            <div class="meta-label">Reporter</div>
                            <div class="meta-value">${bug.reporter_name || 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Environment</div>
                            <div class="meta-value">${bug.environment || 'Not specified'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Browser</div>
                            <div class="meta-value">${bug.browser || 'Unknown'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Device</div>
                            <div class="meta-value">${bug.device || 'Not specified'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">OS</div>
                            <div class="meta-value">${bug.os || 'Unknown'}</div>
                        </div>
                                                 <div class="meta-item">
                             <div class="meta-label">Created</div>
                             <div class="meta-value">${bug.created_at ? new Date(bug.created_at).toLocaleDateString() : 'Unknown'}</div>
                         </div>
                        <div class="meta-item">
                            <div class="meta-label">URL</div>
                            <div class="meta-value">${bug.url || 'Not provided'}</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-label">Email</div>
                            <div class="meta-value">${bug.reporter_email || 'Not provided'}</div>
                        </div>
                    </div>
                    
                    <div class="bug-details" id="details-${bug.id}">
                        <div class="details-grid">
                            <div class="detail-section">
                                <div class="detail-title">🔄 Steps to Reproduce</div>
                                <div class="detail-content">${bug.steps_to_reproduce || 'No steps provided'}</div>
                            </div>
                            
                            <div class="detail-section">
                                <div class="detail-title">✅ Expected Result</div>
                                <div class="detail-content">${bug.expected_result || 'No expected result provided'}</div>
                            </div>
                            
                            <div class="detail-section">
                                <div class="detail-title">❌ Actual Result</div>
                                <div class="detail-content">${bug.actual_result || 'No actual result provided'}</div>
                            </div>
                            
                            <div class="detail-section">
                                <div class="detail-title">🏷️ Tags</div>
                                <div class="detail-content">${bug.tags ? (Array.isArray(bug.tags) ? bug.tags.join(', ') : bug.tags) : 'No tags'}</div>
                            </div>
                            
                            ${bug.attachment_urls && bug.attachment_urls.length > 0 ? `
                            <div class="detail-section full-width">
                                <div class="detail-title">📎 Attachments (${bug.attachment_urls.length})</div>
                                <div class="detail-content">
                                    <div class="attachments-grid">
                                        ${bug.attachment_urls.map((url, index) => {
                                          const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                          const isVideo = url.toLowerCase().match(/\.(mp4|webm|avi|mov|wmv|flv)$/i)
                                          
                                          if (isImage) {
                                            return `<div class="attachment-item">
                                              <img src="${url}" alt="Attachment ${index + 1}" class="attachment-image" onclick="window.open('${url}', '_blank')" />
                                              <div class="attachment-label">Image ${index + 1}</div>
                                            </div>`
                                          } else if (isVideo) {
                                            return `<div class="attachment-item">
                                              <video src="${url}" class="attachment-video" controls preload="metadata"></video>
                                              <div class="attachment-label">Video ${index + 1}</div>
                                            </div>`
                                          } else {
                                            return `<div class="attachment-item">
                                              <div class="attachment-file" onclick="window.open('${url}', '_blank')">
                                                <div class="file-icon">📄</div>
                                                <div class="attachment-label">File ${index + 1}</div>
                                              </div>
                                            </div>`
                                          }
                                        }).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </section>

        <!-- Footer -->
        <footer class="footer">
            <h3>🎯 Report Summary</h3>
            <p>This comprehensive bug report provides detailed insights into all reported issues, their current status, and key metrics for tracking progress. Generated automatically from the bug tracking system with real-time data.</p>
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--gray-200);">
                <p style="font-size: 0.875rem; color: var(--gray-500);">
                    Report generated on ${reportDate} • Total bugs: ${stats.total} • Active issues: ${stats.open + stats.inProgress}
                </p>
            </div>
        </footer>
    </div>
</body>
</html>`
  }

  const downloadHTMLReport = () => {
    setIsGenerating(true)
    
    try {
      const htmlContent = generateHTMLReport()
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bug-report-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('HTML report downloaded successfully!')
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate HTML report')
    } finally {
      setIsGenerating(false)
    }
  }

  const previewReport = () => {
    const htmlContent = generateHTMLReport()
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const printReport = () => {
    const htmlContent = generateHTMLReport()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">HTML Bug Report</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={previewReport}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button
            onClick={printReport}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={downloadHTMLReport}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Enhanced HTML report with interactive features, modern design, and comprehensive bug details</span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          The report includes visual charts, detailed bug information, responsive design, and interactive elements for better user experience.
        </div>
      </div>
    </div>
  )
} 