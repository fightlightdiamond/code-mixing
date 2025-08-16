# Design Document

## Overview

Trang học tiếng Anh bằng phương pháp truyện chêm được thiết kế như một Single Page Application (SPA) sử dụng Next.js với React components tương tác. Hệ thống tận dụng cơ sở dữ liệu PostgreSQL hiện có với các bảng Story, StoryChunk, Vocabulary, Audio và UserProgress để cung cấp trải nghiệm học tập liền mạch.

## Architecture

### Frontend Architecture

```
src/app/learning/
├── page.tsx                    # Main learning page
├── components/
│   ├── StoryReader.tsx         # Story display with embedded words
│   ├── VocabularyPopup.tsx     # Word definition popup
│   ├── AudioPlayer.tsx         # Audio playback controls
│   ├── ProgressTracker.tsx     # Learning progress display
│   ├── ExercisePanel.tsx       # Interactive exercises
│   └── SettingsPanel.tsx       # User preferences
├── hooks/
│   ├── useStoryReader.ts       # Story reading logic
│   ├── useAudioPlayer.ts       # Audio playback management
│   └── useProgress.ts          # Progress tracking
└── types/
    └── learning.ts             # TypeScript interfaces
```

### Backend API Endpoints

```
/api/learning/
├── stories/                    # Story management
│   ├── GET /                   # List stories by level/type
│   ├── GET /[id]              # Get story with chunks
│   └── GET /[id]/audio        # Get story audio
├── vocabulary/
│   ├── GET /[word]            # Get word definition
│   └── POST /progress         # Update vocabulary progress
├── exercises/
│   ├── GET /story/[id]        # Get exercises for story
│   └── POST /submit           # Submit exercise answers
└── progress/
    ├── GET /user              # Get user progress
    └── POST /update           # Update learning progress
```

## Components and Interfaces

### StoryReader Component

```typescript
interface StoryReaderProps {
  story: Story;
  chunks: StoryChunk[];
  onWordClick: (word: string) => void;
  highlightedChunk?: number;
}

interface StoryChunk {
  id: string;
  chunkOrder: number;
  chunkText: string;
  type: "normal" | "chem" | "explain";
}
```

**Functionality:**

- Renders story content with embedded English words highlighted
- Handles click events on embedded words
- Supports text highlighting during audio playback
- Responsive design for mobile and desktop

### VocabularyPopup Component

```typescript
interface VocabularyPopupProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

interface VocabularyData {
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  audioUrl?: string;
}
```

**Functionality:**

- Displays word definition, pronunciation, and examples
- Positioned near clicked word
- Audio playback for pronunciation
- Mark word as learned/reviewing

### AudioPlayer Component

```typescript
interface AudioPlayerProps {
  audioUrl: string;
  chunks: StoryChunk[];
  onChunkHighlight: (chunkIndex: number) => void;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentChunk: number;
}
```

**Functionality:**

- Play/pause story audio
- Sync text highlighting with audio
- Seek to specific positions
- Speed control (0.5x, 1x, 1.5x, 2x)

### ExercisePanel Component

```typescript
interface ExercisePanelProps {
  storyId: string;
  exercises: Exercise[];
  onComplete: (results: ExerciseResult[]) => void;
}

interface Exercise {
  id: string;
  type: "fill_blank" | "multiple_choice" | "drag_drop";
  question: string;
  options?: string[];
  correctAnswer: string;
}
```

**Functionality:**

- Render different exercise types
- Validate answers in real-time
- Provide immediate feedback
- Calculate and display scores

## Data Models

### Enhanced Story Model

```typescript
interface LearningStory extends Story {
  chunks: StoryChunk[];
  vocabularies: Vocabulary[];
  exercises: Exercise[];
  audioUrl?: string;
  userProgress?: UserProgress;
}
```

### User Learning Session

```typescript
interface LearningSession {
  id: string;
  userId: string;
  storyId: string;
  startedAt: Date;
  currentChunk: number;
  wordsLearned: string[];
  exerciseResults: ExerciseResult[];
  timeSpent: number;
}
```

