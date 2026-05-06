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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: 'var(--bg-base)', 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      {/* Dynamic Background Effects */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(240, 72, 29, 0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(58, 29, 93, 0.4) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />

      <div className="glass-card" style={{ 
        padding: '3.5rem', 
        borderRadius: 'var(--radius-lg)', 
        width: '100%', 
        maxWidth: 460, 
        position: 'relative', 
        zIndex: 1, 
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style={{ height: '50px' }} />
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: '#fff' }}>Project Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Sign in to access your dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em' 
            }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="name@hashouttech.com"
              style={{ 
                width: '100%', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid var(--border-color)', 
                color: '#fff', 
                borderRadius: 'var(--radius-md)', 
                outline: 'none', 
                transition: 'var(--transition)', 
                fontSize: '1rem' 
              }}
              onFocus={e => { 
                e.target.style.borderColor = 'var(--brand-orange)'; 
                e.target.style.background = 'rgba(255,255,255,0.08)';
              }}
              onBlur={e => { 
                e.target.style.borderColor = 'var(--border-color)'; 
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>
          
          {error && (
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              color: '#fca5a5', 
              fontSize: '0.85rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              lineHeight: 1.4
            }}>
               <span style={{ flexShrink: 0 }}>⚠️</span> {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              marginTop: '0.5rem', 
              fontSize: '1.1rem',
              height: '54px'
            }} 
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '3.5rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          textAlign: 'center' 
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Strictly for <strong style={{ color: 'var(--brand-orange)' }}>hashouttech.com</strong> authorized users only.
          </p>
        </div>
      </div>
    </div>
  );
};
