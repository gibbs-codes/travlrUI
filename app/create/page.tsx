'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { Heading, Text } from '../components/Typography';
import { Container, Section } from '../components/Layout';
import { TopBar } from '../components/Navigation';
import { tripService } from '../lib/api';
import { buildCreateTripPayload } from '../lib/buildCreateTripPayload';
import type { TripRequest } from '../lib/types';
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';

const INTEREST_OPTIONS = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'food', label: 'Food' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'nature', label: 'Nature' },
];

const ACCOMMODATION_OPTIONS = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'resort', label: 'Resort' },
  { id: 'boutique', label: 'Boutique' },
];

const FLIGHT_CLASS_OPTIONS = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium_economy', label: 'Premium Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First' },
];

const DINING_PRICE_OPTIONS = [
  { id: 'budget', label: 'Budget' },
  { id: 'mid_range', label: 'Mid Range' },
  { id: 'premium', label: 'Premium' },
];

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120000;

type CreationPhase = 'idle' | 'creating' | 'polling' | 'loading' | 'error';

interface CreateTripFormValues {
  destination: string;
  destinationCoordinates?: { lat: number; lng: number };
  origin: string;
  originCoordinates?: { lat: number; lng: number };
  departureDate: string;
  returnDate: string;
  travelers: string;
  interests: string[];
  accommodationType: string;
  minRating: string;
  flightClass: string;
  diningPriceRange: string;
  selectedAgents: {
    flight: boolean;
    accommodation: boolean;
    activity: boolean;
    restaurant: boolean;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractData = (response: any) => response?.data?.data || response?.data || response;

const extractTripId = (data: any): string | undefined =>
  data?.tripId || data?.id || data?._id;

const getErrorMessage = (error: any): string =>
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong. Please try again.';

export default function CreateTrip() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateTripFormValues>({
    destination: '',
    origin: '',
    departureDate: '',
    returnDate: '',
    travelers: '1',
    interests: [],
    accommodationType: 'hotel',
    minRating: '3',
    flightClass: 'economy',
    diningPriceRange: 'mid_range',
    selectedAgents: {
      flight: true,
      accommodation: true,
      activity: false,
      restaurant: false,
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationPhase, setCreationPhase] = useState<CreationPhase>('idle');
  const [statusMessage, setStatusMessage] = useState('Creating your trip request...');
  const [processError, setProcessError] = useState<string | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [lastSubmittedPayload, setLastSubmittedPayload] = useState<TripRequest | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(false);
  const [originSelected, setOriginSelected] = useState(false);

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
    const newErrors: Record<string, string> = {};

    // Get current values from the DOM inputs
    const currentDestination = destinationAutocomplete.inputRef.current?.value || '';
    const currentOrigin = originAutocomplete.inputRef.current?.value || '';

    if (!currentDestination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (!destinationSelected) {
      newErrors.destination = 'Please select a destination from the dropdown suggestions';
    }

    if (!currentOrigin.trim()) {
      newErrors.origin = 'Origin is required';
    } else if (!originSelected) {
      newErrors.origin = 'Please select an origin city from the dropdown suggestions';
    }
    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    } else if (formData.departureDate < today) {
      newErrors.departureDate = 'Departure date cannot be in the past';
    }
    if (formData.returnDate && formData.departureDate && formData.returnDate <= formData.departureDate) {
      newErrors.returnDate = 'Return date must be after departure date';
    }

    const travelerCount = parseInt(formData.travelers, 10);
    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      newErrors.travelers = 'At least 1 traveler is required';
    }

    if (formData.minRating) {
      const ratingValue = parseFloat(formData.minRating);
      if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        newErrors.minRating = 'Rating must be between 1 and 5';
      }
    }

    // Validate at least one agent is selected
    const selectedAgentCount = Object.values(formData.selectedAgents).filter(Boolean).length;
    if (selectedAgentCount === 0) {
      newErrors.agents = 'Please select at least one recommendation type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset selection state if user manually changes destination/origin
    if (name === 'destination') {
      setDestinationSelected(false);
    }
    if (name === 'origin') {
      setOriginSelected(false);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleAgentToggle = (agentKey: keyof CreateTripFormValues['selectedAgents']) => {
    setFormData(prev => ({
      ...prev,
      selectedAgents: {
        ...prev.selectedAgents,
        [agentKey]: !prev.selectedAgents[agentKey],
      },
    }));
    // Clear agent selection error if exists
    if (errors.agents) {
      setErrors(prev => ({ ...prev, agents: '' }));
    }
  };

  const buildPayloadFromForm = (): TripRequest => {
    const travelerCount = parseInt(formData.travelers, 10);
    const safeTravelerCount = Number.isFinite(travelerCount) && travelerCount > 0 ? travelerCount : 1;

    const minRatingValue = formData.minRating ? parseFloat(formData.minRating) : undefined;

    return buildCreateTripPayload({
      destination: formData.destination,
      origin: formData.origin,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      travelers: {
        count: safeTravelerCount,
        adults: safeTravelerCount,
        children: 0,
        infants: 0,
      },
      preferences: {
        interests: formData.interests,
        accommodation: {
          type: formData.accommodationType,
          minRating: minRatingValue,
        },
        transportation: {
          flightClass: formData.flightClass,
          preferNonStop: true,
        },
        dining: {
          priceRange: formData.diningPriceRange,
        },
      },
    });
  };

  const pollAndNavigate = async (tripId: string) => {
    setCreationPhase('polling');
    setStatusMessage('Building your trip with our travel agents...');
    const startTime = Date.now();

    let finalStatusData: any;

    while (true) {
      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        throw new Error('Trip processing is taking longer than expected. Please try again.');
      }

      let statusData: any;
      try {
        const statusResponse = await tripService.getTripStatus(tripId);
        statusData = extractData(statusResponse);
        finalStatusData = statusData;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }

      const executionStatus = statusData?.execution?.status;

      if (statusData?.message) {
        setStatusMessage(statusData.message);
      } else if (executionStatus === 'in_progress') {
        setStatusMessage('Our agents are finalizing flights, stays, and experiences...');
      }

      // Stop polling when orchestrator finishes (completed or failed)
      const orchestratorFinished =
        executionStatus === 'completed' ||
        executionStatus === 'failed';

      if (orchestratorFinished) {
        break;
      }

      await delay(POLL_INTERVAL_MS);
    }

    // Check if we got any recommendations
    const recommendationCounts = finalStatusData?.recommendationCounts || {};
    const totalRecommendations = Object.values(recommendationCounts).reduce(
      (sum: number, count: any) => sum + (typeof count === 'number' ? count : 0),
      0
    );

    // If no recommendations at all, show error
    if (totalRecommendations === 0) {
      throw new Error('Unable to generate recommendations. Please try again with different preferences.');
    }

    setCreationPhase('loading');
    setStatusMessage('Loading your trip details...');

    try {
      await tripService.getTripDetails(tripId);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }

    router.push(`/trip/${tripId}/overview`);
  };

  const runCreateFlow = async (payload: TripRequest) => {
    setStatusMessage('Creating your trip request...');
    const response = await tripService.createTrip(payload);
    const data = extractData(response);
    const tripId = extractTripId(data);

    if (!tripId) {
      throw new Error('Trip created but no tripId received from server');
    }

    setCurrentTripId(tripId);
    await pollAndNavigate(tripId);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');
    setProcessError(null);

    if (!validateForm()) return;

    const payload = buildPayloadFromForm();
    setLastSubmittedPayload(payload);
    setCreationPhase('creating');
    setIsSubmitting(true);

    try {
      await runCreateFlow(payload);
    } catch (error) {
      const message = getErrorMessage(error);
      setProcessError(message);
      setApiError(message);
      setCreationPhase('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (creationPhase !== 'error') return;

    setProcessError(null);
    setApiError('');

    if (currentTripId) {
      setIsRetrying(true);
      try {
        await pollAndNavigate(currentTripId);
      } catch (error) {
        const message = getErrorMessage(error);
        setProcessError(message);
        setApiError(message);
        setCreationPhase('error');
      } finally {
        setIsRetrying(false);
      }
      return;
    }

    if (lastSubmittedPayload) {
      setIsRetrying(true);
      setCreationPhase('creating');
      try {
        await runCreateFlow(lastSubmittedPayload);
      } catch (error) {
        const message = getErrorMessage(error);
        setProcessError(message);
        setApiError(message);
        setCreationPhase('error');
      } finally {
        setIsRetrying(false);
      }
      return;
    }

    setCreationPhase('idle');
  };

  const handleCancel = () => {
    setCreationPhase('idle');
    setProcessError(null);
    setStatusMessage('Creating your trip request...');
    setIsRetrying(false);
    setCurrentTripId(null);
  };

  const travelerCount = parseInt(formData.travelers, 10);
  const isFormValid =
    formData.destination.trim() &&
    formData.origin.trim() &&
    formData.departureDate &&
    formData.departureDate >= today &&
    Number.isInteger(travelerCount) &&
    travelerCount >= 1 &&
    (!formData.returnDate || formData.returnDate > formData.departureDate);

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '0.75rem',
    background: 'white',
    border: `2px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
    borderRadius: '0.5rem',
    color: '#111827',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    transition: 'all 150ms ease',
    outline: 'none',
  });

  const renderProcessingOverlay = () => {
    if (creationPhase === 'idle') {
      return null;
    }

    const isError = creationPhase === 'error';

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(6, 12, 24, 0.78)',
          backdropFilter: 'blur(14px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <GlassCard className="max-w-md w-full p-6 sm:p-8">
          <Heading level={2} elegant style={{ marginBottom: 'var(--space-3)' }}>
            {isError ? 'We hit a bump' : 'Building your trip...'}
          </Heading>
          <Text style={{ marginBottom: 'var(--space-6)', opacity: 0.85 }}>
            {isError ? processError || 'We could not finish creating your trip.' : statusMessage}
          </Text>

          {isError ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: isRetrying
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-base)',
                  letterSpacing: '0.4px',
                }}
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: 'var(--space-3)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)',
                  letterSpacing: '0.4px',
                }}
              >
                Back to form
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid rgba(255, 255, 255, 0.2)',
                  borderTopColor: 'var(--color-primary-200)',
                  borderRadius: '50%',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <Text style={{ fontSize: '0.95rem', opacity: 0.75 }}>
                {creationPhase === 'creating' && 'Connecting with Travlr...'}
                {creationPhase === 'polling' && 'Curating flights, stays, and experiences...'}
                {creationPhase === 'loading' && 'Finalizing your itinerary...'}
              </Text>
            </div>
          )}
        </GlassCard>
      </div>
    );
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem 2rem',
    background:
      isFormValid && !isSubmitting && creationPhase === 'idle'
        ? '#1f2937'
        : '#9ca3af',
    border: '2px solid #111827',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: isFormValid && !isSubmitting && creationPhase === 'idle' ? 'pointer' : 'not-allowed',
    transition: 'all 150ms ease',
  } as const;

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="home" />

      <Container>
        <Section>
          <Heading level={1}>Create Your Journey</Heading>
        </Section>

        <Section width="narrow">
          <GlassCard>
            <Heading level={2} elegant>Tell Us Your Dreams</Heading>
            <Text size="large">
              Share the essentials and we&apos;ll handle the rest. Our AI agents will craft flights, stays,
              dining, and activities tailored to your style.
            </Text>

            {apiError && (
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  background: 'rgba(255, 107, 107, 0.2)',
                  border: '1px solid rgba(255, 107, 107, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-6)' }}>
              {/* Destination & Origin */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--weight-medium)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Destination * {destinationAutocomplete.isLoading && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Loading...)</span>}
                  </label>
                  <input
                    ref={destinationAutocomplete.inputRef}
                    type="text"
                    name="destination"
                    placeholder="e.g., Barcelona, Spain"
                    defaultValue={formData.destination}
                    style={inputStyle(!!errors.destination)}
                    disabled={destinationAutocomplete.isLoading}
                    autoComplete="off"
                    onFocus={(event) => {
                      event.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      event.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      event.currentTarget.style.borderColor = errors.destination
                        ? 'rgba(255, 107, 107, 0.6)'
                        : 'rgba(255, 255, 255, 0.3)';
                    }}
                  />
                  {errors.destination && (
                    <p
                      style={{
                        marginTop: 'var(--space-1)',
                        fontSize: '0.85rem',
                        color: 'rgba(255, 107, 107, 0.9)',
                        fontStyle: 'italic',
                      }}
                    >
                      {errors.destination}
                    </p>
                  )}
                  {destinationAutocomplete.error && !errors.destination && (
                    <p
                      style={{
                        marginTop: 'var(--space-1)',
                        fontSize: '0.85rem',
                        color: 'rgba(255, 193, 7, 0.9)',
                        fontStyle: 'italic',
                      }}
                    >
                      {destinationAutocomplete.error}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--weight-medium)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Origin * {originAutocomplete.isLoading && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Loading...)</span>}
                  </label>
                  <input
                    ref={originAutocomplete.inputRef}
                    type="text"
                    name="origin"
                    placeholder="e.g., Chicago, USA"
                    defaultValue={formData.origin}
                    style={inputStyle(!!errors.origin)}
                    disabled={originAutocomplete.isLoading}
                    autoComplete="off"
                    onFocus={(event) => {
                      event.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      event.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      event.currentTarget.style.borderColor = errors.origin
                        ? 'rgba(255, 107, 107, 0.6)'
                        : 'rgba(255, 255, 255, 0.3)';
                    }}
                  />
                  {errors.origin && (
                    <p
                      style={{
                        marginTop: 'var(--space-1)',
                        fontSize: '0.85rem',
                        color: 'rgba(255, 107, 107, 0.9)',
                        fontStyle: 'italic',
                      }}
                    >
                      {errors.origin}
                    </p>
                  )}
                  {originAutocomplete.error && !errors.origin && (
                    <p
                      style={{
                        marginTop: 'var(--space-1)',
                        fontSize: '0.85rem',
                        color: 'rgba(255, 193, 7, 0.9)',
                        fontStyle: 'italic',
                      }}
                    >
                      {originAutocomplete.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--weight-medium)',
                    }}
                  >
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={formData.departureDate}
                    onChange={handleChange}
                    min={today}
                    style={inputStyle(!!errors.departureDate)}
                  />
                  {errors.departureDate && (
                    <p style={{ marginTop: 'var(--space-1)', fontSize: '0.85rem', color: '#ff6b6b' }}>
                      {errors.departureDate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--weight-medium)',
                    }}
                  >
                    Return Date <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    min={formData.departureDate || today}
                    style={inputStyle(!!errors.returnDate)}
                  />
                  {errors.returnDate && (
                    <p style={{ marginTop: 'var(--space-1)', fontSize: '0.85rem', color: '#ff6b6b' }}>
                      {errors.returnDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Travelers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  marginBottom: 'var(--space-5)',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 'var(--space-2)',
                      fontSize: '0.9rem',
                      fontWeight: 'var(--weight-medium)',
                    }}
                  >
                    Travelers *
                  </label>
                  <input
                    type="number"
                    name="travelers"
                    value={formData.travelers}
                    onChange={handleChange}
                    min="1"
                    style={inputStyle(!!errors.travelers)}
                  />
                  {errors.travelers && (
                    <p style={{ marginTop: 'var(--space-1)', fontSize: '0.85rem', color: '#ff6b6b' }}>
                      {errors.travelers}
                    </p>
                  )}
                </div>
              </div>

              {/* Interests */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--space-3)',
                    fontSize: '0.9rem',
                    fontWeight: 'var(--weight-medium)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.3px',
                  }}
                >
                  Interests{' '}
                  <span style={{ opacity: 0.6, fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                    (select all that apply)
                  </span>
                </label>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                >
                  {INTEREST_OPTIONS.map(interest => (
                    <label
                      key={interest.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: 'var(--space-3)',
                        background: formData.interests.includes(interest.id)
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.1)',
                        border: `1px solid ${
                          formData.interests.includes(interest.id)
                            ? 'rgba(255, 255, 255, 0.5)'
                            : 'rgba(255, 255, 255, 0.2)'
                        }`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        fontSize: '0.9rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest.id)}
                        onChange={() => handleInterestToggle(interest.id)}
                        style={{ marginRight: 'var(--space-2)' }}
                      />
                      {interest.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Agent Selection */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--space-3)',
                    fontSize: '0.9rem',
                    fontWeight: 'var(--weight-medium)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.3px',
                  }}
                >
                  What recommendations do you want?
                </label>
                <p
                  style={{
                    marginBottom: 'var(--space-4)',
                    fontSize: '0.85rem',
                    opacity: 0.7,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  You can always add more recommendations later
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      background: formData.selectedAgents.flight
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${
                        formData.selectedAgents.flight
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAgents.flight}
                      onChange={() => handleAgentToggle('flight')}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    Flights
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      background: formData.selectedAgents.accommodation
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${
                        formData.selectedAgents.accommodation
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAgents.accommodation}
                      onChange={() => handleAgentToggle('accommodation')}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    Hotels
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      background: formData.selectedAgents.activity
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${
                        formData.selectedAgents.activity
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAgents.activity}
                      onChange={() => handleAgentToggle('activity')}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    Activities
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      background: formData.selectedAgents.restaurant
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${
                        formData.selectedAgents.restaurant
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)'
                      }`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedAgents.restaurant}
                      onChange={() => handleAgentToggle('restaurant')}
                      style={{ marginRight: 'var(--space-2)' }}
                    />
                    Restaurants
                  </label>
                </div>
                {errors.agents && (
                  <p
                    style={{
                      marginTop: 'var(--space-2)',
                      fontSize: '0.85rem',
                      color: '#dc2626',
                    }}
                  >
                    {errors.agents}
                  </p>
                )}
              </div>

              {/* Advanced Options Toggle */}
              <div
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdvanced(prev => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.95rem',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Advanced Options
                  <span style={{ fontSize: '1.2rem' }}>{showAdvanced ? '▲' : '▼'}</span>
                </button>
                {showAdvanced && (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4"
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.85rem',
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        Accommodation Type
                      </label>
                      <select
                        name="accommodationType"
                        value={formData.accommodationType}
                        onChange={handleChange}
                        style={inputStyle(false)}
                      >
                        {ACCOMMODATION_OPTIONS.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.85rem',
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        Min Rating
                      </label>
                      <input
                        type="number"
                        name="minRating"
                        value={formData.minRating}
                        onChange={handleChange}
                        min="1"
                        max="5"
                        step="0.5"
                        style={inputStyle(!!errors.minRating)}
                      />
                      {errors.minRating && (
                        <p style={{ marginTop: 'var(--space-1)', fontSize: '0.8rem', color: '#ff6b6b' }}>
                          {errors.minRating}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.85rem',
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        Flight Class
                      </label>
                      <select
                        name="flightClass"
                        value={formData.flightClass}
                        onChange={handleChange}
                        style={inputStyle(false)}
                      >
                        {FLIGHT_CLASS_OPTIONS.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 'var(--space-2)',
                          fontSize: '0.85rem',
                          fontWeight: 'var(--weight-medium)',
                        }}
                      >
                        Dining Price Range
                      </label>
                      <select
                        name="diningPriceRange"
                        value={formData.diningPriceRange}
                        onChange={handleChange}
                        style={inputStyle(false)}
                      >
                        {DINING_PRICE_OPTIONS.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting || creationPhase !== 'idle'}
                style={buttonStyle}
                onMouseEnter={(event) => {
                  if (isFormValid && !isSubmitting && creationPhase === 'idle') {
                    event.currentTarget.style.background = '#111827';
                    event.currentTarget.style.transform = 'translateY(-1px)';
                    event.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(event) => {
                  if (isFormValid && !isSubmitting && creationPhase === 'idle') {
                    event.currentTarget.style.background = '#1f2937';
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: 'var(--color-text-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Creating Your Journey...
                  </span>
                ) : (
                  'Begin Planning →'
                )}
              </button>
              <style jsx>{`
                @keyframes spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>

              <p style={{ marginTop: 'var(--space-3)', fontSize: '0.85rem', textAlign: 'center', opacity: 0.7 }}>
                * Required fields
              </p>
            </form>
          </GlassCard>
        </Section>
      </Container>

      {renderProcessingOverlay()}
    </>
  );
}
