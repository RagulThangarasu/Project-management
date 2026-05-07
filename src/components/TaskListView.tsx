import type { Task, User, TaskStatus } from '../types';
import { mockTaskLists } from '../data';
import { Trash2, ChevronRight } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  in_progress: { label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  in_review:   { label: 'In Review',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  closed:      { label: 'Closed',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  duplicate:   { label: 'Duplicate',   color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  backlog:     { label: 'Backlog',     color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  high:   { color: '#fca5a5', bg: 'rgba(239,68,68,0.15)' },
  medium: { color: '#fcd34d', bg: 'rgba(245,158,11,0.15)' },
  low:    { color: '#93c5fd', bg: 'rgba(59,130,246,0.15)' },
};

export const TaskListView = ({ tasks, updateTask, deleteTask, currentUser, onTaskClick }: TaskListViewProps) => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {mockTaskLists.map(taskList => {
        const listTasks = tasks.filter(t => t.taskListId === taskList.id);
        if (listTasks.length === 0) return null;

        return (
          <div key={taskList.id}>
            {/* Section Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem', paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)'
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: 'var(--brand-orange)',
                boxShadow: '0 0 8px var(--brand-orange)'
              }} />
              <h3 style={{
                fontSize: '1rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#fff'
              }}>
                {taskList.name}
              </h3>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px',
                borderRadius: '20px', background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)'
              }}>
                {listTasks.length} tasks
              </span>
            </div>

            {/* Task Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {listTasks.map(task => {
                const sc = statusConfig[task.status] || statusConfig.open;
                const pc = priorityConfig[task.priority] || priorityConfig.medium;

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(240,72,29,0.35)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Left accent bar */}
                    <div style={{
                      width: '3px', height: '36px', borderRadius: '2px',
                      background: sc.color, flexShrink: 0
                    }} />

                    {/* Task ID */}
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace',
                      color: 'var(--text-muted)', minWidth: '70px'
                    }}>
                      {task.id}
                    </span>

                    {/* Title */}
                    <span style={{
                      flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#fff',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {task.title}
                    </span>

                    {/* Status Badge */}
                    <select
                      value={task.status}
                      onChange={e => { e.stopPropagation(); updateTask(task.id, { status: e.target.value as TaskStatus }); }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                        background: sc.bg, color: sc.color,
                        border: `1px solid ${sc.color}40`,
                        fontSize: '0.72rem', fontWeight: 700,
                        outline: 'none', appearance: 'none', textAlign: 'center',
                        minWidth: '95px'
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="closed">Closed</option>
                      <option value="duplicate">Duplicate</option>
                    </select>

                    {/* Priority Badge */}
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.05em', minWidth: '68px', textAlign: 'center',
                      background: pc.bg, color: pc.color,
                      border: `1px solid ${pc.color}30`
                    }}>
                      {task.priority}
                    </span>

                    {/* Assignee chip */}
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '120px' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--brand-orange), #ff7043)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, color: '#fff'
                        }}>
                          {task.assignee.avatar}
                        </div>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 700,
                          color: '#f9a74e', whiteSpace: 'nowrap'
                        }}>
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', minWidth: '120px' }}>
                        Unassigned
                      </span>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                      {currentUser.role === 'admin' && (
                        <button
                          className="btn-icon"
                          onClick={() => deleteTask(task.id)}
                          style={{ color: '#ef4444', padding: '0.4rem' }}
                          title="Delete task"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
