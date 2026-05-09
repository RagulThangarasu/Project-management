import React, { useState } from 'react';
import type { Task, User, TaskStatus, TaskList, Project } from '../types';
import { Trash2, Edit, Trash, Home, AlertCircle, Plus, Check, X as CloseIcon } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { Tooltip } from './ui/Tooltip';

interface TaskListViewProps {
  tasks: Task[];
  taskLists: TaskList[];
  activeProject: Project;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  onBackHome: () => void;
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

export const TaskListView = ({ 
  tasks = [], 
  taskLists = [], 
  activeProject, 
  updateTask, 
  deleteTask, 
  addTask,
  currentUser, 
  onTaskClick, 
  onBackHome 
}: TaskListViewProps) => {
  const [inlineCreatingListId, setInlineCreatingListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  if (!activeProject) return null;

  const projectTaskLists = taskLists.filter(tl => tl.projectId === activeProject.id);

  const handleCreateInlineTask = (listId: string) => {
    if (!newTaskTitle.trim()) return;
    
    addTask({
      title: newTaskTitle.trim(),
      description: '',
      status: 'open',
      priority: 'medium',
      type: 'task',
      taskListId: listId,
      assignee: currentUser
    });
    
    setNewTaskTitle('');
    setInlineCreatingListId(null);
  };

  if (projectTaskLists.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 'calc(100vh - 200px)', 
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: 'rgba(240, 72, 29, 0.05)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid rgba(240, 72, 29, 0.1)'
        }}>
          <AlertCircle size={48} color="var(--brand-orange)" style={{ opacity: 0.8 }} />
        </div>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>404</h2>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Task Lists Not Found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            There are no task lists configured for <strong>{activeProject.name}</strong> yet. 
            Create a list in the sidebar to get started.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={onBackHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 2rem' }}
        >
          <Home size={18} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingBottom: '3rem' }}>
      {projectTaskLists.map(taskList => {
        const listTasks = tasks.filter(t => t.taskListId === taskList.id);

        return (
          <div key={taskList.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-orange)' }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}>{taskList.name}</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>{listTasks.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {listTasks.map(task => {
                const sc = statusConfig[task.status] || statusConfig.open;
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: sc.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-muted)', minWidth: '75px' }}>{task.id}</span>
                    <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{
                        padding: '3px 10px', borderRadius: '12px', background: sc.bg, color: sc.color,
                        border: `1px solid ${sc.color}30`, fontSize: '0.7rem', fontWeight: 700
                      }}>
                        {sc.label}
                      </div>
                      
                      <span style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800,
                        textTransform: 'uppercase', background: pc.bg, color: pc.color, border: `1px solid ${pc.color}25`
                      }}>{task.priority}</span>
                    </div>

                    {task.assignee && (
                      <Tooltip content={task.assignee.name}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-orange), #ff7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
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
                );
              })}

              {/* Inline Task Creator */}
              {inlineCreatingListId === taskList.id ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--brand-orange)',
                  borderRadius: '12px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <input 
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateInlineTask(taskList.id);
                      if (e.key === 'Escape') setInlineCreatingListId(null);
                    }}
                    placeholder="Enter task name..."
                    style={{ flex: 1, background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: '0.95rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleCreateInlineTask(taskList.id)}
                      style={{ color: '#10b981' }}
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => setInlineCreatingListId(null)}
                      style={{ color: '#ef4444' }}
                    >
                      <CloseIcon size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="btn-ghost"
                  onClick={() => setInlineCreatingListId(taskList.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.75rem', 
                    padding: '0.75rem 1rem', width: '100%', 
                    borderRadius: '12px', color: 'var(--text-muted)',
                    fontSize: '0.85rem', fontWeight: 600,
                    border: '1px dashed rgba(255,255,255,0.06)'
                  }}
                >
                  <Plus size={16} /> Add Task
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
