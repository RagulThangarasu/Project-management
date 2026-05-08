import { useState, useEffect } from 'react';
import { Layout, CheckCircle, Clock, AlertTriangle, FolderOpen, ArrowRight, Bug, BookOpen, Wrench, Users, Zap, TrendingUp, Trash2 } from 'lucide-react';
import type { Task, TimeLog, User, Project, TaskList } from '../types';
import { mockUsers } from '../data';

interface DashboardViewProps {
  tasks: Task[];               // filtered tasks (current project + sprint)
  timeLogs: TimeLog[];
  currentUser: User;
  allProjects: Project[];      // ALL projects in the system
  allTasks: Task[];             // ALL tasks across projects
  taskLists: TaskList[];        // to resolve project membership
  onCreateProject?: (name: string, description: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onProjectClick: (project: Project) => void;
  onTaskClick: (taskId: string) => void;
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
}: DashboardViewProps) => {
  const [myTasksFilter, setMyTasksFilter] = useState<'all' | 'in_progress' | 'open' | 'in_review'>('all');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Welcome back, <span style={{ color: 'var(--brand-orange)' }}>{currentUser.name.split(' ')[0]}</span> 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Here's the latest update on your Hashout projects.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* KEY METRICS ROW */}
      {/* ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {[
          { icon: <FolderOpen size={22} />, label: 'My Projects', value: myProjects.length, color: 'var(--brand-orange)' },
          { icon: <Layout size={22} />, label: 'Active Tasks', value: filteredTasks.length, color: 'var(--status-open)' },
          { icon: <CheckCircle size={22} />, label: 'Completion', value: `${completionRate}%`, color: 'var(--status-closed)' },
          { icon: <Clock size={22} />, label: 'Hours Logged', value: totalHours, color: 'var(--status-progress)' },
          { icon: <AlertTriangle size={22} />, label: 'High Priority', value: highPriorityTasks, color: highPriorityTasks > 0 ? 'var(--priority-high)' : 'var(--text-muted)' },
        ].map((m) => (
          <div
            key={m.label}
            className="glass-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ color: m.color, background: `${m.color}15`, width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.icon}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MY PROJECTS */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderOpen size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>My Projects</h3>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(240, 78, 35, 0.15)',
                color: 'var(--brand-orange)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {myProjects.length}
            </span>
          </div>
          {currentUser.role === 'admin' && onCreateProject && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              onClick={() => {
                const name = prompt("Enter project name:");
                if (!name) return;
                const desc = prompt("Enter project description (optional):") || "";
                onCreateProject(name, desc);
              }}
            >
              + New Project
            </button>
          )}
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
                  padding: '2rem',
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
                {/* Delete Project Button (Admins only) */}
                {currentUser.role === 'admin' && onDeleteProject && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete the project "${project.name}"? This action cannot be undone.`)) {
                        onDeleteProject(project.id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 10
                    }}
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
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
                      <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{project.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {project.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '1.5rem' }}>
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
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>My Tasks</h3>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
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
