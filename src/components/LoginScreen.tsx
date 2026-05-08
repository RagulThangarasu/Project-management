import React, { useState } from 'react';
import type { User } from '../types';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const LoginScreen = ({ users, onLogin, setUsers }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-z0-9._%+-]+@hashouttech\.com$/i;

    if (!emailRegex.test(cleanEmail)) {
      setError('Only @hashouttech.com outlook domain users can access this application.');
      return;
    }

    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const password = (e.target as any).password.value;
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = userCredential.user;
      
      // Map Firebase user to our application user type
      const nameParts = cleanEmail.split('@')[0].split('.');
      const formattedName = nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      
      const user: User = {
        id: fbUser.uid,
        name: formattedName,
        email: cleanEmail,
        avatar: nameParts.map((p: string) => p.charAt(0).toUpperCase()).join('').substring(0, 2),
        role: (cleanEmail === 'ragul.thangarasu@hashouttech.com' || cleanEmail === 'ragul.thnagarasu@hashouttech.com' || cleanEmail === 'ragul.thangarasi@hashouttech.com') ? 'admin' : 'member'
      };

      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail.endsWith('@hashouttech.com')) {
      setError('Please enter a valid @hashouttech.com email.');
      return;
    }

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setMessage('Password reset link has been sent to your email.');
      setTimeout(() => setResetMode(false), 3000);
    } catch (err: any) {
      console.error('Reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No user found with this email address.');
      } else {
        setError('Failed to send reset link. Please try again.');
      }
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
          <div style={{
            width: '180px',
            height: '40px',
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

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: '#fff' }}>Project Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>Sign in to access your dashboard</p>
        </div>

        {resetMode ? (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="name@hashouttech.com"
                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)', outline: 'none' }}
              />
            </div>
            
            {error && (
              <div style={{ display: 'flex', gap: '0.75rem', color: '#fca5a5', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ flexShrink: 0 }}>⚠️</span> {error}
              </div>
            )}
            
            {message && (
              <div style={{ display: 'flex', gap: '0.75rem', color: '#6ee7b7', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ flexShrink: 0 }}>✅</span> {message}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', height: '54px' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <button type="button" onClick={() => setResetMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="name@hashouttech.com"
                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)', outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Password</label>
                <button type="button" onClick={() => { setResetMode(true); setError(''); setMessage(''); }} style={{ background: 'none', border: 'none', color: 'var(--brand-orange)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  Forgot password?
                </button>
              </div>
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)', outline: 'none' }}
              />
            </div>
            
            {error && (
              <div style={{ display: 'flex', gap: '0.75rem', color: '#fca5a5', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ flexShrink: 0 }}>⚠️</span> {error}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', height: '54px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

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
