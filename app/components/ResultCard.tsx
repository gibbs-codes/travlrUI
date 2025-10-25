'use client';

import {
  Plane,
  Bed,
  TrainFront,
  UtensilsCrossed,
  Clock,
  MapPin,
  Luggage,
  Package,
  BaggageClaim,
  Check,
  Star,
  CalendarDays,
  ShieldCheck,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { ReactNode, MouseEvent, KeyboardEvent, useState } from 'react';
import {
  formatDateTime,
  formatDuration,
  formatMoney,
  formatRoute,
  stars as formatStars,
  priceLevel as formatPriceLevel,
} from '../lib/formatters';
import type { Flight, Stay, Transit, Restaurant } from '../lib/types';

type ResultCardProps =
  | {
      kind: 'flight';
      data: Flight;
      isSelected: boolean;
      onSelect: (id: string) => void;
    }
  | {
      kind: 'stay';
      data: Stay;
      isSelected: boolean;
      onSelect: (id: string) => void;
    }
  | {
      kind: 'transit';
      data: Transit;
      isSelected: boolean;
      onSelect: (id: string) => void;
    }
  | {
      kind: 'food';
      data: Restaurant;
      isSelected: boolean;
      onSelect: (id: string) => void;
    };

const CARD_BASE =
  'group relative rounded-2xl border border-black/5 bg-white/70 backdrop-blur p-4 shadow-sm hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
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
          <Bed className="mx-auto mb-2 h-8 w-8" />
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

export function ResultCard(props: ResultCardProps) {
  // Card shell is standardized here so flights, stays, transit, and food feel cohesive.
  // We use a div with button semantics so the footer CTA can stay an actual button.
  const { kind, data, isSelected, onSelect } = props as {
    kind: ResultCardProps['kind'];
    data: Flight | Stay | Transit | Restaurant;
    isSelected: boolean;
    onSelect: (id: string) => void;
  };

  const handleClick = () => onSelect(data.id);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(data.id);
    }
  };
  const handleActionClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect(data.id);
  };

  const { icon, title, subtitle, meta, price, actionLabel, footerNote, bookingUrl, bookingLabel, imageUrl, imageAlt } =
    buildContent(kind, data, isSelected);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${CARD_BASE} ${isSelected ? CARD_SELECTED : ''}`}
    >
      {isSelected && (
        <span className={`${BADGE_CLASSES} absolute right-4 top-4`}>
          <Check className="h-3.5 w-3.5" />
          Selected
        </span>
      )}

      {imageUrl && (
        <CardImage src={imageUrl} alt={imageAlt || title} />
      )}

      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-700">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-base font-semibold text-gray-900">{title}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {!isSelected && (
              <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-xs font-medium text-gray-500">
                Tap to choose
              </span>
            )}
          </div>

          {meta.length > 0 && (
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
              {meta.map(({ label, value, icon: metaIcon }) => (
                <div key={label} className="flex items-center gap-2">
                  {metaIcon}
                  <div>
                    <dt className="sr-only">{label}</dt>
                    <dd className="leading-normal">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200/70 pt-3 text-sm">
        {price && (
          <span className="text-base font-semibold text-gray-900">
            {price}
          </span>
        )}

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
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
          >
            {bookingLabel || 'View details'}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <button
          type="button"
          onClick={handleActionClick}
          className={`ml-auto inline-flex items-center rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-800 ${
            isSelected ? 'bg-emerald-600 hover:bg-emerald-500' : ''
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

type MetaRow = {
  label: string;
  value: string;
  icon: ReactNode;
};

type CardContent = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  meta: MetaRow[];
  price?: string;
  footerNote?: string;
  actionLabel: string;
  bookingUrl?: string;
  bookingLabel?: string;
  imageUrl?: string;
  imageAlt?: string;
};

