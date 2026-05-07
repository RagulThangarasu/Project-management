import { useEffect, useState } from 'react';

export const AcceptInvite = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');

    if (email && token) {
      const API_BASE = 'https://hashout-jira-backend.onrender.com/api';
      fetch(`${API_BASE}/invites/verify?email=${encodeURIComponent(email)}&token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus('success');
            setMessage('Invitation accepted! You can now log in to the dashboard.');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 450, textAlign: 'center' }}>
        <img src="https://favorable-car-4949e1f525.media.strapiapp.com/Hashout_Logo_SVG_fc3b3ba449.svg" alt="Hashout Tech" style={{ height: '40px', marginBottom: '2rem', filter: 'brightness(0) invert(1)' }} />
        
        {status === 'loading' && <p>Verifying your invitation...</p>}
        {status === 'success' && (
          <>
            <div style={{ color: 'var(--status-closed)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Success!</div>
            <p style={{ marginBottom: '2rem' }}>{message}</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/'}>Go to Login</button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ color: 'var(--priority-high)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Invalid Invitation</div>
            <p style={{ marginBottom: '2rem' }}>{message}</p>
            <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>Back to Home</button>
          </>
        )}
      </div>
    </div>
  );
};
