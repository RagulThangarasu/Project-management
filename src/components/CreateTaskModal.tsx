import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskStatus, Project, TaskType, TaskList, Sprint } from '../types';
import { mockUsers } from '../data';
import { CustomSelect } from './CustomSelect';

interface CreateTaskModalProps {
  initialStatus: TaskStatus;
  activeProject: Project;
  taskLists: TaskList[];
  sprints: Sprint[];
  onClose: () => void;
  onAdd: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const CreateTaskModal = ({ initialStatus, activeProject, taskLists, sprints, onClose, onAdd }: CreateTaskModalProps) => {
  const projectTaskLists = taskLists.filter(tl => tl.projectId === activeProject.id);
  const projectSprints = sprints.filter(s => s.projectId === activeProject.id);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [type, setType] = useState<TaskType>('task');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [sprintId, setSprintId] = useState<string>('');
  const [taskListId, setTaskListId] = useState<string>(projectTaskLists[0]?.id || '');
  const [componentName, setComponentName] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !taskListId) return;

    onAdd({
      title,
      description,
      status,
      priority,
      type,
      taskListId,
      sprintId,
      componentName,
      estimatedTime,
      assignee: mockUsers.find(u => u.id === assigneeId)
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#1a202c',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content animate-slide-in" 
        onClick={e => e.stopPropagation()} 
        style={{ width: '90%', maxWidth: 500, padding: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Create New Task</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Task Title *</label>
            <input 
              autoFocus
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., Design the new homepage"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <CustomSelect
              label="Task List *"
              value={taskListId}
              options={projectTaskLists.map(tl => ({ id: tl.id, name: tl.name }))}
              onChange={setTaskListId}
            />

            <CustomSelect
              label="Sprint"
              value={sprintId}
              options={projectSprints.map(s => ({ id: s.id, name: s.name }))}
              onChange={setSprintId}
              placeholder="No Sprint"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Component Name</label>
              <input 
                type="text" 
                value={componentName}
                onChange={e => setComponentName(e.target.value)}
                placeholder="E.g., Sidebar, Auth Module"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Estimated Time</label>
              <input 
                type="text" 
                value={estimatedTime}
                onChange={e => setEstimatedTime(e.target.value)}
                placeholder="E.g., 4h, 2d"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <CustomSelect
              label="Status"
              value={status}
              options={[
                { id: 'backlog', name: 'Backlog' },
                { id: 'open', name: 'Open' },
                { id: 'in_progress', name: 'In Progress' },
                { id: 'in_review', name: 'In Review' },
                { id: 'closed', name: 'Closed' }
              ]}
              onChange={val => setStatus(val as TaskStatus)}
            />

            <CustomSelect
              label="Priority"
              value={priority}
              options={[
                { id: 'low', name: 'Low' },
                { id: 'medium', name: 'Medium' },
                { id: 'high', name: 'High' }
              ]}
              onChange={val => setPriority(val as Task['priority'])}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <CustomSelect
              label="Type"
              value={type}
              options={[
                { id: 'task', name: 'Task' },
                { id: 'story', name: 'Story' },
                { id: 'bug', name: 'Bug' }
              ]}
              onChange={val => setType(val as TaskType)}
            />

            <CustomSelect
              label="Assignee"
              value={assigneeId}
              options={mockUsers.map(u => ({ id: u.id, name: u.name }))}
              onChange={setAssigneeId}
              placeholder="Unassigned"
              maxHeight={130}
            />
          </div>

          <div>
            <label style={labelStyle}>Description (Optional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add more details..."
              style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '14px', padding: '0.625rem 1.25rem' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim() || !taskListId} style={{ fontSize: '14px', padding: '0.625rem 1.25rem' }}>Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

