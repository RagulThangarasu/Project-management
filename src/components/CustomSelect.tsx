import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'white-card' | 'ghost' | 'form';
  style?: React.CSSProperties;
  maxHeight?: number;
}

export const CustomSelect = ({ label, value, options, onChange, placeholder, variant = 'white-card', style, maxHeight }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isWhiteCard = variant === 'white-card';
  const isForm = variant === 'form';

  return (
    <div style={{ position: 'relative', ...style }} ref={containerRef}>
      {label && (
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {label}
        </label>
      ) }
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: isWhiteCard ? '0.75rem' : isForm ? '0.6rem' : '0.25rem 0.5rem',
          background: isWhiteCard ? '#ffffff' : isForm ? 'var(--bg-base)' : 'transparent',
          border: isWhiteCard ? '1px solid #e2e8f0' : isForm ? '1px solid var(--border-color)' : 'none',
          color: isWhiteCard ? '#1a202c' : 'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          fontWeight: isWhiteCard || isForm ? 400 : 500,
          boxShadow: isWhiteCard ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: isWhiteCard ? '44px' : 'auto'
        }}
      >
        <span style={{ color: selectedOption ? (isWhiteCard ? '#1a202c' : 'inherit') : 'var(--text-muted)' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={isWhiteCard ? 16 : 14} color={isWhiteCard ? '#718096' : 'var(--text-muted)'} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '0.5rem' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: variant === 'ghost' ? 'auto' : 0,
          minWidth: variant === 'ghost' ? '160px' : '100%',
          background: isForm ? 'var(--bg-surface)' : '#ffffff',
          border: isForm ? '1px solid var(--border-color)' : '1px solid #e2e8f0',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1100,
          maxHeight: maxHeight ? `${maxHeight}px` : '200px',
          overflowY: 'auto'
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem', fontSize: '14px', color: '#a0aec0', textAlign: 'center' }}>No options</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem',
                  fontSize: '14px',
                  color: isForm ? 'var(--text-primary)' : '#1a202c',
                  cursor: 'pointer',
                  background: value === opt.id ? (isForm ? 'var(--bg-surface-hover)' : '#f7fafc') : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = isForm ? 'var(--bg-surface-hover)' : '#edf2f7')}
                onMouseLeave={e => (e.currentTarget.style.background = value === opt.id ? (isForm ? 'var(--bg-surface-hover)' : '#f7fafc') : 'transparent')}
              >
                {opt.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
