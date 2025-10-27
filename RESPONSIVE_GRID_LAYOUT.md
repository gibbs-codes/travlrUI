# Responsive Grid Layout Documentation

Complete guide to the responsive grid layout system for agent cards on the trip status page.

## Overview

The trip status page uses a responsive CSS Grid layout that adapts seamlessly across desktop, tablet, and mobile devices. The layout ensures optimal viewing experience regardless of screen size or number of active agents.

## Layout Structure

```
┌─────────────────────────────────────┐
│         Header Section              │
│  (Trip title + subtitle)            │
├─────────────────────────────────────┤
│                                     │
│    ┌────────────┬────────────┐     │
│    │  Flight    │  Hotel     │     │
│    │  Card      │  Card      │     │
│    ├────────────┼────────────┤     │
│    │ Activity   │ Restaurant │     │
│    │  Card      │  Card      │     │
│    └────────────┴────────────┘     │
│                                     │
│      Status Message                 │
└─────────────────────────────────────┘
```

## Breakpoints

### Desktop (>1024px)
- **Grid**: 2 columns × 2 rows
- **Gap**: 24px
- **Card min-height**: 300px
- **Container max-width**: 1400px
- **Padding**: 2rem horizontal

### Tablet (768px - 1024px)
- **Grid**: 2 columns × 2 rows
- **Gap**: 16px
- **Card min-height**: 280px
- **Container padding**: 1.5rem horizontal
- **Slightly smaller text**

### Mobile (<768px)
- **Grid**: 1 column (stacked)
- **Gap**: 12px
- **Card min-height**: 250px
- **Container padding**: 1rem horizontal
- **Compact text sizes**

### Large Desktop (>1400px)
- **Gap**: 32px (extra spacing)
- **Card min-height**: 320px
- **Enhanced padding**: 2.5rem

## CSS Implementation

### Main Grid

```css
.agentGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 2rem;
}

/* Equal height cards */
.agentGrid > * {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}
```

### Responsive Grid

**Mobile** (<768px):
```css
@media (max-width: 767px) {
  .agentGrid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .agentGrid > * {
    min-height: 250px;
  }
}
```

**Tablet** (768px - 1024px):
```css
@media (max-width: 1024px) and (min-width: 768px) {
  .agentGrid {
    gap: 16px;
  }

  .agentGrid > * {
    min-height: 280px;
  }
}
```

**Large Desktop** (>1400px):
```css
@media (min-width: 1400px) {
  .agentGrid {
    gap: 32px;
  }

  .agentGrid > * {
    min-height: 320px;
  }
}
```

## Special Layouts

### Single Card Layout

When only one agent is active:

```css
.agentGrid.singleCard {
  grid-template-columns: 1fr;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
```

**Result**: Centered single card at optimal reading width

### Three Cards Layout

When three agents are active:

```css
@media (min-width: 768px) {
  .agentGrid.threeCards {
    grid-template-columns: repeat(2, 1fr);
  }

  .agentGrid.threeCards > :last-child {
    grid-column: span 2;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
}
```

**Result**:
- First two cards in top row
- Third card centered in bottom row

## Header Section

### Desktop
```css
.header {
  text-align: center;
  margin-bottom: 3rem;
}

.tripTitle {
  font-size: 2rem;        /* 32px */
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem;
}

.tripSubtitle {
  font-size: 1.125rem;    /* 18px */
  color: #6b7280;
  margin: 0 0 2rem;
}
```

### Tablet
```css
.tripTitle {
  font-size: 1.75rem;     /* 28px */
}

.tripSubtitle {
  font-size: 1rem;        /* 16px */
}
```

### Mobile
```css
.tripTitle {
  font-size: 1.5rem;      /* 24px */
}

.tripSubtitle {
  font-size: 0.875rem;    /* 14px */
  margin-bottom: 1.5rem;
}
```

## Grid Spacing Reference

| Screen Size | Gap | Card Min-Height | Container Padding |
|-------------|-----|-----------------|-------------------|
| Mobile (<768px) | 12px | 250px | 1rem |
| Tablet (768-1024px) | 16px | 280px | 1.5rem |
| Desktop (>1024px) | 24px | 300px | 2rem |
| Large (>1400px) | 32px | 320px | 2.5rem |

## Card Sizing Behavior

### Equal Heights
All cards in the same row maintain equal height using CSS Grid's default behavior:

```css
.agentGrid {
  display: grid;
  /* Grid automatically equalizes row heights */
}
```

### Content Overflow
Cards expand vertically to fit content:

```css
.agentGrid > * {
  display: flex;
  flex-direction: column;
  /* Content determines final height */
}
```

If content exceeds available space, the card scrolls internally (handled by AgentCard component).

## Smooth Transitions

All layout changes animate smoothly:

```css
.agentGrid,
.agentGrid > *,
.progressFill {
  transition: all 0.3s ease;
}
```

**Transitions apply to**:
- Grid gap changes
- Card height adjustments
- Column count changes
- Padding/margin changes

