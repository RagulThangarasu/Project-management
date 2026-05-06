export type User = {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role: 'admin' | 'member';
};

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  members: string[]; // Array of user IDs
};

export type TaskList = {
  id: string;
  projectId: string;
  name: string;
};

export type Sprint = {
  id: string;
  projectId: string;
  name: string;
};

export type TaskStatus = 'backlog' | 'open' | 'in_progress' | 'in_review' | 'closed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'story' | 'bug' | 'task';

export type Task = {
  id: string;
  taskListId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  sprintId?: string;
  assignee?: User;
  createdAt: string;
  previousSprintId?: string;
  componentName?: string;
  estimatedTime?: string;
};

export type TimeLog = {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  notes?: string;
};
