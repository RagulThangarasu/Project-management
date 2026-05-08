import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const AcceptInvite = () => {
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error' | 'setting-password'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
      setStatus('verifying');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      fetch(`${API_BASE}/invites/verify?email=${encodeURIComponent(emailParam)}&token=${tokenParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setRole(data.role || 'member');
            setStatus('setting-password');
          } else {
            setStatus('error');
            setMessage(data.error || 'Failed to verify invitation.');
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('Something went wrong. Please try again later.');
        });
    } else {
      setStatus('error');
      setMessage('Missing email or token in the URL.');
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Sync to backend to ensure role is persisted
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      const nameParts = email.split('@')[0].split('.');
      const formattedName = nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      
      const userData = {
        id: fbUser.uid,
        name: formattedName,
        email: email,
        avatar: nameParts.map((p: string) => p.charAt(0).toUpperCase()).join('').substring(0, 2),
        role: role
      };

      await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      // Update invite status
      await fetch(`${API_BASE}/invites/verify?email=${encodeURIComponent(email)}&token=${token}`, {
        method: 'GET' // In a real app this would be a PUT/POST to mark as accepted
      });

      setStatus('success');
      setMessage('Your account has been created successfully! You can now log in.');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setStatus('success');
        setMessage('Account already exists. You can now log in.');
      } else {
        setMessage(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 450, textAlign: 'center' }}>
        <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style={{ height: '40px', marginBottom: '2rem', filter: 'brightness(0) invert(1)' }} />
        
        {status === 'verifying' && <p style={{ color: 'var(--text-secondary)' }}>Verifying your invitation...</p>}
        
        {status === 'setting-password' && (
          <form onSubmit={handleSignUp} style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Welcome to Hashout</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Please set a password for your account (email: {email})</p>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>New Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{ 
                  width: '100%', padding: '0.875rem', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-md)', outline: 'none' 
                }}
              />
            </div>

            {message && <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{message}</p>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Finish Setup'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <>
            <div style={{ color: 'var(--status-closed)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Success!</div>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{message}</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = '/'}>Go to Login</button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={{ color: 'var(--priority-high)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Invalid Invitation</div>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{message}</p>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => window.location.href = '/'}>Back to Home</button>
          </>
        )}
      </div>
    </div>
  );
};
