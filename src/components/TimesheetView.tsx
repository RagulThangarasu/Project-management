import { useState } from 'react';
import type { TimeLog, Task, User } from '../types';
import { mockUsers } from '../data';
import { Plus, Clock, Edit2, Trash2, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface TimesheetViewProps {
  timeLogs: TimeLog[];
  tasks: Task[];
  currentUser: User;
  addTimeLog: (log: Omit<TimeLog, 'id'>) => void;
  updateTimeLog: (logId: string, updates: Partial<TimeLog>) => void;
  deleteTimeLog: (logId: string) => void;
  users: User[];
}

export const TimesheetView = ({ timeLogs, tasks, currentUser, addTimeLog, updateTimeLog, deleteTimeLog, users }: TimesheetViewProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const totalHours = timeLogs.reduce((acc, log) => acc + log.hours, 0);

  const handleEdit = (log: TimeLog) => {
    setEditingLog(log);
    setSelectedTaskId(log.taskId);
    setHours(log.hours.toString());
    setDate(log.date);
    setNotes(log.notes || '');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingLog(null);
    setSelectedTaskId('');
    setHours('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !hours) return;

    if (editingLog) {
      updateTimeLog(editingLog.id, {
        taskId: selectedTaskId,
        date,
        hours: parseFloat(hours),
        notes
      });
    } else {
      addTimeLog({
        taskId: selectedTaskId,
        userId: currentUser.id,
        date,
        hours: parseFloat(hours),
        notes
      });
    }

    handleClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#1a202c',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: '#1a202c'
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Project Timesheet</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Total Hours Logged: <strong style={{ color: 'var(--text-primary)' }}>{totalHours} hrs</strong>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Log Time
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table className="list-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Date</th>
              <th style={{ width: '18%' }}>User</th>
              <th style={{ width: '25%' }}>Task</th>
              <th style={{ width: '8%' }}>Hours</th>
              <th style={{ width: '25%' }}>Notes</th>
              <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => {
              const task = tasks.find(t => t.id === log.taskId);
              const user = users.find(u => u.id === log.userId) || mockUsers.find(u => u.id === log.userId);
              const canEdit = currentUser.role === 'admin' || currentUser.id === log.userId;

              return (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{user?.avatar}</div>
                      <span>{user?.name}</span>
                    </div>
                  </td>
                  <td>{task ? task.title : 'Unknown Task'}</td>
                  <td style={{ fontWeight: 600 }}>{log.hours}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {log.notes ? (
                      <div dangerouslySetInnerHTML={{ __html: log.notes }} className="timesheet-notes" />
                    ) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleEdit(log)}
                          title="Edit Log"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this time log?')) {
                              deleteTimeLog(log.id);
                            }
                          }}
                          title="Delete Log"
                          style={{ color: 'var(--status-closed)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {timeLogs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <Clock size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  No time logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 800, minHeight: 600, display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingLog ? 'Edit Time Log' : 'Log Time'}</h2>
              <button className="btn-icon" onClick={handleClose}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', flex: 1 }}>
                <CustomSelect
                  label="Task"
                  value={selectedTaskId}
                  onChange={setSelectedTaskId}
                  options={tasks.map(t => ({ id: t.id, name: `${t.id} - ${t.title}` }))}
                  placeholder="Select a task..."
                  variant="form"
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Date</label>
                    <input 
                      type="date" 
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Hours</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0.1"
                      max="24"
                      required
                      value={hours}
                      onChange={e => setHours(e.target.value)}
                      placeholder="e.g. 2.5"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={labelStyle}>Work Description</label>
                  <ReactQuill 
                    theme="snow"
                    value={notes}
                    onChange={setNotes}
                    style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', height: '250px', display: 'flex', flexDirection: 'column', flex: 1, color: '#1a202c' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={handleClose} style={{ color: '#4a5568', borderColor: '#e2e8f0', background: '#f8fafc' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingLog ? 'Update Log' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
