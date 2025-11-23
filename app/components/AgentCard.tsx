'use client';

import React, { ReactNode } from 'react';
import { Plane, Hotel, Theater, UtensilsCrossed, RefreshCw, Play, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { AgentType } from '../lib/types';
import { LoadingSkeleton, PulsingDot } from './LoadingSkeleton';
import styles from './AgentCard.module.css';

export type AgentStatus = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface AgentCardProps {
  agentType: AgentType;
  tripId: string;
  status: AgentStatus;
  recommendationCount?: number;
  estimatedTimeRemaining?: number; // in seconds
  currentPhase?: string; // e.g., "Searching flights", "Comparing prices"
  onRerun?: () => void;
  onGenerate?: () => void;
  children?: ReactNode;
}

const AGENT_CONFIG: Record<AgentType, { icon: any; label: string; emoji: string }> = {
  flight: {
    icon: Plane,
    label: 'Flights',
    emoji: '✈️',
  },
  accommodation: {
    icon: Hotel,
    label: 'Hotels',
    emoji: '🏨',
  },
  activity: {
    icon: Theater,
    label: 'Activities',
    emoji: '🎭',
  },
  restaurant: {
    icon: UtensilsCrossed,
    label: 'Restaurants',
    emoji: '🍽️',
  },
  transportation: {
    icon: Theater,
    label: 'Transportation',
    emoji: '🚗',
  },
};

const STATUS_CONFIG = {
  idle: {
    icon: null,
    label: 'Ready to generate',
    className: styles.statusPending,
  },
  pending: {
    icon: Loader2,
    label: 'Waiting to start...',
    className: styles.statusPending,
  },
  running: {
    icon: Loader2,
    label: 'Finding options...',
    className: styles.statusRunning,
    spin: true,
  },
  completed: {
    icon: CheckCircle2,
    label: 'Found',
    className: styles.statusCompleted,
  },
  failed: {
    icon: XCircle,
    label: 'Failed to load',
    className: styles.statusFailed,
  },
  skipped: {
    icon: null,
    label: 'Not requested',
    className: styles.statusSkipped,
  },
} as const;

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export const AgentCard = React.memo(function AgentCard({
  agentType,
  tripId,
  status,
  recommendationCount = 0,
  estimatedTimeRemaining,
  currentPhase,
  onRerun,
  onGenerate,
  children,
}: AgentCardProps) {
  const agentConfig = AGENT_CONFIG[agentType];
  const statusConfig = STATUS_CONFIG[status];
  const AgentIcon = agentConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={styles.card} role="region" aria-label={`${agentConfig.label} recommendations`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <AgentIcon className={styles.agentIcon} />
          </div>
          <h3 className={styles.title}>
            <span className={styles.emoji}>{agentConfig.emoji}</span>
            {agentConfig.label}
          </h3>
        </div>

        {/* Status Indicator */}
        <div
          className={`${styles.statusBadge} ${statusConfig.className}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {StatusIcon && (
            <StatusIcon
              className={`${styles.statusIcon} ${'spin' in statusConfig && statusConfig.spin ? styles.spin : ''}`}
              aria-hidden="true"
            />
          )}
          <span className={styles.statusLabel}>
            {status === 'completed' && recommendationCount > 0
              ? `${statusConfig.label} ${recommendationCount} recommendation${recommendationCount === 1 ? '' : 's'}`
              : statusConfig.label}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {/* Idle State - Ready to Generate */}
        {status === 'idle' && onGenerate && (
          <div className={styles.skippedState}>
            <div className={styles.emptyStateIcon}>
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className={styles.emptyStateTitle}>
              Ready to search for {agentConfig.label.toLowerCase()}
            </p>
            <button
              type="button"
              onClick={onGenerate}
              className={styles.generateButton}
              aria-label={`Generate ${agentConfig.label.toLowerCase()} recommendations`}
            >
              <Play className={styles.buttonIcon} aria-hidden="true" />
              Generate Recommendations
            </button>
          </div>
        )}

        {/* Running State - Loading Skeleton */}
        {status === 'running' && (
          <div className={styles.loadingState}>
            <div className={styles.loadingHeader}>
              <PulsingDot />
              <div className={styles.loadingTextContainer}>
                <p className={styles.loadingMessage}>
                  {currentPhase || `Finding the best ${agentConfig.label.toLowerCase()} for you...`}
                </p>
                {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                  <p className={styles.estimatedTime} aria-live="polite">
                    About {formatTime(estimatedTimeRemaining)} remaining
                  </p>
                )}
              </div>
            </div>
            <LoadingSkeleton variant="recommendation" count={3} />
          </div>
        )}

        {/* Completed State - Show Recommendations */}
        {status === 'completed' && (
          <div className={styles.completedState}>
            {recommendationCount > 0 && (
              <div className={styles.successMessage}>
                <CheckCircle2 className={styles.successIcon} />
                <span>Found {recommendationCount} great option{recommendationCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {children}
          </div>
        )}

        {/* Failed State - Error Message */}
        {status === 'failed' && (
          <div className={styles.failedState}>
            <AlertCircle className={styles.failedIcon} />
            <p className={styles.failedTitle}>
              Unable to load {agentConfig.label.toLowerCase()}
            </p>
            <p className={styles.failedMessage}>
              We encountered an issue while searching for options. Please try again.
            </p>
            {onRerun && (
              <button
                type="button"
                onClick={onRerun}
                className={styles.retryButton}
                aria-label={`Retry loading ${agentConfig.label.toLowerCase()}`}
              >
                <RefreshCw className={styles.buttonIcon} aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        )}

        {/* Skipped State - Empty State */}
        {status === 'skipped' && (
          <div className={styles.skippedState}>
            <div className={styles.emptyStateIcon}>{agentConfig.emoji}</div>
            <p className={styles.emptyStateTitle}>
              Want {agentConfig.label.toLowerCase()} recommendations?
            </p>
            <p className={styles.emptyStateMessage}>
              Add {agentConfig.label.toLowerCase()} to your trip to see personalized options
            </p>
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                className={styles.generateButton}
                aria-label={`Generate ${agentConfig.label.toLowerCase()} recommendations`}
              >
                <Play className={styles.buttonIcon} aria-hidden="true" />
                Generate Now
              </button>
            )}
          </div>
        )}

        {/* Pending State - Waiting */}
        {status === 'pending' && (
          <div className={styles.pendingState}>
            <Loader2 className={styles.pendingIcon} />
            <p className={styles.pendingMessage}>Waiting to start...</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {status === 'completed' && onRerun && (
        <div className={styles.actions}>
          <button
            type="button"
            onClick={onRerun}
            className={styles.rerunButton}
            aria-label={`Get more ${agentConfig.label.toLowerCase()} options`}
          >
            <RefreshCw className={styles.buttonIcon} aria-hidden="true" />
            Get more options
          </button>
        </div>
      )}
    </div>
  );
});
