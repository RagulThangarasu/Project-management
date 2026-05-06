import React, { useState } from 'react';
import type { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const LoginScreen = ({ users, onLogin, setUsers }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail.endsWith('@hashouttech.com')) {
      setError('Only @hashouttech.com outlook domain users can access this application.');
      return;
    }
    
    setLoading(true);
    try {
      // Check for invites first (unless it's the admin)
      if (cleanEmail !== 'ragul.thangarasu@hashouttech.com') {
        const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
        const inviteResponse = await fetch(`${API_BASE}/invites`);
        const invitedUsers: {email: string, status: string}[] = await inviteResponse.json();
        const userInvite = invitedUsers.find(i => i.email === cleanEmail);
        
        if (!userInvite) {
          setError('You have not been invited to access this dashboard. Please contact an administrator.');
          setLoading(false);
          return;
        }

        if (userInvite.status !== 'accepted') {
          setError('Your invitation is pending. Please check your inbox and click the accept link to proceed.');
          setLoading(false);
          return;
        }
      }

      let user = users.find(u => u.email === cleanEmail);
      
      // If user doesn't exist by email, maybe fallback to name check for old mock users
      if (!user) {
        const nameParts = cleanEmail.split('@')[0].split('.');
        const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
        
        user = users.find(u => u.name.toLowerCase() === formattedName.toLowerCase());
        
        if (!user) {
          user = {
            id: `usr_${Date.now()}`,
            name: formattedName,
            email: cleanEmail,
            avatar: nameParts.map(p => p.charAt(0).toUpperCase()).join('').substring(0, 2),
            role: cleanEmail === 'ragul.thangarasu@hashouttech.com' ? 'admin' : 'member'
          };
          
          const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
          await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          });
          
          setUsers(prev => [...prev, user!]);
        }
      }

      // Ensure this specific user is always an admin, even if previously saved as a member
      if (user && cleanEmail === 'ragul.thangarasu@hashouttech.com' && user.role !== 'admin') {
        user.role = 'admin';
        const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
        await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
      }
      
      onLogin(user);
    } catch (err) {
      setError('Failed to login. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Brand Circles */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(240, 78, 35, 0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(240, 78, 35, 0.03) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{ background: 'var(--bg-surface)', padding: '3rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-premium)', width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, border: '1px solid var(--border-color-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style={{ height: '45px' }} />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Project Management</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>Sign in to access your dashboard</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="name@hashouttech.com"
              style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-base)', border: '1.5px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', outline: 'none', transition: 'all 0.2s', fontSize: '1rem' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(240, 78, 35, 0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          
          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--priority-high)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
               <span>⚠️</span> {error}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color-light)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Strictly for <strong>hashouttech.com</strong> authorized users only.
          </p>
        </div>
      </div>
    </div>
  );
};
