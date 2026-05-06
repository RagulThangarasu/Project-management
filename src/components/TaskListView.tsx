import type { Task, User } from '../types';
import { mockTaskLists } from '../data';
import { Trash2 } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
}

export const TaskListView = ({ tasks, updateTask, deleteTask, currentUser, onTaskClick }: TaskListViewProps) => {
  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {mockTaskLists.map(taskList => {
        const listTasks = tasks.filter(t => t.taskListId === taskList.id);
        if (listTasks.length === 0) return null;

        return (
          <div key={taskList.id} style={{ marginBottom: '1rem' }}>
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
              {taskList.name} ({listTasks.length})
            </div>
            <table className="list-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>ID</th>
                  <th style={{ width: '40%' }}>Title</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '15%' }}>Priority</th>
                  <th style={{ width: '10%' }}>Assignee</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {listTasks.map(task => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => onTaskClick(task.id)}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{task.id}</td>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
                        style={{ padding: '0.25rem', borderRadius: '4px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td><span className={`tag tag-priority-${task.priority}`}>{task.priority}</span></td>
                    <td>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                        {task.assignee ? task.assignee.avatar : '?'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {currentUser.role === 'admin' && (
                        <button className="btn-icon" onClick={() => deleteTask(task.id)} style={{ color: 'var(--priority-high)' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};
