'use client';

import Link from 'next/link';
import styles from './TopBar.module.css';

interface TopBarProps {
  logo?: string;
  navText?: string;
  navLink?: string;
}

export function TopBar({ logo = 'essence', navText = 'explore', navLink }: TopBarProps) {
  return (
    <nav className={styles.topBar}>
      <div className={styles.logo}>{logo}</div>
      {navLink ? (
        <Link href={navLink} className={styles.navLink}>
          {navText}
        </Link>
      ) : (
        <a href="#" className={styles.navLink}>{navText}</a>
      )}
    </nav>
  );
}