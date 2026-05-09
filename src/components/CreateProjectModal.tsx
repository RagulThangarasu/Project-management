import React, { useState } from 'react';
import { X, FolderPlus, Palette, Type, AlignLeft } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => void;
}

const COLORS = [
  '#F04E23', // Hashout Orange
  '#3b82f6', // Blue
  '#10b981', // Green
  '#a855f7', // Purple
  '#f97316', // Orange
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
];

export const CreateProjectModal = ({ isOpen, onClose, onCreate }: CreateProjectModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, description, color);
    setName('');
    setDescription('');
    setColor(COLORS[0]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content animate-slide-in" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', padding: '0', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem 2rem', 
          background: 'linear-gradient(135deg, var(--brand-purple), #1a1425)', 
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderPlus size={20} color="var(--brand-orange)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Create New Project</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <Type size={14} /> Project Name
            </label>
            <input 
              type="text" 
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Marketing Website Redesign"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              <AlignLeft size={14} /> Description
            </label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this project about?"
              style={{ width: '100%', padding: '0.75rem', minHeight: '100px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#4a5568', marginBottom: '1rem', textTransform: 'uppercase' }}>
              <Palette size={14} /> Theme Color
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: c,
                    border: color === c ? '3px solid #fff' : 'none',
                    boxShadow: color === c ? '0 0 0 2px var(--brand-orange)' : 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    transform: color === c ? 'scale(1.1)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
