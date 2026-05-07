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
          <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <MoreVertical size={16} />
          </button>
        )}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-2xl animate-in fade-in zoom-in duration-150"
          sideOffset={5}
        >
          {items.map((item, index) => (
            <DropdownMenuPrimitive.Item
              key={index}
              onClick={item.onClick}
              className={`flex items-center gap-2 px-3 py-2 text-sm outline-none cursor-pointer rounded-md transition-colors ${
                item.variant === 'danger' 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
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
