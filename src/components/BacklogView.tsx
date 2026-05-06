import { Play, MessageSquare } from 'lucide-react';
import type { Task, User } from '../types';

interface BacklogViewProps {
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onCreateTask: () => void;
}

export const BacklogView = ({ tasks, updateTask, currentUser, onTaskClick, onCreateTask }: BacklogViewProps) => {
  const backlogTasks = tasks.filter(t => t.status === 'backlog');

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Backlog</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Tasks that are prioritized but not yet active on the board.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onCreateTask} style={{ background: 'var(--bg-surface)' }}>
          + Add to Backlog
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {backlogTasks.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Your backlog is empty. Create a ticket and set its status to Backlog.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {backlogTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => onTaskClick(task.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1rem 1.5rem', 
                  borderBottom: '1px solid var(--border-color-light)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.875rem', width: '80px' }}>
                  {task.id}
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`tag tag-priority-${task.priority}`}>{task.priority}</span>
                  <span style={{ fontWeight: 500 }}>{task.title}</span>
                  {(task.description || task.imageUrl) && <MessageSquare size={14} color="var(--text-muted)" />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }} title={task.assignee?.name || 'Unassigned'}>
                    {task.assignee ? task.assignee.avatar : '?'}
                  </div>
                  
                  {currentUser.role === 'admin' && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => updateTask(task.id, { status: 'open' })}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
                      title="Move to Board"
                    >
                      <Play size={12} fill="currentColor" /> Move to Board
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
