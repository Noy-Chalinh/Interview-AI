import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'online' | 'offline' | 'language' | 'score' | 'completed' | 'pending';
  className?: string;
}

export function Badge({ children, variant = 'language', className }: BadgeProps) {
  const variantStyles = {
    online: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    offline: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    language: 'bg-[#334155] text-[#94A3B8] border-[#334155]',
    score: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
    completed: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
    pending: 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20',
  };
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
