import { useState, useEffect } from 'react';
import { FileText, Layout, List, CheckSquare, Clock, Plus, Layers, ChevronDown } from 'lucide-react';
import { mockUsers, mockProjects, mockTaskLists, initialTasks, initialTimeLogs } from './data';
import { api } from './api';
import type { Task, User, Project, TimeLog, TaskStatus, TaskList, Sprint } from './types';
import './App.css';

import { KanbanBoard } from './components/KanbanBoard';
import { TaskListView } from './components/TaskListView';
import { TimesheetView } from './components/TimesheetView';
import { DashboardView } from './components/DashboardView';
import { BacklogView } from './components/BacklogView';
import { TaskModal } from './components/TaskModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CustomSelect } from './components/CustomSelect';
import { ExcelView } from './components/ExcelView';
import { LoginScreen } from './components/LoginScreen';
import { AcceptInvite } from './components/AcceptInvite';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pm-currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pm-currentUser', JSON.stringify(user));
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pm-currentUser');
  };
  
  const visibleProjects = currentUser 
    ? mockProjects.filter(p => currentUser.role === 'admin' || p.members.includes(currentUser.id)) 
    : mockProjects;
  const [activeProject, setActiveProject] = useState<Project>(visibleProjects[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'backlog' | 'board' | 'list' | 'timesheet' | 'excel'>('dashboard');
  const [activeSprintId, setActiveSprintId] = useState<string | 'all'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creatingTaskStatus, setCreatingTaskStatus] = useState<TaskStatus | null>(null);

  const handleInviteUser = async (email: string) => {
    const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
    const res = await fetch(`${API_BASE}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return data.acceptLink;
  };

  const handleRemoveInvite = async (email: string) => {
    const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
    await fetch(`${API_BASE}/invites/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
  };

  const [isAddingTaskList, setIsAddingTaskList] = useState(false);
  const [newTaskListName, setNewTaskListName] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        let data = await api.getData();
        if (data.tasks.length === 0 && data.sprints.length === 0) {
          const defaultSprints = mockProjects.map(p => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' }));
          await api.seedData({ tasks: initialTasks, sprints: defaultSprints, taskLists: mockTaskLists, timeLogs: initialTimeLogs, users: mockUsers });
          data = await api.getData();
        } else if (!data.users || data.users.length === 0) {
          await api.seedData({ users: mockUsers });
          data = await api.getData();
        }
        const hashoutUsers = (data.users || []).filter((u: User) => u.email);
        setUsers(hashoutUsers);
        setTasks(data.tasks || []);
        setSprints(data.sprints || []);
        setTaskLists(data.taskLists || []);
        setTimeLogs(data.timeLogs || []);
        
        const firstProjectId = mockProjects[0]?.id;
        const first = data.sprints.find((s: Sprint) => s.projectId === firstProjectId);
        if (first) setActiveSprintId(first.id);
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load data', err);
        setTasks(initialTasks);
        setSprints(mockProjects.map(p => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' })));
        setTaskLists(mockTaskLists);
        setTimeLogs(initialTimeLogs);
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const userVisibleProjects = mockProjects.filter(p => currentUser.role === 'admin' || p.members.includes(currentUser.id));
    if (!userVisibleProjects.some(p => p.id === activeProject.id)) {
      setActiveProject(userVisibleProjects[0]);
    }
  }, [currentUser, activeProject.id]);

  useEffect(() => {
    const firstSprint = sprints.find((s: Sprint) => s.projectId === activeProject.id);
    if (firstSprint) setActiveSprintId(firstSprint.id);
  }, [activeProject.id, sprints]);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t: Task) => t.id === taskId ? { ...t, ...updates } : t));
    await api.updateTask(taskId, updates);
  };

  const deleteTask = async (taskId: string) => {
    setTasks(tasks.filter((t: Task) => t.id !== taskId));
    await api.deleteTask(taskId);
  };

  const deleteTasks = async (taskIds: string[]) => {
    setTasks(tasks.filter((t: Task) => !taskIds.includes(t.id)));
    await api.bulkDeleteTasks(taskIds);
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const prefix = taskData.type === 'bug' ? 'BUG' : taskData.type === 'story' ? 'STR' : 'TSK';
    
    const maxId = tasks.reduce((max: number, task: Task) => {
      const match = task.id.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    
    const newTask: Task = {
      ...taskData,
      id: `${prefix}-${maxId + 1}`,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
    setCreatingTaskStatus(null);
    await api.createTask(newTask);
  };

  const reorderTasks = async (activeId: string, overId: string) => {
    setTasks((prev: Task[]) => {
      const oldIndex = prev.findIndex((t: Task) => t.id === activeId);
      const newIndex = prev.findIndex((t: Task) => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newTasks = [...prev];
      const [movedItem] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedItem);
      return newTasks;
    });
    // In a real app we'd update sort order on backend here
  };

  const addTimeLog = async (log: Omit<TimeLog, 'id'>) => {
    const newLog: TimeLog = {
      ...log,
      id: `log-${Math.floor(Math.random() * 10000)}`
    };
    setTimeLogs([...timeLogs, newLog]);
    await api.createTimeLog(newLog);
  };

  const projectSprints = sprints.filter((s: Sprint) => s.projectId === activeProject.id);

  // The first sprint of the current project acts as "Sprint 1" — tasks with no sprintId belong here
  const firstProjectSprint = projectSprints[0];

  const projectTasks = tasks.filter((t: Task) => 
    taskLists.some((tl: TaskList) => tl.id === t.taskListId && tl.projectId === activeProject.id)
  );

  const filteredTasks = projectTasks.filter((t: Task) => {
    if (activeSprintId === 'all') return true;
    // Sprint 0: include tasks with no sprint AND tasks explicitly set to Sprint 0's ID
    if (firstProjectSprint && activeSprintId === firstProjectSprint.id) {
      return !t.sprintId || t.sprintId === firstProjectSprint.id;
    }
    return t.sprintId === activeSprintId;
  });

  if (!isLoaded) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Workspace...</div>;

  const isAcceptingInvite = window.location.pathname === '/accept-invite';

  if (isAcceptingInvite) {
    return <AcceptInvite />;
  }

  if (!currentUser) {
    return <LoginScreen users={users} setUsers={setUsers} onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
          <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style={{ height: '28px' }} />
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>Project Portal</div>
        </div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layout size={18} /> Dashboard
          </div>
          <div style={{ margin: '1rem 0', padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            CURRENT PROJECT
          </div>
          <div className={`nav-item ${activeTab === 'backlog' ? 'active' : ''}`} onClick={() => setActiveTab('backlog')}>
            <Layers size={18} /> Backlog
          </div>
          <div className={`nav-item ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
            <CheckSquare size={18} /> Task Board
          </div>
          <div className={`nav-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <List size={18} /> Task List
          </div>
          <div className={`nav-item ${activeTab === 'timesheet' ? 'active' : ''}`} onClick={() => setActiveTab('timesheet')}>
            <Clock size={18} /> Timesheets
          </div>
          <div className={`nav-item ${activeTab === 'excel' ? 'active' : ''}`} onClick={() => setActiveTab('excel')}>
            <FileText size={18} /> Excel View
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '0.75rem', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem', padding: '0 0.25rem' }}>TASK LISTS</div>
            {taskLists.filter((tl: TaskList) => tl.projectId === activeProject?.id).map((tl: TaskList) => (
              <div key={tl.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tl.name}</span>
              </div>
            ))}
            {isAddingTaskList ? (
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                <input
                  autoFocus
                  value={newTaskListName}
                  onChange={e => setNewTaskListName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTaskListName.trim()) {
                      const newTL = { id: `tl-${Date.now()}`, projectId: activeProject.id, name: newTaskListName.trim() };
                      setTaskLists([...taskLists, newTL]);
                      setNewTaskListName('');
                      setIsAddingTaskList(false);
                    }
                    if (e.key === 'Escape') { setIsAddingTaskList(false); setNewTaskListName(''); }
                  }}
                  placeholder="List name…"
                  style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.4rem', fontSize: '0.8rem', outline: 'none' }}
                />
                <button
                  onClick={async () => {
                    if (newTaskListName.trim()) {
                      const newTL = { id: `tl-${Date.now()}`, projectId: activeProject.id, name: newTaskListName.trim() };
                      setTaskLists([...taskLists, newTL]);
                      setNewTaskListName('');
                      setIsAddingTaskList(false);
                      await api.createTaskList(newTL);
                    }
                  }}
                  style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', padding: '0 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}
                >✓</button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTaskList(true)}
                style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', width: '100%' }}
              >
                <Plus size={12} /> New Task List
              </button>
            )}
          </div>
        </nav>

        {/* User Profile Logon - Persistent at Bottom */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem', position: 'relative' }}>
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.85rem', background: 'var(--accent-primary)', color: '#fff', border: 'none' }}>
              {currentUser.avatar}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>
                {currentUser.role}
              </span>
            </div>
          </div>

          {isProfileMenuOpen && (
            <div 
              style={{ 
                position: 'absolute', 
                bottom: 'calc(100% + 0.5rem)', 
                left: '1rem', 
                right: '1rem', 
                background: '#1F2937', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                padding: '0.5rem 0',
                zIndex: 100
              }}
            >
              <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>SWITCH USER</div>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {users.filter(u => u.id !== currentUser.id).map(u => (
                  <button 
                    key={u.id} 
                    className="menu-item" 
                    style={{ color: 'rgba(255,255,255,0.7)', padding: '0.5rem 1rem' }} 
                    onClick={() => { handleLogin(u); setIsProfileMenuOpen(false); }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
              <div style={{ margin: '4px 0', height: 1, background: 'rgba(255,255,255,0.05)' }} />
              <button 
                className="menu-item" 
                style={{ color: '#ef4444', padding: '0.5rem 1rem' }} 
                onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Project Name + Dropdown Switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)',
                  padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {activeProject.name}
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
              {isProjectMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setIsProjectMenuOpen(false)} />
                  <div className="menu-dropdown" style={{ left: 0, top: '100%', marginTop: '0.25rem', minWidth: 220, zIndex: 50 }}>
                    <div style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Switch Project</div>
                    {visibleProjects.map(p => (
                      <button
                        key={p.id}
                        className="menu-item"
                        style={{
                          fontWeight: p.id === activeProject.id ? 600 : 400,
                          color: p.id === activeProject.id ? 'var(--accent-primary)' : undefined
                        }}
                        onClick={() => { setActiveProject(p); setIsProjectMenuOpen(false); }}
                      >
                        {p.name} {p.id === activeProject.id ? ' ✓' : ''}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>SPRINT:</span>
            <CustomSelect 
              value={activeSprintId}
              onChange={(val) => setActiveSprintId(val)}
              options={[
                { id: 'all', name: 'All Sprints' },
                ...projectSprints.map((s: Sprint) => ({ id: s.id, name: s.name }))
              ]}
              variant="ghost"
              style={{ minWidth: '120px' }}
            />
            </div>
            <button 
              className="btn-icon" 
              onClick={async () => {
                const name = prompt('Enter new Sprint name:');
                if (name?.trim()) {
                  const newSprint = { id: `sp-${Date.now()}`, projectId: activeProject.id, name: name.trim() };
                  setSprints([...sprints, newSprint]);
                  setActiveSprintId(newSprint.id);
                  await api.createSprint(newSprint);
                }
              }}
              title="Create New Sprint"
            >
              <Plus size={16} />
            </button>
            <button className="btn btn-primary" onClick={() => setCreatingTaskStatus('open')}>
              <Plus size={16} /> Create Ticket
            </button>

            <div style={{ position: 'relative' }}>
              {/* User profile removed from header (now persistent in sidebar) */}
            </div>
          </div>
        </header>

        <div className="view-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={filteredTasks}
              timeLogs={timeLogs}
              currentUser={currentUser}
              allProjects={mockProjects}
              allTasks={tasks}
              taskLists={taskLists}
              onProjectClick={(project) => {
                setActiveProject(project);
                setActiveTab('board');
              }}
              onTaskClick={setSelectedTaskId}
              onInviteUser={handleInviteUser}
              onRemoveInvite={handleRemoveInvite}
            />
          )}
          {activeTab === 'backlog' && (
            <BacklogView tasks={filteredTasks} updateTask={updateTask} deleteTask={deleteTask} currentUser={currentUser} onTaskClick={setSelectedTaskId} onCreateTask={() => setCreatingTaskStatus('backlog')} />
          )}
          {activeTab === 'board' && (
            <KanbanBoard 
              tasks={filteredTasks.filter((t: Task) => t.status !== 'backlog')} 
              updateTask={updateTask} 
              deleteTask={deleteTask} 
              reorderTasks={reorderTasks}
              currentUser={currentUser} 
              onTaskClick={setSelectedTaskId}
              sprints={projectSprints}
            />
          )}
          {activeTab === 'list' && (
            <TaskListView tasks={filteredTasks} updateTask={updateTask} deleteTask={deleteTask} currentUser={currentUser} onTaskClick={setSelectedTaskId} />
          )}
          {activeTab === 'excel' && (
            <ExcelView 
              tasks={filteredTasks} 
              timeLogs={timeLogs} 
              onTaskClick={setSelectedTaskId} 
              onDeleteTasks={deleteTasks}
            />
          )}
          {activeTab === 'timesheet' && (
            <TimesheetView 
              timeLogs={timeLogs} 
              tasks={filteredTasks} 
              currentUser={currentUser} 
              addTimeLog={addTimeLog} 
            />
          )}
        </div>
        
        {selectedTaskId && (
          <TaskModal 
            task={tasks.find((t: Task) => t.id === selectedTaskId)!} 
            onClose={() => setSelectedTaskId(null)} 
            updateTask={updateTask} 
            currentUser={currentUser} 
            taskLists={taskLists}
            sprints={projectSprints}
          />
        )}
        
        {creatingTaskStatus && (
          <CreateTaskModal 
            initialStatus={creatingTaskStatus}
            activeProject={activeProject}
            taskLists={taskLists}
            sprints={sprints}
            onClose={() => setCreatingTaskStatus(null)}
            onAdd={addTask}
          />
        )}
      </main>
    </div>
  );
}

export default App;
