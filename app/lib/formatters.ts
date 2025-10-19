import type { Money } from './types';

// Shared formatter helpers keep display copy consistent between routes.
const ROUTE_SEPARATOR = ' \u2192 ';

export function formatDuration(isoDuration?: string | null): string {
  if (!isoDuration) return '—';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;

  const [, hours, minutes] = match;
  const parts: string[] = [];

  if (hours) {
    parts.push(`${Number(hours)}h`);
  }

  if (minutes) {
    parts.push(`${Number(minutes)}m`);
  }

  return parts.length ? parts.join(' ') : '0m';
}

export function formatDateTime(isoDate?: string | null): string {
  if (!isoDate) return '—';

  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('formatDateTime error', error);
    return isoDate;
  }
}

export function formatMoney(money?: Money | null): string {
  if (!money || typeof money.amount !== 'number') return '—';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency ?? 'USD',
      maximumFractionDigits: 2,
    }).format(money.amount);
  } catch (error) {
    console.error('formatMoney error', error);
    return `${money.currency || '$'}${money.amount.toFixed(2)}`;
  }
}

export function formatRoute(parts?: string[] | null): string {
  if (!parts?.length) return '—';
  return parts.join(ROUTE_SEPARATOR);
}

export function stars(rating?: number | null): string {
  if (rating == null) return '—';
  return `${rating.toFixed(1)} ★`;
}

export function priceLevel(level?: 1 | 2 | 3 | 4 | null): string {
  if (!level) return '—';
  return '$'.repeat(level);
}
