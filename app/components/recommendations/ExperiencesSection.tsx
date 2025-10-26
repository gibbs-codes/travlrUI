'use client';

import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Car } from 'lucide-react';
import { experienceService } from '../../lib/api';
import { ExperienceCard } from './ExperienceCard';
import { SectionHeader } from '../SectionHeader';
import { SkeletonStack } from '../Skeleton';
import { ErrorMessage } from '../ErrorMessage';
import { EmptyState } from '../EmptyState';
import { LockedSection } from '../LockedSection';
import type { Transit } from '../../lib/types';

interface ExperiencesSectionProps {
  tripId: string;
  selectedTransitId?: string;
  onSelectTransit: (transit: Transit) => void;
  isUnlocked: boolean;
}

export const ExperiencesSection = forwardRef<HTMLElement, ExperiencesSectionProps>(
  ({ tripId, selectedTransitId, onSelectTransit, isUnlocked }, ref) => {
    const [experiences, setExperiences] = useState<Transit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExperiences = useCallback(async () => {
      if (!isUnlocked) return;

      setIsLoading(true);
      setError(null);
      try {
        const response = await experienceService.getRecommendations(tripId);
        setExperiences(response.recommendations || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transit options';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }, [tripId, isUnlocked]);

    useEffect(() => {
      if (isUnlocked) {
        fetchExperiences();
      }
    }, [isUnlocked, fetchExperiences]);

    const handleRerun = async () => {
      try {
        await experienceService.rerunRecommendations(tripId);
        await fetchExperiences();
      } catch (err) {
        console.error('Failed to rerun experiences:', err);
      }
    };

    if (!isUnlocked) {
      return (
        <section ref={ref} id="transit">
          <LockedSection
            title="Getting around"
            message="Select a hotel first to see transit options"
            icon={<Car size={24} className="text-slate-500" />}
          />
        </section>
      );
    }

    return (
      <section ref={ref} id="transit">
        <SectionHeader
          title="Getting around"
          description="Pick the transit plan that feels easy."
        />
        <div className="mt-4 space-y-2.5">
          {isLoading && <SkeletonStack count={2} />}

          {error && (
            <ErrorMessage
              title="Failed to load transit options"
              message={error}
              onRetry={fetchExperiences}
            />
          )}

          {!isLoading && !error && experiences.length === 0 && (
            <EmptyState
              icon={<Car className="h-12 w-12 text-gray-400" />}
              title="No transit options yet"
              message="We're looking for the best ways to get around. Transit options will appear here soon."
            />
          )}

          {!isLoading &&
            !error &&
            experiences.map((transit) => (
              <ExperienceCard
                key={transit.id}
                transit={transit}
                isSelected={selectedTransitId === transit.id}
                onSelect={() => onSelectTransit(transit)}
                onRerun={handleRerun}
              />
            ))}
        </div>
      </section>
    );
  }
);

ExperiencesSection.displayName = 'ExperiencesSection';
