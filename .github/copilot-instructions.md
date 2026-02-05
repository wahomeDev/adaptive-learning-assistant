# Adaptive Learning Assistant - AI Agent Guidelines

## Architecture Overview

This is a **vanilla JavaScript single-page application (SPA)** with no frameworks. The app provides an adaptive learning platform with practice quizzes, exams, and progress analytics.

**Key Components:**
- **Navigation Model** ([index.html](../index.html#L24)): Four-page layout (Dashboard, Topics, Assessment, Progress)
- **Question Engine** ([script.js](../script.js#L30-L110)): Nested object structure `questions[topic][difficulty]` with properties `q` (question), `o` (options), `a` (answer), `c` (concept)
- **State Management** ([script.js](../script.js#L1-L20)): Global variables track `currentTopic`, `difficulty`, `currentQuestionIndex`, `score`, `examMode`
- **Progress Tracking**: localStorage stores quiz results as JSON array with `{date, topic, percentage, difficulty, mode}`

## Critical Workflows

### Adding New Topics and Questions

**New Topic Checklist:**
1. Add entry to `questions` object with three difficulty tiers:
   ```javascript
   questions.history = {
     easy: [
       { q: "When did X happen?", o: ["1066", "1096", "1106"], a: "1066", c: "medieval" },
       // ... more easy questions
     ],
     medium: [/* ... */],
     hard: [/* ... */]
   };
   ```
2. Update [Assessment page buttons](../index.html#L75-L80) to include new topic: `<button onclick="startQuiz('history', false)">History</button>`
3. Add corresponding exam button: `<button onclick="startExam('history')">History Exam</button>`

**Question Properties (required, always use abbreviations):**
- `q`: String - the question text
- `o`: Array - answer options (minimum 2, typically 3-4)
- `a`: String - correct answer (must exactly match one option)
- `c`: String - concept/skill tag (used for tracking weak areas in `weakConcepts`)

### Adaptive Difficulty Algorithm
[getAdaptiveDifficulty()](../script.js#L213-L227) implements the core adaptation logic:
```javascript
const topicData = data.filter(d => d.topic === topic);
const avg = topicData.reduce((s, d) => s + d.percentage, 0) / topicData.length;
// Returns: avg >= 80 ? "hard" : avg < 50 ? "easy" : "medium"
```

**Algorithm Behavior:**
- **First attempt**: Returns `"medium"` (no history)
- **< 50% average**: Drops to `"easy"` for scaffolding
- **50-79% average**: Stays `"medium"`
- **≥ 80% average**: Promotes to `"hard"` for challenge

This calculation runs every quiz start via [startQuiz()](../script.js#L134-L155), ensuring difficulty matches recent performance.

### Quiz Flow (Practice Mode)
1. `startQuiz(topic, false)` → calls `getAdaptiveDifficulty()` → stores difficulty in global `difficulty` variable
2. `renderQuestion()` displays current question with concept label
3. User clicks option → `submitAnswer(selected)` compares to `currentQuestions[index].a`
4. Score tracked, concept stored in `weakConcepts` if wrong
5. `currentQuestionIndex` incremented → next question or `showResult()`
6. Results saved to localStorage via `generateRecommendation()` with format: `{date: "2024-01-15", topic: "mathematics", percentage: 85, difficulty: "medium", mode: "practice"}`

### Exam Mode Mechanics
- `startExam(topic)` calls `startQuiz(topic, true)` with 10 random questions across all difficulties
- `startTimer(900)` starts 15-minute countdown, updates `#timer` element every 1s
- `examInProgress = true` blocks navigation (guard in nav click handler prevents page switches)
- Auto-calls `showResult()` when timer reaches 0
- **Critical**: `resetQuizState()` clears `timerInterval` to prevent orphaned interval bugs

## Project-Specific Conventions

### Naming Patterns
- **Question properties**: Single-char: `q`, `o`, `a`, `c` (never use full words like `question`, `options`)
- **Difficulty levels**: Strictly `"easy"`, `"medium"`, `"hard"` (case-sensitive, lowercase)
- **Data format**: Dates always strings ("2024-01-15"), topics always lowercase, mode is "practice" or "exam"
- **Concept tags**: Short, lowercase, underscore-separated (e.g., `photosynthesis`, `fractions`, `respiration`)

### State Management Pattern
**Module-level mutable state** (not function returns):
- `currentTopic`, `difficulty`, `currentQuestionIndex`, `score` - used across multiple functions
- `examMode`, `examInProgress` - control conditional rendering and navigation guards
- `timerInterval` - must be module-level so `resetQuizState()` can clear it
- `currentQuestions` - array reference updated by `startQuiz()`, read by `renderQuestion()` and `submitAnswer()`
- `weakConcepts` - object tracking wrong answers by concept for recommendation logic

**Why globals?** Chart.js and timer cleanup require access across function boundaries; refactoring to returns would require threading state through call stacks.

### UI State Coupling
**Critical Rule**: Both `.page` section and corresponding `.nav button` must have `.active` class, or UI becomes inconsistent.
```javascript
// Correct pattern (from nav click handler):
document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
document.getElementById(btn.dataset.page).classList.add("active");
btn.classList.add("active");
```
- If only page is `.active` but nav button isn't: visual feedback breaks
- If only nav button is `.active` but page isn't: content invisible

### Chart Rendering & Cleanup
[renderCharts()](../script.js#L418-L490) **must destroy old instances before creating new ones**:
```javascript
if (progressionChart) { progressionChart.destroy(); progressionChart = null; }
if (averageChart) { averageChart.destroy(); averageChart = null; }
// Then create new Chart instances
progressionChart = new Chart(progressionCtx, {...});
averageChart = new Chart(averageCtx, {...});
```
**Why?** Chart.js v3+ requires explicit cleanup to prevent canvas binding conflicts; missing destroy() causes "Cannot reuse canvas" errors on second render.

## Integration Points & Dependencies

- **localStorage**: Single source of truth. Structure: `progress` key holds JSON stringified array of result objects. Example: `[{date: "2024-01-15", topic: "mathematics", percentage: 85, difficulty: "medium", mode: "practice"}]`
- **Chart.js**: Required for progress page (`renderCharts()` needs `new Chart()`). Loaded via CDN in [index.html](../index.html#L7)
- **Google Fonts (Inter)**: Applied to `body` font-family in [style.css](../style.css#L34)

## Common Pitfalls to Avoid

1. **Orphaned timers**: `timerInterval` must be cleared in `resetQuizState()` AND checked before creating new one in `startTimer()`. Missing either causes double-counting or stale updates.
2. **localStorage corruption**: Always wrap `JSON.parse(localStorage.getItem("progress"))` in try-catch or `|| []` fallback. Corrupted data silently breaks `getAdaptiveDifficulty()`.
3. **Container ID mismatch**: `containerId` must match actual DOM element ID (`practice-container` or `exam-container`). Wrong ID means `quiz.innerHTML =` targets nothing—renders silently fail.
4. **Chart memory leaks**: Never call `new Chart()` without destroying old instance first. Prevents "canvas already in use" exceptions.
5. **Navigation during exam**: `examInProgress` guard blocks nav clicks with alert. UX issue: consider modal instead of `alert()` for better UX.
6. **Missing concept tracking**: `weakConcepts[concept] = (weakConcepts[concept] || 0) + 1` increments count per wrong answer; needed for recommendation generation.

## Debugging Tips

- **Check localStorage directly**: `console.log(JSON.parse(localStorage.getItem("progress")))` to inspect saved results
- **Monitor state**: Add `console.log()` calls in `getAdaptiveDifficulty()` (already has logging for avg difficulty calculation)
- **Timer issues**: Verify `timerInterval` is null after exam completes via `console.log(timerInterval)`
- **Chart errors**: Open DevTools Console for "canvas already in use" errors—indicates missing `destroy()` call
- **Quiz render fails**: Check that `currentQuestions` array is populated and `containerId` matches an actual DOM element

## Adding Features

### New Assessment Type (Timed Quiz, Topic Quiz)
Follow the pattern of `startQuiz()`:
```javascript
function startTimedQuiz(topic, timeLimit) {
  resetQuizState();
  currentTopic = topic;
  difficulty = getAdaptiveDifficulty(topic);
  currentQuestions = questions[topic][difficulty];
  examMode = false;
  containerId = "practice-container";
  startTimer(timeLimit); // Use existing timer
  renderQuestion();
}
```

### Concept-Based Analytics
Hook into `weakConcepts` tracking from [submitAnswer()](../script.js#L260-L279):
```javascript
// In generateRecommendation():
const concepts = Object.keys(weakConcepts).sort((a, b) => 
  weakConcepts[b] - weakConcepts[a]
);
// Now `concepts[0]` is the weakest concept for this topic
```

### Dark Mode Implementation
CSS variables at [`:root`](../style.css#L1-L20) define all colors. Add toggle:
```javascript
document.body.classList.toggle("dark-mode");
// In style.css:
body.dark-mode { --bg-main: #1f2937; --text-main: #f3f4f6; /* ... */ }
```

### Analytics Export (CSV)
```javascript
const data = JSON.parse(localStorage.getItem("progress")) || [];
const csv = "date,topic,percentage,difficulty,mode\n" + 
  data.map(d => `${d.date},${d.topic},${d.percentage},${d.difficulty},${d.mode}`).join("\n");
// Trigger download or copy to clipboard
```
