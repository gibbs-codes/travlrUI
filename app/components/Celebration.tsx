/**
 * Celebration Component
 * Shows a brief celebratory animation when agents complete successfully
 */

'use client';

import { useEffect, useState } from 'react';
import styles from './Celebration.module.css';

interface CelebrationProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
}

export function Celebration({ show, onComplete, message = 'Success!' }: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Auto-hide after animation completes
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.celebration} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
            <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <p className={styles.message}>{message}</p>
      </div>

      {/* Confetti particles */}
      <div className={styles.confetti}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className={styles.confettiParticle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
