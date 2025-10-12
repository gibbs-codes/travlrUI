import styles from './Typography.module.css';

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  elegant?: boolean;
  className?: string;
}

export function Heading({ level = 1, children, elegant = false, className = '' }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const classes = `${styles[`heading${level}`]} ${elegant ? 'elegant-underline' : ''} ${className}`;
  
  return <Tag className={classes}>{children}</Tag>;
}