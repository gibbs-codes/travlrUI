'use client';

import { Bed, Star, CalendarDays, MapPin, ShieldCheck } from 'lucide-react';
import { MouseEvent } from 'react';
import { formatMoney, stars as formatStars } from '../../lib/formatters';
import type { Stay } from '../../lib/types';
import {
  BaseRecommendationCard,
  CardHeader,
  CardMeta,
  CardFooter,
  type MetaRow,
} from './BaseRecommendationCard';

export interface HotelCardProps {
  stay: Stay;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
}

export function HotelCard({ stay, isSelected, onSelect, onRerun }: HotelCardProps) {
  const handleActionClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(stay.id);
  };

  // Build metadata
  const meta: MetaRow[] = [
    {
      label: 'Rating',
      value: formatStars(stay.rating),
      icon: <Star className="h-4 w-4 text-amber-500" />,
    },
    {
      label: 'Nights',
      value: `${stay.nights} night${stay.nights === 1 ? '' : 's'}`,
      icon: <CalendarDays className="h-4 w-4 text-slate-500" />,
    },
  ];

  if (stay.neighborhood) {
    meta.push({
      label: 'Area',
      value: stay.neighborhood,
      icon: <MapPin className="h-4 w-4 text-slate-500" />,
    });
  }

  if (typeof stay.distanceMi === 'number') {
    meta.push({
      label: 'Distance',
      value: `${stay.distanceMi.toFixed(1)} mi away`,
      icon: <MapPin className="h-4 w-4 text-slate-500" />,
    });
  }

  if (stay.freeCancel) {
    meta.push({
      label: 'Cancellation',
      value: 'Free cancellation',
      icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    });
  }

  return (
    <BaseRecommendationCard
      id={stay.id}
      isSelected={isSelected}
      onSelect={onSelect}
      imageUrl={stay.images?.[0]}
      imageAlt={stay.name}
    >
      <CardHeader
        icon={<Bed className="h-5 w-5" />}
        title={stay.name}
        subtitle={stay.neighborhood}
        isSelected={isSelected}
      />

      <CardMeta items={meta} />

      <CardFooter
        price={formatMoney(stay.total)}
        footerNote={stay.freeCancel ? 'Cancel anytime' : undefined}
        actionLabel={isSelected ? 'Stay saved' : 'Select stay'}
        isSelected={isSelected}
        onActionClick={handleActionClick}
        bookingUrl={stay.bookingUrl}
        bookingLabel="View hotel"
        onRerun={onRerun}
      />
    </BaseRecommendationCard>
  );
}
