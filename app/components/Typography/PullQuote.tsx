import styles from './Typography.module.css';

interface PullQuoteProps {
  children: React.ReactNode;
}

export function PullQuote({ children }: PullQuoteProps) {
  return <blockquote className={styles.pullQuote}>{children}</blockquote>;
}