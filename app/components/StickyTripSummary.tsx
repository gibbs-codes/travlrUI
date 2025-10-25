'use client';

import { Plane, Bed, TrainFront, UtensilsCrossed, Users, Printer } from 'lucide-react';
import { formatDateTime, formatDuration, formatMoney, formatRoute } from '../lib/formatters';
import type { Flight, Trip } from '../lib/types';
import { estimateTripTotal } from '../lib/tripAdapters';

type SummaryKind = 'flight' | 'stay' | 'transit' | 'restaurants';

type StickyTripSummaryProps = {
  trip: Trip;
  onEdit: (kind: SummaryKind) => void;
  onPrint: () => void;
};

export function StickyTripSummary({ trip, onEdit, onPrint }: StickyTripSummaryProps) {
  // We consolidate totals here so every page shows the exact same math + formatting.
  const total = estimateTripTotal(trip);
  const hasAnySelection =
    Boolean(trip.selections.flight) ||
    Boolean(trip.selections.stay) ||
    Boolean(trip.selections.transit);
  const totalLabel =
    total.amount > 0
      ? formatMoney(total)
      : hasAnySelection
      ? 'Pending total'
      : formatMoney(total);

  const start = firstPart(formatDateTime(trip.start));
  const end = firstPart(formatDateTime(trip.end));

  // These rows drive the checklist-like summary while keeping copy centralized.
  const rows: Array<{
    kind: SummaryKind;
    label: string;
    hasSelection: boolean;
    summary: string;
    icon: JSX.Element;
  }> = [
    {
      kind: 'flight',
      label: 'Flight',
      hasSelection: Boolean(trip.selections.flight),
      summary: trip.selections.flight
        ? describeFlight(trip.selections.flight)
        : 'Not selected',
      icon: <Plane className="h-4 w-4" />,
    },
    {
      kind: 'stay',
      label: 'Stay',
      hasSelection: Boolean(trip.selections.stay),
      summary: trip.selections.stay
        ? `${trip.selections.stay.name} · ${trip.selections.stay.nights} night${
            trip.selections.stay.nights === 1 ? '' : 's'
          }${trip.selections.stay.freeCancel ? ' · Free cancel' : ''}`
        : 'Not selected',
      icon: <Bed className="h-4 w-4" />,
    },
    {
      kind: 'transit',
      label: 'Transit',
      hasSelection: Boolean(trip.selections.transit),
      summary: trip.selections.transit
        ? `${formatRoute(trip.selections.transit.chain)} · ${formatDuration(
            trip.selections.transit.durationISO
          )}`
        : 'Not selected',
      icon: <TrainFront className="h-4 w-4" />,
    },
    {
      kind: 'restaurants',
      label: 'Restaurants',
      hasSelection: trip.selections.restaurants.length > 0,
      summary:
        trip.selections.restaurants.length > 0
          ? `${trip.selections.restaurants.length} saved · ${trip.selections.restaurants
              .slice(0, 2)
              .map((item) => item.name)
              .join(', ')}`
          : 'Not selected',
      icon: <UtensilsCrossed className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="sticky top-4 h-fit space-y-4 rounded-2xl border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Trip summary
        </p>
        <h2 className="text-lg font-semibold text-gray-900">{trip.destination}</h2>
        <p className="text-sm text-gray-500">
          {start} → {end}
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-gray-600">
          <Users className="h-3.5 w-3.5" />
          {trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}
        </p>
      </header>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.kind}
            className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2.5"
          >
            <span
              className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${
                row.hasSelection
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {row.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                <button
                  type="button"
                  onClick={() => onEdit(row.kind)}
                  className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
                >
                  Edit
                </button>
              </div>
              <p
                className={`mt-0.5 text-sm ${
                  row.hasSelection ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {row.summary}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl bg-slate-900 px-4 py-4 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">
          Estimated total
        </p>
        <p className="text-xl font-semibold">{totalLabel}</p>
        <p className="text-xs text-slate-300">
          Flights, stays, and transit — restaurants not included
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
        >
          <Printer className="h-4 w-4" />
          Print itinerary
        </button>
        <button
          type="button"
          onClick={() => onEdit('flight')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
        >
          Review selections
        </button>
      </div>
    </aside>
  );
}

function firstPart(label: string) {
  return label.split('·')[0]?.trim() ?? label;
}

function describeFlight(flight: Flight) {
  const departure = formatDateTime(flight.depart);
  const arrival = formatDateTime(flight.arrive);
  const duration = formatDuration(flight.durationISO);
  const price = formatMoney(flight.price);

  return `${flight.carrier} ${flight.flightNo} · ${departure} → ${arrival} · ${duration} · ${price}`;
}
