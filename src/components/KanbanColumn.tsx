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
    <div className="kanban-column">
      <div className="column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{title}</span>
          <span className="column-count">{filteredTasks.length}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            className="btn-icon" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            style={{ 
              color: filterType !== 'all' ? 'var(--accent-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Filter size={14} />
            <span style={{ textTransform: 'capitalize' }}>{filterType}</span>
          </button>
          
          {isFilterOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onPointerDown={() => setIsFilterOpen(false)} />
              <div className="menu-dropdown" style={{ right: 0, top: '100%', marginTop: '0.25rem', width: '120px' }}>
                <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Filter by Type</div>
                <button className="menu-item" onClick={() => { setFilterType('all'); setIsFilterOpen(false); }}>
                  All
                </button>
                <button className="menu-item" onClick={() => { setFilterType('task'); setIsFilterOpen(false); }}>
                  Tasks
                </button>
                <button className="menu-item" onClick={() => { setFilterType('story'); setIsFilterOpen(false); }}>
                  Stories
                </button>
                <button className="menu-item" onClick={() => { setFilterType('bug'); setIsFilterOpen(false); }}>
                  Bugs
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div 
        className="column-body" 
        ref={setNodeRef}
        style={{
          backgroundColor: isOver ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          transition: 'background-color 0.2s ease'
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
