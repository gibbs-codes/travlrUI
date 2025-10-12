import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
}

export function GlassCard({ children, interactive = false, className = '' }: GlassCardProps) {
  return (
    <div 
      className={`${styles.glassCard} ${interactive ? styles.interactive : ''} ${className}`}
    >
      {children}
    </div>
  );
}