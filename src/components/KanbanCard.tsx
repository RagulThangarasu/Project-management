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
      className="glass-card animate-fade-in"
      style={{
        ...style,
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            {...listeners}
            style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', touchAction: 'none' }}
            title="Drag to move"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </span>

          <span className={`tag tag-priority-${task.priority}`} style={{ borderRadius: '4px' }}>{task.priority}</span>
        </div>

        <div className="menu-container" style={{ position: 'relative' }} onPointerDown={e => e.stopPropagation()}>
          <button
            className="btn-icon"
            style={{ padding: '2px', background: 'transparent' }}
            onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <MoreHorizontal size={16} />
          </button>

          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onPointerDown={() => setShowMenu(false)} />
              <div className="glass" style={{ position: 'absolute', top: '100%', right: 0, width: '180px', background: 'rgba(31, 41, 55, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '0.5rem', zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</div>
                <button
                  className="menu-item"
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                >
                  Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
        {task.title}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{task.id}</span>
          {task.sprintId && (
            <span style={{ fontSize: '0.65rem', color: 'var(--brand-orange)', fontWeight: 600 }}>
              ★ {sprints.find(s => s.id === task.sprintId)?.name}
            </span>
          )}
        </div>
        
        <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: 'var(--brand-purple)', border: '1px solid var(--border-color)' }}>
          {task.assignee ? task.assignee.avatar : '?'}
        </div>
      </div>
    </div>
  );
};
