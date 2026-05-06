import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, closestCorners, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Task, User, TaskStatus, Sprint } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  tasks: Task[];
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  currentUser: User;
  onTaskClick: (taskId: string) => void;
  sprints: Sprint[];
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'open', title: 'Open' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'closed', title: 'Closed' }
];

export const KanbanBoard = ({ tasks, updateTask, deleteTask, reorderTasks, currentUser, onTaskClick, sprints }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [boardTasks, setBoardTasks] = useState<Task[]>(tasks);

  // Only start dragging after pointer moves ≥8px — prevents single-click jump
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Sync with props when not dragging
  useEffect(() => {
    if (!activeId) {
      setBoardTasks(tasks);
    }
  }, [tasks, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = boardTasks.find(t => t.id === activeId);
    const isOverTask = boardTasks.find(t => t.id === overId);
    
    if (!isActiveTask) return;

    const activeStatus = isActiveTask.status;
    let overStatus = isOverTask ? isOverTask.status : (overId as TaskStatus);

    if (activeStatus !== overStatus) {
      setBoardTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        
        const newTasks = [...prev];
        const [movedTask] = newTasks.splice(activeIndex, 1);
        movedTask.status = overStatus;
        
        if (overIndex >= 0) {
          newTasks.splice(overIndex, 0, movedTask);
        } else {
          newTasks.push(movedTask);
        }
        return newTasks;
      });
    } else if (activeId !== overId) {
      setBoardTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const overIndex = prev.findIndex(t => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prev;
        
        const newTasks = [...prev];
        const [movedTask] = newTasks.splice(activeIndex, 1);
        newTasks.splice(overIndex, 0, movedTask);
        return newTasks;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      setBoardTasks(tasks); // Revert on cancel
      return;
    }

    const taskId = active.id as string;
    
    // If dropped over a column
    let newStatus = over.id as TaskStatus;
    
    // If dropped over another task
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    }

    const currentTask = tasks.find(t => t.id === taskId);
    
    // We only commit changes at the end.
    if (currentTask && currentTask.status !== newStatus) {
      updateTask(taskId, { status: newStatus });
      // If we also changed order, we need to commit that too.
      // But updateTask handles status. We can call reorderTasks if it was dropped on another task.
      if (active.id !== over.id) {
        // Use timeout to let React batch updates cleanly
        setTimeout(() => reorderTasks(active.id as string, over.id as string), 0);
      }
    } else if (active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  const activeTask = boardTasks.find(t => t.id === activeId);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setBoardTasks(tasks);
      }}
    >
      <div className="board-canvas animate-fade-in">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={boardTasks.filter(t => t.status === col.id)}
            updateTask={updateTask}
            deleteTask={deleteTask}
            currentUser={currentUser}
            onTaskClick={onTaskClick}
            sprints={sprints}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.9, transform: 'scale(1.05)', transition: 'transform var(--transition-fast)', boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}>
            <KanbanCard 
              task={activeTask} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
              currentUser={currentUser} 
              onTaskClick={() => {}} 
              sprints={sprints}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
