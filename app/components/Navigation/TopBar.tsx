import styles from './TopBar.module.css';

interface TopBarProps {
  logo?: string;
  navText?: string;
}

export function TopBar({ logo = 'essence', navText = 'explore' }: TopBarProps) {
  return (
    <nav className={styles.topBar}>
      <div className={styles.logo}>{logo}</div>
      <a href="#" className={styles.navLink}>{navText}</a>
    </nav>
  );
}