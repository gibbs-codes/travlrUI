/**
 * Loading Skeleton Component
 * Animated skeleton loaders for various content types
 */

'use client';

import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  variant?: 'recommendation' | 'text' | 'card' | 'custom';
  count?: number;
  height?: string;
  width?: string;
  className?: string;
}

export function LoadingSkeleton({
  variant = 'recommendation',
  count = 3,
  height,
  width,
  className = '',
}: LoadingSkeletonProps) {
  if (variant === 'recommendation') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.recommendationSkeleton}>
            <div className={styles.skeletonHeader}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonPrice} />
            </div>
            <div className={styles.skeletonBody}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} style={{ width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={styles.skeletonLine}
            style={{
              height: height || '1rem',
              width: width || '100%',
              marginBottom: '0.5rem',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${styles.cardSkeleton} ${className}`}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonCardBody}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  // Custom variant
  return (
    <div
      className={`${styles.skeletonLine} ${className}`}
      style={{
        height: height || '3rem',
        width: width || '100%',
      }}
    />
  );
}

/**
 * Pulsing dot indicator for active loading states
 */
export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.pulsingDot} ${className}`}>
      <span className={styles.dotInner} />
    </span>
  );
}

/**
 * Spinner loader
 */
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${styles.spinner} ${sizeClasses[size]} ${className}`}>
      <div className={styles.spinnerCircle} />
    </div>
  );
}
