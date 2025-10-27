'use client';

import { useParams } from 'next/navigation';
import { Background } from '../../../components/Background';
import { GlassCard } from '../../../components/GlassCard';
import { Heading, Text } from '../../../components/Typography';
import { Container, Section } from '../../../components/Layout';
import { TopBar } from '../../../components/Navigation';
import { TripAgentCard } from '../../../components/TripAgentCard';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import type { AgentType } from '../../../lib/types';
import styles from './StatusPage.module.css';

// Agents to display (excluding transportation from user-facing UI)
const DISPLAY_AGENTS: AgentType[] = [
  'flight',
  'accommodation',
  'activity',
  'restaurant',
];

export default function TripStatus() {
  const params = useParams();
  const tripId = params.tripId as string;

  // Determine grid class based on number of active agents
  const getGridClass = () => {
    const count = DISPLAY_AGENTS.length;
    if (count === 1) return `${styles.agentGrid} ${styles.singleCard}`;
    if (count === 3) return `${styles.agentGrid} ${styles.threeCards}`;
    return styles.agentGrid;
  };

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="explore" />

      <div className={styles.pageContainer}>
        {/* Header Section */}
        <header className={styles.header}>
          <h1 className={styles.tripTitle}>Planning Your Trip</h1>
          <p className={styles.tripSubtitle}>
            Our AI agents are working independently to find the best options for your journey
          </p>
        </header>

        <ErrorBoundary>
          <GlassCard>
            {/* Section Title */}
            <div className="mb-8 text-center">
              <Heading level={2} elegant>AI Agents at Work</Heading>
              <Text className="mt-3 text-gray-600">
                Each agent specializes in finding the perfect recommendations.
                Watch as they complete their search.
              </Text>
            </div>

            {/* Responsive Agent Cards Grid */}
            <div className={getGridClass()}>
              {DISPLAY_AGENTS.map((agentType) => (
                <TripAgentCard
                  key={agentType}
                  tripId={tripId}
                  agentType={agentType}
                />
              ))}
            </div>

            {/* Status Message */}
            <div className={styles.statusMessage}>
              <p className={styles.statusMessageText}>
                Each agent works independently. You can view recommendations as they become available.
              </p>
            </div>
          </GlassCard>
        </ErrorBoundary>
      </div>
    </>
  );
}
