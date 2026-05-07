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

  const isGhost = variant === 'ghost';

  return (
    <div style={{ position: 'relative', ...style }} ref={containerRef}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
      ) }
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: isGhost ? '0.25rem 0.5rem' : '0.6rem 1rem',
          background: isGhost ? 'transparent' : '#ffffff',
          border: isGhost ? 'none' : `1px solid ${isOpen ? 'var(--brand-orange)' : '#e2e8f0'}`,
          color: isGhost ? '#fff' : '#1a202c',
          borderRadius: '8px',
          fontSize: '0.9rem',
          fontWeight: 500,
          boxShadow: isOpen && !isGhost ? '0 0 0 3px rgba(240, 72, 29, 0.15)' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          minHeight: isGhost ? 'auto' : '44px'
        }}
      >
        <span style={{ color: selectedOption ? (isGhost ? '#fff' : '#1a202c') : (isGhost ? 'rgba(255,255,255,0.3)' : '#a0aec0') }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={16} color={isGhost ? "var(--text-muted)" : "#718096"} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '0.5rem' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: isGhost ? 'auto' : 0,
          minWidth: isGhost ? '160px' : '100%',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          zIndex: 9999, /* High z-index to avoid overlapping */
          maxHeight: maxHeight ? `${maxHeight}px` : '220px',
          overflowY: 'auto'
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#a0aec0', textAlign: 'center' }}>No options</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  color: value === opt.id ? 'var(--brand-orange)' : '#1a202c',
                  cursor: 'pointer',
                  fontWeight: value === opt.id ? 700 : 500,
                  background: value === opt.id ? 'rgba(240, 72, 29, 0.08)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => {
                  if (value !== opt.id) e.currentTarget.style.background = '#f7fafc';
                }}
                onMouseLeave={e => {
                  if (value !== opt.id) e.currentTarget.style.background = 'transparent';
                }}
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
