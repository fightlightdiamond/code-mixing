# Story-Based Learning Module

A comprehensive interactive learning system that uses story embedding methodology to teach English vocabulary through Vietnamese stories with embedded English words.

## Features

### 🎯 Core Learning Features

- **Story Reading**: Interactive story reader with embedded English vocabulary
- **Audio Playback**: Synchronized audio with text highlighting
- **Vocabulary Learning**: Click-to-learn vocabulary with definitions and pronunciation
- **Interactive Exercises**: Multiple exercise types (fill-in-blank, multiple choice, drag-drop)
- **Progress Tracking**: Comprehensive learning analytics and progress monitoring

### 🎨 User Experience

- **Personalized Learning**: Adaptive difficulty and personalized recommendations
- **Offline Support**: Download stories and learn offline with sync capabilities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Theme switching for comfortable reading

### ♿ Accessibility

- **Screen Reader Support**: Full ARIA compliance and screen reader optimization
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Reduced Motion**: Respects user motion preferences
- **Skip Links**: Quick navigation for assistive technologies

### ⚡ Performance

- **Lazy Loading**: Components and content loaded on demand
- **Virtual Scrolling**: Efficient rendering of large vocabulary lists
- **Audio Preloading**: Smooth audio playback experience
- **Service Worker**: Offline caching and background sync
- **Bundle Optimization**: Code splitting and tree shaking

## Architecture

### Directory Structure

```
src/app/learning/
├── components/           # React components
│   ├── StoryReader.tsx      # Main story display component
│   ├── AudioPlayer.tsx      # Audio playback controls
│   ├── ExercisePanel.tsx    # Interactive exercises
│   ├── VocabularyPopup.tsx  # Word definition popup
│   ├── ProgressTracker.tsx  # Learning progress display
│   ├── SettingsPanel.tsx    # User preferences
│   ├── AccessibilityPanel.tsx # Accessibility settings
│   ├── OfflineIndicator.tsx # Offline status
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useStoryReader.ts    # Story reading logic
│   ├── useAudioPlayer.ts    # Audio management
│   ├── useProgress.ts       # Progress tracking
│   ├── useOfflineManager.ts # Offline functionality
│   └── ...
├── contexts/            # React contexts
│   └── AccessibilityContext.tsx # Accessibility state
├── types/               # TypeScript definitions
│   └── learning.ts          # Learning-related types
├── utils/               # Utility functions
│   ├── accessibility.ts     # Accessibility helpers
│   ├── bundleOptimization.ts # Performance utilities
│   └── testUtils.tsx        # Testing utilities
├── styles/              # CSS files
│   ├── high-contrast.css    # High contrast styles
│   └── reduced-motion.css   # Reduced motion styles
├── config/              # Configuration files
│   └── deployment.ts        # Deployment settings
└── page.tsx             # Main learning page
```

### Component Hierarchy

```
LearningPage
├── AccessibilityProvider
├── SkipLinks
├── StoryReader
│   ├── LazyChunk (virtualized)
│   └── VocabularyWord (interactive)
├── AudioPlayer
│   ├── PlaybackControls
│   └── BookmarkPanel
├── ExercisePanel
│   ├── FillBlankExercise
│   ├── MultipleChoiceExercise
│   └── DragDropExercise
├── ProgressTracker
│   ├── LearningStats
│   └── VocabularyProgressManager (virtualized)
├── SettingsPanel
└── OfflineIndicator
```

## API Endpoints

### Stories

- `GET /api/learning/stories` - List stories with filters
- `GET /api/learning/stories/[id]` - Get story details
- `GET /api/learning/stories/[id]/audio` - Redirects to a signed audio URL from storage

### Vocabulary

- `GET /api/learning/vocabulary/[word]` - Get word definition
- `POST /api/learning/vocabulary/progress` - Update vocabulary progress

### Exercises

- `GET /api/learning/exercises/story/[id]` - Get story exercises
- `POST /api/learning/exercises/submit` - Submit exercise answers

### Progress

- `GET /api/learning/progress/user` - Get user progress
- `POST /api/learning/progress/update` - Update learning progress

## Usage

### Basic Story Reading

```tsx
import { StoryReader } from "./components/StoryReader";

function MyLearningPage() {
  const handleWordClick = (
    word: string,
    position: { x: number; y: number }
  ) => {
    // Show vocabulary popup
  };

  return (
    <StoryReader
      story={story}
      onWordClick={handleWordClick}
      highlightedChunk={currentChunk}
    />
  );
}
```

### Audio Integration

