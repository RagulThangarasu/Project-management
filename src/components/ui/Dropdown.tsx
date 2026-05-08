import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ items, trigger }) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger || (
          <button className="btn-icon" style={{ padding: '0.25rem', borderRadius: '50%' }}>
            <MoreVertical size={16} />
          </button>
        )}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="animate-slide-up"
          style={{
            zIndex: 100,
            minWidth: '180px',
            overflow: 'hidden',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-base)',
            padding: '0.5rem',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
          sideOffset={5}
        >
          {items.map((item, index) => (
            <DropdownMenuPrimitive.Item
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.85rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                transition: 'var(--transition)',
                color: item.variant === 'danger' ? 'var(--priority-high)' : 'var(--text-secondary)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                e.currentTarget.style.color = item.variant === 'danger' ? '#ff8080' : 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = item.variant === 'danger' ? 'var(--priority-high)' : 'var(--text-secondary)';
              }}
            >
              {item.icon}
              {item.label}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};
