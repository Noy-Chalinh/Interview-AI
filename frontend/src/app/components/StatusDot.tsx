import { cn } from '../../lib/utils';

interface StatusDotProps {
  status: 'connected' | 'disconnected' | 'reconnecting';
  showLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, showLabel = false, className }: StatusDotProps) {
  const statusConfig = {
    connected: {
      color: 'bg-[#10B981]',
      label: 'Connected',
      animate: false,
    },
    disconnected: {
      color: 'bg-[#EF4444]',
      label: 'Disconnected',
      animate: false,
    },
    reconnecting: {
      color: 'bg-[#EAB308]',
      label: 'Reconnecting',
      animate: true,
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {config.animate && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.color)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', config.color)} />
      </span>
      {showLabel && <span className="text-sm text-[#F8FAFC]">{config.label}</span>}
    </div>
  );
}