### Vocabulary Progress Tracking

```typescript
interface VocabularyProgress {
  word: string;
  status: "new" | "reviewing" | "mastered";
  encounters: number;
  lastReviewed: Date;
  nextReview: Date;
  correctAnswers: number;
  totalAttempts: number;
}
```

## Error Handling

### Client-Side Error Handling

- **Network Errors:** Retry mechanism with exponential backoff
- **Audio Loading Errors:** Fallback to text-only mode with user notification
- **Vocabulary Loading Errors:** Cache previous definitions, show loading state
- **Progress Sync Errors:** Queue updates for retry when connection restored

### Server-Side Error Handling

- **Database Connection Errors:** Return cached data when possible
- **Audio File Missing:** Generate TTS audio as fallback
- **User Authentication Errors:** Redirect to login with return URL
- **Rate Limiting:** Implement request throttling and user feedback

## Testing Strategy

### Unit Testing

- **Components:** Test rendering, user interactions, and state management
- **Hooks:** Test custom hooks with various scenarios and edge cases
- **Utilities:** Test audio synchronization, progress calculation functions
- **API Endpoints:** Test request/response handling and error scenarios

### Integration Testing

- **Story Reading Flow:** Test complete user journey from story selection to completion
- **Audio Synchronization:** Test text highlighting accuracy with audio playback
- **Progress Persistence:** Test data consistency across sessions
- **Offline Functionality:** Test offline reading and sync when reconnected

### End-to-End Testing

- **Learning Session:** Complete story reading with exercises and progress tracking
- **Multi-device Sync:** Test progress synchronization across devices
- **Performance:** Test loading times and responsiveness with large stories
- **Accessibility:** Test keyboard navigation and screen reader compatibility

## Performance Optimizations

### Frontend Optimizations

- **Lazy Loading:** Load story chunks progressively as user reads
- **Audio Preloading:** Preload next story audio in background
- **Component Memoization:** Use React.memo for expensive components
- **Virtual Scrolling:** For long stories and vocabulary lists

### Backend Optimizations

- **Database Indexing:** Optimize queries for story retrieval and progress updates
- **Caching Strategy:** Redis cache for frequently accessed stories and vocabulary
- **CDN Integration:** Serve audio files through CDN for faster loading
- **API Response Compression:** Gzip compression for large story content

## Security Considerations

### Data Protection

- **User Progress Encryption:** Encrypt sensitive learning data
- **Audio File Access Control:** Signed URLs for audio file access
- **Rate Limiting:** Prevent abuse of vocabulary lookup API
- **Input Sanitization:** Sanitize user input in exercises and feedback

### Privacy Compliance

- **Learning Analytics:** Anonymize user learning patterns for analytics
- **Data Retention:** Implement data retention policies for user progress
- **Consent Management:** Clear consent for audio recording features
- **Cross-border Data:** Comply with data localization requirements

## Accessibility Features

### Visual Accessibility

- **High Contrast Mode:** Support for users with visual impairments
- **Font Size Control:** Adjustable text size for better readability
- **Color Blind Support:** Use patterns and shapes in addition to colors
- **Focus Indicators:** Clear focus indicators for keyboard navigation

### Audio Accessibility

- **Closed Captions:** Text captions for audio content
- **Audio Descriptions:** Describe visual elements for screen readers
- **Playback Speed:** Variable speed control for different learning needs
- **Keyboard Shortcuts:** Audio control via keyboard shortcuts

## Internationalization

### Multi-language Support

- **Interface Language:** Support Vietnamese and English interface
- **Story Content:** Support multiple source languages for embedding
- **Pronunciation Guides:** IPA notation for accurate pronunciation
- **Cultural Context:** Provide cultural context for embedded words

### Localization Features

- **Regional Accents:** Support different English accent options
- **Local Examples:** Use culturally relevant examples in definitions
- **Currency/Units:** Localize measurements and currency in stories
- **Date/Time Formats:** Use appropriate date/time formats for region
