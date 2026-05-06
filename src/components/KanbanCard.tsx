import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, MessageSquare, Trash2, GripVertical } from 'lucide-react';
import type { Task, User, TaskStatus, Sprint } from '../types';
import { mockUsers } from '../data';

interface KanbanCardProps {
  task: Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  sprints: Sprint[];
}

export const KanbanCard = ({ task, updateTask, deleteTask, currentUser, onTaskClick, sprints }: KanbanCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);

  // Track whether the pointer moved enough to count as a drag (≥8px)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: task,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : (showMenu || showAssigneeMenu) ? 50 : 1,
    position: 'relative' as const,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          opacity: 0.1,
          background: 'var(--bg-surface-hover)',
          minHeight: 120,
          border: '2px dashed var(--border-color-light)',
          borderRadius: 'var(--radius-md)',
        }}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card animate-fade-in"
      onPointerDown={(e) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        didDragRef.current = false;
      }}
      onPointerMove={(e) => {
        if (pointerStartRef.current) {
          const dx = e.clientX - pointerStartRef.current.x;
          const dy = e.clientY - pointerStartRef.current.y;
          if (Math.sqrt(dx * dx + dy * dy) >= 8) {
            didDragRef.current = true;
          }
        }
      }}
      onClick={() => {
        if (didDragRef.current) return;      // dragged — skip modal
        if (showMenu || showAssigneeMenu) return;
        onTaskClick(task.id);
      }}
      {...attributes}
    >
      {/* Top row: drag handle + tags + menu */}
      <div className="card-tags" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Dedicated drag handle — drag ONLY starts from here */}
          <span
            {...listeners}
            style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', touchAction: 'none' }}
            title="Drag to move"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </span>

          <span className={`tag tag-priority-${task.priority}`}>{task.priority}</span>

          {task.sprintId && (
            <span className="tag" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
              ★ {sprints.find(s => s.id === task.sprintId)?.name ?? 'Sprint'}
            </span>
          )}
          {!task.sprintId && sprints[0] && (
            <span className="tag" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>
              ★ {sprints[0].name}
            </span>
          )}
          {task.previousSprintId && (
            <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
              Moved From Previous Sprint
            </span>
          )}
        </div>

        {/* ⋯ Context menu */}
        <div className="menu-container" style={{ position: 'relative' }} onPointerDown={e => e.stopPropagation()}>
          <button
            className="btn-icon"
            style={{ padding: '2px' }}
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onPointerDown={() => setShowMenu(false)} />
              <div className="menu-dropdown">
                <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Status</div>
                {['backlog', 'open', 'in_progress', 'in_review', 'closed'].map(s => (
                  <button
                    key={s}
                    className="menu-item"
                    onClick={e => { e.stopPropagation(); updateTask(task.id, { status: s as TaskStatus }); setShowMenu(false); }}
                  >
                    Move to {s.replace('_', ' ')}
                  </button>
                ))}

                {currentUser.role === 'admin' && (
                  <>
                    <div style={{ margin: '4px 0', height: 1, background: 'var(--border-color)' }} />
                    <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Sprint</div>
                    {sprints.map(s => (
                      <button
                        key={s.id}
                        className="menu-item"
                        style={{ fontWeight: (task.sprintId === s.id || (!task.sprintId && s.id === sprints[0]?.id)) ? 600 : 400,
                                 color: (task.sprintId === s.id || (!task.sprintId && s.id === sprints[0]?.id)) ? 'var(--accent-primary)' : undefined }}
                        onClick={e => {
                          e.stopPropagation();
                          updateTask(task.id, {
                            sprintId: s.id,
                            previousSprintId: task.sprintId && task.sprintId !== s.id ? task.sprintId : task.previousSprintId
                          });
                          setShowMenu(false);
                        }}
                      >
                        {s.id === sprints[0]?.id ? '★ ' : ''}{s.name}
                        {(task.sprintId === s.id || (!task.sprintId && s.id === sprints[0]?.id)) ? ' ✓' : ''}
                      </button>
                    ))}
                    <div style={{ margin: '4px 0', height: 1, background: 'var(--border-color)' }} />
                    <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Assign</div>
                    {mockUsers.map(u => (
                      <button
                        key={u.id}
                        className="menu-item"
                        onClick={e => { e.stopPropagation(); updateTask(task.id, { assignee: u }); setShowMenu(false); }}
                      >
                        {u.name}
                      </button>
                    ))}
                    <div style={{ margin: '4px 0', height: 1, background: 'var(--border-color)' }} />
                    <button
                      className="menu-item"
                      style={{ color: 'var(--priority-high)' }}
                      onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                    >
                      <Trash2 size={14} style={{ marginRight: 4 }} /> Delete
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="card-title" style={{ fontSize: '14px', fontWeight: 500, margin: '0.5rem 0' }}>
        {task.title}
      </div>

      {/* Footer: ID + assignee avatar */}
      <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)', alignItems: 'center' }}>
          <span className="card-id" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{task.id}</span>
          <span
            className="tag"
            style={{
              background: task.type === 'bug' ? 'rgba(239,68,68,0.1)' : task.type === 'story' ? 'rgba(59,130,246,0.1)' : 'var(--bg-surface-hover)',
              color: task.type === 'bug' ? '#ef4444' : task.type === 'story' ? '#3b82f6' : 'var(--text-muted)',
              fontSize: '0.65rem',
              padding: '2px 6px',
            }}
          >
            {task.type?.toUpperCase() || 'TASK'}
          </span>
          {(task.description || task.imageUrl) && <MessageSquare size={12} />}
        </div>

        <div style={{ position: 'relative' }} onPointerDown={e => e.stopPropagation()}>
          <div
            className="avatar"
            style={{ width: 24, height: 24, fontSize: 10, cursor: currentUser.role === 'admin' ? 'pointer' : 'default' }}
            onClick={e => { e.stopPropagation(); currentUser.role === 'admin' && setShowAssigneeMenu(!showAssigneeMenu); }}
            title={task.assignee?.name || 'Unassigned'}
          >
            {task.assignee ? task.assignee.avatar : '?'}
          </div>

          {showAssigneeMenu && currentUser.role === 'admin' && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onPointerDown={() => setShowAssigneeMenu(false)} />
              <div className="menu-dropdown">
                <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Assign To</div>
                <button
                  className="menu-item"
                  onClick={e => { e.stopPropagation(); updateTask(task.id, { assignee: undefined }); setShowAssigneeMenu(false); }}
                >
                  Unassigned
                </button>
                {mockUsers.map(u => (
                  <button
                    key={u.id}
                    className="menu-item"
                    onClick={e => { e.stopPropagation(); updateTask(task.id, { assignee: u }); setShowAssigneeMenu(false); }}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