```tsx
import { AudioPlayer } from "./components/AudioPlayer";

function MyAudioLearning() {
  const handleChunkHighlight = (chunkIndex: number) => {
    // Highlight corresponding text chunk
  };

  return (
    <AudioPlayer
      audioUrl={story.audioUrl}
      chunks={story.chunks}
      storyId={story.id}
      onChunkHighlight={handleChunkHighlight}
    />
  );
}
```

### Exercise Implementation

```tsx
import ExercisePanel from "./components/ExercisePanel";

function MyExercises() {
  const handleComplete = (results: ExerciseResult[]) => {
    // Process exercise results
  };

  return (
    <ExercisePanel
      storyId={story.id}
      exercises={exercises}
      onComplete={handleComplete}
    />
  );
}
```

### Accessibility Integration

```tsx
import {
  AccessibilityProvider,
  useAccessibility,
} from "./contexts/AccessibilityContext";

function MyAccessibleApp() {
  return (
    <AccessibilityProvider>
      <MyLearningContent />
    </AccessibilityProvider>
  );
}

function MyLearningContent() {
  const { settings, announce } = useAccessibility();

  const handleAction = () => {
    announce("Action completed successfully");
  };

  return (
    <div className={settings.highContrast ? "high-contrast" : ""}>
      {/* Your content */}
    </div>
  );
}
```

## Testing

### Unit Tests

```bash
npm test src/app/learning/components/
```

### Integration Tests

```bash
npm test src/app/learning/__tests__/integration/
```

### E2E Tests

```bash
npm run test:e2e src/app/learning/__tests__/e2e/
```

### Accessibility Tests

```bash
npm run test:a11y
```

### Test Utilities

```tsx
import { renderWithProviders, mockStory } from "./utils/testUtils";

test("renders story correctly", () => {
  renderWithProviders(
    <StoryReader story={mockStory} onWordClick={jest.fn()} />
  );
  // Test assertions
});
```

## Performance Optimization

### Bundle Analysis

```bash
ANALYZE=true npm run build
```

### Performance Monitoring

```tsx
import { performanceMonitoring } from "./utils/bundleOptimization";

// Measure component render time
performanceMonitoring.measureRenderTime("StoryReader", () => {
  // Component render logic
});

// Measure API response time
const data = await performanceMonitoring.measureApiTime("getStory", () =>
  fetch("/api/learning/stories/123")
);
```

### Memory Management

```tsx
import { memoryManagement } from "./utils/bundleOptimization";

// Debounce expensive operations
const debouncedSearch = memoryManagement.debounce(searchFunction, 300);

// Throttle scroll events
const throttledScroll = memoryManagement.throttle(scrollHandler, 100);
```

## Deployment

### Environment Configuration

```typescript
import { getDeploymentConfig } from "./config/deployment";

const config = getDeploymentConfig();
// Use config.apiBaseUrl, config.features, etc.
```

### Build Optimization

```bash
# Production build with optimizations
NODE_ENV=production DEPLOYMENT_ENV=production npm run build

# Staging build
NODE_ENV=production DEPLOYMENT_ENV=staging npm run build

# Development build with analysis
NODE_ENV=development ANALYZE=true npm run build
```

### Service Worker

The application includes a service worker for offline functionality:

- Caches stories and audio files
- Provides offline reading capability
- Syncs progress when connection is restored

## Browser Support

### Minimum Requirements

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Progressive Enhancement

- Works without JavaScript (basic story reading)
- Enhanced features with JavaScript enabled
- Offline functionality with service worker support

## Accessibility Compliance

### WCAG 2.1 AA Compliance

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast ratios
- ✅ Focus indicators
- ✅ Alternative text
- ✅ Semantic HTML

### Testing Tools

- axe-core for automated testing
- NVDA/JAWS for screen reader testing
- Keyboard-only navigation testing
- Color contrast analyzers

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Check accessibility: `npm run test:a11y`

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing
- React Testing Library for component tests

### Performance Guidelines

- Use React.memo for expensive components
- Implement lazy loading for large content
- Optimize images and audio files
- Monitor bundle size and performance metrics

## Troubleshooting

### Common Issues

#### Audio Not Playing

- Check browser audio permissions
- Verify audio file format support
- Test with different audio files

#### Offline Mode Not Working

- Verify service worker registration
- Check browser storage permissions
- Clear cache and reload

#### Accessibility Issues

- Test with screen readers
- Verify keyboard navigation
- Check color contrast ratios

### Debug Mode

Enable debug mode by setting `NODE_ENV=development`:

- Shows chunk type indicators
- Enables performance logging
- Provides detailed error messages

## License

This learning module is part of the larger application and follows the same license terms.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the test files for usage examples
3. Create an issue with detailed reproduction steps
