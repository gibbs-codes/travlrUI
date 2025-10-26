'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Building2, Compass, UtensilsCrossed, Car, CheckCircle2, Loader2 } from 'lucide-react';
import { Background } from '../../../components/Background';
import { GlassCard } from '../../../components/GlassCard';
import { Heading, Text } from '../../../components/Typography';
import { Container, Section } from '../../../components/Layout';
import { TopBar } from '../../../components/Navigation';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { tripAPI } from '../../../lib/api';

const AGENT_CONFIG = [
  { id: 'flight', name: 'Flight Agent', icon: Plane },
  { id: 'accommodation', name: 'Accommodation Agent', icon: Building2 },
  { id: 'activity', name: 'Activity Agent', icon: Compass },
  { id: 'restaurant', name: 'Restaurant Agent', icon: UtensilsCrossed },
  { id: 'transportation', name: 'Transportation Agent', icon: Car }
];

// Sequential order for display (exclude transportation from user-facing UI)
const SEQUENTIAL_AGENTS = [
  { id: 'accommodation', name: 'Accommodation', icon: Building2 },
  { id: 'flight', name: 'Flights', icon: Plane },
  { id: 'activity', name: 'Activities', icon: Compass },
  { id: 'restaurant', name: 'Restaurants', icon: UtensilsCrossed },
];

const POLL_INTERVAL = 3000;

function AgentStatusIcon({ status }: { status: string }) {
  if (status === 'running') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          borderTopColor: 'var(--color-primary-200)',
          borderRightColor: 'var(--color-primary-300)',
          borderRadius: '50%',
          filter: 'drop-shadow(0 0 12px rgba(245, 169, 98, 0.6))'
        }}
      />
    );
  }
  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(76, 175, 80, 0.2)',
          border: '3px solid rgba(76, 175, 80, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          color: 'rgba(76, 175, 80, 1)',
          filter: 'drop-shadow(0 0 12px rgba(76, 175, 80, 0.5))'
        }}
      >
        ✓
      </motion.div>
    );
  }
  if (status === 'failed') {
    return (
      <motion.div
        animate={{ x: [-2, 2, -2, 0] }}
        transition={{ duration: 0.4, repeat: 2 }}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 107, 107, 0.2)',
          border: '3px solid rgba(255, 107, 107, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          color: 'rgba(255, 107, 107, 1)'
        }}
      >
        ✗
      </motion.div>
    );
  }
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '3px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      opacity: 0.4
    }}>
      ○
    </div>
  );
}

function AgentStatusText({ status, count }: { status: string; count: number }) {
  if (status === 'running') {
    return (
      <motion.span
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ color: 'var(--color-primary-200)', fontStyle: 'italic' }}
      >
        Searching for the perfect options...
      </motion.span>
    );
  }
  if (status === 'completed') {
    return (
      <span style={{ color: 'rgba(76, 175, 80, 1)', fontWeight: 'var(--weight-medium)' }}>
        ✨ Found {count || 0} recommendation{count !== 1 ? 's' : ''}
      </span>
    );
  }
  if (status === 'failed') {
    return <span style={{ color: 'rgba(255, 107, 107, 1)' }}>Failed - retrying soon</span>;
  }
  return <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Waiting...</span>;
}

