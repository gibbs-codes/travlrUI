import { Lock } from 'lucide-react';

interface LockedSectionProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export function LockedSection({ title, message, icon }: LockedSectionProps) {
  return (
    <div className="relative rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-8 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200/80">
          {icon || <Lock size={24} className="text-slate-500" />}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-700">{title}</h3>
        <p className="max-w-md text-sm text-slate-600">{message}</p>
      </div>

      {/* Subtle overlay effect */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/30" />
    </div>
  );
}
