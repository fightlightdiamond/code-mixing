jkh# Implementation Plan

- [x] 1. Set up learning page structure and routing
  - Create main learning page at `/src/app/learning/page.tsx`
  - Set up routing and navigation from main dashboard
  - Create basic layout with responsive design
  - _Requirements: 1.1, 1.2_

- [x] 2. Implement core story reading functionality
- [x] 2.1 Create StoryReader component with embedded word highlighting
  - Build StoryReader component that renders story chunks
  - Implement highlighting for embedded English words (ChunkType.chem)
  - Add click handlers for embedded words
  - Style embedded words with distinct visual indicators
  - _Requirements: 1.2, 1.3_

- [x] 2.2 Create VocabularyPopup component for word definitions
  - Build popup component that displays word meaning, pronunciation, and examples
  - Implement positioning logic to show popup near clicked word
  - Add close functionality and outside-click handling
  - Integrate with vocabulary API to fetch word data
  - _Requirements: 1.3_

- [x] 2.3 Implement story selection and filtering
  - Create story list component with level-based filtering
  - Add search and category filtering functionality
  - Implement story preview with difficulty indicators
  - Connect to stories API endpoint
  - _Requirements: 1.1_

- [x] 3. Build audio playback system
- [x] 3.1 Create AudioPlayer component with sync functionality
  - Build audio player with play/pause/seek controls
  - Implement text-audio synchronization for chunk highlighting
  - Add playback speed controls (0.5x, 1x, 1.5x, 2x)
  - Handle audio loading states and errors
  - _Requirements: 2.1, 2.3_

- [x] 3.2 Implement vocabulary word pronunciation
  - Add individual word audio playback functionality
  - Create pronunciation button for each vocabulary popup
  - Handle audio loading and playback errors gracefully
  - Cache audio files for offline access
  - _Requirements: 2.1_

- [x] 3.3 Add audio position persistence
  - Save current audio position when user pauses
  - Restore audio position when user returns to story
  - Implement bookmark functionality for important sections
  - Store position data in user progress
  - _Requirements: 2.4_

- [x] 4. Create interactive exercise system
- [x] 4.1 Build ExercisePanel component with multiple question types
  - Create base exercise component with different question types
  - Implement fill-in-the-blank exercises with story vocabulary
  - Build multiple choice questions based on story content
  - Add drag-and-drop word matching exercises
  - _Requirements: 3.1, 3.2_

- [x] 4.2 Implement exercise validation and feedback
  - Add real-time answer validation for all exercise types
  - Create immediate feedback system with correct/incorrect indicators
  - Implement explanation display for wrong answers
  - Add retry functionality for incorrect answers
  - _Requirements: 3.2, 3.3_

- [x] 4.3 Create exercise scoring and completion tracking
  - Calculate scores based on correct answers and time taken
  - Track exercise completion status per story
  - Update user progress when exercises are completed
  - Generate performance analytics for user review
  - _Requirements: 3.3, 3.4_

- [-] 5. Implement progress tracking system
- [x] 5.1 Create ProgressTracker component for learning analytics
  - Build progress dashboard showing stories read and vocabulary learned
  - Display completion percentages and learning streaks
  - Create visual progress indicators and achievement badges
  - Show time spent learning and words mastered statistics
  - _Requirements: 4.1, 4.2_

- [x] 5.2 Implement vocabulary progress management
  - Create vocabulary status tracking (new, reviewing, mastered)
  - Implement spaced repetition algorithm for vocabulary review
  - Build vocabulary review suggestions based on forgetting curve
  - Add vocabulary search and filtering in progress view
  - _Requirements: 4.2, 4.3_

- [x] 5.3 Create level progression and unlocking system
  - Implement automatic level unlocking based on completion criteria
  - Create level requirements display and progress indicators
  - Add celebration animations for level completions
  - Build recommendation system for next stories to read
  - _Requirements: 4.4_

