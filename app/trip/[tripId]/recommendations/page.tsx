'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Background } from '../../../components/Background';
import { GlassCard } from '../../../components/GlassCard';
import { Heading, Text, PullQuote } from '../../../components/Typography';
import { Container, Section } from '../../../components/Layout';
import { TopBar } from '../../../components/Navigation';
import { tripAPI } from '../../../lib/api';

const CATEGORIES = [
  { id: 'flight', name: 'Flights', icon: '✈️' },
  { id: 'accommodation', name: 'Accommodations', icon: '🏨' },
  { id: 'activity', name: 'Activities', icon: '🎭' },
  { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
  { id: 'transportation', name: 'Transportation', icon: '🚗' }
];

function RecommendationCard({ recommendation, isSelected, onToggle, category }: any) {
  const imageUrl = recommendation.imageUrl || recommendation.image;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -12, transition: { duration: 0.4, type: 'spring', stiffness: 300 } }}
      transition={{ duration: 0.5, type: 'spring' }}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        transformOrigin: 'center'
      }}
    >
      <GlassCard
        interactive
        style={{
          border: isSelected
            ? '2px solid rgba(255, 255, 255, 0.7)'
            : '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: isSelected
            ? '0 20px 60px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
            : 'var(--shadow-glass)',
          background: isSelected
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(255, 255, 255, 0.15)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Image or Gradient with zoom effect */}
        {imageUrl ? (
          <div style={{
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <motion.img
              src={imageUrl}
              alt={recommendation.name}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {/* Gradient overlay for text readability */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)',
              pointerEvents: 'none'
            }} />
          </div>
        ) : (
          <div style={{
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-4)',
            background: `linear-gradient(135deg,
              var(--color-primary-200) 0%,
              var(--color-primary-300) 50%,
              var(--color-primary-400) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem',
            boxShadow: 'inset 0 2px 20px rgba(0, 0, 0, 0.1)'
          }}>
            {category.icon}
          </div>
        )}

        {/* Selection Indicator with enhanced animation */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{
                scale: 1,
                rotate: 0,
                opacity: 1,
              }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                position: 'absolute',
                top: 'var(--space-4)',
                right: 'var(--space-4)',
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(56, 142, 60, 0.95) 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: 'white',
                boxShadow: '0 8px 24px rgba(76, 175, 80, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.3)',
                zIndex: 10
              }}
            >
              ✓
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price Badge with enhanced styling */}
        {recommendation.price && (
          <div style={{
            position: 'absolute',
            top: 'var(--space-4)',
            left: 'var(--space-4)',
            padding: 'var(--space-2) var(--space-4)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: '1.2rem',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            letterSpacing: '0.3px',
            fontFamily: 'var(--font-display)',
            zIndex: 10
          }}>
            ${typeof recommendation.price === 'number' ? recommendation.price.toLocaleString() : recommendation.price}
          </div>
        )}

        {/* Rating with stars */}
        {recommendation.rating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 'var(--space-3)',
            gap: 'var(--space-1)'
          }}>
            <div style={{ display: 'flex' }}>
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    fontSize: '1.1rem',
                    color: i < Math.floor(recommendation.rating) ? '#FFD700' : 'rgba(255, 255, 255, 0.25)',
                    textShadow: i < Math.floor(recommendation.rating) ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none'
                  }}
                >
                  ★
                </motion.span>
              ))}
            </div>
            <Text style={{
              marginLeft: 'var(--space-2)',
              fontSize: '0.95rem',
              fontWeight: 'var(--weight-medium)'
            }}>
              {recommendation.rating}
              {recommendation.reviews && (
                <span style={{ opacity: 0.7, fontWeight: 'var(--weight-light)' }}>
                  {' '}({recommendation.reviews})
                </span>
              )}
            </Text>
          </div>
        )}

        {/* Title with elegant font */}
        <Heading
          level={3}
          style={{
            marginBottom: 'var(--space-3)',
            fontSize: '1.6rem',
            lineHeight: '1.3',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-semibold)',
            letterSpacing: '0.3px'
          }}
        >
          {recommendation.name}
        </Heading>

        {/* Description */}
        {recommendation.description && (
          <Text style={{
            marginBottom: 'var(--space-4)',
            opacity: 0.9,
            lineHeight: '1.7',
            fontSize: '0.95rem'
          }}>
            {recommendation.description}
          </Text>
        )}

        {/* Meta Info */}
        {(recommendation.duration || recommendation.location || recommendation.time) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            fontSize: '0.9rem',
            opacity: 0.8,
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-2) 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            {recommendation.duration && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⏱ {recommendation.duration}
              </span>
            )}
            {recommendation.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                📍 {recommendation.location}
              </span>
            )}
            {recommendation.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                🕒 {recommendation.time}
              </span>
            )}
          </div>
        )}

        {/* Add to Trip Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: isSelected
              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(56, 142, 60, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.15)',
            border: `2px solid ${isSelected ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.25)'}`,
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            fontWeight: 'var(--weight-semibold)',
            fontSize: '1rem',
            letterSpacing: '0.5px',
            transition: 'all 0.3s ease',
            boxShadow: isSelected ? '0 4px 12px rgba(76, 175, 80, 0.2)' : 'none'
          }}
        >
          {isSelected ? '✓ Added to Trip' : '+ Add to Trip'}
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}

function CategorySection({ category, recommendations, selections, onToggleSelection, isOpen, onToggleOpen }: any) {
  const selectedCount = recommendations.filter((r: any) => selections[category.id]?.includes(r.id)).length;

  return (
    <Section width="wide" style={{ marginBottom: 'var(--space-7)' }}>
      <motion.div
        onClick={onToggleOpen}
        whileHover={{ scale: 1.01, boxShadow: 'var(--shadow-glass-hover)' }}
        whileTap={{ scale: 0.99 }}
        style={{
          cursor: 'pointer',
          padding: 'var(--space-6) var(--space-7)',
          background: isOpen
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(25px)',
          border: `1px solid ${isOpen ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)'}`,
          borderRadius: 'var(--radius-xl)',
          marginBottom: 'var(--space-5)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'var(--shadow-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <motion.span
              style={{ fontSize: '3.5rem' }}
              animate={{ scale: isOpen ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {category.icon}
            </motion.span>
            <div>
              <Heading
                level={2}
                style={{
                  marginBottom: 'var(--space-2)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  letterSpacing: '0.5px'
                }}
              >
                {category.name}
              </Heading>
              <Text style={{ fontSize: '1rem', opacity: 0.85, fontWeight: 'var(--weight-light)' }}>
                {recommendations.length} option{recommendations.length !== 1 ? 's' : ''} available
                {selectedCount > 0 && (
                  <span style={{
                    fontWeight: 'var(--weight-medium)',
                    color: 'rgba(76, 175, 80, 1)',
                    marginLeft: 'var(--space-2)'
                  }}>
                    • {selectedCount} selected
                  </span>
                )}
              </Text>
            </div>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
            style={{
              fontSize: '2.5rem',
              opacity: 0.8
            }}
          >
            ↓
          </motion.span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 'var(--space-6)',
              marginTop: 'var(--space-5)'
            }}>
              {recommendations.map((rec: any, index: number) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 100
                  }}
                >
                  <RecommendationCard
                    recommendation={rec}
                    category={category}
                    isSelected={selections[category.id]?.includes(rec.id)}
                    onToggle={() => onToggleSelection(category.id, rec.id)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

export default function Recommendations() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const [tripData, setTripData] = useState<any>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    flight: [],
    accommodation: [],
    activity: [],
    restaurant: [],
    transportation: []
  });
  const [openSections, setOpenSections] = useState(['flight']);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
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

  const toggleSection = (categoryId: string) => {
    setOpenSections(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSelection = (categoryId: string, recommendationId: string) => {
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
        const rec = categoryRecs.find((r: any) => r.id === id);
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
      await tripAPI.selectRecommendations(tripId, {
        selections,
        selectedBy: 'user@example.com'
      });

      router.push(`/trip/${tripId}/overview`);
    } catch (err: any) {
      console.error('Error finalizing trip:', err);
      alert('Failed to finalize trip. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
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
                <Text style={{ fontSize: '1.1rem' }}>Loading your curated recommendations...</Text>
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
                  Unable to Load Recommendations
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

  const totalSelections = getTotalSelections();
  const totalPrice = calculateTotal();

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="home" />

      <Container>
        <Section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level={1}>Curate Your Perfect Journey</Heading>
          </motion.div>
        </Section>

        <Section width="narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PullQuote>
              Handpick the experiences that will make your trip unforgettable.
            </PullQuote>
          </motion.div>
        </Section>

        {CATEGORIES.map((category, index) => {
          const recommendations = tripData?.recommendations?.[category.id] || [];
          if (recommendations.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + (index * 0.1) }}
            >
              <CategorySection
                category={category}
                recommendations={recommendations}
                selections={selections}
                onToggleSelection={toggleSelection}
                isOpen={openSections.includes(category.id)}
                onToggleOpen={() => toggleSection(category.id)}
              />
            </motion.div>
          );
        })}

        {/* Spacer for sticky footer */}
        {totalSelections > 0 && <div style={{ height: '180px' }} />}

        {/* Sticky Footer */}
        <AnimatePresence>
          {totalSelections > 0 && (
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'var(--space-6) var(--space-5)',
                background: 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(40px)',
                borderTop: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.15)',
                zIndex: 1000
              }}
            >
              <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-5)'
              }}>
                <div>
                  <Text style={{
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-2)',
                    opacity: 0.85,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Your Selections
                  </Text>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => {
                      const count = selections[cat.id]?.length || 0;
                      if (count === 0) return null;
                      return (
                        <motion.div
                          key={cat.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-2) var(--space-3)',
                            background: 'rgba(255, 255, 255, 0.25)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                          <span style={{ fontWeight: 'var(--weight-semibold)' }}>{count}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Text style={{
                    fontSize: '0.85rem',
                    marginBottom: 'var(--space-2)',
                    opacity: 0.85,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Estimated Total
                  </Text>
                  <motion.div
                    key={totalPrice}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Text style={{
                      fontSize: '2.5rem',
                      fontWeight: 'var(--weight-semibold)',
                      fontFamily: 'var(--font-display)',
                      lineHeight: '1',
                      textShadow: '0 2px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                      ${totalPrice.toLocaleString()}
                    </Text>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  style={{
                    padding: 'var(--space-4) var(--space-8)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--color-text-primary)',
                    fontSize: '1.2rem',
                    fontWeight: 'var(--weight-semibold)',
                    cursor: isFinalizing ? 'not-allowed' : 'pointer',
                    opacity: isFinalizing ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    letterSpacing: '0.5px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  {isFinalizing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTopColor: 'var(--color-text-primary)',
                          borderRadius: '50%',
                          display: 'inline-block'
                        }}
                      />
                      Finalizing...
                    </span>
                  ) : (
                    '✨ Finalize Trip'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </>
  );
}
