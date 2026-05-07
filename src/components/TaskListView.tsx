import type { Task, User, TaskStatus } from '../types';
import { mockTaskLists } from '../data';
import { Trash2, ChevronRight, Edit, Trash } from 'lucide-react';
import { FixedSizeList } from 'react-window';
import { Dropdown } from './ui/Dropdown';
import { Tooltip } from './ui/Tooltip';

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: 'calc(100vh - 200px)' }}>
      {mockTaskLists.map(taskList => {
        const listTasks = tasks.filter(t => t.taskListId === taskList.id);
        if (listTasks.length === 0) return null;

        const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
          const task = listTasks[index];
          const sc = statusConfig[task.status] || statusConfig.open;
          const pc = priorityConfig[task.priority] || priorityConfig.medium;

          return (
            <div style={{ ...style, padding: '4px 0' }}>
              <div
                onClick={() => onTaskClick(task.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  height: '56px',
                  boxSizing: 'border-box'
                }}
                className="hover-card"
              >
                <div style={{ width: '3px', height: '24px', borderRadius: '2px', background: sc.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '70px' }}>{task.id}</span>
                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                  <select
                    value={task.status}
                    onChange={e => updateTask(task.id, { status: e.target.value as any })}
                    style={{
                      padding: '2px 8px', borderRadius: '12px', background: sc.bg, color: sc.color,
                      border: `1px solid ${sc.color}40`, fontSize: '0.7rem', fontWeight: 700, outline: 'none'
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <span style={{
                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                    textTransform: 'uppercase', background: pc.bg, color: pc.color, border: `1px solid ${pc.color}30`
                  }}>{task.priority}</span>
                </div>

                {task.assignee && (
                  <Tooltip content={task.assignee.name}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-orange), #ff7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>
                      {task.assignee.avatar}
                    </div>
                  </Tooltip>
                )}

                <Dropdown 
                  items={[
                    { label: 'Edit', onClick: () => onTaskClick(task.id), icon: <Edit size={14}/> },
                    { label: 'Delete', onClick: () => deleteTask(task.id), icon: <Trash size={14}/>, variant: 'danger' }
                  ]} 
                />
              </div>
            </div>
          );
        };

        return (
          <div key={taskList.id} style={{ display: 'flex', flexDirection: 'column', height: listTasks.length > 5 ? '400px' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-orange)' }} />
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}>{taskList.name}</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>{listTasks.length}</span>
            </div>

            <div style={{ flex: 1 }}>
              <FixedSizeList
                height={Math.min(listTasks.length * 64, 400)}
                itemCount={listTasks.length}
                itemSize={64}
                width="100%"
              >
                {Row}
              </FixedSizeList>
            </div>
          </div>
        );
      })}
    </div>
  );
};