function buildContent(
  kind: ResultCardProps['kind'],
  data: Flight | Stay | Transit | Restaurant,
  isSelected: boolean
): CardContent {
  switch (kind) {
    case 'flight': {
      const flight = data as Flight;
      const departure = formatDateTime(flight.depart);
      const arrival = formatDateTime(flight.arrive);
      const stopsLabel =
        flight.stops === 0
          ? 'Nonstop'
          : flight.stops === 1
          ? '1 stop'
          : `${flight.stops} stops`;

      const baggageBadges: MetaRow[] = [];
      if (flight.baggage?.personal) {
        baggageBadges.push({
          label: 'Personal item',
          value: 'Personal item included',
          icon: <Package className="h-4 w-4 text-slate-500" />,
        });
      }
      if (flight.baggage?.carryOn) {
        baggageBadges.push({
          label: 'Carry-on',
          value: 'Carry-on included',
          icon: <Luggage className="h-4 w-4 text-slate-500" />,
        });
      }
      if (typeof flight.baggage?.checked === 'number') {
        baggageBadges.push({
          label: 'Checked baggage',
          value: `${flight.baggage.checked} checked bag${
            flight.baggage.checked === 1 ? '' : 's'
          }`,
          icon: <BaggageClaim className="h-4 w-4 text-slate-500" />,
        });
      }

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
        ...baggageBadges,
      ];

      return {
        icon: <Plane className="h-5 w-5" />,
        title: `${flight.carrier} ${flight.flightNo}`.trim(),
        subtitle: `${departure} → ${arrival}`,
        meta,
        price: formatMoney(flight.price),
        actionLabel: isSelected ? 'Flight saved' : 'Select flight',
        bookingUrl: flight.bookingUrl,
        bookingLabel: 'Book flight',
      };
    }

    case 'stay': {
      const stay = data as Stay;
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

      return {
        icon: <Bed className="h-5 w-5" />,
        title: stay.name,
        subtitle: stay.neighborhood,
        meta,
        price: formatMoney(stay.total),
        footerNote: stay.freeCancel ? 'Cancel anytime' : undefined,
        actionLabel: isSelected ? 'Stay saved' : 'Select stay',
        bookingUrl: stay.bookingUrl,
        bookingLabel: 'View hotel',
        imageUrl: stay.images?.[0],
        imageAlt: stay.name,
      };
    }

    case 'transit': {
      const transit = data as Transit;
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

      return {
        icon: <TrainFront className="h-5 w-5" />,
        title: formatRoute(transit.chain),
        meta,
        price: formatMoney(transit.fare),
        actionLabel: isSelected ? 'Transit saved' : 'Select transit',
        bookingUrl: transit.bookingUrl,
        bookingLabel: 'Learn more',
      };
    }

    case 'food': {
      const restaurant = data as Restaurant;

      // Check if this is a placeholder/generic restaurant
      const isGeneric =
        !restaurant.name ||
        restaurant.name === 'Restaurant' ||
        restaurant.name.toLowerCase().includes('restaurant recommendation');

      const displayName = isGeneric ? 'Name unavailable' : restaurant.name;

      const meta: MetaRow[] = [];

      // Add rating if available
      if (typeof restaurant.rating === 'number') {
        meta.push({
          label: 'Rating',
          value: `${formatStars(restaurant.rating)}${
            restaurant.reviewCount ? ` (${restaurant.reviewCount})` : ''
          }`,
          icon: <Star className="h-4 w-4 text-amber-500" />,
        });
      }

      // Add cuisine if available
      if (restaurant.cuisine) {
        meta.push({
          label: 'Cuisine',
          value: restaurant.cuisine,
          icon: <UtensilsCrossed className="h-4 w-4 text-slate-500" />,
        });
      }

      // Add price level if available
      if (restaurant.priceLevel) {
        meta.push({
          label: 'Price level',
          value: formatPriceLevel(restaurant.priceLevel),
          icon: <DollarSign className="h-4 w-4 text-slate-500" />,
        });
      }

      // Add address if available
      if (restaurant.address) {
        meta.push({
          label: 'Address',
          value: restaurant.address,
          icon: <MapPin className="h-4 w-4 text-slate-500" />,
        });
      }

      // Add distance if available
      if (typeof restaurant.distanceMi === 'number') {
        meta.push({
          label: 'Distance',
          value: `${restaurant.distanceMi.toFixed(1)} mi away`,
          icon: <MapPin className="h-4 w-4 text-slate-500" />,
        });
      }

      // Generate Google Maps link
      let mapsUrl: string | undefined;
      if (restaurant.googlePlaceId) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${restaurant.googlePlaceId}`;
      } else if (restaurant.coordinates) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`;
      }

      return {
        icon: <UtensilsCrossed className="h-5 w-5" />,
        title: displayName,
        subtitle: restaurant.address,
        meta,
        price: restaurant.price ? formatMoney(restaurant.price) : undefined,
        footerNote: restaurant.openNow ? 'Open now' : undefined,
        actionLabel: isSelected ? 'Saved to eats' : 'Save restaurant',
        bookingUrl: mapsUrl,
        bookingLabel: 'View on map',
      };
    }

    default:
      return {
        icon: <Plane className="h-5 w-5" />,
        title: 'Travel pick',
        meta: [],
        actionLabel: 'Select',
      };
  }
}
