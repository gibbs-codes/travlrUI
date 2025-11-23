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
import { useGooglePlacesAutocomplete } from '../hooks/useGooglePlacesAutocomplete';
import { toast } from '../lib/toast';

interface CreateTripFormValues {
  destination: string;
  destinationCoordinates?: { lat: number; lng: number };
  origin: string;
  originCoordinates?: { lat: number; lng: number };
  departureDate: string;
  returnDate: string;
  travelers: string;
}

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
    travelers: '2',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const buildPayloadFromForm = (): TripRequest => {
    const travelerCount = parseInt(formData.travelers, 10);
    const safeTravelerCount = Number.isFinite(travelerCount) && travelerCount > 0 ? travelerCount : 2;

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
      agentsToRun: ['flight', 'accommodation', 'activity', 'restaurant'],
      triggerOrchestrator: false,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    const payload = buildPayloadFromForm();
    setIsSubmitting(true);

    try {
      const response = await tripService.createTrip(payload);
      const data = extractData(response);
      const tripId = extractTripId(data);

      if (!tripId) {
        throw new Error('Trip created but no tripId received from server');
      }

      // Show success toast
      toast.success('Trip created! Our agents are now working on your recommendations.');

      // Redirect to status page
      router.push(`/trip/${tripId}/status`);
    } catch (error) {
      const message = getErrorMessage(error);
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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


  const buttonStyle = {
    width: '100%',
    padding: '1rem 2rem',
    background:
      isFormValid && !isSubmitting
        ? '#1f2937'
        : '#9ca3af',
    border: '2px solid #111827',
    borderRadius: '0.5rem',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
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
              Share where you&apos;re going and when. Our AI agents will craft personalized recommendations for flights, stays, dining, and activities.
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={buttonStyle}
                onMouseEnter={(event) => {
                  if (isFormValid && !isSubmitting) {
                    event.currentTarget.style.background = '#111827';
                    event.currentTarget.style.transform = 'translateY(-1px)';
                    event.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(event) => {
                  if (isFormValid && !isSubmitting) {
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
    </>
  );
}
