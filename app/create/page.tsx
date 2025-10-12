'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Background } from '../components/Background';
import { GlassCard } from '../components/GlassCard';
import { Heading, Text } from '../components/Typography';
import { Container, Section } from '../components/Layout';
import { TopBar } from '../components/Navigation';
import { tripAPI } from '../lib/api';

const INTEREST_OPTIONS = [
  { id: 'cultural', label: 'Cultural' },
  { id: 'food', label: 'Food' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'nature', label: 'Nature' }
];

export default function CreateTrip() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destination: '',
    origin: '',
    departureDate: '',
    returnDate: '',
    travelers: 2,
    budget: '',
    interests: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }
    if (!formData.departureDate) {
      newErrors.departureDate = 'Departure date is required';
    } else if (formData.departureDate < today) {
      newErrors.departureDate = 'Departure date cannot be in the past';
    }
    if (formData.returnDate && formData.departureDate) {
      if (formData.returnDate <= formData.departureDate) {
        newErrors.returnDate = 'Return date must be after departure date';
      }
    }
    if (!formData.travelers || formData.travelers < 1) {
      newErrors.travelers = 'At least 1 traveler is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: `Trip to ${formData.destination}`,
        destination: formData.destination,
        origin: formData.origin,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate || undefined,
        travelers: {
          count: parseInt(String(formData.travelers)),
          adults: parseInt(String(formData.travelers)),
          children: 0,
          infants: 0
        },
        preferences: {
          interests: formData.interests,
          budget: formData.budget ? {
            total: parseFloat(formData.budget),
            currency: 'USD'
          } : undefined
        },
        collaboration: {
          createdBy: 'user@example.com'
        }
      };

      const response = await tripAPI.create(requestBody);
      const tripId = response.data.tripId || response.data.id || response.data._id;

      if (!tripId) {
        throw new Error('Trip created but no tripId received from server');
      }

      router.push(`/trip/${tripId}/status`);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      setApiError(error.response?.data?.message || error.message || 'Failed to create trip. Please try again.');
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

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: 'var(--space-3)',
    background: 'rgba(255, 255, 255, 0.15)',
    border: `1px solid ${hasError ? 'rgba(255, 107, 107, 0.6)' : 'rgba(255, 255, 255, 0.3)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    backdropFilter: 'blur(10px)',
    transition: 'all var(--transition-base)',
    outline: 'none',
  });

  const buttonStyle = {
    width: '100%',
    padding: 'var(--space-4) var(--space-6)',
    background: isFormValid && !isSubmitting
      ? 'rgba(255, 255, 255, 0.25)'
      : 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '1.1rem',
    fontWeight: 'var(--weight-medium)',
    cursor: isFormValid && !isSubmitting ? 'pointer' : 'not-allowed',
    opacity: isFormValid && !isSubmitting ? 1 : 0.5,
    transition: 'all var(--transition-base)',
    letterSpacing: '0.5px'
  };

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
              Every great journey begins with intention. Share your vision, and let our AI agents
              craft an experience tailored to your desires.
            </Text>

            {apiError && (
              <div style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)'
              }}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-6)' }}>
              {/* Destination & Origin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                    fontSize: '0.9rem',
                    fontWeight: 'var(--weight-medium)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.3px'
                  }}>
                    Destination *
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    placeholder="e.g., Paris, France"
                    style={inputStyle(!!errors.destination)}
                    onFocus={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = errors.destination ? 'rgba(255, 107, 107, 0.6)' : 'rgba(255, 255, 255, 0.3)';
                    }}
                  />
                  {errors.destination && (
                    <p style={{
                      marginTop: 'var(--space-1)',
                      fontSize: '0.85rem',
                      color: 'rgba(255, 107, 107, 0.9)',
                      fontStyle: 'italic'
                    }}>
                      {errors.destination}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: 'var(--space-2)',
                    fontSize: '0.9rem',
                    fontWeight: 'var(--weight-medium)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.3px'
                  }}>
                    Origin *
                  </label>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="e.g., New York, USA"
                    style={inputStyle(!!errors.origin)}
                    onFocus={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = errors.origin ? 'rgba(255, 107, 107, 0.6)' : 'rgba(255, 255, 255, 0.3)';
                    }}
                  />
                  {errors.origin && (
                    <p style={{
                      marginTop: 'var(--space-1)',
                      fontSize: '0.85rem',
                      color: 'rgba(255, 107, 107, 0.9)',
                      fontStyle: 'italic'
                    }}>
                      {errors.origin}
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)' }}>
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
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)' }}>
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

              {/* Travelers & Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)' }}>
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

                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)' }}>
                    Budget (USD) <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>(optional)</span>
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 2000"
                    style={inputStyle(false)}
                  />
                </div>
              </div>

              {/* Interests */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-3)',
                  fontSize: '0.9rem',
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.3px'
                }}>
                  Interests <span style={{ opacity: 0.6, fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>(select all that apply)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
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
                        border: `1px solid ${formData.interests.includes(interest.id)
                          ? 'rgba(255, 255, 255, 0.5)'
                          : 'rgba(255, 255, 255, 0.2)'}`,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-base)',
                        fontSize: '0.9rem'
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={buttonStyle}
                onMouseEnter={(e) => {
                  if (isFormValid && !isSubmitting) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glass-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFormValid && !isSubmitting) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'var(--color-text-primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Creating Your Journey...
                  </span>
                ) : (
                  'Begin Planning →'
                )}
              </button>
              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
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
