// Build: 2026-05-07T14:40:00Z
import { useState, useEffect } from 'react';
import { FileText, Layout, List, CheckSquare, Clock, Plus, Layers, ChevronDown, BarChart2, X } from 'lucide-react';
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
import { MetricsView } from './components/MetricsView';
import { LoginScreen } from './components/LoginScreen';
import { AcceptInvite } from './components/AcceptInvite';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ResetPassword } from './components/ResetPassword';
import { Dropdown } from './components/ui/Dropdown';
import { Tooltip } from './components/ui/Tooltip';
import { AdminView } from './components/AdminView';
import { Shield } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        syncUser(fbUser);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  async function syncUser(fbUser: any) {
    const cleanEmail = fbUser.email?.toLowerCase();
    const userRef = doc(db, 'users', fbUser.uid);
    
    try {
      const userSnap = await getDoc(userRef);
      let userData: User;

      if (userSnap.exists()) {
        userData = userSnap.data() as User;
        console.log('✅ User profile loaded from Firestore:', userData);
      } else {
        // Create new user profile in Firestore
        const nameParts = cleanEmail.split('@')[0].split('.');
        const formattedName = nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        
        // Check for hardcoded admin access
        const isAdmin = ['ragul.thangarasu@hashouttech.com', 'ragul.thnagarasu@hashouttech.com', 'ragul.thangarasi@hashouttech.com'].includes(cleanEmail);
        
        userData = {
          id: fbUser.uid,
          name: formattedName,
          email: cleanEmail,
          avatar: nameParts.map((p: string) => p.charAt(0).toUpperCase()).join('').substring(0, 2),
          role: isAdmin ? 'admin' : 'member',
          preferences: {
            theme: 'dark',
            defaultTab: 'dashboard'
          }
        };

        await setDoc(userRef, userData);
        console.log('🆕 New user profile created in Firestore');
      }

      // Also sync to legacy backend for backward compatibility if needed, but Firestore is now primary
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'https://hashout-jira-backend.onrender.com/api';
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      } catch (err) {
        console.warn('Backend sync failed (Firestore is active):', err);
      }

      setCurrentUser(userData);
    } catch (error) {
      console.error('❌ Firestore sync error:', error);
      // Fallback to basic user object if Firestore fails
      setCurrentUser({
        id: fbUser.uid,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: '??',
        role: 'member'
      });
    }
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };
  
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const visibleProjects = currentUser 
    ? projects.filter(p => currentUser.role === 'admin' || p.members.includes(currentUser.id) || currentUser.role === 'member') 
    : projects;
  const [activeProject, setActiveProject] = useState<Project>(visibleProjects[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'backlog' | 'board' | 'list' | 'timesheet' | 'excel' | 'metrics' | 'admin'>('dashboard');
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
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false);

  const handleInviteUser = async (email: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'https://hashout-jira-backend.onrender.com/api';
    const res = await fetch(`${API_BASE}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    return data.acceptLink;
  };

  const handleRemoveInvite = async (email: string) => {
    const API_BASE = import.meta.env.VITE_API_URL || 'https://hashout-jira-backend.onrender.com/api';
    await fetch(`${API_BASE}/invites/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
  };

  const [isAddingTaskList, setIsAddingTaskList] = useState(false);
  const [newTaskListName, setNewTaskListName] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      // Example of how to fetch from Supabase
      // const { data: sbTasks } = await supabase.from('tasks').select('*');
      // if (sbTasks) setTasks(sbTasks);

      // Use a timeout so we never hang forever if the backend is cold/down
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000));

      try {
        setIsBackendWaking(true);
        const result = await Promise.race([
          api.getData(),
          timeout
        ]);

        // If timeout won (result === null), fall back to local data
        if (!result) {
          throw new Error('Backend timeout – using local data');
        }

        let data = result as any;
        if (!data) throw new Error('No data received from backend');

        // Robust checks for data structure
        const safeTasks = data.tasks || [];
        const safeSprints = data.sprints || [];
        const safeUsers = data.users || [];

        // Only seed if projects AND users are both empty (fresh DB)
        if ((!data.projects || data.projects.length === 0) && (!data.users || data.users.length === 0)) {
          const defaultSprints = mockProjects.map(p => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' }));
          await api.seedData({ tasks: initialTasks, sprints: defaultSprints, taskLists: mockTaskLists, timeLogs: initialTimeLogs, users: mockUsers, projects: mockProjects });
          data = await api.getData();
        } else if (safeUsers.length === 0) {
          await api.seedData({ users: mockUsers });
          data = await api.getData();
        }

        const hashoutUsers = (data.users || []).filter((u: User) => u.email);
        setUsers(hashoutUsers.length > 0 ? hashoutUsers : mockUsers);
        
        const loadedProjects = data.projects || [];
        setProjects(loadedProjects.length > 0 ? loadedProjects : (data.projects ? [] : mockProjects));
        
        setTasks(data.tasks || initialTasks);
        setSprints(data.sprints || loadedProjects.map((p: Project) => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' })));
        setTaskLists(data.taskLists || mockTaskLists);
        setTimeLogs(data.timeLogs || initialTimeLogs);

        const firstProjectId = loadedProjects[0]?.id;
        const first = (data.sprints || []).find((s: Sprint) => s.projectId === firstProjectId);
        if (first) setActiveSprintId(first.id);
        
        setIsBackendWaking(false);
      } catch (err: any) {
        console.warn('Backend connection issue (using offline mode):', err);
        setIsBackendWaking(true); 
        
        // Fallback to localStorage OR mock data
        const localProjects = localStorage.getItem('hashout_projects');
        const localTasks = localStorage.getItem('hashout_tasks');
        const localLists = localStorage.getItem('hashout_task_lists');
        const localSprints = localStorage.getItem('hashout_sprints');

        if (localProjects) {
          setProjects(JSON.parse(localProjects));
          setTasks(localTasks ? JSON.parse(localTasks) : initialTasks);
          setTaskLists(localLists ? JSON.parse(localLists) : mockTaskLists);
          setSprints(localSprints ? JSON.parse(localSprints) : []);
          setUsers(mockUsers);
          setTimeLogs(initialTimeLogs);
        } else {
          setUsers(mockUsers);
          setProjects(mockProjects);
          setTasks(initialTasks);
          setSprints(mockProjects.map(p => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' })));
          setTaskLists(mockTaskLists);
          setTimeLogs(initialTimeLogs);
        }
      } finally {
        setIsLoaded(true);
        setTimeout(() => setIsBackendWaking(false), 8000);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const userVisibleProjects = projects.filter(p => currentUser.role === 'admin' || p.members.includes(currentUser.id) || currentUser.role === 'member');
    if (userVisibleProjects.length > 0 && !userVisibleProjects.some(p => p.id === activeProject.id)) {
      setActiveProject(userVisibleProjects[0]);
    }
  }, [currentUser, activeProject.id, projects]);

  // Persist to localStorage for Offline Mode
  useEffect(() => {
    if (isLoaded && projects.length > 0) {
      localStorage.setItem('hashout_projects', JSON.stringify(projects));
      localStorage.setItem('hashout_tasks', JSON.stringify(tasks));
      localStorage.setItem('hashout_task_lists', JSON.stringify(taskLists));
      localStorage.setItem('hashout_sprints', JSON.stringify(sprints));
    }
  }, [isLoaded, projects, tasks, taskLists, sprints]);

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
      if (!task || !task.id || typeof task.id !== 'string') return max;
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

  const addProject = async (name: string, description: string, color: string) => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name,
      description,
      color,
      members: currentUser ? [currentUser.id] : []
    };
    setProjects([...projects, newProject]);
    await api.createProject(newProject);
    
    // Also create a default sprint for it
    const defaultSprint = { id: `sp-${newProject.id}-1`, projectId: newProject.id, name: 'Sprint 0' };
    setSprints([...sprints, defaultSprint]);
    await api.createSprint(defaultSprint);
  };

  const deleteProject = async (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    await api.deleteProject(id);
    if (activeProject.id === id && projects.length > 1) {
      setActiveProject(projects.find(p => p.id !== id) || projects[0]);
    }
  };

  const addTaskList = async (name: string) => {
    const newList: TaskList = {
      id: `tl-${Date.now()}`,
      projectId: activeProject.id,
      name
    };
    setTaskLists([...taskLists, newList]);
    await api.createTaskList(newList);
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

  if (!isLoaded) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '2rem'
    }}>
      {/* Animated ring */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg style={{ animation: 'spin 1.2s linear infinite', width: '80px', height: '80px' }}>
          <circle cx="40" cy="40" r="30" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
          <circle cx="40" cy="40" r="30" fill="transparent" stroke="var(--brand-orange)" strokeWidth="6"
            strokeDasharray="60 130" strokeLinecap="round"/>
        </svg>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%,-50%)', 
          width: '36px', 
          height: '36px', 
          backgroundColor: '#ffffff',
          maskImage: 'url(https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg)',
          WebkitMaskImage: 'url(https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg)',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center'
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Loading Workspace</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Connecting to Hashout intelligence…</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'center' }}>
          Server is waking up. This may take a minute.
        </p>
        <button 
          className="btn btn-secondary" 
          style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          onClick={() => {
            setIsLoaded(true);
            setLoadError(null);
            // Fallback to local data
            setUsers(mockUsers);
            setTasks(initialTasks);
            const loadedProjects = mockProjects;
            setProjects(loadedProjects);
            setSprints(loadedProjects.map((p: Project) => ({ id: `sp-${p.id}-1`, projectId: p.id, name: 'Sprint 0' })));
            setTaskLists(mockTaskLists);
            setTimeLogs(initialTimeLogs);
            setIsBackendWaking(true); 
          }}
        >
          Skip & Use Offline Mode
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (loadError && !currentUser) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Workspace Load Failed</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '2rem', lineHeight: 1.6 }}>
        {loadError}
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry Connection</button>
        <button className="btn btn-secondary" onClick={() => { setLoadError(null); setIsLoaded(true); }}>Use Offline Mode</button>
      </div>
    </div>
  );

  const isAcceptingInvite = window.location.pathname === '/accept-invite';
  const isResettingPassword = window.location.pathname === '/reset-password';

  if (isAcceptingInvite) {
    return <AcceptInvite />;
  }

  if (isResettingPassword) {
    return <ResetPassword />;
  }

  if (!currentUser) {
    return <LoginScreen users={users} setUsers={setUsers} onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar" style={{ background: 'rgba(58, 29, 93, 0.3)', borderRight: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}>
        <div className="sidebar-header" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color-light)', marginBottom: '1rem' }}>
          <div style={{ 
            width: '120px', 
            height: '28px', 
            backgroundColor: '#ffffff',
            maskImage: 'url(https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg)',
            WebkitMaskImage: 'url(https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'left center',
            WebkitMaskPosition: 'left center'
          }} />
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

          <div style={{ margin: '1.5rem 0 0.5rem', padding: '0 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            TASK LISTS
            <button 
              onClick={() => setIsAddingTaskList(!isAddingTaskList)} 
              className="btn-icon" 
              style={{ padding: 0, color: isAddingTaskList ? 'var(--brand-orange)' : 'var(--text-muted)' }}
            >
              {isAddingTaskList ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {isAddingTaskList && (
            <div style={{ padding: '0 0.75rem 0.5rem' }}>
              <input 
                autoFocus
                value={newTaskListName}
                onChange={e => setNewTaskListName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTaskListName.trim()) {
                    addTaskList(newTaskListName.trim());
                    setNewTaskListName('');
                    setIsAddingTaskList(false);
                  }
                  if (e.key === 'Escape') {
                    setIsAddingTaskList(false);
                    setNewTaskListName('');
                  }
                }}
                placeholder="New list name..."
                style={{ 
                  width: '100%', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--brand-orange)', 
                  color: '#fff', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
          
          {taskLists.filter(tl => tl.projectId === activeProject.id).map(tl => (
            <div 
              key={tl.id} 
              className="nav-item" 
              onClick={() => setActiveTab('list')}
              style={{ paddingLeft: '1.5rem', fontSize: '0.85rem' }}
            >
              <List size={14} /> {tl.name}
            </div>
          ))}
          <div className={`nav-item ${activeTab === 'excel' ? 'active' : ''}`} onClick={() => setActiveTab('excel')}>
            <FileText size={18} /> Excel View
          </div>
          <div className={`nav-item ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>
            <BarChart2 size={18} /> Metrics
          </div>

          {currentUser && currentUser.role === 'admin' && (
            <div 
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{ 
                marginTop: '0.5rem',
                color: 'var(--brand-orange)',
                background: activeTab === 'admin' ? 'rgba(240, 72, 29, 0.1)' : 'transparent'
              }}
            >
              <Shield size={18} /> 
              <span style={{ fontWeight: 700 }}>Admin Portal</span>
            </div>
          )}
        </nav>


        {/* Server Status Indicator */}
        <div style={{ marginTop: 'auto', padding: '0 1.25rem', marginBottom: '0.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            fontSize: '0.65rem', 
            color: 'var(--text-muted)',
            background: 'rgba(0,0,0,0.2)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            width: 'fit-content'
          }}>
            <div style={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              background: isBackendWaking ? '#fbbf24' : '#10b981',
              boxShadow: isBackendWaking ? '0 0 8px #fbbf24' : '0 0 8px #10b981'
            }} />
            <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              {isBackendWaking ? 'SERVER WAKING UP...' : 'SERVER ONLINE'}
            </span>
          </div>
        </div>

        {/* User Profile Logon - Persistent at Bottom */}
        <div style={{ borderTop: '1px solid var(--border-color-light)', padding: '1.25rem', position: 'relative' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'var(--transition)'
          }}>
            <Dropdown
              trigger={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', width: '100%' }}>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.9rem', background: 'linear-gradient(135deg, var(--brand-orange), #ff7043)', color: '#fff', border: 'none', boxShadow: '0 4px 12px rgba(240,72,29,0.3)' }}>
                    {currentUser.avatar}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              }
              items={[
                ...users.filter(u => u.id !== currentUser.id).map(u => ({
                  label: `Switch to ${u.name}`,
                  onClick: () => handleLogin(u)
                })),
                { label: 'Sign Out', onClick: handleLogout, variant: 'danger' }
              ]}
            />
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <main className="main-area">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Project Name + Dropdown Switcher */}
            <div style={{ position: 'relative' }}>
              <Dropdown
                trigger={
                  <button
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
                }
                items={visibleProjects.map(p => ({
                  label: p.name,
                  onClick: () => setActiveProject(p)
                }))}
              />
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
            {currentUser.role === 'admin' && (
              <>
                <button 
                  className="btn-icon" 
                  onClick={() => setIsCreatingSprint(true)}
                  title="Create New Sprint"
                >
                  <Plus size={16} />
                </button>
                <button className="btn btn-primary" onClick={() => setCreatingTaskStatus('open')}>
                  <Plus size={16} /> Create Ticket
                </button>
              </>
            )}

            <div style={{ position: 'relative' }}>
              {/* User profile removed from header (now persistent in sidebar) */}
            </div>
          </div>
        </header>

        <div className="view-container">
          {activeTab === 'dashboard' && (
            <DashboardView 
              tasks={projectTasks} 
              timeLogs={timeLogs} 
              currentUser={currentUser}
              allProjects={projects}
              allTasks={tasks}
              taskLists={taskLists}
              onCreateProject={addProject}
              onDeleteProject={deleteProject}
              onProjectClick={(p) => setActiveProject(p)}
              onTaskClick={(id) => setSelectedTaskId(id)}
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
            <TaskListView 
              tasks={filteredTasks} 
              taskLists={taskLists}
              activeProject={activeProject}
              updateTask={updateTask} 
              deleteTask={deleteTask} 
              addTask={addTask}
              currentUser={currentUser} 
              onTaskClick={setSelectedTaskId} 
              onBackHome={() => setActiveTab('dashboard')}
            />
          )}
          {activeTab === 'excel' && (
            <ExcelView 
              tasks={filteredTasks} 
              timeLogs={timeLogs} 
              onTaskClick={setSelectedTaskId} 
              onDeleteTasks={deleteTasks}
              availableUsers={users}
              onUploadTasks={(newTasksData) => {
                newTasksData.forEach(tData => {
                  addTask({
                    ...tData,
                    projectId: activeProject.id,
                    taskListId: taskLists.find(tl => tl.projectId === activeProject.id)?.id || taskLists[0].id,
                    sprintId: activeSprintId === 'all' ? (sprints.find(s => s.projectId === activeProject.id)?.id || '') : activeSprintId,
                    type: 'task',
                    priority: 'medium',
                    componentName: 'General'
                  });
                });
              }}
            />
          )}
          {activeTab === 'metrics' && (
            <MetricsView 
              tasks={filteredTasks} 
              users={users} 
            />
          )}
          {activeTab === 'timesheet' && (
            <TimesheetView 
              timeLogs={timeLogs} 
              tasks={filteredTasks} 
              currentUser={currentUser}
              users={users}
              addTimeLog={addTimeLog} 
            />
          )}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <AdminView 
              currentUser={currentUser}
              onInvite={handleInviteUser}
              onRemoveInvite={handleRemoveInvite}
              users={users}
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
        {isCreatingSprint && (
          <div className="modal-overlay" onClick={() => setIsCreatingSprint(false)} style={{ zIndex: 1000 }}>
            <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 400, padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Create New Sprint</h2>
                <button className="btn-icon" onClick={() => setIsCreatingSprint(false)}><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('sprintName') as HTMLInputElement).value;
                if (name.trim()) {
                  const newSprint = { id: `sp-${Date.now()}`, projectId: activeProject.id, name: name.trim() };
                  setSprints([...sprints, newSprint]);
                  setActiveSprintId(newSprint.id);
                  setIsCreatingSprint(false);
                  await api.createSprint(newSprint);
                }
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '0.5rem', color: '#1a202c' }}>Sprint Name</label>
                  <input 
                    name="sprintName"
                    autoFocus
                    type="text" 
                    required
                    placeholder="E.g., Sprint 1, Q2 Roadmap"
                    style={{ 
                      width: '100%', padding: '0.75rem', background: '#ffffff', border: '1px solid #e2e8f0', 
                      color: '#1a202c', borderRadius: 'var(--radius-md)', outline: 'none' 
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingSprint(false)} style={{ color: '#4a5568', borderColor: '#e2e8f0', background: '#f8fafc' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Sprint</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
