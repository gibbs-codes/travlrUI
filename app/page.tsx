'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Background } from './components/Background';
import { GlassCard } from './components/GlassCard';
import { Heading, Text, PullQuote } from './components/Typography';
import { Container, Section } from './components/Layout';
import { TopBar } from './components/Navigation';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <Background />
      <TopBar logo="TravlrAPI" navText="explore" />

      <Container>
        {/* Hero Section */}
        <Section>
          <Heading level={1}>Plan Your Perfect Journey</Heading>
        </Section>

        {/* Main Description Card */}
        <Section width="narrow">
          <GlassCard interactive>
            <Heading level={2} elegant>AI-Powered Travel Planning</Heading>
            <Text size="large">
              Let our intelligent agents curate the perfect trip for you. From flights
              to accommodations, activities to dining - we handle every detail.
            </Text>
            <Text>
              Simply tell us where you want to go, and we'll create a personalized
              itinerary that matches your style and preferences.
            </Text>

            {/* Call to Action Button */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Link
                href="/create"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  background: isHovered ? '#111827' : '#1f2937',
                  border: '2px solid #111827',
                  borderRadius: '0.5rem',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 150ms ease',
                  fontSize: '1.1rem',
                  transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Start Planning →
              </Link>
            </div>
          </GlassCard>
        </Section>

        {/* Pull Quote Section */}
        <Section width="wide">
          <GlassCard>
            <PullQuote>
              The world is a book, and those who do not travel read only one page.
            </PullQuote>
          </GlassCard>
        </Section>
      </Container>
    </>
  );
}
