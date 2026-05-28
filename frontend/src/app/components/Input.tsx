import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] placeholder:text-[#94A3B8]',
            'focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent',
            'transition-all',
            error && 'border-[#EF4444] focus:ring-[#EF4444]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
