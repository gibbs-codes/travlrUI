import { CSSProperties } from 'react';
import styles from './Typography.module.css';

interface TextProps {
  children: React.ReactNode;
  size?: 'base' | 'large';
  className?: string;
  style?: CSSProperties;
}

export function Text({ children, size = 'base', className = '', style }: TextProps) {
  const classes = `${styles.bodyText} ${size === 'large' ? styles.bodyTextLarge : ''} ${className}`;

  return <p className={classes} style={style}>{children}</p>;
}