'use client';

import { Check } from 'lucide-react';
import { ReactNode, MouseEvent, KeyboardEvent, useState } from 'react';

export interface BaseRecommendationCardProps {
  id: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
  children: ReactNode;
  imageUrl?: string;
  imageAlt?: string;
}

const CARD_BASE =
  'group relative rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-3 shadow-sm hover:shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
const CARD_SELECTED = 'border-emerald-400/70 bg-emerald-50/80';

const BADGE_CLASSES =
  'inline-flex items-center gap-1 rounded-full bg-emerald-600/10 text-emerald-700 px-2 py-0.5 text-xs';

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-slate-100">
        <div className="text-center text-xs text-gray-400">
          <p>Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-slate-100">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}

export function BaseRecommendationCard({
  id,
  isSelected,
  onSelect,
  children,
  imageUrl,
  imageAlt,
}: BaseRecommendationCardProps) {
  const handleClick = () => onSelect(id);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${CARD_BASE} ${isSelected ? CARD_SELECTED : ''}`}
    >
      {isSelected && (
        <span className={`${BADGE_CLASSES} absolute right-4 top-4 z-10`}>
          <Check className="h-3.5 w-3.5" />
          Selected
        </span>
      )}

      {imageUrl && <CardImage src={imageUrl} alt={imageAlt || 'Recommendation'} />}

      {children}
    </div>
  );
}

export interface CardHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  isSelected: boolean;
}

export function CardHeader({ icon, title, subtitle, isSelected }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-gray-900">{title}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {!isSelected && (
            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs font-medium text-gray-500">
              Tap to choose
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export interface MetaRow {
  label: string;
  value: string;
  icon: ReactNode;
}

export interface CardMetaProps {
  items: MetaRow[];
}

export function CardMeta({ items }: CardMetaProps) {
  if (items.length === 0) return null;

  return (
    <dl className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-gray-700 sm:grid-cols-2">
      {items.map(({ label, value, icon }) => (
        <div key={label} className="flex items-center gap-1.5">
          {icon}
          <div>
            <dt className="sr-only">{label}</dt>
            <dd className="leading-normal">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export interface CardFooterProps {
  price?: string;
  footerNote?: string;
  bookingUrl?: string;
  bookingLabel?: string;
  actionLabel: string;
  isSelected: boolean;
  onActionClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onRerun?: () => void;
  showRerunButton?: boolean;
}

export function CardFooter({
  price,
  footerNote,
  bookingUrl,
  bookingLabel,
  actionLabel,
  isSelected,
  onActionClick,
  onRerun,
  showRerunButton = true,
}: CardFooterProps) {
  const handleRerunClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRerun?.();
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-200/70 pt-2.5 text-sm">
      {price && <span className="text-base font-semibold text-gray-900">{price}</span>}

      {footerNote && (
        <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs text-gray-500">
          {footerNote}
        </span>
      )}

      {bookingUrl && (
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-150"
        >
          {bookingLabel || 'View details'}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}

      {showRerunButton && onRerun && (
        <button
          type="button"
          onClick={handleRerunClick}
          className="text-xs text-gray-600 hover:text-gray-900 hover:underline transition-colors duration-150"
        >
          Get more options
        </button>
      )}

      <button
        type="button"
        onClick={onActionClick}
        className={`ml-auto inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isSelected
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
