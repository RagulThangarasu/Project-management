import React from 'react';
import { BarChart2, Users, PieChart, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { Task, User, TaskStatus } from '../types';

interface MetricsViewProps {
  tasks: Task[];
  users: User[];
}

export const MetricsView = ({ tasks, users }: MetricsViewProps) => {
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const totalTasks = tasks.length;
  const closedTasks = statusCounts['closed'] || 0;
  const completionRate = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;

  const userMetrics = users.map(user => {
    const userTasks = tasks.filter(t => t.assignee?.id === user.id);
    return {
      user,
      total: userTasks.length,
      open: userTasks.filter(t => t.status === 'open').length,
      closed: userTasks.filter(t => t.status === 'closed').length,
      duplicate: userTasks.filter(t => t.status === 'duplicate').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress' || t.status === 'in_review').length
    };
  });

  const statusColors: Record<TaskStatus, string> = {
    backlog: 'var(--text-muted)',
    open: 'var(--status-open)',
    in_progress: 'var(--status-progress)',
    in_review: 'var(--status-review)',
    closed: 'var(--status-closed)',
    duplicate: '#f43f5e' // Rose/Pink for duplicate
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart2 size={28} color="var(--brand-orange)" />
          Project Metrics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Deep dive into your project's performance and team velocity.</p>
      </div>

      {/* Top Row: Overall Completion & Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Completion Ring */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '1.5rem' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle
                cx="80" cy="80" r="70"
                fill="transparent"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
              />
              <circle
                cx="80" cy="80" r="70"
                fill="transparent"
                stroke="var(--status-closed)"
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{completionRate}%</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completed</span>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>{closedTasks}</strong> of <strong>{totalTasks}</strong> tasks closed
          </p>
        </div>

        {/* Status Distribution Bars */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} /> Status Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(['open', 'in_progress', 'in_review', 'closed', 'duplicate'] as TaskStatus[]).map(status => {
              const count = statusCounts[status] || 0;
              const percentage = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{status.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 700 }}>{count} tasks ({Math.round(percentage)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: statusColors[status],
                        borderRadius: '4px',
                        transition: 'width 1s ease-out'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Metrics Table */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} /> Team Status Breakdown
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={tableHeaderStyle}>Assignee</th>
                <th style={tableHeaderStyle}>Total</th>
                <th style={{ ...tableHeaderStyle, color: 'var(--status-open)' }}>Open</th>
                <th style={{ ...tableHeaderStyle, color: 'var(--status-progress)' }}>In Progress</th>
                <th style={{ ...tableHeaderStyle, color: 'var(--status-closed)' }}>Closed</th>
                <th style={{ ...tableHeaderStyle, color: '#f43f5e' }}>Duplicate</th>
              </tr>
            </thead>
            <tbody>
              {userMetrics.map(({ user, total, open, closed, duplicate, inProgress }) => (
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.8rem', background: 'var(--brand-purple)' }}>
                        {user.avatar}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.role}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...tableCellStyle, fontWeight: 700 }}>{total}</td>
                  <td style={tableCellStyle}>{open}</td>
                  <td style={tableCellStyle}>{inProgress}</td>
                  <td style={tableCellStyle}>{closed}</td>
                  <td style={tableCellStyle}>{duplicate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '1rem',
  fontSize: '0.75rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-secondary)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '1.25rem 1rem',
  fontSize: '0.9rem'
};
