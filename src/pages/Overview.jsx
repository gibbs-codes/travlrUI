import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { id: 'flight', name: 'Your Flight', icon: '✈️', color: 'blue' },
  { id: 'accommodation', name: 'Your Accommodations', icon: '🏨', color: 'purple' },
  { id: 'activity', name: 'Your Activities', icon: '🎭', color: 'orange' },
  { id: 'restaurant', name: 'Your Restaurants', icon: '🍽️', color: 'green' },
  { id: 'transportation', name: 'Your Transportation', icon: '🚗', color: 'indigo' }
];

// Format date string nicely
function formatDateRange(departureDate, returnDate) {
  if (!departureDate) return 'Dates not specified';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const start = formatDate(departureDate);
  const end = returnDate ? formatDate(returnDate) : null;

  return end ? `${start} - ${end}` : start;
}

// Recommendation item card
function RecommendationItem({ item, category }) {
  const imageUrl = item.imageUrl || item.image;

  return (
    <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      {/* Image or Icon */}
      <div className="flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-3xl">{category.icon}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-grow min-w-0">
        <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h4>

        {/* Rating */}
        {item.rating && (
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600">{item.rating}</span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {item.duration && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {item.duration}
            </span>
          )}
          {item.location && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {item.location}
            </span>
          )}
          {item.time && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {item.time}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xl font-bold text-gray-900">
          {item.price ? `$${typeof item.price === 'number' ? item.price.toLocaleString() : item.price}` : 'Free'}
        </p>
      </div>
    </div>
  );
}

// Category section
function CategorySection({ category, items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <span className="text-3xl mr-3">{category.icon}</span>
        <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
        <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <RecommendationItem key={item.id || index} item={item} category={category} />
        ))}
      </div>
    </div>
  );
}

export default function Overview() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      const response = await fetch(`http://jamess-mac-mini:3006/api/trip/${tripId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trip: ${response.status}`);
      }

      const data = await response.json();
      setTripData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trip data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSelections = () => {
    navigate(`/trip/${tripId}/recommendations`);
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotalCost = () => {
    if (!tripData?.selectedRecommendations) return 0;

    let total = 0;
    Object.values(tripData.selectedRecommendations).forEach(categoryItems => {
      if (Array.isArray(categoryItems)) {
        categoryItems.forEach(item => {
          if (item.price && typeof item.price === 'number') {
            total += item.price;
          }
        });
      }
    });
    return total;
  };

  const getTotalSelections = () => {
    if (!tripData?.selectedRecommendations) return 0;
    return Object.values(tripData.selectedRecommendations).reduce((sum, items) => {
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your trip overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Trip</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTripData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalCost = calculateTotalCost();
  const totalSelections = getTotalSelections();
  const dateRange = formatDateRange(tripData?.departureDate, tripData?.returnDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-before: always; }
          body { background: white; }
        }
      `}</style>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {tripData?.title || `Trip to ${tripData?.destination || 'Your Destination'}`}
          </h1>
          <p className="text-xl text-blue-100">Your complete trip overview</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Trip Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Destination</p>
              <p className="text-xl font-semibold text-gray-900">{tripData?.destination || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Dates</p>
              <p className="text-xl font-semibold text-gray-900">{dateRange}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Travelers</p>
              <p className="text-xl font-semibold text-gray-900">
                {tripData?.travelers?.count || tripData?.travelers || 1}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Total Cost</p>
              <p className="text-xl font-semibold text-blue-600">
                ${totalCost.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {tripData?.origin && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Origin:</span> {tripData.origin}
              </p>
            </div>
          )}
        </div>

        {/* Selected Recommendations */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Selections</h2>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-full">
              {totalSelections} {totalSelections === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {totalSelections === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No selections made yet</p>
              <button
                onClick={handleEditSelections}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Selections
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {CATEGORIES.map(category => {
                const items = tripData?.selectedRecommendations?.[category.id] || [];
                return (
                  <CategorySection key={category.id} category={category} items={items} />
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end no-print">
          <button
            onClick={handlePrint}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Overview
          </button>
          <button
            onClick={handleEditSelections}
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Edit Selections
          </button>
        </div>

        {/* Trip ID Reference (for support) */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Trip ID: {tripId}
        </div>
      </div>
    </div>
  );
}