## Dynamic Grid Classes

The status page dynamically applies grid classes based on the number of active agents:

```typescript
const getGridClass = () => {
  const count = DISPLAY_AGENTS.length;
  if (count === 1) return `${styles.agentGrid} ${styles.singleCard}`;
  if (count === 3) return `${styles.agentGrid} ${styles.threeCards}`;
  return styles.agentGrid;
};
```

### Grid Variations

**4 Agents** (default):
```
┌────────┬────────┐
│ Flight │ Hotel  │
├────────┼────────┤
│Activity│Restaur.│
└────────┴────────┘
```

**3 Agents**:
```
┌────────┬────────┐
│ Agent1 │ Agent2 │
├────────┴────────┤
│    Agent3       │
│   (centered)    │
└─────────────────┘
```

**1 Agent**:
```
┌─────────────────┐
│                 │
│   Single Card   │
│   (centered)    │
│                 │
└─────────────────┘
```

## Status Message

Positioned below the grid with consistent styling:

```css
.statusMessage {
  text-align: center;
  padding: 1.5rem;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 12px;
  margin-top: 2rem;
}
```

**Responsive**:
- Desktop: 1.5rem padding, 2rem top margin
- Mobile: 1rem padding, 1.5rem top margin

## Usage Example

```typescript
import styles from './StatusPage.module.css';

export default function TripStatus() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.tripTitle}>Planning Your Trip</h1>
        <p className={styles.tripSubtitle}>
          AI agents are finding the best options
        </p>
      </header>

      <div className={styles.agentGrid}>
        <TripAgentCard agentType="flight" />
        <TripAgentCard agentType="accommodation" />
        <TripAgentCard agentType="activity" />
        <TripAgentCard agentType="restaurant" />
      </div>

      <div className={styles.statusMessage}>
        <p className={styles.statusMessageText}>
          Each agent works independently
        </p>
      </div>
    </div>
  );
}
```

## Accessibility

### Semantic HTML
```html
<div className={styles.pageContainer}>
  <header className={styles.header}>
    <h1>...</h1>
    <p>...</p>
  </header>

  <div className={styles.agentGrid}>
    <!-- Cards -->
  </div>
</div>
```

### Focus Management
- Cards are keyboard navigable
- Focus indicators visible
- Logical tab order (left-to-right, top-to-bottom)

### Screen Readers
- Header hierarchy (h1, h2)
- Descriptive text
- ARIA labels on interactive elements

## Performance

### CSS Grid Benefits
1. **Hardware Acceleration**: GPU-accelerated layout
2. **Efficient Reflows**: Minimal layout recalculation
3. **No JavaScript**: Pure CSS responsive behavior
4. **Smooth Animations**: Optimized transitions

### Bundle Size
- StatusPage.module.css: ~2.5KB minified
- No external dependencies
- Minimal runtime overhead

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ CSS Grid supported in all modern browsers

## Testing Responsive Behavior

### Resize Testing

**Desktop → Tablet**:
1. Start at 1200px width
2. Resize to 900px
3. Verify gap changes from 24px to 16px
4. Verify smooth transition

**Tablet → Mobile**:
1. Start at 900px width
2. Resize to 600px
3. Verify grid changes to 1 column
4. Verify cards stack vertically
5. Verify gap changes to 12px

### Different Card Counts

**Test with 1 card**:
- Should be centered
- Max-width 600px
- Proper spacing

**Test with 3 cards**:
- First two in row
- Third centered below
- Equal heights maintained

**Test with 4 cards**:
- 2×2 grid on desktop
- 1 column on mobile
- Consistent spacing

## Common Issues & Solutions

### Issue: Cards Different Heights

**Solution**: Ensure grid items use flexbox:
```css
.agentGrid > * {
  display: flex;
  flex-direction: column;
}
```

### Issue: Grid Breaks on Small Screens

**Solution**: Use proper min-width media queries:
```css
@media (min-width: 768px) {
  /* Tablet+ styles */
}
```

### Issue: Gap Too Large on Mobile

**Solution**: Override gap in mobile breakpoint:
```css
@media (max-width: 767px) {
  .agentGrid {
    gap: 12px;
  }
}
```

## Customization

### Adjust Breakpoints

Change tablet breakpoint to 1000px:
```css
@media (max-width: 1000px) and (min-width: 768px) {
  /* Tablet styles */
}
```

### Change Grid Columns

3-column layout on large screens:
```css
@media (min-width: 1600px) {
  .agentGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Adjust Card Heights

Taller cards on desktop:
```css
.agentGrid > * {
  min-height: 350px;
}
```

## Related Files

- `app/trip/[tripId]/status/page.tsx` - Status page component
- `app/trip/[tripId]/status/StatusPage.module.css` - Layout styles
- `app/components/TripAgentCard.tsx` - Individual agent cards
- `app/components/AgentCard.tsx` - Base card component
- `app/components/AgentCard.module.css` - Card styles