export default function TripStatus() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;
  const [tripData, setTripData] = useState<any>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [recommendationCounts, setRecommendationCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTripStatus = async () => {
    try {
      const response = await tripAPI.getStatus(tripId);
      // Handle both wrapped and unwrapped response formats
      const data = response.data?.data || response.data;

      setTripData(data);
      setAgentStatuses(data.execution?.agents || {});
      setRecommendationCounts(data.recommendationCounts || {});
      setError(null);

      if (data.status === 'recommendations_ready') {
        setIsPolling(false);
        setTimeout(() => {
          router.push(`/trip/${tripId}/recommendations`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error fetching trip status:', err);
      setError(err.message);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchTripStatus();

    if (isPolling) {
      pollIntervalRef.current = setInterval(fetchTripStatus, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [tripId, isPolling]);

  const calculateOverallProgress = () => {
    const totalAgents = AGENT_CONFIG.length;
    const completedAgents = Object.values(agentStatuses).filter(status => status === 'completed').length;
    return Math.round((completedAgents / totalAgents) * 100);
  };

  const handleRetry = () => {
    setError(null);
    setIsPolling(true);
  };

  const overallProgress = calculateOverallProgress();
  const destination = tripData?.destination || 'your destination';

  if (error) {
    return (
      <>
        <Background />
        <TopBar logo="TravlrAPI" navText="explore" />
        <Container>
          <Section width="narrow">
            <GlassCard>
              <ErrorMessage
                title="Unable to load trip status"
                message="We're having trouble connecting to our travel agents. Please check your connection and try again."
                onRetry={handleRetry}
              />
            </GlassCard>
          </Section>
        </Container>
      </>
    );
  }

  if (!tripData) {
    return (
      <>
        <Background />
        <TopBar logo="TravlrAPI" navText="explore" />
        <Container>
          <Section width="narrow">
            <GlassCard>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    borderTopColor: 'var(--color-primary-200)',
                    borderRadius: '50%',
                    margin: '0 auto var(--space-4)',
                    filter: 'drop-shadow(0 0 8px rgba(245, 169, 98, 0.4))'
                  }}
                />
                <Text>Loading trip status...</Text>
              </div>
            </GlassCard>
          </Section>
        </Container>
      </>
    );
  }

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="explore" />

      <Container>
        <Section>
          <Heading level={1}>Planning your trip to {destination}</Heading>
        </Section>

        <Section width="wide">
          <GlassCard>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
              <Heading level={2} elegant>Our AI Agents at Work</Heading>
              <Text size="large" style={{ marginTop: 'var(--space-3)' }}>
                Like skilled artisans, each agent carefully curates options that match your vision.
                Watch as your perfect journey takes shape.
              </Text>
            </div>

            {/* Overall Progress */}
            <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'var(--weight-medium)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                  Overall Progress
                </Text>
                <motion.div
                  key={overallProgress}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                  style={{ fontSize: '1.8rem', fontWeight: 'var(--weight-semibold)', color: 'var(--color-primary-200)' }}
                >
                  {overallProgress}%
                </motion.div>
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-primary-200) 0%, var(--color-primary-300) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 0 20px rgba(245, 169, 98, 0.6)'
                  }}
                />
              </div>
            </div>

            {/* Sequential Agent Progress */}
            <div className="mt-7 mx-auto max-w-2xl px-4">
              <div className="flex flex-col gap-3">
                {SEQUENTIAL_AGENTS.map((agent, index) => {
                  const status = agentStatuses[agent.id] || 'pending';
                  const count = recommendationCounts[agent.id] || 0;

                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-md transition-all ${
                        status === 'running'
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      {/* Status Icon */}
                      <div style={{ flexShrink: 0 }}>
                        {status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-gray-400" />
                        )}
                        {status === 'running' && (
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        )}
                        {status === 'pending' && (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)' }} />
                        )}
                      </div>

                      {/* Agent Icon */}
                      <div style={{ flexShrink: 0 }}>
                        <agent.icon className={`h-5 w-5 ${
                          status === 'completed' ? 'text-gray-400' :
                          status === 'running' ? 'text-blue-500' :
                          'text-gray-500/50'
                        }`} />
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base font-medium ${
                          status === 'pending' ? 'text-white/40' : 'text-gray-700'
                        } ${status === 'completed' ? 'mb-0.5' : ''}`}>
                          {agent.name}
                        </p>
                        {status === 'completed' && count > 0 && (
                          <p className="text-xs text-gray-500">
                            {count} option{count !== 1 ? 's' : ''} found
                          </p>
                        )}
                        {status === 'running' && (
                          <p className="text-xs text-blue-500 italic">
                            Searching...
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Completion Celebration */}
            <AnimatePresence>
              {tripData.status === 'recommendations_ready' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                  style={{
                    marginTop: 'var(--space-8)',
                    padding: 'var(--space-7)',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.25) 0%, rgba(76, 175, 80, 0.15) 100%)',
                    border: '3px solid rgba(76, 175, 80, 0.5)',
                    borderRadius: 'var(--radius-xl)',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 12px 48px rgba(76, 175, 80, 0.3)'
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 15, -15, 0]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    style={{ fontSize: '5rem', marginBottom: 'var(--space-4)' }}
                  >
                    ✨
                  </motion.div>
                  <Heading level={2} style={{ marginBottom: 'var(--space-3)', color: 'rgba(76, 175, 80, 1)' }}>
                    Your Journey Awaits!
                  </Heading>
                  <Text size="large" style={{ marginBottom: 'var(--space-2)' }}>
                    All agents have finished curating your perfect trip
                  </Text>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Text style={{ fontSize: '0.95rem', fontStyle: 'italic', opacity: 0.9 }}>
                      Preparing your personalized recommendations...
                    </Text>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </Section>
      </Container>
    </>
  );
}
