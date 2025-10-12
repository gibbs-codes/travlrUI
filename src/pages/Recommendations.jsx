import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'flight', name: 'Flights', icon: '✈️', emoji: '✈️', gradient: 'from-sky-400 to-blue-600' },
  { id: 'accommodation', name: 'Accommodations', icon: '🏨', emoji: '🏨', gradient: 'from-purple-400 to-pink-600' },
  { id: 'activity', name: 'Activities', icon: '🎭', emoji: '🎭', gradient: 'from-orange-400 to-red-600' },
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️', emoji: '🍽️', gradient: 'from-green-400 to-emerald-600' },
  { id: 'transportation', name: 'Transportation', icon: '🚗', emoji: '🚗', gradient: 'from-indigo-400 to-purple-600' }
];

// Glassmorphic Recommendation Card Component
function RecommendationCard({ recommendation, isSelected, onToggle, category }) {
  const categoryConfig = CATEGORIES.find(c => c.id === category);
  const imageUrl = recommendation.imageUrl || null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div
        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
          isSelected
            ? 'ring-4 ring-blue-400 ring-opacity-60 shadow-2xl shadow-blue-500/50'
            : 'hover:shadow-2xl'
        }`}
        onClick={onToggle}
      >
        {/* Hero Image or Gradient Background */}
        <div className="relative h-48 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={recommendation.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryConfig?.gradient} opacity-80`}>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          )}

          {/* Glassmorphic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            <span className="text-lg font-bold text-gray-900">
              {recommendation.price ? `$${recommendation.price}` : 'Free'}
            </span>
          </div>

          {/* Selection Indicator */}
          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="absolute top-4 left-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Glassmorphic Content Card */}
        <div className="relative bg-white/95 backdrop-blur-xl p-6">
          {/* Rating */}
          {recommendation.rating && (
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(recommendation.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {recommendation.rating} {recommendation.reviews ? `(${recommendation.reviews} reviews)` : ''}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {recommendation.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {recommendation.description || 'Explore this amazing option for your trip.'}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {recommendation.duration && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recommendation.duration}
              </span>
            )}
            {recommendation.location && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {recommendation.location}
              </span>
            )}
          </div>

          {/* Add to Trip Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-4 w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
            }`}
          >
            {isSelected ? '✓ Added to Trip' : '+ Add to Trip'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Accordion Section Component
function AccordionSection({ category, recommendations, selections, onToggleSelection, isOpen, onToggleOpen }) {
  const selectedCount = recommendations.filter(r => selections[category.id]?.includes(r.id)).length;

  return (
    <div className="mb-6">
      <motion.button
        onClick={onToggleOpen}
        className="w-full group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${category.gradient} p-8 shadow-xl transition-all duration-300 ${
          isOpen ? 'shadow-2xl' : 'hover:shadow-2xl'
        }`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-5xl">{category.emoji}</span>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-white mb-1">{category.name}</h2>
                <p className="text-white/80 text-sm">
                  {recommendations.length} option{recommendations.length !== 1 ? 's' : ''} available
                  {selectedCount > 0 && ` • ${selectedCount} selected`}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-white"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 px-2">
              {recommendations.map(rec => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  category={category.id}
                  isSelected={selections[category.id]?.includes(rec.id)}
                  onToggle={() => onToggleSelection(category.id, rec.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Recommendations() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);
  const [selections, setSelections] = useState({
    flight: [],
    accommodation: [],
    activity: [],
    restaurant: [],
    transportation: []
  });
  const [openSections, setOpenSections] = useState(['flight']);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
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

  const toggleSection = (categoryId) => {
    setOpenSections(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSelection = (categoryId, recommendationId) => {
    setSelections(prev => {
      const categorySelections = prev[categoryId] || [];
      const isSelected = categorySelections.includes(recommendationId);

      return {
        ...prev,
        [categoryId]: isSelected
          ? categorySelections.filter(id => id !== recommendationId)
          : [...categorySelections, recommendationId]
      };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(selections).forEach(([category, ids]) => {
      const categoryRecs = tripData?.recommendations?.[category] || [];
      ids.forEach(id => {
        const rec = categoryRecs.find(r => r.id === id);
        if (rec?.price && typeof rec.price === 'number') {
          total += rec.price;
        }
      });
    });
    return total;
  };

  const getTotalSelections = () => {
    return Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);

    try {
      const response = await fetch(`http://jamess-mac-mini:3006/api/trip/${tripId}/select`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selections,
          selectedBy: 'user@example.com'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize trip: ${response.status}`);
      }

      // Navigate to overview
      navigate(`/trip/${tripId}/overview`);
    } catch (err) {
      console.error('Error finalizing trip:', err);
      alert('Failed to finalize trip. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        ></motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Recommendations</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTripData}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalSelections = getTotalSelections();
  const totalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16 px-4 mb-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-6xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Curate Your Perfect Journey
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Handpick the experiences that will make your trip unforgettable
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {CATEGORIES.map(category => {
          const recommendations = tripData?.recommendations?.[category.id] || [];
          if (recommendations.length === 0) return null;

          return (
            <AccordionSection
              key={category.id}
              category={category}
              recommendations={recommendations}
              selections={selections}
              onToggleSelection={toggleSelection}
              isOpen={openSections.includes(category.id)}
              onToggleOpen={() => toggleSection(category.id)}
            />
          );
        })}
      </div>

      {/* Sticky Glassmorphic Footer */}
      <AnimatePresence>
        {totalSelections > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="relative bg-white/80 backdrop-blur-2xl border-t border-white/20 shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                  {/* Selection Summary */}
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Selections</p>
                      <div className="flex items-center space-x-2">
                        {CATEGORIES.map(cat => {
                          const count = selections[cat.id]?.length || 0;
                          if (count === 0) return null;
                          return (
                            <div key={cat.id} className="flex items-center space-x-1 bg-white/60 px-3 py-1 rounded-full">
                              <span>{cat.emoji}</span>
                              <span className="font-semibold text-sm">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-gray-300"></div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Estimated Total</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ${totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Finalize Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFinalize}
                    disabled={isFinalizing}
                    className="relative px-10 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    ></motion.div>
                    <span className="relative">
                      {isFinalizing ? 'Finalizing...' : '✨ Finalize Trip'}
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
