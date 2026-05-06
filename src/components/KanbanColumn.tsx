import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Filter } from 'lucide-react';
import type { Task, User, TaskStatus, TaskType, Sprint } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  sprints: Sprint[];
}

export const KanbanColumn = ({ id, title, tasks, updateTask, deleteTask, currentUser, onTaskClick, sprints }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredTasks = filterType === 'all' ? tasks : tasks.filter(t => t.type === filterType);

  return (
    <div className="glass-card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'rgba(255, 255, 255, 0.02)', 
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: 'var(--radius-lg)',
      height: '100%',
      minWidth: '280px'
    }}>
      <div style={{ 
        padding: '1.25rem', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-main)' }}>
            {title}
          </h3>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '2px 8px', 
            borderRadius: '10px',
            color: 'var(--text-secondary)'
          }}>
            {filteredTasks.length}
          </span>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-icon" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{ color: filterType !== 'all' ? 'var(--brand-orange)' : 'var(--text-muted)' }}
          >
            <Filter size={14} />
          </button>
          
          {isFilterOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onPointerDown={() => setIsFilterOpen(false)} />
              <div className="glass" style={{ position: 'absolute', top: '100%', right: 0, width: '140px', background: 'rgba(31, 41, 55, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '0.5rem', zIndex: 50, marginTop: '0.5rem' }}>
                {['all', 'task', 'story', 'bug'].map(type => (
                  <button 
                    key={type}
                    className="menu-item" 
                    style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: filterType === type ? 'var(--brand-orange)' : '#fff', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize' }}
                    onClick={() => { setFilterType(type as any); setIsFilterOpen(false); }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: isOver ? 'rgba(240, 72, 29, 0.05)' : 'transparent',
          transition: 'var(--transition)',
          minHeight: '200px',
          overflowY: 'auto'
        }}
      >
        <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {filteredTasks.map(task => (
            <KanbanCard key={task.id} task={task} updateTask={updateTask} deleteTask={deleteTask} currentUser={currentUser} onTaskClick={onTaskClick} sprints={sprints} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
