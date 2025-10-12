import styles from './Typography.module.css';

interface TextProps {
  children: React.ReactNode;
  size?: 'base' | 'large';
  className?: string;
}

export function Text({ children, size = 'base', className = '' }: TextProps) {
  const classes = `${styles.bodyText} ${size === 'large' ? styles.bodyTextLarge : ''} ${className}`;
  
  return <p className={classes}>{children}</p>;
}