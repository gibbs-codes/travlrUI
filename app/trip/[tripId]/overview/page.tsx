'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Background } from '../../../components/Background';
import { GlassCard } from '../../../components/GlassCard';
import { Heading, Text } from '../../../components/Typography';
import { Container, Section } from '../../../components/Layout';
import { TopBar } from '../../../components/Navigation';
import { tripAPI } from '../../../lib/api';

const CATEGORIES = [
  { id: 'flight', name: 'Your Flight', icon: '✈️', singularName: 'Flight' },
  { id: 'accommodation', name: 'Your Accommodations', icon: '🏨', singularName: 'Accommodation' },
  { id: 'activity', name: 'Your Activities', icon: '🎭', singularName: 'Activity' },
  { id: 'restaurant', name: 'Your Restaurants', icon: '🍽️', singularName: 'Restaurant' },
  { id: 'transportation', name: 'Your Transportation', icon: '🚗', singularName: 'Transportation' }
];

function SelectedItemCard({ item, category, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, type: 'spring', stiffness: 100 }}
      whileHover={{ x: 8, transition: { duration: 0.2 } }}
      style={{
        padding: 'var(--space-5)',
        background: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-4)',
        transition: 'all 0.3s ease',
        cursor: 'default'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: '2rem', lineHeight: '1' }}>{category.icon}</span>
            <Heading level={4} style={{
              fontSize: '1.4rem',
              marginBottom: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--weight-semibold)',
              letterSpacing: '0.3px'
            }}>
              {item.name}
            </Heading>
          </div>

          {item.rating && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-3)', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '1rem',
                      color: i < Math.floor(item.rating) ? '#FFD700' : 'rgba(255, 255, 255, 0.25)',
                      textShadow: i < Math.floor(item.rating) ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <Text style={{ marginLeft: 'var(--space-2)', fontSize: '0.9rem', fontWeight: 'var(--weight-medium)' }}>
                {item.rating}
                {item.reviews && (
                  <span style={{ opacity: 0.7, fontWeight: 'var(--weight-light)' }}>
                    {' '}({item.reviews})
                  </span>
                )}
              </Text>
            </div>
          )}

          {item.description && (
            <Text style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: 'var(--space-3)', lineHeight: '1.7' }}>
              {item.description}
            </Text>
          )}

          {(item.duration || item.location || item.time) && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              fontSize: '0.9rem',
              opacity: 0.8,
              marginTop: 'var(--space-3)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              {item.duration && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏱ {item.duration}
                </span>
              )}
              {item.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 {item.location}
                </span>
              )}
              {item.time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🕒 {item.time}
                </span>
              )}
            </div>
          )}
        </div>

        {item.price && (
          <div style={{
            padding: 'var(--space-3) var(--space-5)',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: '1.4rem',
            fontFamily: 'var(--font-display)',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            ${typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const [tripData, setTripData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTripData();
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      const response = await tripAPI.get(tripId);
      setTripData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching trip data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (!tripData?.selectedRecommendations) return 0;

    Object.values(tripData.selectedRecommendations).forEach((items: any) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item?.price && typeof item.price === 'number') {
            total += item.price;
          }
        });
      }
    });

    return total;
  };

  const getTotalSelections = () => {
    if (!tripData?.selectedRecommendations) return 0;
    return Object.values(tripData.selectedRecommendations).reduce((sum: number, items: any) => {
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <>
        <Background />
        <TopBar logo="TravlrAPI" navText="home" />
        <Container>
          <Section width="narrow">
            <GlassCard>
              <div style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '64px',
                    height: '64px',
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    borderTopColor: 'var(--color-primary-200)',
                    borderRightColor: 'var(--color-primary-300)',
                    borderRadius: '50%',
                    margin: '0 auto var(--space-5)',
                    filter: 'drop-shadow(0 0 12px rgba(245, 169, 98, 0.5))'
                  }}
                />
                <Text style={{ fontSize: '1.1rem' }}>Loading your trip overview...</Text>
              </div>
            </GlassCard>
          </Section>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Background />
        <TopBar logo="TravlrAPI" navText="home" />
        <Container>
          <Section width="narrow">
            <GlassCard>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: '5rem', display: 'block', marginBottom: 'var(--space-4)' }}
                >
                  ⚠️
                </motion.span>
                <Heading level={2} elegant style={{ marginBottom: 'var(--space-3)' }}>
                  Unable to Load Trip
                </Heading>
                <Text style={{ marginBottom: 'var(--space-6)', opacity: 0.9 }}>{error}</Text>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchTripData}
                  style={{
                    padding: 'var(--space-3) var(--space-6)',
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'var(--weight-semibold)',
                    backdropFilter: 'blur(10px)',
                    letterSpacing: '0.5px'
                  }}
                >
                  Try Again
                </motion.button>
              </div>
            </GlassCard>
          </Section>
        </Container>
      </>
    );
  }

  const totalCost = calculateTotalCost();
  const totalSelections = getTotalSelections();

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="home" />

      <Container>
        {/* Trip Header */}
        <Section width="wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard style={{
              padding: 'var(--space-8) var(--space-7)',
              marginBottom: 'var(--space-7)',
              background: 'rgba(255, 255, 255, 0.25)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: 'var(--shadow-glass-hover)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--space-7)'
              }}>
                <div style={{ flex: 1, minWidth: '320px' }}>
                  <Text style={{
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: 0.75,
                    marginBottom: 'var(--space-3)',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Your Journey To
                  </Text>
                  <Heading level={1} style={{
                    fontSize: '3.5rem',
                    marginBottom: 'var(--space-5)',
                    fontFamily: 'var(--font-display)',
                    lineHeight: '1.1',
                    letterSpacing: '0.5px'
                  }}>
                    {typeof tripData?.destination === 'string'
                      ? tripData.destination
                      : tripData?.destination?.name || 'Your Destination'}
                  </Heading>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 'var(--space-5)',
                    marginTop: 'var(--space-6)'
                  }}>
                    {tripData?.departureDate && (
                      <div>
                        <Text style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Departure
                        </Text>
                        <Text style={{ fontSize: '1.15rem', fontWeight: 'var(--weight-semibold)', lineHeight: '1.4' }}>
                          {formatDate(tripData.departureDate)}
                        </Text>
                      </div>
                    )}

                    {tripData?.returnDate && (
                      <div>
                        <Text style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Return
                        </Text>
                        <Text style={{ fontSize: '1.15rem', fontWeight: 'var(--weight-semibold)', lineHeight: '1.4' }}>
                          {formatDate(tripData.returnDate)}
                        </Text>
                      </div>
                    )}

                    {tripData?.travelers && (
                      <div>
                        <Text style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Travelers
                        </Text>
                        <Text style={{ fontSize: '1.15rem', fontWeight: 'var(--weight-semibold)', lineHeight: '1.4' }}>
                          {tripData.travelers?.count || tripData.travelers} {(tripData.travelers?.count || tripData.travelers) === 1 ? 'Person' : 'People'}
                        </Text>
                      </div>
                    )}

                    {tripData?.origin && (
                      <div>
                        <Text style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          From
                        </Text>
                        <Text style={{ fontSize: '1.15rem', fontWeight: 'var(--weight-semibold)', lineHeight: '1.4' }}>
                          {typeof tripData.origin === 'string'
                            ? tripData.origin
                            : tripData.origin?.name || 'Origin'}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{
                    padding: 'var(--space-7) var(--space-6)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: 'var(--radius-xl)',
                    textAlign: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.35)',
                    minWidth: '240px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Text style={{
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: 0.8,
                    marginBottom: 'var(--space-3)',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Total Cost
                  </Text>
                  <Text style={{
                    fontSize: '4rem',
                    fontWeight: 'var(--weight-semibold)',
                    fontFamily: 'var(--font-display)',
                    lineHeight: '1',
                    textShadow: '0 2px 16px rgba(0, 0, 0, 0.15)'
                  }}>
                    ${totalCost.toLocaleString()}
                  </Text>
                  {totalSelections > 0 && (
                    <Text style={{
                      fontSize: '0.85rem',
                      opacity: 0.7,
                      marginTop: 'var(--space-3)'
                    }}>
                      {totalSelections} {totalSelections === 1 ? 'item' : 'items'} selected
                    </Text>
                  )}
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </Section>

        {/* Selected Items by Category */}
        {totalSelections === 0 ? (
          <Section width="narrow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlassCard style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
                <span style={{ fontSize: '5rem', display: 'block', marginBottom: 'var(--space-4)' }}>📋</span>
                <Heading level={2} elegant style={{ marginBottom: 'var(--space-3)' }}>
                  No Selections Yet
                </Heading>
                <Text style={{ marginBottom: 'var(--space-6)', fontSize: '1.05rem', opacity: 0.85 }}>
                  Start curating your perfect journey by selecting recommendations.
                </Text>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-glass-hover)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/trip/${tripId}/recommendations`)}
                  style={{
                    padding: 'var(--space-4) var(--space-7)',
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 'var(--weight-semibold)',
                    backdropFilter: 'blur(10px)',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Browse Recommendations →
                </motion.button>
              </GlassCard>
            </motion.div>
          </Section>
        ) : (
          CATEGORIES.map((category, categoryIndex) => {
            const items = tripData?.selectedRecommendations?.[category.id] || [];
            if (!items || items.length === 0) return null;

            return (
              <Section key={category.id} width="wide">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (categoryIndex * 0.1) }}
                >
                  <GlassCard style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      marginBottom: 'var(--space-6)',
                      paddingBottom: 'var(--space-4)',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <span style={{ fontSize: '3rem', lineHeight: '1' }}>{category.icon}</span>
                      <Heading level={2} style={{
                        fontSize: '2rem',
                        marginBottom: 0,
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '0.5px'
                      }}>
                        {category.name}
                      </Heading>
                      <Text style={{
                        marginLeft: 'auto',
                        fontSize: '0.95rem',
                        opacity: 0.75,
                        fontWeight: 'var(--weight-medium)',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </Text>
                    </div>

                    <div>
                      {items.map((item: any, index: number) => (
                        <SelectedItemCard key={item.id || index} item={item} category={category} index={index} />
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              </Section>
            );
          })
        )}

        {/* Action Buttons */}
        <Section width="narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: 'var(--space-7)',
              marginBottom: 'var(--space-10)'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/trip/${tripId}/recommendations`)}
              style={{
                padding: 'var(--space-4) var(--space-7)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text-primary)',
                fontSize: '1.15rem',
                fontWeight: 'var(--weight-semibold)',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.3s ease'
              }}
            >
              ← Edit Selections
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.print()}
              style={{
                padding: 'var(--space-4) var(--space-7)',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text-primary)',
                fontSize: '1.15rem',
                fontWeight: 'var(--weight-medium)',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                transition: 'all 0.3s ease'
              }}
            >
              🖨 Print Itinerary
            </motion.button>
          </motion.div>
        </Section>

        {/* Trip Reference */}
        <Section width="narrow">
          <Text style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            opacity: 0.5,
            marginBottom: 'var(--space-8)',
            fontFamily: 'monospace',
            letterSpacing: '0.5px'
          }}>
            Trip ID: {tripId}
          </Text>
        </Section>
      </Container>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          [class*="Background"] {
            display: none !important;
          }
          [class*="TopBar"] {
            display: none !important;
          }
          button {
            display: none !important;
          }
          [class*="GlassCard"] {
            background: white !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            page-break-inside: avoid;
          }
          * {
            color: #000 !important;
          }
        }
      `}</style>
    </>
  );
}
