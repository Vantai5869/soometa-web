// components/ui/badge.tsx
import { cn } from '@/lib/utils';

type BadgeProps = {
  variant?: 'outline' | 'solid';
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = 'solid', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'px-3 py-1 text-sm font-semibold rounded-lg',
        variant === 'outline' ? 'border border-gray-300' : 'bg-green-500 text-white',
        className
      )}
    >
      {children}
    </span>
  );
}
