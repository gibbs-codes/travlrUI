'use client';

import { useParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const tripId = params.tripId as string;

  // Determine grid class based on number of active agents
  const getGridClass = () => {
    const count = DISPLAY_AGENTS.length;
    if (count === 1) return `${styles.agentGrid} ${styles.singleCard}`;
    if (count === 3) return `${styles.agentGrid} ${styles.threeCards}`;
    return styles.agentGrid;
  };

  const handleViewSummary = () => {
    router.push(`/trip/${tripId}/overview`);
  };

  return (
    <>
      <Background />
      <TopBar
        logo="TravlrAPI"
        navText="View Summary"
        navLink={`/trip/${tripId}/overview`}
      />

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

            {/* View Summary Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleViewSummary}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-base font-medium text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                View Trip Summary
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </GlassCard>
        </ErrorBoundary>
      </div>
    </>
  );
}
