'use client';

import { TrainFront, Clock } from 'lucide-react';
import { MouseEvent } from 'react';
import { formatDuration, formatMoney, formatRoute } from '../../lib/formatters';
import type { Transit } from '../../lib/types';
import {
  BaseRecommendationCard,
  CardHeader,
  CardMeta,
  CardFooter,
  type MetaRow,
} from './BaseRecommendationCard';

export interface ExperienceCardProps {
  transit: Transit;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
}

export function ExperienceCard({ transit, isSelected, onSelect, onRerun }: ExperienceCardProps) {
  const handleActionClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(transit.id);
  };

  // Build metadata
  const meta: MetaRow[] = [
    {
      label: 'Route',
      value: formatRoute(transit.chain),
      icon: <TrainFront className="h-4 w-4 text-slate-500" />,
    },
    {
      label: 'Duration',
      value: formatDuration(transit.durationISO),
      icon: <Clock className="h-4 w-4 text-slate-500" />,
    },
  ];

  return (
    <BaseRecommendationCard
      id={transit.id}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <CardHeader
        icon={<TrainFront className="h-5 w-5" />}
        title={formatRoute(transit.chain)}
        isSelected={isSelected}
      />

      <CardMeta items={meta} />

      <CardFooter
        price={formatMoney(transit.fare)}
        actionLabel={isSelected ? 'Transit saved' : 'Select transit'}
        isSelected={isSelected}
        onActionClick={handleActionClick}
        bookingUrl={transit.bookingUrl}
        bookingLabel="Learn more"
        onRerun={onRerun}
      />
    </BaseRecommendationCard>
  );
}
