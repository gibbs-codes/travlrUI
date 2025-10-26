'use client';

import { Plane, Clock, MapPin, Package, Luggage, BaggageClaim } from 'lucide-react';
import { MouseEvent } from 'react';
import { formatDateTime, formatDuration, formatMoney } from '../../lib/formatters';
import type { Flight } from '../../lib/types';
import {
  BaseRecommendationCard,
  CardHeader,
  CardMeta,
  CardFooter,
  type MetaRow,
} from './BaseRecommendationCard';

export interface FlightCardProps {
  flight: Flight;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRerun?: () => void;
}

export function FlightCard({ flight, isSelected, onSelect, onRerun }: FlightCardProps) {
  const handleActionClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onSelect(flight.id);
  };

  // Format flight details
  const departure = formatDateTime(flight.depart);
  const arrival = formatDateTime(flight.arrive);
  const stopsLabel =
    flight.stops === 0
      ? 'Nonstop'
      : flight.stops === 1
      ? '1 stop'
      : `${flight.stops} stops`;

  // Build metadata
  const meta: MetaRow[] = [
    {
      label: 'Duration',
      value: formatDuration(flight.durationISO),
      icon: <Clock className="h-4 w-4 text-slate-500" />,
    },
    {
      label: 'Stops',
      value: stopsLabel,
      icon: <MapPin className="h-4 w-4 text-slate-500" />,
    },
  ];

  // Add baggage information
  if (flight.baggage?.personal) {
    meta.push({
      label: 'Personal item',
      value: 'Personal item included',
      icon: <Package className="h-4 w-4 text-slate-500" />,
    });
  }
  if (flight.baggage?.carryOn) {
    meta.push({
      label: 'Carry-on',
      value: 'Carry-on included',
      icon: <Luggage className="h-4 w-4 text-slate-500" />,
    });
  }
  if (typeof flight.baggage?.checked === 'number') {
    meta.push({
      label: 'Checked baggage',
      value: `${flight.baggage.checked} checked bag${
        flight.baggage.checked === 1 ? '' : 's'
      }`,
      icon: <BaggageClaim className="h-4 w-4 text-slate-500" />,
    });
  }

  return (
    <BaseRecommendationCard
      id={flight.id}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <CardHeader
        icon={<Plane className="h-5 w-5" />}
        title={`${flight.carrier} ${flight.flightNo}`.trim()}
        subtitle={`${departure} → ${arrival}`}
        isSelected={isSelected}
      />

      <CardMeta items={meta} />

      <CardFooter
        price={formatMoney(flight.price)}
        actionLabel={isSelected ? 'Flight saved' : 'Select flight'}
        isSelected={isSelected}
        onActionClick={handleActionClick}
        bookingUrl={flight.bookingUrl}
        bookingLabel="Book flight"
        onRerun={onRerun}
      />
    </BaseRecommendationCard>
  );
}
