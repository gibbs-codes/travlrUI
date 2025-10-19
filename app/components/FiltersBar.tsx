'use client';

export type FlightSort = 'price-asc' | 'price-desc' | 'duration' | 'depart';

export type Filters = {
  nonstop: boolean;
  carryOn: boolean;
};

type FiltersBarProps = {
  sort: FlightSort;
  filters: Filters;
  onSortChange: (value: FlightSort) => void;
  onToggleFilter: (filter: keyof Filters) => void;
};

const pillBase =
  'inline-flex items-center gap-2 rounded-full border border-slate-200/80 px-3 py-1 text-xs font-medium transition';
const pillActive = 'border-emerald-400/60 bg-emerald-50 text-emerald-700';
const pillInactive = 'bg-white text-slate-600 hover:bg-slate-100';

export function FiltersBar({
  sort,
  filters,
  onSortChange,
  onToggleFilter,
}: FiltersBarProps) {
  // Keeps flight sorting/filtering simple while signalling which controls are wired.
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
        Sort
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as FlightSort)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="price-asc">Price · Low to High</option>
          <option value="price-desc">Price · High to Low</option>
          <option value="duration">Duration</option>
          <option value="depart">Departure time</option>
        </select>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleFilter('nonstop')}
          className={`${pillBase} ${
            filters.nonstop ? pillActive : pillInactive
          }`}
        >
          Nonstop only
        </button>
        <button
          type="button"
          onClick={() => onToggleFilter('carryOn')}
          className={`${pillBase} ${
            filters.carryOn ? pillActive : pillInactive
          }`}
        >
          Carry-on included
        </button>
      </div>
    </div>
  );
}
