import React, { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { Task, TimeLog } from '../types';

interface ExcelViewProps {
  tasks: Task[];
  timeLogs: TimeLog[];
  onTaskClick: (taskId: string) => void;
  onDeleteTasks: (taskIds: string[]) => void;
}

export const ExcelView = ({ tasks, timeLogs, onTaskClick, onDeleteTasks }: ExcelViewProps) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setSelectedTasks(next);
  };

  const handleDeleteSelected = () => {
    if (selectedTasks.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)) {
      onDeleteTasks(Array.from(selectedTasks));
      setSelectedTasks(new Set());
    }
  };
  const getLoggedHours = (taskId: string) => {
    return timeLogs
      .filter(log => log.taskId === taskId)
      .reduce((sum, log) => sum + log.hours, 0);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
            <FileText size={28} color="var(--brand-orange)" />
            Task Ledger
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Comprehensive spreadsheet overview of project intelligence.</p>
        </div>
        {selectedTasks.size > 0 && (
          <button 
            className="btn btn-primary"
            onClick={handleDeleteSelected}
            style={{ background: 'var(--priority-high)', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)' }}
          >
            <Trash2 size={16} />
            Delete Selected ({selectedTasks.size})
          </button>
        )}
      </div>

      <div className="glass-card" style={{ 
        flex: 1, 
        overflow: 'auto', 
        background: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(58, 29, 93, 0.8)', backdropFilter: 'blur(10px)' }}>
            <tr>
              <th style={{ ...headerCellStyle, width: '40px' }}></th>
              <th style={headerCellStyle}>S.No</th>
              <th style={headerCellStyle}>Task Name</th>
              <th style={headerCellStyle}>Description</th>
              <th style={headerCellStyle}>Component</th>
              <th style={headerCellStyle}>Estimate</th>
              <th style={headerCellStyle}>Logged</th>
              <th style={headerCellStyle}>Assignee</th>
              <th style={headerCellStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr 
                key={task.id} 
                onClick={() => onTaskClick(task.id)}
                style={{ 
                  cursor: 'pointer', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'var(--transition)',
                  background: selectedTasks.has(task.id) ? 'rgba(240, 72, 29, 0.05)' : 'transparent'
                }}
                onMouseEnter={e => { if (!selectedTasks.has(task.id)) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                onMouseLeave={e => { if (!selectedTasks.has(task.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={cellStyle} onClick={e => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTask(task.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', fontWeight: 600 }}>{index + 1}</td>
                <td style={{ ...cellStyle, fontWeight: 600, maxWidth: '250px', whiteSpace: 'normal', color: '#fff' }}>{task.title}</td>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'normal', fontSize: '13px' }}>
                  <div style={{ wordBreak: 'break-word', opacity: 0.8 }}>
                    {task.description ? stripHtml(task.description) : '-'}
                  </div>
                </td>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'normal' }}>
                  <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                    {task.componentName || '-'}
                  </span>
                </td>
                <td style={{ ...cellStyle, fontWeight: 700 }}>{task.estimatedTime || '-'}</td>
                <td style={{ ...cellStyle, fontWeight: 800, color: 'var(--brand-orange)' }}>
                  {getLoggedHours(task.id)}h
                </td>
                <td style={cellStyle}>
                  {task.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: '10px', background: 'var(--brand-purple)' }}>
                        {task.assignee.avatar}
                      </div>
                      <span style={{ fontWeight: 500 }}>{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </td>
                <td style={cellStyle}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: getStatusBg(task.status),
                    color: getStatusColor(task.status)
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const headerCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '1.25rem 1rem',
  color: 'rgba(255, 255, 255, 0.5)',
  fontWeight: 800,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  whiteSpace: 'nowrap'
};

const cellStyle: React.CSSProperties = {
  padding: '1.25rem 1rem',
  color: 'var(--text-main)',
  whiteSpace: 'nowrap'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'var(--status-open)';
    case 'in_progress': return 'var(--status-progress)';
    case 'in_review': return 'var(--status-review)';
    case 'closed': return 'var(--status-closed)';
    case 'backlog': return 'var(--text-muted)';
    default: return 'var(--text-main)';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'open': return 'rgba(56, 189, 248, 0.1)';
    case 'in_progress': return 'rgba(251, 191, 36, 0.1)';
    case 'in_review': return 'rgba(168, 85, 247, 0.1)';
    case 'closed': return 'rgba(16, 185, 129, 0.1)';
    case 'backlog': return 'rgba(255, 255, 255, 0.05)';
    default: return 'transparent';
  }
};
