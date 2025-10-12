import styles from './Layout.module.css';

interface SectionProps {
  children: React.ReactNode;
  width?: 'narrow' | 'wide' | 'full';
  className?: string;
}

export function Section({ children, width = 'full', className = '' }: SectionProps) {
  const widthClass = width !== 'full' ? styles[`${width}Content`] : '';
  
  return (
    <section className={`${styles.contentSection} ${widthClass} ${className}`}>
      {children}
    </section>
  );
}