import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Mail, CheckCircle, Clock } from 'lucide-react';
import type { User } from '../types';

interface Invite {
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted';
}

interface AdminViewProps {
  currentUser: User;
  onInvite: (email: string) => Promise<string>;
  onRemoveInvite: (email: string) => Promise<void>;
  users: User[];
}

export const AdminView = ({ currentUser, onInvite, onRemoveInvite, users }: AdminViewProps) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error', link?: string } | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_BASE}/invites`);
      const data = await res.json();
      setInvites(data);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      
      if (data.warning) {
        setMessage({ 
          text: `Invitation created, but the email was blocked by your Microsoft 365 security policy (SMTP AUTH is disabled). Please enable 'Authenticated SMTP' in your M365 Admin Center or share this link manually:`, 
          type: 'error',
          link: data.acceptLink 
        });
      } else {
        setMessage({ text: `Invitation sent to ${inviteEmail}`, type: 'success' });
      }
      setInviteEmail('');
      fetchInvites();
    } catch (error) {
      setMessage({ text: 'Failed to connect to invitation server', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    
    try {
      await onRemoveInvite(email);
      fetchInvites();
    } catch (error) {
      console.error('Failed to remove invite:', error);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage team access and invitations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
        {/* User & Invites List */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Users & Pending Invites</h3>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              {users.length + invites.filter(i => i.status === 'pending').length} Total
            </span>
          </div>
          
          <table className="list-table">
            <thead>
              <tr>
                <th>User / Email</th>
                <th>Role / Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Active Users */}
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{user.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      background: user.role === 'admin' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: user.role === 'admin' ? '#c084fc' : '#34d399',
                      textTransform: 'uppercase'
                    }}>
                      <Shield size={10} /> {user.role}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {user.id !== currentUser.id && (
                      <button 
                        className="btn-icon" 
                        onClick={() => handleRemove(user.email)}
                        style={{ color: '#ef4444' }}
                        title="Revoke Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Pending Invites */}
              {invites.filter(i => i.status === 'pending').map(invite => (
                <tr key={invite.email}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={16} color="var(--text-muted)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Invitation</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{invite.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      background: 'rgba(251, 191, 36, 0.1)',
                      color: '#fbbf24',
                      textTransform: 'uppercase'
                    }}>
                      <Clock size={10} /> {invite.role || 'pending'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleRemove(invite.email)}
                      style={{ color: '#ef4444' }}
                      title="Cancel Invite"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invite Form */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} color="var(--brand-orange)" /> Invite People
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Invited users will receive an email with a secure link to join this workspace.
          </p>

          <form onSubmit={handleInvite}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@hashouttech.com"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', 
                  color: '#fff', 
                  borderRadius: 'var(--radius-md)',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Assign Role</label>
              <select 
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', 
                  color: '#fff', 
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="member" style={{ background: '#1a1425' }}>Member (Default)</option>
                <option value="admin" style={{ background: '#1a1425' }}>Administrator</option>
              </select>
            </div>

            {message && (
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.8rem', 
                marginBottom: '1rem',
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? '#34d399' : '#fca5a5',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {message.type === 'success' ? <CheckCircle size={14} /> : '⚠️'}
                  {message.text}
                </div>
                {message.link && (
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      wordBreak: 'break-all',
                      marginBottom: '0.5rem',
                      fontFamily: 'monospace'
                    }}>
                      {message.link}
                    </div>
                    <button 
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                      onClick={() => {
                        navigator.clipboard.writeText(message.link!);
                        alert('Link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
