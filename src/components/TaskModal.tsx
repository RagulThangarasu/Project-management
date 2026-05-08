import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { X, Image as ImageIcon, Upload, ChevronDown } from 'lucide-react';
import type { Task, User, TaskList, Sprint } from '../types';
import { mockUsers } from '../data';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  currentUser: User;
  taskLists: TaskList[];
  sprints: Sprint[];
}

const CustomSelect = ({ label, value, options, onChange, disabled, maxHeight = 200 }: { label: string, value: string, options: {id: string, name: string}[], onChange: (val: string) => void, disabled?: boolean, maxHeight?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.id === value);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{label}</label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          width: '100%', padding: '0.6rem 0.85rem', background: '#f1f5f9', 
          border: '1px solid #e2e8f0', color: '#1e293b', 
          borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: disabled ? 0.6 : 1,
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOption?.name || 'Select...'}</span>
        <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }} />
      </div>

      {isOpen && !disabled && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onPointerDown={() => setIsOpen(false)} />
          <div style={{ 
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: '#334155', // Dark grey for dropdown
            border: '1px solid #475569',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxHeight,
            overflowY: 'auto',
            padding: '0.25rem'
          }}>
            {options.map((opt) => (
              <button 
                key={opt.id} 
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  color: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all 0.2s ease',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const TaskModal = ({ task, onClose, updateTask, currentUser, taskLists, sprints }: TaskModalProps) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [isUploading, setIsUploading] = useState(false);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  // Sync state if task prop changes while modal is open
  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleSave = () => {
    updateTask(task.id, editedTask);
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        setEditedTask(prev => ({ ...prev, imageUrl: base64String }));
      } catch (err) {
        console.error("Failed to save image. It might be too large.", err);
        alert("Failed to save image. Please try a smaller file.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const canEdit = currentUser.role === 'admin' || task.assignee?.id === currentUser.id;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-content animate-slide-in" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 1000, width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '0.25rem' }}>{task.id}</div>
            {canEdit ? (
              <input 
                type="text"
                value={editedTask.title}
                onChange={e => setEditedTask(prev => ({ ...prev, title: e.target.value }))}
                style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.2, background: 'transparent', border: '1px solid transparent', color: 'var(--text-primary)', outline: 'none', width: '100%', padding: '0.25rem 0' }}
                placeholder="Task Title"
                onFocus={e => e.target.style.borderBottom = '1px solid var(--accent-primary)'}
                onBlur={e => e.target.style.borderBottom = '1px solid transparent'}
              />
            ) : (
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{editedTask.title}</h2>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
          {/* Main Content Area */}
          <div style={{ flex: 2, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
            
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Description
              </h3>
              <ReactQuill 
                theme="snow"
                value={editedTask.description || ''}
                onChange={content => setEditedTask(prev => ({ ...prev, description: content }))}
                modules={modules}
                readOnly={!canEdit}
                placeholder="Add a detailed description..."
                style={{ 
                  background: '#f8fafc', 
                  color: '#1e293b', 
                  opacity: canEdit ? 1 : 0.7,
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)'
                }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={18} /> Attachments
              </h3>
              
              {editedTask.imageUrl && (
                <div style={{ marginBottom: '1rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <img src={editedTask.imageUrl} alt="Task Attachment" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                </div>
              )}

              {canEdit && (
                <div>
                  <input 
                    type="file" 
                    id={`upload-${task.id}`} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor={`upload-${task.id}`} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', borderStyle: 'dashed', opacity: isUploading ? 0.5 : 1, background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px dashed #cbd5e1', color: '#475569' }}
                  >
                    <Upload size={16} /> {isUploading ? 'Uploading...' : editedTask.imageUrl ? 'Replace Image' : 'Upload Image'}
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Area */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              
              <CustomSelect 
                label="Status"
                value={editedTask.status}
                onChange={val => setEditedTask(prev => ({ ...prev, status: val as Task['status'] }))}
                options={[
                  { id: 'backlog', name: 'Backlog' },
                  { id: 'open', name: 'Open' },
                  { id: 'in_progress', name: 'In Progress' },
                  { id: 'in_review', name: 'In Review' },
                  { id: 'closed', name: 'Closed' }
                ]}
              />

              <CustomSelect 
                label="Priority"
                value={editedTask.priority}
                onChange={val => setEditedTask(prev => ({ ...prev, priority: val as Task['priority'] }))}
                options={[
                  { id: 'low', name: 'Low' },
                  { id: 'medium', name: 'Medium' },
                  { id: 'high', name: 'High' }
                ]}
              />

              <CustomSelect 
                label="Type"
                value={editedTask.type || 'task'}
                onChange={val => setEditedTask(prev => ({ ...prev, type: val as Task['type'] }))}
                options={[
                  { id: 'task', name: 'Task' },
                  { id: 'story', name: 'Story' },
                  { id: 'bug', name: 'Bug' }
                ]}
              />

              <CustomSelect 
                label="Sprint"
                value={editedTask.sprintId || (sprints[0]?.id ?? '')}
                onChange={val => setEditedTask(prev => ({ 
                  ...prev, 
                  sprintId: val,
                  previousSprintId: (task.sprintId || sprints[0]?.id) !== val
                    ? (task.sprintId || sprints[0]?.id)
                    : prev.previousSprintId
                }))}
                options={sprints.map(s => ({ id: s.id, name: s.name }))}
              />

              <CustomSelect 
                label="Task List"
                value={editedTask.taskListId}
                onChange={val => setEditedTask(prev => ({ ...prev, taskListId: val }))}
                options={taskLists.map(tl => ({ id: tl.id, name: tl.name }))}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Component Name</label>
                <input 
                  type="text"
                  disabled={!canEdit}
                  value={editedTask.componentName || ''}
                  onChange={e => setEditedTask(prev => ({ ...prev, componentName: e.target.value }))}
                  style={{ 
                    width: '100%', padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem'
                  }}
                  placeholder="E.g., Sidebar"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Estimated Time</label>
                <input 
                  type="text"
                  disabled={!canEdit}
                  value={editedTask.estimatedTime || ''}
                  onChange={e => setEditedTask(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  style={{ 
                    width: '100%', padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem'
                  }}
                  placeholder="E.g., 4h"
                />
              </div>

              <div>
                {currentUser.role === 'admin' ? (
                  <CustomSelect 
                    label="Assignee"
                    value={editedTask.assignee?.id || ''}
                    maxHeight={100}
                    onChange={val => {
                      const user = mockUsers.find(u => u.id === val);
                      setEditedTask(prev => ({ ...prev, assignee: user }));
                    }}
                    options={[
                      { id: '', name: 'Unassigned' },
                      ...mockUsers.map(u => ({ id: u.id, name: u.name }))
                    ]}
                  />
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Assignee</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      {editedTask.assignee ? (
                        <>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{editedTask.assignee.avatar}</div>
                          <span style={{ fontSize: '0.875rem' }}>{editedTask.assignee.name}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Save / Cancel Footer */}
            {canEdit && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={handleSave} style={{ width: '100%' }}>Save Changes</button>
                <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
