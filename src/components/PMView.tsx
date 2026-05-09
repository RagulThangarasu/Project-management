import React from 'react';
import { Users, Briefcase, ChevronRight, Shield } from 'lucide-react';
import type { Project, User } from '../types';

interface PMViewProps {
  projects: Project[];
  users: User[];
  onProjectClick: (project: Project) => void;
}

export const PMView = ({ projects, users, onProjectClick }: PMViewProps) => {
  // Group projects by PM
  // For now, we'll consider all admins as potential PMs and assign projects based on pmId or first admin member
  const pmGroups = users
    .filter(u => u.role === 'admin')
    .map(pm => ({
      pm,
      projects: projects.filter(p => p.pmId === pm.id || (!p.pmId && p.members.includes(pm.id)))
    }))
    .filter(group => group.projects.length > 0);

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Project <span style={{ color: 'var(--brand-orange)' }}>Managers</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Assignments and project oversight across the organization.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={20} color="var(--brand-orange)" />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active PMs</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{pmGroups.length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
        {pmGroups.map(({ pm, projects: pmProjects }) => (
          <div key={pm.id} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle at top right, rgba(240, 72, 29, 0.1), transparent)', zIndex: 0 }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
              <div className="avatar" style={{ 
                width: 56, 
                height: 56, 
                fontSize: '1.25rem', 
                background: 'linear-gradient(135deg, var(--brand-orange), #ff7043)', 
                color: '#fff', 
                border: 'none',
                boxShadow: '0 8px 16px rgba(240, 72, 29, 0.25)' 
              }}>
                {pm.avatar}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#fff' }}>{pm.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                  Lead Project Manager
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Briefcase size={16} color="var(--text-muted)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Managing {pmProjects.length} {pmProjects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pmProjects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => onProjectClick(p)}
                    className="pm-project-item"
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = p.color;
                      e.currentTarget.style.background = `${p.color}08`;
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f1f5f9' }}>{p.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to view board</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
