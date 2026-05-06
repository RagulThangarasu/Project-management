import { useState, useEffect } from 'react';
import { Layout, CheckCircle, Clock, AlertTriangle, FolderOpen, ArrowRight, Bug, BookOpen, Wrench, Users, Zap, TrendingUp } from 'lucide-react';
import type { Task, TimeLog, User, Project, TaskList } from '../types';
import { mockUsers } from '../data';

interface DashboardViewProps {
  tasks: Task[];               // filtered tasks (current project + sprint)
  timeLogs: TimeLog[];
  currentUser: User;
  allProjects: Project[];      // ALL projects in the system
  allTasks: Task[];             // ALL tasks across projects
  taskLists: TaskList[];        // to resolve project membership
  onProjectClick: (project: Project) => void;
  onTaskClick: (taskId: string) => void;
  onInviteUser?: (email: string) => Promise<string | void>;
  onRemoveInvite?: (email: string) => Promise<void>;
}

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  open: 'Open',
  in_progress: 'In Progress',
  in_review: 'In Review',
  closed: 'Closed',
};
const STATUS_COLOR: Record<string, string> = {
  backlog: 'var(--status-backlog)',
  open: 'var(--status-open)',
  in_progress: 'var(--status-inprogress)',
  in_review: 'var(--status-inreview)',
  closed: 'var(--status-closed)',
};
const TYPE_ICON: Record<string, typeof Bug> = {
  bug: Bug,
  story: BookOpen,
  task: Wrench,
};

