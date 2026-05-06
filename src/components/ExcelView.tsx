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
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={24} color="var(--accent-primary)" />
            Excel View
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Spreadsheet style overview of all project tasks.</p>
        </div>
        {selectedTasks.size > 0 && (
          <button 
            onClick={handleDeleteSelected}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'var(--status-closed)', color: '#fff', 
              border: 'none', padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem'
            }}
          >
            <Trash2 size={16} />
            Delete Selected ({selectedTasks.size})
          </button>
        )}
      </div>

      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        background: 'var(--bg-surface)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
            <tr>
              <th style={{ ...headerCellStyle, width: '40px' }}></th>
              <th style={headerCellStyle}>S.No</th>
              <th style={headerCellStyle}>Task Name</th>
              <th style={headerCellStyle}>Description</th>
              <th style={headerCellStyle}>Component Name</th>
              <th style={headerCellStyle}>Estimated Time</th>
              <th style={headerCellStyle}>Hours</th>
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
                  borderBottom: '1px solid var(--border-color-light)',
                  transition: 'background 0.2s',
                  background: selectedTasks.has(task.id) ? 'var(--bg-surface-hover)' : 'transparent'
                }}
                onMouseEnter={e => { if (!selectedTasks.has(task.id)) e.currentTarget.style.background = 'var(--bg-surface-hover)'; }}
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
                <td style={cellStyle}>{index + 1}</td>
                <td style={{ ...cellStyle, fontWeight: 500, maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>{task.title}</td>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'normal' }}>
                  <div style={{ wordBreak: 'break-word' }}>
                    {task.description ? stripHtml(task.description) : '-'}
                  </div>
                </td>
                <td style={{ ...cellStyle, color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'normal' }}>
                  <div style={{ wordBreak: 'break-word' }}>
                    {task.componentName || '-'}
                  </div>
                </td>
                <td style={cellStyle}>{task.estimatedTime || '-'}</td>
                <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {getLoggedHours(task.id)}h
                </td>
                <td style={cellStyle}>
                  {task.assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: '10px' }}>
                        {task.assignee.avatar}
                      </div>
                      <span>{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </td>
                <td style={cellStyle}>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: getStatusBg(task.status),
                    color: getStatusColor(task.status)
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tasks found for this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const headerCellStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '1rem',
  borderBottom: '2px solid var(--border-color)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

const cellStyle: React.CSSProperties = {
  padding: '1rem',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap'
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'var(--status-open)';
    case 'in_progress': return '#ffffff';
    case 'in_review': return '#ffffff';
    case 'closed': return '#ffffff';
    case 'backlog': return 'var(--status-backlog)';
    default: return 'var(--text-primary)';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'open': return 'rgba(71, 85, 105, 0.1)';
    case 'in_progress': return 'var(--status-inprogress)';
    case 'in_review': return 'var(--status-inreview)';
    case 'closed': return 'var(--status-closed)';
    case 'backlog': return 'rgba(100, 116, 139, 0.1)';
    default: return 'transparent';
  }
};
