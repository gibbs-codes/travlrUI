'use client';

import { ReactNode } from 'react';

type SectionHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  actions,
}: SectionHeaderProps) {
  // Establishes consistent heading sizing + divider treatment across sections.
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/70 pb-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