export const DashboardView = ({
  tasks: filteredTasks,
  timeLogs,
  currentUser,
  allProjects,
  allTasks,
  taskLists,
  onProjectClick,
  onTaskClick,
  onInviteUser,
  onRemoveInvite,
}: DashboardViewProps) => {
  const [myTasksFilter, setMyTasksFilter] = useState<'all' | 'in_progress' | 'open' | 'in_review'>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<{email: string, status: string, token: string}[]>([]);
  const [, setIsLoadingInvites] = useState(false);

  const fetchInvites = async () => {
    if (currentUser.role !== 'admin') return;
    try {
      setIsLoadingInvites(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_BASE}/invites`);
      const data = await res.json();
      setInvitedUsers(data);
    } catch (err) {
      console.error('Failed to fetch invites', err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail || !onInviteUser) return;
    setIsInviting(true);
    setInviteStatus(null);
    setGeneratedLink(null);
    try {
      const link = await onInviteUser(inviteEmail);
      if (link) setGeneratedLink(link as string);
      setInviteStatus('Success! User has been invited.');
      setInviteEmail('');
      fetchInvites();
    } catch (err) {
      setInviteStatus('Failed to invite user. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveInvite = async (email: string) => {
    if (!onRemoveInvite) return;
    try {
      await onRemoveInvite(email);
      fetchInvites();
    } catch (err) {
      console.error('Failed to remove invite', err);
    }
  };

  // ── Projects accessible to me ──
  const myProjects = allProjects.filter(
    (p) => currentUser.role === 'admin' || p.members.includes(currentUser.id)
  );

  // ── Tasks assigned to me across ALL projects ──
  const myTasks = allTasks.filter((t) => t.assignee?.id === currentUser.id && t.status !== 'closed');
  const filteredMyTasks =
    myTasksFilter === 'all' ? myTasks : myTasks.filter((t) => t.status === myTasksFilter);

  // ── Stats for the currently‑active project view ──
  const totalTasks = filteredTasks.length;
  const closedTasks = filteredTasks.filter((t) => t.status === 'closed').length;
  const completionRate = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0;
  const highPriorityTasks = filteredTasks.filter((t) => t.priority === 'high' && t.status !== 'closed').length;
  const totalHours = timeLogs.reduce((acc, log) => acc + log.hours, 0);

  // Helper: get tasks for a project
  const getProjectTasks = (projectId: string) =>
    allTasks.filter((t) => taskLists.some((tl) => tl.id === t.taskListId && tl.projectId === projectId));

  // Helper: completion % for a project
  const getProjectCompletion = (projectId: string) => {
    const pt = getProjectTasks(projectId);
    if (pt.length === 0) return 0;
    return Math.round((pt.filter((t) => t.status === 'closed').length / pt.length) * 100);
  };

  // Helper: project from task
  const getProjectForTask = (task: Task) => {
    const tl = taskLists.find((l) => l.id === task.taskListId);
    if (!tl) return null;
    return allProjects.find((p) => p.id === tl.projectId) ?? null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Welcome back, {currentUser.name.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Here's everything happening across your projects.
        </p>
      </div>

      {/* Admin Invite Panel */}
      {currentUser.role === 'admin' && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Users size={20} color="var(--accent-primary)" /> Invite Team Member
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="email" 
              placeholder="colleague@hashouttech.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', outline: 'none' }}
            />
            <button 
              className="btn btn-primary"
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.toLowerCase().endsWith('@hashouttech.com')}
              style={{ minWidth: '120px' }}
            >
              {isInviting ? 'Sending...' : 'Invite'}
            </button>
          </div>
            {inviteStatus && (
              <div style={{ 
                marginTop: '0.75rem', 
                fontSize: '0.8rem', 
                color: inviteStatus.includes('Failed') ? '#ef4444' : '#10b981',
                fontWeight: 500
              }}>
                {inviteStatus}
              </div>
            )}

            {generatedLink && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#f8fafc', 
                border: '1px dashed #cbd5e1', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>
                  MANUAL INVITE LINK (Copy & Send):
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  wordBreak: 'break-all', 
                  color: 'var(--brand-orange)', 
                  fontWeight: 500,
                  background: 'white',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}>
                  {generatedLink}
                </div>
              </div>
            )}
          {/* Invited Users List */}
          {invitedUsers.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color-light)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Invited Members</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invitedUsers.map((invite, idx) => (
                  <div 
                    key={invite.email || idx}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      background: 'var(--bg-base)', 
                      padding: '0.6rem 1rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 500 }}>{invite.email}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)',
                        background: invite.status === 'accepted' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: invite.status === 'accepted' ? 'var(--status-closed)' : 'var(--priority-medium)',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {invite.status}
                      </span>
                      {invite.status === 'pending' && (
                        <a 
                          href={`/accept-invite?token=${invite.token}&email=${encodeURIComponent(invite.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                        >
                          Dev: Accept Link
                        </a>
                      )}
                    </div>
                    <button 
                      onClick={() => handleRemoveInvite(invite.email)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--priority-high)', padding: 0, display: 'flex', alignItems: 'center', opacity: 0.7 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                      title="Remove Access"
                    >
                      <Layout size={16} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* KEY METRICS ROW */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { icon: <FolderOpen size={20} />, label: 'My Projects', value: myProjects.length, color: 'var(--accent-primary)' },
          { icon: <Layout size={20} />, label: 'Active Tasks', value: filteredTasks.length, color: 'var(--status-inprogress)' },
          { icon: <CheckCircle size={20} />, label: 'Completion', value: `${completionRate}%`, color: 'var(--status-closed)' },
          { icon: <Clock size={20} />, label: 'Hours Logged', value: totalHours, color: 'var(--priority-medium)' },
          { icon: <AlertTriangle size={20} />, label: 'High Priority', value: highPriorityTasks, color: highPriorityTasks > 0 ? 'var(--priority-high)' : 'var(--text-muted)' },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'var(--bg-surface)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: m.color }}>
              {m.icon}
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{m.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: m.color === 'var(--priority-high)' ? m.color : 'var(--text-primary)' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MY PROJECTS */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <FolderOpen size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>My Projects</h3>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'rgba(99,102,241,0.12)',
              color: 'var(--accent-primary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {myProjects.length}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {myProjects.map((project) => {
            const pt = getProjectTasks(project.id);
            const comp = getProjectCompletion(project.id);
            const activeTasks = pt.filter((t) => t.status !== 'closed' && t.status !== 'backlog').length;
            const members = mockUsers.filter((u) => project.members.includes(u.id));

            return (
              <div
                key={project.id}
                onClick={() => onProjectClick(project)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = project.color;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 8px 25px -5px ${project.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top accent bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${project.color}, ${project.color}88)`,
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-md)',
                        background: `${project.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: project.color,
                      }}
                    >
                      {project.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600 }}>{project.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {project.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: 600, color: project.color }}>{comp}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-base)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${comp}%`,
                        background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 1s ease-out',
                      }}
                    />
                  </div>
                </div>

                {/* Bottom stats */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Zap size={12} color="var(--status-inprogress)" /> {activeTasks} active
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <TrendingUp size={12} color="var(--status-closed)" /> {pt.length} total
                    </span>
                  </div>
                  {/* Member avatars */}
                  <div style={{ display: 'flex' }}>
                    {members.slice(0, 4).map((u, idx) => (
                      <div
                        key={u.id || idx}
                        title={u.name}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-surface-hover)',
                          border: '2px solid var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: 'var(--accent-primary)',
                          marginLeft: idx > 0 ? -6 : 0,
                          zIndex: members.length - idx,
                        }}
                      >
                        {u.avatar}
                      </div>
                    ))}
                    {members.length > 4 && (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--accent-primary)',
                          border: '2px solid var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#fff',
                          marginLeft: -6,
                        }}
                      >
                        +{members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MY TASKS (assigned to me across all projects) */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>My Tasks</h3>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(139,92,246,0.12)',
                color: 'var(--accent-secondary)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {myTasks.length} open
            </span>
          </div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'open', 'in_progress', 'in_review'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMyTasksFilter(f)}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  border: '1px solid',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  borderColor: myTasksFilter === f ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: myTasksFilter === f ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: myTasksFilter === f ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              >
                {f === 'all' ? 'All' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {filteredMyTasks.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <CheckCircle size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>You're all caught up!</div>
            <div style={{ fontSize: '0.85rem' }}>No open tasks assigned to you right now.</div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {filteredMyTasks.map((task, idx) => {
              const proj = getProjectForTask(task);
              const Icon = TYPE_ICON[task.type] || Wrench;
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.875rem 1.25rem',
                    borderBottom: idx < filteredMyTasks.length - 1 ? '1px solid var(--border-color-light)' : 'none',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 'var(--radius-sm)',
                      background: task.type === 'bug' ? 'rgba(239,68,68,0.12)' : task.type === 'story' ? 'rgba(99,102,241,0.12)' : 'rgba(139,92,246,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      size={14}
                      color={task.type === 'bug' ? 'var(--priority-high)' : task.type === 'story' ? 'var(--accent-primary)' : 'var(--accent-secondary)'}
                    />
                  </div>

                  {/* Task info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{task.id}</span>
                      {proj && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: proj.color,
                            background: `${proj.color}15`,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {proj.name}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.title}
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${STATUS_COLOR[task.status]}20`,
                      color: STATUS_COLOR[task.status],
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>

                  {/* Priority */}
                  <span
                    className={`tag tag-priority-${task.priority}`}
                    style={{ flexShrink: 0 }}
                  >
                    {task.priority}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TASK DISTRIBUTION + RECENT ACTIVITY (existing) */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Task Distribution for active project */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Task Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Open', count: filteredTasks.filter((t) => t.status === 'open').length, color: 'var(--status-open)' },
              { label: 'In Progress', count: filteredTasks.filter((t) => t.status === 'in_progress').length, color: 'var(--status-inprogress)' },
              { label: 'In Review', count: filteredTasks.filter((t) => t.status === 'in_review').length, color: 'var(--status-inreview)' },
              { label: 'Closed', count: closedTasks, color: 'var(--status-closed)' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>{stat.label}</span>
                  <span style={{ fontWeight: 600 }}>{stat.count}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-base)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: stat.color,
                      width: `${totalTasks > 0 ? (stat.count / totalTasks) * 100 : 0}%`,
                      transition: 'width 1s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Recent Time Logs</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {timeLogs
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map((log) => {
                const user = mockUsers.find((u) => u.id === log.userId);
                const task = filteredTasks.find((t) => t.id === log.taskId);
                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid var(--border-color-light)',
                    }}
                  >
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                      {user?.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {user?.name}{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                          logged {log.hours}h on
                        </span>{' '}
                        {task?.title || log.taskId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {log.date} {log.notes && `- "${log.notes}"`}
                      </div>
                    </div>
                  </div>
                );
              })}
            {timeLogs.length === 0 && (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  padding: '2rem 0',
                }}
              >
                No recent activity to display.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
