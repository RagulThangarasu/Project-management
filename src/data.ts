import type { User, Project, TaskList, Task, TimeLog } from './types';

export const mockUsers: User[] = [];

export const mockProjects: Project[] = [
  { id: 'p1', name: 'Website Redesign', description: 'Overhaul of the main corporate website.', color: '#6366f1', members: [] },
  { id: 'p2', name: 'Mobile App V2', description: 'Development of the new React Native app.', color: '#10b981', members: [] }
];

export const mockTaskLists: TaskList[] = [
  { id: 'tl1', projectId: 'p1', name: 'Design Phase' },
  { id: 'tl2', projectId: 'p1', name: 'Frontend Development' },
  { id: 'tl3', projectId: 'p2', name: 'Core Infrastructure' }
];

export const initialTasks: Task[] = [
  {
    id: 'TSK-101',
    taskListId: 'tl1',
    title: 'Create wireframes for landing page',
    status: 'closed',
    priority: 'high',
    type: 'task',
    componentName: 'UI Design',
    estimatedTime: '4h',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TSK-102',
    taskListId: 'tl1',
    title: 'Finalize color palette',
    status: 'in_review',
    priority: 'medium',
    type: 'task',
    componentName: 'Branding',
    estimatedTime: '2h',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TSK-103',
    taskListId: 'tl2',
    title: 'Implement responsive navbar',
    status: 'in_progress',
    priority: 'high',
    type: 'task',
    componentName: 'Frontend',
    estimatedTime: '6h',
    createdAt: new Date().toISOString()
  },
  {
    id: 'TSK-104',
    taskListId: 'tl2',
    title: 'Setup authentication routing',
    status: 'open',
    priority: 'high',
    type: 'task',
    componentName: 'Auth Module',
    estimatedTime: '8h',
    createdAt: new Date().toISOString()
  }
];

export const initialTimeLogs: TimeLog[] = [];