- [x] 6. Build user customization features
- [x] 6.1 Create SettingsPanel for learning preferences
  - Build settings interface for embedding ratio adjustment (10%-50%)
  - Add difficulty level selection with story filtering
  - Implement theme preferences (light/dark mode)
  - Create topic preference selection for story recommendations
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6.2 Implement personalized learning experience
  - Apply user preferences to story filtering and display
  - Customize embedding ratio in real-time story rendering
  - Implement adaptive difficulty based on user performance
  - Create personalized vocabulary review schedules
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Add offline functionality and data synchronization
- [x] 7.1 Implement offline story caching
  - Create service worker for offline story and audio caching
  - Build download functionality for stories and associated audio
  - Implement offline storage management with size limits
  - Add offline indicator and available content display
  - _Requirements: 6.1_

- [x] 7.2 Create offline progress tracking
  - Store learning progress locally when offline
  - Implement local vocabulary progress updates
  - Cache exercise results for later synchronization
  - Build offline learning session tracking
  - _Requirements: 6.2_

- [x] 7.3 Build data synchronization system
  - Create automatic sync when internet connection is restored
  - Implement conflict resolution for progress data
  - Add manual sync trigger for user control
  - Build sync status indicators and error handling
  - _Requirements: 6.3, 6.4_

- [x] 8. Create API endpoints for learning functionality
- [x] 8.1 Build story retrieval API endpoints
  - Create GET `/api/learning/stories` for story listing with filters
  - Implement GET `/api/learning/stories/[id]` for detailed story data
  - Add GET `/api/learning/stories/[id]/audio` for audio file serving
  - Include user progress data in story responses
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 8.2 Implement vocabulary and exercise APIs
  - Create GET `/api/learning/vocabulary/[word]` for word definitions
  - Build GET `/api/learning/exercises/story/[id]` for story exercises
  - Implement POST `/api/learning/exercises/submit` for answer validation
  - Add POST `/api/learning/vocabulary/progress` for vocabulary tracking
  - _Requirements: 1.3, 3.1, 3.2, 4.2_

- [x] 8.3 Create progress tracking API endpoints
  - Build GET `/api/learning/progress/user` for user progress retrieval
  - Implement POST `/api/learning/progress/update` for progress updates
  - Add batch update functionality for offline sync
  - Create analytics endpoints for learning insights
  - _Requirements: 4.1, 4.2, 6.3_

- [x] 9. Implement comprehensive testing
- [x] 9.1 Write unit tests for all components
  - Test StoryReader component rendering and word click handling
  - Test VocabularyPopup positioning and data display
  - Test AudioPlayer synchronization and controls
  - Test ExercisePanel question types and validation
  - _Requirements: All requirements_

- [x] 9.2 Create integration tests for learning flow
  - Test complete story reading session from start to finish
  - Test audio-text synchronization accuracy
  - Test exercise completion and progress updates
  - Test offline functionality and data sync
  - _Requirements: All requirements_

- [x] 9.3 Add end-to-end testing for user journeys
  - Test full learning session with story selection, reading, and exercises
  - Test progress tracking across multiple sessions
  - Test settings changes and their effects on learning experience
  - Test offline learning and synchronization scenarios
  - _Requirements: All requirements_

- [x] 10. Optimize performance and add final polish
- [x] 10.1 Implement performance optimizations
  - Add lazy loading for story chunks and images
  - Implement audio preloading for smooth playback
  - Optimize component re-rendering with React.memo
  - Add virtual scrolling for long vocabulary lists
  - _Requirements: All requirements_

- [x] 10.2 Add accessibility features
  - Implement keyboard navigation for all interactive elements
  - Add ARIA labels and screen reader support
  - Create high contrast mode for visual accessibility
  - Add focus indicators and skip links
  - _Requirements: All requirements_

- [x] 10.3 Final integration and deployment preparation
  - Integrate all components into main learning page
  - Test cross-browser compatibility and responsive design
  - Optimize bundle size and loading performance
  - Prepare production build and deployment configuration
  - _Requirements: All requirements_
