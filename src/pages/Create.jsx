import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

const INTEREST_OPTIONS = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'food', label: 'Food' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'nature', label: 'Nature' }
];

export default function Create() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: '',
    destinationCoordinates: null,
    origin: '',
    originCoordinates: null,
    departureDate: '',
    returnDate: '',
    travelers: 2,
    interests: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [originSelected, setOriginSelected] = useState(false);

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Google Places Autocomplete for destination
  const destinationAutocomplete = useGooglePlacesAutocomplete({
    onPlaceSelected: (place) => {
      setFormData(prev => ({
        ...prev,
        destination: place.name,
        destinationCoordinates: place.coordinates,
      }));
      setDestinationSelected(true);
      if (errors.destination) {
        setErrors(prev => ({ ...prev, destination: '' }));
      }
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, destination: error }));
    },
  });

  // Google Places Autocomplete for origin
  const originAutocomplete = useGooglePlacesAutocomplete({
    onPlaceSelected: (place) => {
      setFormData(prev => ({
        ...prev,
        origin: place.name,
        originCoordinates: place.coordinates,
      }));
      setOriginSelected(true);
      if (errors.origin) {
        setErrors(prev => ({ ...prev, origin: '' }));
      }
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, origin: error }));
    },
  });

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (!destinationSelected) {
      newErrors.destination = 'Please select a destination from the dropdown suggestions';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    } else if (!originSelected) {
      newErrors.origin = 'Please select an origin city from the dropdown suggestions';
    }

    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    } else if (formData.departureDate < today) {
      newErrors.departureDate = 'Departure date cannot be in the past';
    }

    // Return date validation (optional but must be after departure if provided)
    if (formData.returnDate && formData.departureDate) {
      if (formData.returnDate <= formData.departureDate) {
        newErrors.returnDate = 'Return date must be after departure date';
      }
    }

    // Travelers validation
    if (!formData.travelers || formData.travelers < 1) {
      newErrors.travelers = 'At least 1 traveler is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset selection state if user manually changes destination/origin
    if (name === 'destination') {
      setDestinationSelected(false);
    }
    if (name === 'origin') {
      setOriginSelected(false);
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare API request body
      const requestBody = {
        title: formData.title,
        destination: formData.destination,
        origin: formData.origin,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate || undefined,
        travelers: {
          count: parseInt(formData.travelers) || 1,
          adults: parseInt(formData.travelers) || 1,
          children: 0,
          infants: 0
        },
        preferences: {
          interests: formData.interests || []
        },
        collaboration: {
          createdBy: 'user@example.com'
        }
      };

      const response = await fetch('http://jamess-mac-mini:3006/api/trip/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Extract tripId from response
      const tripId = data.tripId || data.id || data._id;

      if (!tripId) {
        throw new Error('Trip created but no tripId received from server');
      }

      // Navigate to status page
      navigate(`/trip/${tripId}/status`);

    } catch (error) {
      console.error('Error creating trip:', error);
      setApiError(error.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.destination.trim() &&
                       formData.origin.trim() &&
                       formData.departureDate &&
                       formData.departureDate >= today &&
                       formData.travelers >= 1 &&
                       (!formData.returnDate || formData.returnDate > formData.departureDate);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Your Trip</h1>
      <p className="text-gray-600 mb-8">Tell us about your dream destination</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Error Message */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {apiError}
          </div>
        )}

        {/* Destination & Origin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
              Destination <span className="text-red-500">*</span>
              {destinationAutocomplete.isLoading && (
                <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
              )}
            </label>
            <input
              ref={destinationAutocomplete.inputRef}
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              disabled={destinationAutocomplete.isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.destination ? 'border-red-500' : 'border-gray-300'
              } ${destinationAutocomplete.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="e.g., Paris, France"
            />
            {errors.destination && (
              <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
            )}
            {destinationAutocomplete.error && !errors.destination && (
              <p className="mt-1 text-sm text-yellow-600">{destinationAutocomplete.error}</p>
            )}
          </div>

          <div>
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
              Origin <span className="text-red-500">*</span>
              {originAutocomplete.isLoading && (
                <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
              )}
            </label>
            <input
              ref={originAutocomplete.inputRef}
              type="text"
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              disabled={originAutocomplete.isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.origin ? 'border-red-500' : 'border-gray-300'
              } ${originAutocomplete.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="e.g., New York, USA"
            />
            {errors.origin && (
              <p className="mt-1 text-sm text-red-600">{errors.origin}</p>
            )}
            {originAutocomplete.error && !errors.origin && (
              <p className="mt-1 text-sm text-yellow-600">{originAutocomplete.error}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="departureDate"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleChange}
              min={today}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.departureDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.departureDate && (
              <p className="mt-1 text-sm text-red-600">{errors.departureDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-2">
              Return Date <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="date"
              id="returnDate"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              min={formData.departureDate || today}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.returnDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.returnDate && (
              <p className="mt-1 text-sm text-red-600">{errors.returnDate}</p>
            )}
          </div>
        </div>

        {/* Travelers */}
        <div>
          <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="travelers"
            name="travelers"
            value={formData.travelers}
            onChange={handleChange}
            min="1"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.travelers ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.travelers && (
            <p className="mt-1 text-sm text-red-600">{errors.travelers}</p>
          )}
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interests <span className="text-gray-400 text-xs">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {INTEREST_OPTIONS.map(interest => (
              <label
                key={interest.id}
                className={`flex items-center space-x-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.interests.includes(interest.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest.id)}
                  onChange={() => handleInterestToggle(interest.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium">{interest.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
            isFormValid && !isSubmitting
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Trip...
            </span>
          ) : (
            'Create Trip'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          <span className="text-red-500">*</span> Required fields
        </p>
      </form>
    </div>
  );
}
