import { Background } from './components/Background';
import { GlassCard } from './components/GlassCard';
import { Heading, Text, PullQuote } from './components/Typography';
import { Container, Section } from './components/Layout';
import { TopBar } from './components/Navigation';

export default function Home() {
  return (
    <>
      <Background />
      <TopBar />
      
      <Container>
        <Section>
          <Heading level={1}>The Art of Simplicity</Heading>
        </Section>

        <Section width="narrow">
          <GlassCard interactive>
            <Heading level={2} elegant>A Study in Warmth</Heading>
            <Text size="large">
              In the gentle glow of peachy light, we find a different kind of elegance. 
              Not the kind that shouts, but the kind that whispers. Not aggressive, but assured.
            </Text>
            <Text>
              This is sophistication through restraint, luxury through lightness. 
              The gradient moves slowly, creating warmth that transcends the screen.
            </Text>
          </GlassCard>
        </Section>

        <Section width="wide">
          <GlassCard>
            <PullQuote>
              Elegance is elimination.
            </PullQuote>
          </GlassCard>
        </Section>

        <Section width="narrow">
          <GlassCard interactive>
            <Heading level={2} elegant>The Power of Less</Heading>
            <Text size="large">
              When we strip away the unnecessary, what remains is essence. 
              The glass effect is present but never overwhelming.
            </Text>
            <Text>
              This is the paradox of minimalist luxury: the less you add, 
              the more valuable each element becomes.
            </Text>
          </GlassCard>
        </Section>
      </Container>
    </>
  );
}