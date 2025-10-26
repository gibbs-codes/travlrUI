import { ReactNode } from 'react';
import { Search, Inbox, MapPin } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'search' | 'inbox' | 'map' | ReactNode;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = 'inbox', title, message, action }: EmptyStateProps) {
  let IconComponent: ReactNode;

  if (typeof icon === 'string') {
    switch (icon) {
      case 'search':
        IconComponent = <Search className="h-12 w-12 text-gray-400" />;
        break;
      case 'map':
        IconComponent = <MapPin className="h-12 w-12 text-gray-400" />;
        break;
      default:
        IconComponent = <Inbox className="h-12 w-12 text-gray-400" />;
    }
  } else {
    IconComponent = icon;
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <div className="mb-4">{IconComponent}</div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-gray-600">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
