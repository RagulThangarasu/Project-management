import type { Task, Sprint, TaskList, TimeLog, Project } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'https://hashout-jira-backend.onrender.com/api';

export const api = {
  async getData() {
    const res = await fetch(`${API_URL}/data`);
    return res.json();
  },
  async seedData(data: any) {
    const res = await fetch(`${API_URL}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async createTask(task: Task) {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    return res.json();
  },
  async updateTask(id: string, updates: Partial<Task>) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async deleteTask(id: string) {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async bulkDeleteTasks(ids: string[]) {
    const res = await fetch(`${API_URL}/tasks/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    return res.json();
  },
  async createSprint(sprint: Sprint) {
    const res = await fetch(`${API_URL}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sprint)
    });
    return res.json();
  },
  async createTaskList(taskList: TaskList) {
    const res = await fetch(`${API_URL}/task_lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskList)
    });
    return res.json();
  },
  async deleteTaskList(id: string) {
    const res = await fetch(`${API_URL}/task_lists/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createTimeLog(log: TimeLog) {
    const res = await fetch(`${API_URL}/time_logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    return res.json();
  },
  async createProject(project: Project) {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return res.json();
  },
  async deleteProject(id: string) {
    const res = await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
    return res.json();
  }
};
