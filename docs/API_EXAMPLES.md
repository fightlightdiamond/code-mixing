# API Usage Examples

This document provides practical code examples for common API usage patterns in the EdTech Platform. All examples include error handling, authentication, and best practices.

## Table of Contents

1. [Authentication Examples](#authentication-examples)
2. [Learning Content Examples](#learning-content-examples)
3. [Progress Tracking Examples](#progress-tracking-examples)
4. [Exercise Submission Examples](#exercise-submission-examples)
5. [Error Handling Examples](#error-handling-examples)
6. [Advanced Usage Patterns](#advanced-usage-patterns)

## Authentication Examples

### Complete Authentication Flow

```javascript
class AuthService {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      // Store tokens securely
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem("accessToken", this.accessToken);
      localStorage.setItem("refreshToken", this.refreshToken);

      return data.data.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is invalid, redirect to login
        this.logout();
        throw new Error("Session expired. Please login again.");
      }

      const data = await response.json();

      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem("accessToken", this.accessToken);
      localStorage.setItem("refreshToken", this.refreshToken);

      return this.accessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    // Ensure we have a valid token
    if (!this.accessToken || this.isTokenExpired(this.accessToken)) {
      await this.refreshAccessToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle token expiration during request
    if (response.status === 401) {
      await this.refreshAccessToken();

      // Retry the request with new token
      return fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    }

    return response;
  }

  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now() + 30000; // 30s buffer
    } catch (error) {
      return true;
    }
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

// Usage
const authService = new AuthService("https://api.edtech-platform.com");

// Login
try {
  const user = await authService.login("user@example.com", "password");
  console.log("Logged in user:", user);
} catch (error) {
  console.error("Login failed:", error.message);
}
```

## Learning Content Examples

### Fetching Stories with Filtering and Pagination

```javascript
class LearningContentService {
  constructor(authService) {
    this.authService = authService;
    this.baseURL = authService.baseURL;
  }

  async getStories(filters = {}) {
    const queryParams = new URLSearchParams();

    // Add filters
    if (filters.level) queryParams.append("level", filters.level);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.minWords) queryParams.append("minWords", filters.minWords);
    if (filters.maxWords) queryParams.append("maxWords", filters.maxWords);
    if (filters.page) queryParams.append("page", filters.page);
    if (filters.limit) queryParams.append("limit", filters.limit);

    const url = `${this.baseURL}/api/learning/stories?${queryParams}`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch stories");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching stories:", error);
      throw error;
    }
  }

  async getStoryDetails(storyId) {
    const url = `${this.baseURL}/api/learning/stories/${storyId}`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Story not found");
        }
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch story details");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching story details:", error);
      throw error;
    }
  }

  // Paginated story loading with infinite scroll
  async *getStoriesPaginated(filters = {}, pageSize = 20) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.getStories({
          ...filters,
          page,
          limit: pageSize,
        });

        yield response.data;

        // Check if there are more pages
        const { pagination } = response.meta;
        hasMore = page < pagination.totalPages;
        page++;
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
  }
}

// Usage examples
const contentService = new LearningContentService(authService);

// Basic story fetching
try {
  const stories = await contentService.getStories({
    level: "intermediate",
    type: "chemdanhtu",
    limit: 10,
  });
  console.log("Stories:", stories.data);
} catch (error) {
  console.error("Failed to load stories:", error.message);
}

// Infinite scroll implementation
async function loadStoriesInfiniteScroll() {
  const storyContainer = document.getElementById("story-list");

  for await (const stories of contentService.getStoriesPaginated({
    level: "beginner",
  })) {
    stories.forEach((story) => {
      const storyElement = createStoryElement(story);
      storyContainer.appendChild(storyElement);
    });

    // Wait for user to scroll near bottom before loading more
    await waitForScroll();
  }
}

function createStoryElement(story) {
  const element = document.createElement("div");
  element.className = "story-card";
  element.innerHTML = `
    <h3>${story.title}</h3>
    <p>Difficulty: ${story.difficulty}</p>
    <p>Estimated time: ${story.estimatedMinutes} minutes</p>
    <button onclick="loadStory('${story.id}')">Read Story</button>
  `;
  return element;
}

function waitForScroll() {
  return new Promise((resolve) => {
    const checkScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollPosition >= documentHeight - 1000) {
        // 1000px from bottom
        resolve();
      } else {
        setTimeout(checkScroll, 100);
      }
    };
    checkScroll();
  });
}
```

### Story Reading with Real-time Progress Tracking

```javascript
class StoryReaderService {
  constructor(authService) {
    this.authService = authService;
    this.baseURL = authService.baseURL;
    this.currentSession = null;
    this.progressInterval = null;
  }

  async startReadingSession(storyId) {
    try {
      // Get story details
      const storyResponse = await this.authService.makeAuthenticatedRequest(
        `${this.baseURL}/api/learning/stories/${storyId}`
      );

      if (!storyResponse.ok) {
        throw new Error("Failed to load story");
      }

      const story = await storyResponse.json();

      // Initialize reading session
      this.currentSession = {
        storyId,
        story: story.data,
        startTime: Date.now(),
        timeSpent: 0,
        interactionCount: 0,
        vocabularyInteractions: [],
        currentChunk: 0,
        completionPercentage: 0,
      };

      // Start progress tracking
      this.startProgressTracking();

      return this.currentSession;
    } catch (error) {
      console.error("Error starting reading session:", error);
      throw error;
    }
  }

  startProgressTracking() {
    // Update progress every 30 seconds
    this.progressInterval = setInterval(() => {
      this.updateProgress();
    }, 30000);
  }

  async updateProgress() {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.timeSpent = Math.floor(
      (now - this.currentSession.startTime) / 1000
    );

    try {
      const response = await this.authService.makeAuthenticatedRequest(
        `${this.baseURL}/api/learning/progress/update`,
        {
          method: "POST",
          body: JSON.stringify({
            storyId: this.currentSession.storyId,
            lessonId: this.currentSession.story.lesson?.id,
            timeSpentSec: this.currentSession.timeSpent,
            interactionCount: this.currentSession.interactionCount,
            completionPercentage: this.currentSession.completionPercentage,
            vocabularyInteractions: this.currentSession.vocabularyInteractions,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Progress updated:", result.data);

        // Handle new achievements
        if (result.data.newAchievements?.length > 0) {
          this.showAchievements(result.data.newAchievements);
        }
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }

  recordVocabularyInteraction(vocabularyId, action = "clicked") {
    if (!this.currentSession) return;

    this.currentSession.interactionCount++;
    this.currentSession.vocabularyInteractions.push({
      vocabularyId,
      action,
      timestamp: new Date().toISOString(),
    });

    // Update completion percentage based on interactions
    this.updateCompletionPercentage();
  }

  updateCompletionPercentage() {
    if (!this.currentSession) return;

    const totalChunks = this.currentSession.story.chunks.length;
    const currentChunk = this.currentSession.currentChunk;

    // Base completion on current chunk position
    const baseCompletion = (currentChunk / totalChunks) * 100;

    // Add bonus for vocabulary interactions
    const interactionBonus = Math.min(
      this.currentSession.interactionCount * 2,
      20
    );

    this.currentSession.completionPercentage = Math.min(
      baseCompletion + interactionBonus,
      100
    );
  }

  async endReadingSession() {
    if (!this.currentSession) return;

    // Stop progress tracking
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Final progress update
    await this.updateProgress();

    const sessionData = { ...this.currentSession };
    this.currentSession = null;

    return sessionData;
  }

  showAchievements(achievements) {
    achievements.forEach((achievement) => {
      // Show achievement notification
      const notification = document.createElement("div");
      notification.className = "achievement-notification";
      notification.innerHTML = `
        <div class="achievement-content">
          <h4>🎉 ${achievement.title}</h4>
          <p>${achievement.description}</p>
        </div>
      `;

      document.body.appendChild(notification);

      // Remove after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    });
  }
}

// Usage
const storyReader = new StoryReaderService(authService);

async function readStory(storyId) {
  try {
    // Start reading session
    const session = await storyReader.startReadingSession(storyId);
    console.log("Reading session started:", session);

    // Render story content
    renderStoryContent(session.story);

    // Set up vocabulary interaction handlers
    setupVocabularyHandlers(storyReader);
  } catch (error) {
    console.error("Error reading story:", error.message);
  }
}

function renderStoryContent(story) {
  const container = document.getElementById("story-content");

  story.chunks.forEach((chunk, index) => {
    const chunkElement = document.createElement("div");
    chunkElement.className = `chunk chunk-${chunk.type}`;
    chunkElement.dataset.chunkIndex = index;

    if (chunk.type === "chem") {
      // Highlight embedded English words
      chunkElement.innerHTML = highlightEmbeddedWords(chunk.chunkText);
    } else {
      chunkElement.textContent = chunk.chunkText;
    }

    container.appendChild(chunkElement);
  });
}

function highlightEmbeddedWords(text) {
  // Simple regex to find English words (this would be more sophisticated in production)
  return text.replace(/\b[a-zA-Z]+\b/g, (word) => {
    if (isEnglishWord(word)) {
      return `<span class="embedded-word" data-word="${word}" onclick="handleWordClick('${word}')">${word}</span>`;
    }
    return word;
  });
}

function setupVocabularyHandlers(storyReader) {
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("embedded-word")) {
      const word = event.target.dataset.word;
      handleWordClick(word, storyReader);
    }
  });
}

async function handleWordClick(word, storyReader) {
  // Record interaction
  storyReader.recordVocabularyInteraction(word, "clicked");

  // Show vocabulary popup
  showVocabularyPopup(word);
}

function showVocabularyPopup(word) {
  const popup = document.createElement("div");
  popup.className = "vocabulary-popup";
  popup.innerHTML = `
    <div class="popup-content">
      <h3>${word}</h3>
      <p>Loading definition...</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Load word definition (would be from API in production)
  loadWordDefinition(word).then((definition) => {
    popup.querySelector("p").textContent = definition;
  });
}
```

## Progress Tracking Examples

### Comprehensive Progress Dashboard

```javascript
class ProgressService {
  constructor(authService) {
    this.authService = authService;
    this.baseURL = authService.baseURL;
  }

  async getUserProgress(options = {}) {
    const queryParams = new URLSearchParams();

    if (options.includeDetails) queryParams.append("includeDetails", "true");
    if (options.timeframe) queryParams.append("timeframe", options.timeframe);

    const url = `${this.baseURL}/api/learning/progress/user?${queryParams}`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch progress");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching progress:", error);
      throw error;
    }
  }

  async getProgressAnalytics(timeframe = "month") {
    const url = `${this.baseURL}/api/learning/progress/analytics?timeframe=${timeframe}`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch analytics");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  }
}

// Progress Dashboard Component
class ProgressDashboard {
  constructor(progressService) {
    this.progressService = progressService;
    this.currentTimeframe = "month";
  }

  async render() {
    try {
      const progress = await this.progressService.getUserProgress({
        includeDetails: true,
        timeframe: this.currentTimeframe,
      });

      this.renderProgressStats(progress.data.stats);
      this.renderLevelProgression(progress.data.levelProgression);
      this.renderRecentAchievements(progress.data.recentAchievements);
      this.renderProgressCharts(progress.data);
    } catch (error) {
      console.error("Error rendering dashboard:", error);
      this.renderError(error.message);
    }
  }

  renderProgressStats(stats) {
    const container = document.getElementById("progress-stats");

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Lessons Completed</h3>
          <div class="stat-value">${stats.completedLessons}</div>
          <div class="stat-total">of ${stats.totalLessons}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(stats.completedLessons / stats.totalLessons) * 100}%"></div>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>Vocabulary Mastered</h3>
          <div class="stat-value">${stats.masteredVocabulary}</div>
          <div class="stat-total">of ${stats.totalVocabulary}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(stats.masteredVocabulary / stats.totalVocabulary) * 100}%"></div>
          </div>
        </div>
        
        <div class="stat-card">
          <h3>Learning Streak</h3>
          <div class="stat-value">${stats.learningStreak}</div>
          <div class="stat-unit">days</div>
        </div>
        
        <div class="stat-card">
          <h3>Time Spent</h3>
          <div class="stat-value">${Math.floor(stats.totalTimeSpent / 3600)}</div>
          <div class="stat-unit">hours</div>
        </div>
      </div>
    `;
  }

  renderLevelProgression(levelProgression) {
    const container = document.getElementById("level-progression");

    container.innerHTML = `
      <div class="level-card">
        <h3>Level ${levelProgression.currentLevel}</h3>
        <div class="level-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((levelProgression.totalPoints % 100) / 100) * 100}%"></div>
          </div>
          <div class="progress-text">
            ${levelProgression.pointsToNextLevel} points to next level
          </div>
        </div>
        <div class="level-stats">
          <span>Total Points: ${levelProgression.totalPoints}</span>
        </div>
      </div>
    `;
  }

  renderRecentAchievements(achievements) {
    const container = document.getElementById("recent-achievements");

    if (achievements.length === 0) {
      container.innerHTML =
        "<p>No recent achievements. Keep learning to earn more!</p>";
      return;
    }

    const achievementsList = achievements
      .map(
        (achievement) => `
      <div class="achievement-item">
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
          <h4>${achievement.title}</h4>
          <p>${achievement.description}</p>
          <small>Earned ${new Date(achievement.earnedAt).toLocaleDateString()}</small>
        </div>
      </div>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="achievements-list">
        ${achievementsList}
      </div>
    `;
  }

  async renderProgressCharts(progressData) {
    // This would integrate with a charting library like Chart.js
    const chartContainer = document.getElementById("progress-charts");

    // Weekly progress chart
    const weeklyData = await this.getWeeklyProgressData();
    this.renderWeeklyChart(chartContainer, weeklyData);

    // Vocabulary progress chart
    this.renderVocabularyChart(chartContainer, progressData.vocabularyProgress);
  }

  async getWeeklyProgressData() {
    try {
      const analytics = await this.progressService.getProgressAnalytics("week");
      return analytics.data.weeklyProgress;
    } catch (error) {
      console.error("Error fetching weekly data:", error);
      return [];
    }
  }

  renderWeeklyChart(container, data) {
    // Example using Chart.js (would need to include the library)
    const chartDiv = document.createElement("div");
    chartDiv.innerHTML = `
      <div class="chart-container">
        <h3>Weekly Progress</h3>
        <canvas id="weekly-chart" width="400" height="200"></canvas>
      </div>
    `;
    container.appendChild(chartDiv);

    // Chart.js implementation would go here
    // const ctx = document.getElementById('weekly-chart').getContext('2d');
    // new Chart(ctx, { ... });
  }

  renderError(message) {
    const container = document.getElementById("progress-dashboard");
    container.innerHTML = `
      <div class="error-message">
        <h3>Error Loading Progress</h3>
        <p>${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Usage
const progressService = new ProgressService(authService);
const dashboard = new ProgressDashboard(progressService);

// Initialize dashboard
dashboard.render();

// Set up timeframe selector
document
  .getElementById("timeframe-selector")
  .addEventListener("change", (event) => {
    dashboard.currentTimeframe = event.target.value;
    dashboard.render();
  });
```

## Exercise Submission Examples

### Interactive Exercise Handler

```javascript
class ExerciseService {
  constructor(authService) {
    this.authService = authService;
    this.baseURL = authService.baseURL;
  }

  async getStoryExercises(storyId) {
    const url = `${this.baseURL}/api/learning/exercises/story/${storyId}`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch exercises");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching exercises:", error);
      throw error;
    }
  }

  async submitAnswer(exerciseId, questionId, answer, timeSpentSec, storyId) {
    const url = `${this.baseURL}/api/learning/exercises/submit`;

    try {
      const response = await this.authService.makeAuthenticatedRequest(url, {
        method: "POST",
        body: JSON.stringify({
          exerciseId,
          questionId,
          answer,
          timeSpentSec,
          storyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit answer");
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw error;
    }
  }
}

class ExerciseHandler {
  constructor(exerciseService) {
    this.exerciseService = exerciseService;
    this.currentExercise = null;
    this.currentQuestionIndex = 0;
    this.startTime = null;
    this.score = 0;
    this.answers = [];
  }

  async startExercises(storyId) {
    try {
      const exercisesData =
        await this.exerciseService.getStoryExercises(storyId);
      this.currentExercise = exercisesData.data;
      this.currentQuestionIndex = 0;
      this.startTime = Date.now();
      this.score = 0;
      this.answers = [];

      this.renderExerciseInterface();
      this.showCurrentQuestion();
    } catch (error) {
      console.error("Error starting exercises:", error);
      this.showError(error.message);
    }
  }

  renderExerciseInterface() {
    const container = document.getElementById("exercise-container");

    container.innerHTML = `
      <div class="exercise-header">
        <h2>Exercises for: ${this.currentExercise.storyTitle}</h2>
        <div class="exercise-progress">
          <span id="question-counter">Question 1 of ${this.getTotalQuestions()}</span>
          <div class="progress-bar">
            <div id="progress-fill" class="progress-fill" style="width: 0%"></div>
          </div>
        </div>
        <div class="exercise-score">Score: <span id="current-score">0</span></div>
      </div>
      
      <div id="question-container" class="question-container">
        <!-- Question content will be inserted here -->
      </div>
      
      <div class="exercise-controls">
        <button id="prev-btn" onclick="exerciseHandler.previousQuestion()" disabled>Previous</button>
        <button id="next-btn" onclick="exerciseHandler.nextQuestion()" disabled>Next</button>
        <button id="submit-btn" onclick="exerciseHandler.submitCurrentAnswer()" style="display: none;">Submit Answer</button>
        <button id="finish-btn" onclick="exerciseHandler.finishExercises()" style="display: none;">Finish Exercises</button>
      </div>
      
      <div id="feedback-container" class="feedback-container" style="display: none;">
        <!-- Feedback will be shown here -->
      </div>
    `;
  }

  showCurrentQuestion() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    const container = document.getElementById("question-container");
    const questionStartTime = Date.now();

    // Update progress
    this.updateProgress();

    if (currentQuestion.type === "MCQ") {
      this.renderMultipleChoiceQuestion(container, currentQuestion);
    } else if (currentQuestion.type === "fill_blank") {
      this.renderFillBlankQuestion(container, currentQuestion);
    }

    // Store question start time for timing
    this.questionStartTime = questionStartTime;
  }

  renderMultipleChoiceQuestion(container, question) {
    const choicesHtml = question.choices
      .map(
        (choice, index) => `
      <label class="choice-option">
        <input type="radio" name="answer" value="${choice.id}" onchange="exerciseHandler.onAnswerSelected()">
        <span class="choice-text">${choice.text}</span>
      </label>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="question">
        <h3>${question.stem}</h3>
        <div class="choices">
          ${choicesHtml}
        </div>
      </div>
    `;
  }

  renderFillBlankQuestion(container, question) {
    container.innerHTML = `
      <div class="question">
        <h3>${question.stem}</h3>
        <div class="fill-blank-input">
          <input type="text" id="fill-blank-answer" placeholder="Type your answer here..." 
                 onkeyup="exerciseHandler.onFillBlankInput()" 
                 onkeypress="exerciseHandler.onFillBlankKeyPress(event)">
        </div>
      </div>
    `;
  }

  onAnswerSelected() {
    document.getElementById("submit-btn").style.display = "inline-block";
    document.getElementById("submit-btn").disabled = false;
  }

  onFillBlankInput() {
    const input = document.getElementById("fill-blank-answer");
    const hasAnswer = input.value.trim().length > 0;

    document.getElementById("submit-btn").style.display = hasAnswer
      ? "inline-block"
      : "none";
    document.getElementById("submit-btn").disabled = !hasAnswer;
  }

  onFillBlankKeyPress(event) {
    if (event.key === "Enter") {
      this.submitCurrentAnswer();
    }
  }

  async submitCurrentAnswer() {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return;

    let answer;
    if (currentQuestion.type === "MCQ") {
      const selectedChoice = document.querySelector(
        'input[name="answer"]:checked'
      );
      if (!selectedChoice) {
        alert("Please select an answer");
        return;
      }
      answer = selectedChoice.value;
    } else if (currentQuestion.type === "fill_blank") {
      const input = document.getElementById("fill-blank-answer");
      answer = input.value.trim();
      if (!answer) {
        alert("Please enter an answer");
        return;
      }
    }

    const timeSpent = Math.floor((Date.now() - this.questionStartTime) / 1000);

    try {
      // Show loading state
      document.getElementById("submit-btn").disabled = true;
      document.getElementById("submit-btn").textContent = "Submitting...";

      const result = await this.exerciseService.submitAnswer(
        this.getCurrentExercise().id,
        currentQuestion.id,
        answer,
        timeSpent,
        this.currentExercise.storyId
      );

      // Store answer result
      this.answers.push({
        questionId: currentQuestion.id,
        answer,
        correct: result.data.correct,
        score: result.data.score,
        timeSpent,
      });

      // Update score
      if (result.data.correct) {
        this.score += result.data.score;
        document.getElementById("current-score").textContent = this.score;
      }

      // Show feedback
      this.showFeedback(result.data);

      // Update controls
      this.updateControls(result.data);
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Error submitting answer. Please try again.");

      // Reset submit button
      document.getElementById("submit-btn").disabled = false;
      document.getElementById("submit-btn").textContent = "Submit Answer";
    }
  }

  showFeedback(result) {
    const container = document.getElementById("feedback-container");

    container.innerHTML = `
      <div class="feedback ${result.correct ? "correct" : "incorrect"}">
        <div class="feedback-header">
          <span class="feedback-icon">${result.correct ? "✅" : "❌"}</span>
          <span class="feedback-text">${result.correct ? "Correct!" : "Incorrect"}</span>
          <span class="feedback-score">+${result.score} points</span>
        </div>
        <div class="feedback-explanation">
          ${result.explanation}
        </div>
        ${result.feedback ? `<div class="feedback-additional">${result.feedback}</div>` : ""}
      </div>
    `;

    container.style.display = "block";
  }

  updateControls(result) {
    document.getElementById("submit-btn").style.display = "none";

    if (this.hasNextQuestion()) {
      document.getElementById("next-btn").disabled = false;
      document.getElementById("next-btn").textContent = "Next Question";
    } else {
      document.getElementById("finish-btn").style.display = "inline-block";
    }
  }

  nextQuestion() {
    if (this.hasNextQuestion()) {
      this.currentQuestionIndex++;
      this.showCurrentQuestion();
      this.hideFeedback();
      this.resetControls();
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.showCurrentQuestion();
      this.hideFeedback();
      this.resetControls();
    }
  }

  hideFeedback() {
    document.getElementById("feedback-container").style.display = "none";
  }

  resetControls() {
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("next-btn").disabled = true;
    document.getElementById("prev-btn").disabled =
      this.currentQuestionIndex === 0;
    document.getElementById("finish-btn").style.display = "none";
  }

  updateProgress() {
    const totalQuestions = this.getTotalQuestions();
    const progress = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;

    document.getElementById("question-counter").textContent =
      `Question ${this.currentQuestionIndex + 1} of ${totalQuestions}`;
    document.getElementById("progress-fill").style.width = `${progress}%`;
  }

  finishExercises() {
    const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
    const totalQuestions = this.getTotalQuestions();
    const correctAnswers = this.answers.filter((a) => a.correct).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;

    this.showCompletionScreen({
      totalQuestions,
      correctAnswers,
      accuracy,
      totalScore: this.score,
      totalTime,
    });
  }

  showCompletionScreen(results) {
    const container = document.getElementById("exercise-container");

    container.innerHTML = `
      <div class="completion-screen">
        <div class="completion-header">
          <h2>🎉 Exercises Completed!</h2>
        </div>
        
        <div class="completion-stats">
          <div class="stat-item">
            <div class="stat-value">${results.correctAnswers}</div>
            <div class="stat-label">Correct Answers</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">${Math.round(results.accuracy)}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">${results.totalScore}</div>
            <div class="stat-label">Total Score</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-value">${Math.floor(results.totalTime / 60)}:${(results.totalTime % 60).toString().padStart(2, "0")}</div>
            <div class="stat-label">Time Spent</div>
          </div>
        </div>
        
        <div class="completion-actions">
          <button onclick="location.href='/learning'" class="primary-btn">Continue Learning</button>
          <button onclick="exerciseHandler.reviewAnswers()" class="secondary-btn">Review Answers</button>
        </div>
      </div>
    `;
  }

  reviewAnswers() {
    // Implementation for reviewing answers
    console.log("Review answers:", this.answers);
  }

  // Helper methods
  getCurrentQuestion() {
    const exercise = this.getCurrentExercise();
    return exercise ? exercise.questions[this.currentQuestionIndex] : null;
  }

  getCurrentExercise() {
    return this.currentExercise.exercises[0]; // Simplified - would handle multiple exercises
  }

  getTotalQuestions() {
    return this.currentExercise.exercises.reduce(
      (total, exercise) => total + exercise.questions.length,
      0
    );
  }

  hasNextQuestion() {
    return this.currentQuestionIndex < this.getTotalQuestions() - 1;
  }

  showError(message) {
    const container = document.getElementById("exercise-container");
    container.innerHTML = `
      <div class="error-message">
        <h3>Error Loading Exercises</h3>
        <p>${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

// Usage
const exerciseService = new ExerciseService(authService);
const exerciseHandler = new ExerciseHandler(exerciseService);

// Start exercises for a story
async function startStoryExercises(storyId) {
  await exerciseHandler.startExercises(storyId);
}
```

## Error Handling Examples

### Comprehensive Error Handling Wrapper

```javascript
class APIErrorHandler {
  constructor() {
    this.errorHandlers = new Map();
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    // Authentication errors
    this.addHandler(401, (error, context) => {
      console.log("Authentication required");
      this.redirectToLogin();
    });

    // Authorization errors
    this.addHandler(403, (error, context) => {
      console.log("Access denied");
      this.showAccessDeniedMessage(error.message);
    });

    // Not found errors
    this.addHandler(404, (error, context) => {
      console.log("Resource not found");
      this.showNotFoundMessage(context.resource);
    });

    // Rate limiting
    this.addHandler(429, (error, context) => {
      console.log("Rate limited");
      this.handleRateLimit(error.details);
    });

    // Server errors
    this.addHandler(500, (error, context) => {
      console.error("Server error");
      this.showServerErrorMessage();
    });

    // Network errors
    this.addHandler("network", (error, context) => {
      console.error("Network error");
      this.handleNetworkError(error);
    });
  }

  addHandler(statusCode, handler) {
    this.errorHandlers.set(statusCode, handler);
  }

  async handleError(error, context = {}) {
    const handler =
      this.errorHandlers.get(error.status) ||
      this.errorHandlers.get(error.type) ||
      this.defaultErrorHandler;

    try {
      await handler(error, context);
    } catch (handlerError) {
      console.error("Error in error handler:", handlerError);
      this.defaultErrorHandler(error, context);
    }
  }

  defaultErrorHandler(error, context) {
    console.error("Unhandled error:", error);
    this.showGenericErrorMessage(error.message);
  }

  redirectToLogin() {
    // Clear stored tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Redirect to login page
    window.location.href = "/login";
  }

  showAccessDeniedMessage(message) {
    this.showNotification({
      type: "error",
      title: "Access Denied",
      message: message || "You do not have permission to access this resource.",
      actions: [
        { text: "Go Back", action: () => window.history.back() },
        { text: "Home", action: () => (window.location.href = "/") },
      ],
    });
  }

  showNotFoundMessage(resource) {
    this.showNotification({
      type: "error",
      title: "Not Found",
      message: `The requested ${resource || "resource"} could not be found.`,
      actions: [
        { text: "Go Back", action: () => window.history.back() },
        { text: "Home", action: () => (window.location.href = "/") },
      ],
    });
  }

  handleRateLimit(details) {
    const retryAfter = details.retryAfter || 60;

    this.showNotification({
      type: "warning",
      title: "Rate Limit Exceeded",
      message: `Too many requests. Please wait ${retryAfter} seconds before trying again.`,
      autoClose: retryAfter * 1000,
    });

    // Optionally implement automatic retry
    setTimeout(() => {
      window.location.reload();
    }, retryAfter * 1000);
  }

  handleNetworkError(error) {
    if (!navigator.onLine) {
      this.showOfflineMessage();
    } else {
      this.showNetworkErrorMessage();
    }
  }

  showOfflineMessage() {
    this.showNotification({
      type: "warning",
      title: "You're Offline",
      message: "Please check your internet connection and try again.",
      persistent: true,
    });
  }

  showNetworkErrorMessage() {
    this.showNotification({
      type: "error",
      title: "Connection Error",
      message: "Unable to connect to the server. Please try again.",
      actions: [{ text: "Retry", action: () => window.location.reload() }],
    });
  }

  showServerErrorMessage() {
    this.showNotification({
      type: "error",
      title: "Server Error",
      message: "Something went wrong on our end. Please try again later.",
      actions: [{ text: "Retry", action: () => window.location.reload() }],
    });
  }

  showGenericErrorMessage(message) {
    this.showNotification({
      type: "error",
      title: "Error",
      message: message || "An unexpected error occurred.",
      actions: [{ text: "Retry", action: () => window.location.reload() }],
    });
  }

  showNotification({
    type,
    title,
    message,
    actions = [],
    autoClose,
    persistent = false,
  }) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;

    const actionsHtml = actions
      .map(
        (action) =>
          `<button onclick="this.parentElement.parentElement.remove(); (${action.action})()">${action.text}</button>`
      )
      .join("");

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-header">
          <h4>${title}</h4>
          ${!persistent ? '<button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>' : ""}
        </div>
        <div class="notification-message">${message}</div>
        ${actions.length > 0 ? `<div class="notification-actions">${actionsHtml}</div>` : ""}
      </div>
    `;

    document.body.appendChild(notification);

    if (autoClose && !persistent) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, autoClose);
    }
  }
}

// Enhanced API client with error handling
class EnhancedAPIClient {
  constructor(baseURL, authService) {
    this.baseURL = baseURL;
    this.authService = authService;
    this.errorHandler = new APIErrorHandler();
  }

  async request(endpoint, options = {}) {
    try {
      const response = await this.authService.makeAuthenticatedRequest(
        `${this.baseURL}${endpoint}`,
        options
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new APIError(
          errorData.message || "Request failed",
          response.status,
          errorData.code,
          errorData.details
        );

        await this.errorHandler.handleError(error, {
          endpoint,
          method: options.method || "GET",
          resource: this.extractResourceFromEndpoint(endpoint),
        });

        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      const networkError = new APIError(
        "Network error occurred",
        0,
        "NETWORK_ERROR"
      );
      networkError.type = "network";

      await this.errorHandler.handleError(networkError, { endpoint });
      throw networkError;
    }
  }

  extractResourceFromEndpoint(endpoint) {
    const parts = endpoint.split("/").filter(Boolean);
    return parts[parts.length - 1] || "resource";
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

class APIError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Usage
const apiClient = new EnhancedAPIClient(
  "https://api.edtech-platform.com",
  authService
);

// All API calls now have comprehensive error handling
async function loadUserStories() {
  try {
    const stories = await apiClient.get("/api/learning/stories");
    console.log("Stories loaded:", stories);
  } catch (error) {
    // Error is already handled by the error handler
    console.log("Failed to load stories");
  }
}
```

## Advanced Usage Patterns

### Real-time Data Synchronization

```javascript
class RealtimeDataSync {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource("/api/realtime/events", {
        withCredentials: true,
      });

      this.eventSource.onopen = () => {
        console.log("Realtime connection established");
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.eventSource.onerror = () => {
        console.error("Realtime connection error");
        this.handleReconnect();
      };
    } catch (error) {
      console.error("Failed to establish realtime connection:", error);
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  handleMessage(data) {
    const { type, payload } = data;

    const listeners = this.listeners.get(type) || [];
    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (error) {
        console.error("Error in realtime listener:", error);
      }
    });
  }

  subscribe(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Usage
const realtimeSync = new RealtimeDataSync(apiClient);

// Subscribe to progress updates
const unsubscribeProgress = realtimeSync.subscribe(
  "progress_updated",
  (data) => {
    console.log("Progress updated:", data);
    updateProgressUI(data);
  }
);

// Subscribe to new achievements
const unsubscribeAchievements = realtimeSync.subscribe(
  "achievement_earned",
  (data) => {
    console.log("New achievement:", data);
    showAchievementNotification(data);
  }
);

// Connect to realtime updates
realtimeSync.connect();

// Clean up when leaving page
window.addEventListener("beforeunload", () => {
  realtimeSync.disconnect();
});
```

### Offline Data Management

```javascript
class OfflineDataManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.dbName = "EdTechOfflineDB";
    this.dbVersion = 1;
    this.db = null;
    this.syncQueue = [];
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains("stories")) {
          const storiesStore = db.createObjectStore("stories", {
            keyPath: "id",
          });
          storiesStore.createIndex("difficulty", "difficulty", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("progress")) {
          db.createObjectStore("progress", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("syncQueue")) {
          db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };
    });
  }

  async cacheStory(story) {
    const transaction = this.db.transaction(["stories"], "readwrite");
    const store = transaction.objectStore("stories");

    return new Promise((resolve, reject) => {
      const request = store.put({
        ...story,
        cachedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedStory(storyId) {
    const transaction = this.db.transaction(["stories"], "readonly");
    const store = transaction.objectStore("stories");

    return new Promise((resolve, reject) => {
      const request = store.get(storyId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedStories(filters = {}) {
    const transaction = this.db.transaction(["stories"], "readonly");
    const store = transaction.objectStore("stories");

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        let stories = request.result;

        // Apply filters
        if (filters.difficulty) {
          stories = stories.filter((s) => s.difficulty === filters.difficulty);
        }

        resolve(stories);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async queueForSync(operation) {
    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...operation,
        timestamp: Date.now(),
        retries: 0,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncOfflineData() {
    if (!navigator.onLine) {
      console.log("Device is offline, skipping sync");
      return;
    }

    const transaction = this.db.transaction(["syncQueue"], "readwrite");
    const store = transaction.objectStore("syncQueue");

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = async () => {
        const operations = request.result;

        for (const operation of operations) {
          try {
            await this.syncOperation(operation);

            // Remove from queue after successful sync
            const deleteRequest = store.delete(operation.id);
            await new Promise((res, rej) => {
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => rej(deleteRequest.error);
            });
          } catch (error) {
            console.error("Sync operation failed:", error);

            // Increment retry count
            operation.retries++;
            if (operation.retries < 3) {
              const updateRequest = store.put(operation);
              await new Promise((res, rej) => {
                updateRequest.onsuccess = () => res();
                updateRequest.onerror = () => rej(updateRequest.error);
              });
            } else {
              // Remove after max retries
              store.delete(operation.id);
            }
          }
        }

        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async syncOperation(operation) {
    switch (operation.type) {
      case "progress_update":
        return this.apiClient.post(
          "/api/learning/progress/update",
          operation.data
        );

      case "exercise_submit":
        return this.apiClient.post(
          "/api/learning/exercises/submit",
          operation.data
        );

      default:
        throw new Error(`Unknown sync operation: ${operation.type}`);
    }
  }

  // Hybrid online/offline data fetching
  async getStories(filters = {}) {
    try {
      if (navigator.onLine) {
        // Try to fetch from API first
        const response = await this.apiClient.get("/api/learning/stories", {
          params: filters,
        });

        // Cache the results
        for (const story of response.data) {
          await this.cacheStory(story);
        }

        return response;
      }
    } catch (error) {
      console.warn("Failed to fetch stories from API, falling back to cache");
    }

    // Fallback to cached data
    const cachedStories = await this.getCachedStories(filters);
    return {
      data: cachedStories,
      meta: {
        source: "cache",
        pagination: {
          total: cachedStories.length,
        },
      },
    };
  }

  // Offline progress tracking
  async updateProgressOffline(progressData) {
    // Store locally first
    await this.cacheProgress(progressData);

    // Queue for sync when online
    await this.queueForSync({
      type: "progress_update",
      data: progressData,
    });

    // Try immediate sync if online
    if (navigator.onLine) {
      try {
        await this.syncOfflineData();
      } catch (error) {
        console.log("Immediate sync failed, will retry later");
      }
    }
  }

  async cacheProgress(progressData) {
    const transaction = this.db.transaction(["progress"], "readwrite");
    const store = transaction.objectStore("progress");

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: `${progressData.storyId}_${Date.now()}`,
        ...progressData,
        cachedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Usage
const offlineManager = new OfflineDataManager(apiClient);

// Initialize offline capabilities
await offlineManager.initialize();

// Set up automatic sync when coming online
window.addEventListener("online", () => {
  console.log("Device came online, syncing data...");
  offlineManager.syncOfflineData();
});

// Use hybrid online/offline data fetching
async function loadStories() {
  try {
    const stories = await offlineManager.getStories({
      difficulty: "intermediate",
    });

    if (stories.meta.source === "cache") {
      showOfflineIndicator();
    }

    renderStories(stories.data);
  } catch (error) {
    console.error("Failed to load stories:", error);
  }
}

// Update progress with offline support
async function updateProgress(progressData) {
  try {
    if (navigator.onLine) {
      await apiClient.post("/api/learning/progress/update", progressData);
    } else {
      await offlineManager.updateProgressOffline(progressData);
      showOfflineMessage(
        "Progress saved offline. Will sync when connection is restored."
      );
    }
  } catch (error) {
    // Fallback to offline storage
    await offlineManager.updateProgressOffline(progressData);
  }
}
```

---

These comprehensive examples demonstrate real-world usage patterns for the EdTech Platform API, including authentication flows, content management, progress tracking, exercise handling, error management, and advanced features like real-time synchronization and offline support.
