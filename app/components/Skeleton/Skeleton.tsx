import { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  style?: CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  style
}: SkeletonProps) {
  const baseStyles: CSSProperties = {
    backgroundColor: 'rgb(229 231 235)',
    backgroundImage: 'linear-gradient(90deg, rgb(229 231 235) 0%, rgb(243 244 246) 50%, rgb(229 231 235) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px',
    ...style,
  };

  return (
    <>
      <div className={className} style={baseStyles} />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2.5">
        <Skeleton width={80} height={24} />
        <Skeleton width={100} height={36} />
      </div>
    </div>
  );
}

export function SkeletonStack({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={16}
        />
      ))}
    </div>
  );
}
