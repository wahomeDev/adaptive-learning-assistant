// ===================================
// GLOBAL STATE
// ===================================
let currentTopic = null;
let currentDetailTopic = null;
let currentFocusTopic = "mathematics";
let difficulty = "medium";
let currentQuestionIndex = 0;
let score = 0;
let answeredQuestions = [];
let weakConcepts = {};
let examMode = false;
let timerInterval = null;
let timeLeft = 0;
let examInProgress = false;
let currentQuestions = [];
let containerId = "practice-container";
let progressionChart = null;
let averageChart = null;

// ===================================
// DEFENSIVE UTILITY FUNCTIONS
// ===================================

/**
 * Safe division function with zero check
 * @param {number} numerator - The dividend
 * @param {number} denominator - The divisor
 * @param {number} defaultValue - Default value if division by zero (default: 0)
 * @returns {number} Result of division or default value
 */
function safeDivide(numerator, denominator, defaultValue = 0) {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return defaultValue;
  }
  return numerator / denominator;
}

/**
 * Safe average calculation
 * @param {array} arr - Array of numbers
 * @returns {number} Average or 0 if array is empty
 */
function safeAverage(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return 0;
  }
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return safeDivide(sum, arr.length, 0);
}

/**
 * Normalize ISO date string (YYYY-MM-DD HH:mm:ss.sssZ format)
 * @param {string|Date} dateInput - Date to normalize
 * @returns {string} ISO string in consistent format
 */
function normalizeDate(dateInput) {
  try {
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (!Number.isFinite(date.getTime())) {
        return new Date().toISOString();
      }
      return date.toISOString();
    }
    if (dateInput instanceof Date) {
      if (!Number.isFinite(dateInput.getTime())) {
        return new Date().toISOString();
      }
      return dateInput.toISOString();
    }
    return new Date().toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Extract date portion from ISO string (YYYY-MM-DD)
 * @param {string} isoString - ISO date string
 * @returns {string} Date in YYYY-MM-DD format
 */
function getDatePart(isoString) {
  try {
    return isoString.split('T')[0] || new Date().toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Safely get data from localStorage with JSON parsing
 * @param {string} key - LocalStorage key
 * @returns {array} Parsed data or empty array
 */
function getSafeStorageData(key) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return [];
  }
}

/**
 * Safely save data to localStorage
 * @param {string} key - LocalStorage key
 * @param {any} value - Value to save
 * @returns {boolean} Success status
 */
function setSafeStorageData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`Error saving to localStorage (${key}):`, e);
    return false;
  }
} 

// ===================================
// QUESTION BANK
// ===================================
const questions = {
  mathematics: {
    easy: [
      { q: "5 + 7 = ?", o: ["10", "11", "12"], a: "12", c: "addition" },
      { q: "3 + 9 = ?", o: ["12", "13", "14"], a: "12", c: "addition" },
      { q: "8 + 2 = ?", o: ["10", "11", "12"], a: "10", c: "addition" },
      { q: "6 + 4 = ?", o: ["10", "11", "12"], a: "10", c: "addition" },
      { q: "1 + 5 = ?", o: ["6", "7", "8"], a: "6", c: "addition" },
      { q: "10 - 3 = ?", o: ["7", "8", "9"], a: "7", c: "subtraction" },
      { q: "15 - 5 = ?", o: ["10", "11", "12"], a: "10", c: "subtraction" },
      { q: "9 - 4 = ?", o: ["5", "6", "7"], a: "5", c: "subtraction" },
      { q: "12 - 7 = ?", o: ["5", "6", "7"], a: "5", c: "subtraction" },
      { q: "8 - 2 = ?", o: ["6", "7", "8"], a: "6", c: "subtraction" }
    ],
    medium: [
      { q: "12 × 8 = ?", o: ["96", "88"], a: "96", c: "multiplication" },
      { q: "7 × 6 = ?", o: ["42", "48"], a: "42", c: "multiplication" },
      { q: "9 × 5 = ?", o: ["45", "50"], a: "45", c: "multiplication" },
      { q: "4 × 9 = ?", o: ["36", "40"], a: "36", c: "multiplication" },
      { q: "6 × 7 = ?", o: ["42", "48"], a: "42", c: "multiplication" },
      { q: "45 ÷ 5 = ?", o: ["7", "8", "9"], a: "9", c: "division" },
      { q: "36 ÷ 6 = ?", o: ["6", "7", "8"], a: "6", c: "division" },
      { q: "24 ÷ 4 = ?", o: ["6", "7", "8"], a: "6", c: "division" },
      { q: "18 ÷ 3 = ?", o: ["6", "7", "8"], a: "6", c: "division" },
      { q: "30 ÷ 5 = ?", o: ["6", "7", "8"], a: "6", c: "division" }
    ],
    hard: [
      { q: "15% of 200 = ?", o: ["20", "25", "30"], a: "30", c: "percentages" },
      { q: "20% of 150 = ?", o: ["30", "35", "40"], a: "30", c: "percentages" },
      { q: "10% of 500 = ?", o: ["50", "55", "60"], a: "50", c: "percentages" },
      { q: "25% of 80 = ?", o: ["20", "25", "30"], a: "20", c: "percentages" },
      { q: "5% of 400 = ?", o: ["20", "25", "30"], a: "20", c: "percentages" },
      { q: "1/2 + 1/4 = ?", o: ["3/4", "1/2", "1/4"], a: "3/4", c: "fractions" },
      { q: "3/4 - 1/4 = ?", o: ["1/2", "1/4", "2/4"], a: "1/2", c: "fractions" },
      { q: "2/3 × 3/4 = ?", o: ["1/2", "2/3", "3/4"], a: "1/2", c: "fractions" },
      { q: "1/5 + 2/5 = ?", o: ["3/5", "1/5", "2/5"], a: "3/5", c: "fractions" },
      { q: "4/5 ÷ 2/3 = ?", o: ["6/5", "4/5", "2/3"], a: "6/5", c: "fractions" }
    ]
  },
  science: {
    easy: [
      { q: "Which gas do plants use?", o: ["Oxygen", "Carbon Dioxide"], a: "Carbon Dioxide", c: "photosynthesis" },
      { q: "What do plants produce?", o: ["Oxygen", "Carbon Dioxide"], a: "Oxygen", c: "photosynthesis" },
      { q: "What is the sun's energy used for?", o: ["Photosynthesis", "Respiration"], a: "Photosynthesis", c: "photosynthesis" },
      { q: "Which organelle does photosynthesis?", o: ["Chloroplast", "Nucleus"], a: "Chloroplast", c: "photosynthesis" },
      { q: "What is needed for photosynthesis?", o: ["Water", "Fire"], a: "Water", c: "photosynthesis" },
      { q: "What do animals do to get energy?", o: ["Respiration", "Photosynthesis"], a: "Respiration", c: "respiration" },
      { q: "What does respiration produce?", o: ["Oxygen", "Carbon Dioxide"], a: "Carbon Dioxide", c: "respiration" },
      { q: "Where does respiration occur?", o: ["Cells", "Leaves"], a: "Cells", c: "respiration" },
      { q: "What is the equation for respiration?", o: ["C6H12O6 + O2", "CO2 + H2O"], a: "C6H12O6 + O2", c: "respiration" },
      { q: "What is released in respiration?", o: ["Energy", "Light"], a: "Energy", c: "respiration" }
    ],
    medium: [
      { q: "What organ pumps blood?", o: ["Heart", "Liver"], a: "Heart", c: "biology" },
      { q: "What carries oxygen in blood?", o: ["Red blood cells", "White blood cells"], a: "Red blood cells", c: "biology" },
      { q: "What is the largest organ?", o: ["Skin", "Heart"], a: "Skin", c: "biology" },
      { q: "What filters blood?", o: ["Kidneys", "Lungs"], a: "Kidneys", c: "biology" },
      { q: "What controls the body?", o: ["Brain", "Heart"], a: "Brain", c: "biology" },
      { q: "What is Newton's first law?", o: ["Inertia", "Gravity"], a: "Inertia", c: "physics" },
      { q: "What is the force of attraction?", o: ["Gravity", "Magnetism"], a: "Gravity", c: "physics" },
      { q: "What is energy of motion?", o: ["Kinetic", "Potential"], a: "Kinetic", c: "physics" },
      { q: "What is stored energy?", o: ["Potential", "Kinetic"], a: "Potential", c: "physics" },
      { q: "What is the unit of force?", o: ["Newton", "Joule"], a: "Newton", c: "physics" }
    ],
    hard: [
      { q: "Process plants use to make food?", o: ["Respiration", "Photosynthesis"], a: "Photosynthesis", c: "photosynthesis" },
      { q: "What is the chemical equation for photosynthesis?", o: ["6CO2 + 6H2O", "C6H12O6 + O2"], a: "6CO2 + 6H2O", c: "photosynthesis" },
      { q: "Where is chlorophyll found?", o: ["Chloroplast", "Mitochondria"], a: "Chloroplast", c: "photosynthesis" },
      { q: "What is the byproduct of photosynthesis?", o: ["Oxygen", "Carbon Dioxide"], a: "Oxygen", c: "photosynthesis" },
      { q: "What wavelength does chlorophyll absorb?", o: ["Red and blue", "Green"], a: "Red and blue", c: "photosynthesis" },
      { q: "What is cellular respiration?", o: ["Energy production", "Food making"], a: "Energy production", c: "biology" },
      { q: "Where does glycolysis occur?", o: ["Cytoplasm", "Mitochondria"], a: "Cytoplasm", c: "biology" },
      { q: "What is ATP?", o: ["Energy currency", "Protein"], a: "Energy currency", c: "biology" },
      { q: "What is Krebs cycle?", o: ["Energy pathway", "DNA replication"], a: "Energy pathway", c: "biology" },
      { q: "What is oxidative phosphorylation?", o: ["ATP synthesis", "Protein synthesis"], a: "ATP synthesis", c: "biology" }
    ]
  },
  language: {
    easy: [
      { q: "What is a noun?", o: ["A person, place, or thing", "A describing word"], a: "A person, place, or thing", c: "parts_of_speech" },
      { q: "What is a verb?", o: ["An action word", "A describing word"], a: "An action word", c: "parts_of_speech" },
      { q: "What is an adjective?", o: ["An action word", "A describing word"], a: "A describing word", c: "parts_of_speech" },
      { q: "Which is a pronoun?", o: ["She", "Happy"], a: "She", c: "pronouns" },
      { q: "What does 'synonym' mean?", o: ["A word with the same meaning", "A word with opposite meaning"], a: "A word with the same meaning", c: "vocabulary" },
      { q: "What does 'antonym' mean?", o: ["A word with the same meaning", "A word with opposite meaning"], a: "A word with opposite meaning", c: "vocabulary" },
      { q: "What is a vowel?", o: ["A, E, I, O, U", "B, C, D, F, G"], a: "A, E, I, O, U", c: "phonetics" },
      { q: "What punctuation ends a sentence?", o: ["Period", "Comma"], a: "Period", c: "punctuation" },
      { q: "What is a sentence?", o: ["A group of words expressing a complete thought", "A single word"], a: "A group of words expressing a complete thought", c: "grammar" },
      { q: "What is capitalization used for?", o: ["Beginning of sentences and proper nouns", "Every word"], a: "Beginning of sentences and proper nouns", c: "grammar" }
    ],
    medium: [
      { q: "What is a conjunction?", o: ["And, but, or", "Slowly, quickly"], a: "And, but, or", c: "parts_of_speech" },
      { q: "What is an adverb?", o: ["Describes a noun", "Describes a verb or adjective"], a: "Describes a verb or adjective", c: "parts_of_speech" },
      { q: "What is a preposition?", o: ["In, on, at", "Very, really"], a: "In, on, at", c: "parts_of_speech" },
      { q: "What is passive voice?", o: ["Subject performs action", "Subject receives action"], a: "Subject receives action", c: "tenses" },
      { q: "What is present perfect tense?", o: ["Has/have + past participle", "Am/is/are + -ing"], a: "Has/have + past participle", c: "tenses" },
      { q: "What is a clause?", o: ["A group of words without subject and verb", "A group of words with subject and verb"], a: "A group of words with subject and verb", c: "grammar" },
      { q: "What is subject-verb agreement?", o: ["Subject and verb match in number", "Subject comes after verb"], a: "Subject and verb match in number", c: "grammar" },
      { q: "What does 'idiom' mean?", o: ["Literal meaning of words", "A phrase with figurative meaning"], a: "A phrase with figurative meaning", c: "vocabulary" },
      { q: "What is alliteration?", o: ["Same sound at start of words", "Words that rhyme"], a: "Same sound at start of words", c: "literary_devices" },
      { q: "What is a metaphor?", o: ["A direct comparison with 'like'", "A comparison without 'like'"], a: "A comparison without 'like'", c: "literary_devices" }
    ],
    hard: [
      { q: "What is a dependent clause?", o: ["Can stand alone", "Cannot stand alone as a sentence"], a: "Cannot stand alone as a sentence", c: "grammar" },
      { q: "What is a complex sentence?", o: ["One independent clause", "Independent + dependent clauses"], a: "Independent + dependent clauses", c: "grammar" },
      { q: "What is personification?", o: ["Giving human qualities to objects", "Comparing two things"], a: "Giving human qualities to objects", c: "literary_devices" },
      { q: "What is the subjunctive mood?", o: ["Expresses facts", "Expresses wishes or hypothetical situations"], a: "Expresses wishes or hypothetical situations", c: "tenses" },
      { q: "What is a gerund?", o: ["A verb", "A noun form of a verb ending in -ing"], a: "A noun form of a verb ending in -ing", c: "parts_of_speech" },
      { q: "What is an infinitive?", o: ["Verb form with 'to'", "Subject of sentence"], a: "Verb form with 'to'", c: "parts_of_speech" },
      { q: "What is irony?", o: ["Direct statement", "Opposite of what is expected"], a: "Opposite of what is expected", c: "literary_devices" },
      { q: "What is parallelism?", o: ["Using similar structure for related ideas", "Using different structures"], a: "Using similar structure for related ideas", c: "grammar" },
      { q: "What is etymology?", o: ["Study of word origins", "Study of grammar"], a: "Study of word origins", c: "vocabulary" },
      { q: "What is a homonym?", o: ["Words with same meaning", "Words with same spelling/sound but different meanings"], a: "Words with same spelling/sound but different meanings", c: "vocabulary" }
    ]
  }
};

// ===================================
// NAVIGATION
// ===================================
document.querySelectorAll(".nav button").forEach(btn => {
  btn.onclick = () => {
    if (examInProgress) {
      alert("You cannot navigate away during an exam. Please complete the exam first.");
      return;
    }
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; timeLeft = 0; examInProgress = false; }
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
    document.getElementById(btn.dataset.page).classList.add("active");
    btn.classList.add("active");
    if (btn.dataset.page === "dashboard") updateDashboard();
    if (btn.dataset.page === "progress") renderProgress();
    if (btn.dataset.page === "assessment") resetAssessmentPage();
    if (btn.dataset.page === "topics") updateTopicsProgress();
  };
});

// ===================================
// TOPICS PAGE FUNCTIONS
// ===================================
function updateTopicsProgress() {
  const data = getSafeStorageData("progress");
  const topics = ["mathematics", "science", "language"];
  
  topics.forEach(topic => {
    const topicData = data.filter(d => d.topic === topic);
    let percentage = 0;
    
    if (topicData.length > 0) {
      const sum = topicData.reduce((s, d) => s + (d.percentage || 0), 0);
      percentage = Math.round(safeDivide(sum, topicData.length, 0));
    }
    
    const fillEl = document.getElementById(`progress-fill-${topic}`);
    const percentEl = document.getElementById(`percentage-${topic}`);
    
    if (fillEl) {
      fillEl.style.width = Math.max(0, Math.min(100, percentage)) + "%";
    }
    if (percentEl) {
      percentEl.innerText = percentage + "%";
    }
  });
}

function navigateToTopic(topic) {
  if (!questions[topic]) {
    alert("This topic is not yet available. Please check back soon!");
    return;
  }
  currentDetailTopic = topic;
  showSubjectDetail(topic);
}

function showSubjectDetail(topic) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  
  // Show subject detail page
  document.getElementById("subject-detail").classList.add("active");
  
  // Update subject detail header
  const topicNames = {
    mathematics: "Mathematics",
    science: "Science",
    language: "Language"
  };
  const topicSubtitles = {
    mathematics: "Master calculations, algebra, and quantitative reasoning.",
    science: "Explore biology, physics, and natural phenomena.",
    language: "Develop vocabulary, grammar, and communication skills."
  };
  
  document.getElementById("subject-detail-title").innerText = topicNames[topic] || "Subject";
  document.getElementById("subject-detail-subtitle").innerText = topicSubtitles[topic] || "";
  
  // Reset to Learn section
  switchSection("learn");
  
  // Update weak areas section
  updateWeakAreasDisplay(topic);
}

function backToTopics() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("topics").classList.add("active");
  const topicsBtn = document.querySelector('[data-page="topics"]');
  if (topicsBtn) topicsBtn.classList.add("active");
  updateTopicsProgress();
}

function switchSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section-content").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".section-tab").forEach(t => t.classList.remove("active"));
  
  // Show selected section
  const sectionEl = document.getElementById(`section-${sectionName}`);
  if (sectionEl) sectionEl.classList.add("active");
  
  // Mark tab as active
  const tabEl = document.querySelector(`.section-tab[onclick*="'${sectionName}'"]`);
  if (tabEl) tabEl.classList.add("active");
}

function updateWeakAreasDisplay(topic) {
  const data = JSON.parse(localStorage.getItem("progress")) || [];
  const topicData = data.filter(d => d.topic === topic);
  
  if (!topicData.length) {
    document.getElementById("weak-areas-content").innerHTML = `
      <p style="color: var(--text-muted); margin-top: 16px;">Complete some quizzes to identify areas for improvement.</p>
    `;
    return;
  }
  
  // Collect weak concepts from this topic (if stored elsewhere)
  let html = "<div class='weak-areas-list'>";
  let hasWeakAreas = false;
  
  // This would ideally pull from stored concept performance data
  // For now, show data availability notice
  html += `
    <p style="color: var(--text-light); margin-bottom: 16px;">
      You've completed ${topicData.length} assessment${topicData.length > 1 ? 's' : ''} in this topic.
      Continue practicing to build strong areas and improve weaker ones.
    </p>
  `;
  
  html += "</div>";
  document.getElementById("weak-areas-content").innerHTML = html;
}

// Initialize topics progress on page load
window.addEventListener("load", () => {
  updateTopicsProgress();
  updateDashboard();
});

// ===================================
// DASHBOARD FUNCTIONS
// ===================================
function updateDashboard() {
  const data = getSafeStorageData("progress");
  const topics = ["mathematics", "science", "language"];
  
  // Update overall mastery (safe divide)
  if (data.length > 0) {
    const sum = data.reduce((s, d) => s + (d.percentage || 0), 0);
    const overallMastery = Math.round(safeDivide(sum, data.length, 0));
    document.getElementById("overall-mastery").innerText = overallMastery + "%";
  }
  
  // Calculate and update practice streak
  updateLastActivityDate();
  const streak = calculatePracticeStreak(data);
  document.getElementById("practice-streak").innerText = "🔥 " + streak;
  
  // Update greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const studentName = "Learner"; // Can be extended to store user name
  document.getElementById("hero-greeting").innerText = greeting + ", " + studentName;
  
  // Update subject snapshots
  topics.forEach(topic => {
    const topicData = data.filter(d => d.topic === topic);
    let percentage = 0;
    let lastActivity = "No activity yet";
    
    if (topicData.length > 0) {
      const sum = topicData.reduce((s, d) => s + (d.percentage || 0), 0);
      percentage = Math.round(safeDivide(sum, topicData.length, 0));
      try {
        const lastDate = new Date(topicData[topicData.length - 1].date);
        if (Number.isFinite(lastDate.getTime())) {
          lastActivity = formatLastActivity(lastDate);
        }
      } catch (e) {
        lastActivity = "Recent activity";
      }
    }
    
    const progressEl = document.getElementById(`snap-progress-${topic}`);
    const textEl = document.getElementById(`snap-text-${topic}`);
    const activityEl = document.getElementById(`snap-activity-${topic}`);
    
    if (progressEl) progressEl.style.width = Math.max(0, Math.min(100, percentage)) + "%";
    if (textEl) textEl.innerText = percentage + "%";
    if (activityEl) activityEl.innerText = lastActivity;
  });
  
  // Update recommendations
  updateRecommendation(data, topics);
  
  // Update achievements
  updateAchievements(data);
  
  // Update focus card
  updateFocusCard();
  
  // Update charts if data exists
  if (data.length > 0) {
    renderCharts(data);
  }
}

// ===================================
// STREAK TRACKING
// ===================================
function updateLastActivityDate() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const lastActivity = localStorage.getItem("lastActivityDate");
  
  if (lastActivity !== today) {
    localStorage.setItem("lastActivityDate", today);
  }
}

function calculatePracticeStreak(data) {
  if (!data || !Array.isArray(data) || !data.length) return 0;
  
  try {
    // Get unique dates sorted in descending order (most recent first)
    const uniqueDates = [...new Set(data.map(d => {
      try {
        return getDatePart(d.date);
      } catch (e) {
        return null;
      }
    }).filter(d => d))].sort().reverse();
    
    if (!uniqueDates.length) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's activity today or yesterday
    const lastActivityDate = localStorage.getItem("lastActivityDate");
    const lastActivityDay = lastActivityDate ? new Date(lastActivityDate + 'T00:00:00') : null;
    
    if (!lastActivityDay || !Number.isFinite(lastActivityDay.getTime())) {
      return 0; // No valid activity recorded
    }
    
    const hoursSinceLastActivity = (today - lastActivityDay) / (1000 * 60 * 60);
    
    // If more than 24 hours since last activity, streak is broken
    if (hoursSinceLastActivity > 24) {
      return 0;
    }
    
    // Count consecutive days backwards from most recent activity
    for (let i = 0; i < uniqueDates.length; i++) {
      const dateStr = uniqueDates[i];
      try {
        const date = new Date(dateStr + 'T00:00:00');
        if (!Number.isFinite(date.getTime())) break;
        
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);
        
        // Check if this date matches the expected position in streak
        if (date.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      } catch (e) {
        break;
      }
    }
    
    return Math.max(0, streak);
  } catch (e) {
    console.warn("Error calculating streak:", e);
    return 0;
  }
}

function formatLastActivity(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return diffMins + " min ago";
  if (diffHours < 24) return diffHours + " hour" + (diffHours > 1 ? "s" : "") + " ago";
  if (diffDays < 7) return diffDays + " day" + (diffDays > 1 ? "s" : "") + " ago";
  
  return date.toLocaleDateString();
}

function updateRecommendation(data, topics) {
  if (!data.length) {
    document.getElementById("recommendation-title").innerText = "Get Started";
    document.getElementById("recommendation-description").innerText = "Complete your first quiz to unlock personalized recommendations.";
    document.getElementById("recommendation-button").innerText = "Start Learning";
    return;
  }
  
  // Find weakest topic
  const topicPerformance = {};
  topics.forEach(topic => {
    const topicData = data.filter(d => d.topic === topic);
    if (topicData.length > 0) {
      topicPerformance[topic] = topicData.reduce((s, d) => s + d.percentage, 0) / topicData.length;
    } else {
      topicPerformance[topic] = 0;
    }
  });
  
  const weakestTopic = Object.keys(topicPerformance).reduce((a, b) => 
    topicPerformance[a] < topicPerformance[b] ? a : b
  );
  
  const weakestPercentage = Math.round(topicPerformance[weakestTopic]);
  const topicName = weakestTopic.charAt(0).toUpperCase() + weakestTopic.slice(1);
  
  if (weakestPercentage < 70) {
    document.getElementById("recommendation-title").innerText = "Focus on " + topicName;
    document.getElementById("recommendation-description").innerText = `Your ${topicName} score is ${weakestPercentage}%. Keep practicing to strengthen this area.`;
  } else {
    document.getElementById("recommendation-title").innerText = "Keep it up! 🎉";
    document.getElementById("recommendation-description").innerText = "You're doing great! Continue challenging yourself with harder problems.";
  }
}

function updateAchievements(data) {
  // First Quiz achievement
  if (data.length >= 1) {
    document.getElementById("achievement-first-quiz").classList.add("unlocked");
  }
  
  // Week Streak achievement
  const streak = calculatePracticeStreak(data);
  if (streak >= 7) {
    document.getElementById("achievement-week-streak").classList.add("unlocked");
  }
  
  // Topic Master achievement (90%+ on any topic)
  const hasMasterTopic = data.some(d => d.percentage >= 90);
  if (hasMasterTopic) {
    document.getElementById("achievement-master-topic").classList.add("unlocked");
  }
  
  // Perfect Exam achievement (100%)
  const hasPerfectExam = data.some(d => d.percentage === 100 && d.mode === "exam");
  if (hasPerfectExam) {
    document.getElementById("achievement-perfect-exam").classList.add("unlocked");
  }
}

function determineFocusTopic(data, topics) {
  // If no data, default to Mathematics
  if (!data.length) {
    return {
      topic: "mathematics",
      mastery: 0,
      concepts: ["addition", "subtraction"],
      focusConcept: "addition",
      estimatedTime: "10 min"
    };
  }
  
  // Calculate performance per topic
  const topicPerformance = {};
  const topicLastFailure = {};
  
  topics.forEach(topic => {
    const topicData = data.filter(d => d.topic === topic);
    if (topicData.length > 0) {
      const avgScore = topicData.reduce((s, d) => s + d.percentage, 0) / topicData.length;
      topicPerformance[topic] = avgScore;
      
      // Find most recent failure (score < 70)
      const failures = topicData.filter(d => d.percentage < 70).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      if (failures.length > 0) {
        topicLastFailure[topic] = new Date(failures[0].date);
      }
    } else {
      topicPerformance[topic] = 0;
    }
  });
  
  // Determine focus: lowest mastery, or if tied, most recent failure
  let focusTopic = "mathematics";
  let minPerformance = 101;
  let mostRecentFailure = null;
  
  for (let topic of topics) {
    const perf = topicPerformance[topic];
    const failure = topicLastFailure[topic];
    
    if (perf < minPerformance) {
      minPerformance = perf;
      focusTopic = topic;
      mostRecentFailure = failure;
    } else if (perf === minPerformance && failure && (!mostRecentFailure || failure > mostRecentFailure)) {
      focusTopic = topic;
      mostRecentFailure = failure;
    }
  }
  
  // Get concepts for this topic (from questions)
  const topicQuestions = questions[focusTopic] || {};
  const allConcepts = new Set();
  Object.values(topicQuestions).forEach(diffLevel => {
    if (Array.isArray(diffLevel)) {
      diffLevel.forEach(q => {
        if (q.c) allConcepts.add(q.c);
      });
    }
  });
  
  const concepts = Array.from(allConcepts).slice(0, 5);
  const focusConcept = concepts.length > 0 ? concepts[0] : focusTopic;
  
  // Estimate time based on mastery
  let estimatedTime = "10 min";
  if (topicPerformance[focusTopic] < 50) {
    estimatedTime = "5 min";
  } else if (topicPerformance[focusTopic] < 70) {
    estimatedTime = "10 min";
  } else {
    estimatedTime = "15 min";
  }
  
  return {
    topic: focusTopic,
    mastery: Math.round(topicPerformance[focusTopic]),
    concepts: concepts,
    focusConcept: focusConcept,
    estimatedTime: estimatedTime
  };
}

function updateFocusCard() {
  const data = JSON.parse(localStorage.getItem("progress")) || [];
  const topics = ["mathematics", "science", "language"];
  
  const focusData = determineFocusTopic(data, topics);
  currentFocusTopic = focusData.topic;
  
  // Map topic to icon
  const icons = {
    mathematics: "📚",
    science: "🔬",
    language: "📖"
  };
  
  // Format concept name (replace underscores, capitalize)
  const conceptName = focusData.focusConcept
    .replace(/_/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  
  // Map mastery to difficulty level
  let difficultyLevel = "Easy";
  if (focusData.mastery >= 70) {
    difficultyLevel = "Hard";
  } else if (focusData.mastery >= 50) {
    difficultyLevel = "Medium";
  }
  
  // Update UI
  document.getElementById("focus-icon").innerText = icons[focusData.topic];
  document.getElementById("focus-subject-name").innerText = 
    focusData.topic.charAt(0).toUpperCase() + focusData.topic.slice(1);
  document.getElementById("focus-topic-name").innerText = conceptName;
  document.getElementById("focus-time").innerText = focusData.estimatedTime;
  document.getElementById("focus-mastery").innerText = focusData.mastery + "%";
  document.getElementById("focus-difficulty").innerText = difficultyLevel;
  document.getElementById("focus-progress-fill").style.width = focusData.mastery + "%";
  
  // Update progress text
  let progressMessage = focusData.mastery + "% mastery - time to level up!";
  if (focusData.mastery >= 90) {
    progressMessage = "Excellent! Challenge yourself with harder problems!";
  } else if (focusData.mastery >= 70) {
    progressMessage = "Good progress! Keep practicing to master this topic.";
  } else if (focusData.mastery >= 50) {
    progressMessage = "Making progress! Focus on the weak areas.";
  } else if (focusData.mastery === 0) {
    progressMessage = "New topic! Let's build your foundation.";
  }
  
  document.getElementById("focus-progress-text").innerText = progressMessage;
}

function startFocusMode() {
  // Start a quiz on the focus topic
  startQuiz(currentFocusTopic, false);
}

function resumeSubject(topic) {
  showSubjectDetail(topic);
}

function goToPractice() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("topics").classList.add("active");
  const topicsBtn = document.querySelector('[data-page="topics"]');
  if (topicsBtn) topicsBtn.classList.add("active");
  updateTopicsProgress();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ===================================
// START QUIZ
// ===================================
function startQuiz(topic, isExam = false) {
  resetQuizState();
  currentTopic = topic;
  examMode = isExam;
  containerId = examMode ? "exam-container" : "practice-container";

  if (examMode) {
    examInProgress = true;
    const all = [...questions[currentTopic].easy, ...questions[currentTopic].medium, ...questions[currentTopic].hard];
    currentQuestions = shuffle(all).slice(0, 10);
  } else {
    difficulty = getAdaptiveDifficulty(topic);
    currentQuestions = questions[currentTopic][difficulty] || [];
  }

  showPreAssessmentScreen();
}

// ===================================
// PRE-ASSESSMENT SCREEN
// ===================================
function showPreAssessmentScreen() {
  // Hide landing, show prep
  document.getElementById("assessment-landing").classList.remove("active");
  document.getElementById("assessment-prep").classList.add("active");
  document.getElementById("assessment-quiz").classList.remove("active");
  document.getElementById("assessment-results").classList.remove("active");

  // Populate prep screen with quiz metadata
  const topicNames = { mathematics: "Mathematics", science: "Science", language: "Language" };
  const topicEmojis = { mathematics: "🔢", science: "🔬", language: "📚" };
  const topicMessages = {
    mathematics: "Let's practice math! Focus and do your best. You've got this!",
    science: "Get ready for science! Think carefully about each question.",
    language: "Language time! Show what you've learned. Great job so far!"
  };

  const numQuestions = currentQuestions.length;
  const timePerQuestion = examMode ? (15 * 60) : (numQuestions > 5 ? 10 : 5);
  const difficultyText = examMode ? "Mixed" : (difficulty.charAt(0).toUpperCase() + difficulty.slice(1));

  document.getElementById("prep-topic-name").innerText = topicEmojis[currentTopic] + " " + topicNames[currentTopic];
  document.getElementById("prep-questions").innerText = numQuestions;
  document.getElementById("prep-time").innerText = timePerQuestion + " min";
  document.getElementById("prep-difficulty").innerText = difficultyText;
  document.getElementById("prep-message-text").innerText = topicMessages[currentTopic] || "Focus on each question and do your best!";
}

// ===================================
// START ASSESSMENT (FROM PREP SCREEN)
// ===================================
function startAssessmentQuiz() {
  document.getElementById("assessment-landing").classList.remove("active");
  document.getElementById("assessment-prep").classList.remove("active");
  document.getElementById("assessment-quiz").classList.add("active");
  
  if (examMode) {
    startTimer(900); // 15 minutes for exam
  }
  
  renderQuestion();
}

// ===================================
// CANCEL ASSESSMENT (FROM PREP SCREEN)
// ===================================
function cancelAssessment() {
  resetQuizState();
  resetAssessmentPage();
  document.getElementById("assessment-landing").classList.add("active");
  document.getElementById("assessment-prep").classList.remove("active");
}

// ===================================
// CANCEL QUIZ (DURING ASSESSMENT)
// ===================================
function cancelQuiz() {
  if (examMode) {
    if (confirm("Are you sure you want to exit the exam? Your progress will be lost.")) {
      resetQuizState();
      examInProgress = false;
      resetAssessmentPage();
      document.getElementById("assessment-quiz").classList.remove("active");
      document.getElementById("assessment-landing").classList.add("active");
    }
  } else {
    resetQuizState();
    resetAssessmentPage();
    document.getElementById("assessment-quiz").classList.remove("active");
    document.getElementById("assessment-landing").classList.add("active");
  }
} 

// ===================================
// START EXAM
// ===================================
function startExam(topic) {
  startQuiz(topic, true);
}

// ===================================
// RESET ASSESSMENT PAGE
// ===================================
function resetAssessmentPage() {
  document.getElementById("practice-container").innerHTML = `
    <button onclick="startQuiz('mathematics', false)" class="quiz-button">Mathematics</button>
    <button onclick="startQuiz('science', false)" class="quiz-button">Science</button>
  `;
  document.getElementById("exam-container").innerHTML = `
    <button onclick="startExam('mathematics')" class="exam-button">Mathematics Exam</button>
    <button onclick="startExam('science')" class="exam-button">Science Exam</button>
  `;
}

// Helper: reset quiz state and clear timers
function resetQuizState() {
  currentQuestionIndex = 0;
  score = 0;
  answeredQuestions = [];
  weakConcepts = {};
  // do not change examMode here; caller should set it
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 0;
  }
} 

// ===================================
// TIMER (EXAM MODE)
// ===================================
function startTimer(seconds) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timeLeft = seconds;

  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${minutes}:${secs.toString().padStart(2, "0")}`;
    
    const timerEl = document.getElementById("quiz-timer");
    if (timerEl) timerEl.innerText = timeStr;
    
    // Update color as time runs low
    if (timeLeft <= 60) {
      if (timerEl) timerEl.style.color = "#ef4444";
    }
  };

  updateTimer(); // Initial update

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      showResult();
    }
  }, 1000);
} 

// ===================================
// ADAPTIVE DIFFICULTY
// ===================================
function getAdaptiveDifficulty(topic) {
  const data = getSafeStorageData("progress");
  const topicData = data.filter(d => d.topic === topic);
  if (!topicData.length) {
    console.log(`No prior data for ${topic}, starting with medium`);
    return "medium";
  }
  const sum = topicData.reduce((s, d) => s + (d.percentage || 0), 0);
  const avg = safeDivide(sum, topicData.length, 50); // Default to 50 if empty
  console.log(`Adaptive difficulty for ${topic}: avg ${avg.toFixed(1)}% -> ${avg >= 80 ? "hard" : avg < 50 ? "easy" : "medium"}`);
  if (avg >= 80) return "hard";
  if (avg < 50) return "easy";
  return "medium";
}

// ===================================
// RENDER QUESTION
// ===================================
function renderQuestion() {
  if (!currentQuestions || !currentQuestions.length) {
    document.getElementById("quiz-question").innerHTML = `<p>No questions available for this topic. Please select another topic or check back later.</p>`;
    return;
  }
  if (currentQuestionIndex >= currentQuestions.length) {
    showResult();
    return;
  }

  const q = currentQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex) / currentQuestions.length) * 100;
  
  // Update progress bar
  const progressFill = document.getElementById("quiz-progress-fill");
  if (progressFill) {
    progressFill.style.width = progressPercent + "%";
  }
  
  // Update question counter
  const counterEl = document.getElementById("quiz-question-counter");
  if (counterEl) {
    counterEl.innerText = `Question ${currentQuestionIndex + 1} of ${currentQuestions.length}`;
  }

  // Render question text
  document.getElementById("quiz-question").innerHTML = `<h3>${q.q}</h3>`;

  // Render options with child-friendly styling
  const optionsContainer = document.getElementById("quiz-options");
  optionsContainer.innerHTML = q.o.map(opt => `
    <button class="quiz-option-button" onclick="submitAnswer('${opt.replace(/'/g, "\\'")}')" data-option="${opt}">
      ${opt}
    </button>
  `).join("");
} 

// ===================================
// SUBMIT ANSWER
// ===================================
function submitAnswer(selected) {
  if (!currentQuestions || !currentQuestions.length) return;
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;

  answeredQuestions.push(q);
  if (selected === q.a) score++;
  else weakConcepts[q.c] = (weakConcepts[q.c] || 0) + 1;

  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuestions.length) {
    renderQuestion();
  } else {
    showResult();
  }
} 

// ===================================
// SHOW RESULT + SAVE
// ===================================
function showResult() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  examInProgress = false;

  const total = answeredQuestions.length;
  const percentage = total ? Math.round(safeDivide(score * 100, total, 0)) : 0;

  const record = {
    topic: currentTopic || "unknown",
    percentage: Math.max(0, Math.min(100, percentage)), // Clamp 0-100
    mode: examMode ? "exam" : "practice",
    weakAreas: Object.keys(weakConcepts || {}),
    date: normalizeDate(new Date())
  };

  const storageKey = examMode ? "exams" : "progress";
  const data = getSafeStorageData(storageKey);
  data.push(record);
  setSafeStorageData(storageKey, data);

  console.log(`${examMode ? "Exam" : "Quiz"} result saved:`, record);

  // Show results screen with new design
  document.getElementById("assessment-quiz").classList.remove("active");
  document.getElementById("assessment-results").classList.add("active");

  // Determine emoji and title based on score
  let emoji = "🎉";
  let title = "Excellent Work!";
  if (percentage >= 80) {
    emoji = "🎉";
    title = "Excellent Work!";
  } else if (percentage >= 60) {
    emoji = "👏";
    title = "Great Effort!";
  } else if (percentage >= 40) {
    emoji = "💪";
    title = "Keep Going!";
  } else {
    emoji = "📚";
    title = "Let's Keep Learning!";
  }

  document.getElementById("results-emoji").innerText = emoji;
  document.getElementById("results-title").innerText = title;
  document.getElementById("results-percentage").innerText = percentage + "%";
  document.getElementById("results-score-text").innerText = `You got ${score} out of ${total} questions correct!`;

  // Calculate mastery change
  const prevData = JSON.parse(localStorage.getItem("progress")) || [];
  const prevTopicData = prevData.slice(0, -1).filter(d => d.topic === currentTopic);
  let masteryChange = "📈";
  if (prevTopicData.length > 0) {
    const prevAvg = prevTopicData.reduce((s, d) => s + d.percentage, 0) / prevTopicData.length;
    if (percentage > prevAvg) {
      masteryChange = "📈 Great improvement!";
    } else if (percentage < prevAvg) {
      masteryChange = "📉 Let's aim higher next time!";
    } else {
      masteryChange = "➡️ Consistent performance!";
    }
  } else {
    masteryChange = "✨ Great first attempt!";
  }
  document.getElementById("results-mastery-change").innerText = masteryChange;
  document.getElementById("results-mastery-change").classList.remove("negative");
  if (masteryChange.includes("📉")) {
    document.getElementById("results-mastery-change").classList.add("negative");
  }

  // Populate strengths (concepts with 100% correct rate)
  const conceptScores = {};
  answeredQuestions.forEach(q => {
    if (!conceptScores[q.c]) {
      conceptScores[q.c] = { total: 0, correct: 0 };
    }
    conceptScores[q.c].total++;
    if (!weakConcepts[q.c] || weakConcepts[q.c] === 0) {
      conceptScores[q.c].correct++;
    }
  });

  const strengths = Object.keys(conceptScores).filter(c => 
    conceptScores[c].correct === conceptScores[c].total && conceptScores[c].total > 0
  );
  
  const strengthsHtml = strengths.length > 0 
    ? strengths.map(c => `<p class="feedback-item-placeholder">✅ ${c.charAt(0).toUpperCase() + c.slice(1)}</p>`).join("")
    : `<p class="feedback-item-placeholder">You're learning! Keep practicing.</p>`;
  document.getElementById("results-strengths").innerHTML = strengthsHtml;

  // Populate improvements (concepts from weakConcepts)
  const improvements = Object.keys(weakConcepts).sort((a, b) => 
    weakConcepts[b] - weakConcepts[a]
  ).slice(0, 3);
  
  const improvementsHtml = improvements.length > 0
    ? improvements.map(c => `<p class="feedback-item-placeholder">📌 Focus on ${c}</p>`).join("")
    : `<p class="feedback-item-placeholder">Great! No weak areas detected.</p>`;
  document.getElementById("results-improvements").innerHTML = improvementsHtml;
} 

// ===================================
// AI RECOMMENDATION ENGINE
// ===================================
function generateRecommendation() {
  const data = JSON.parse(localStorage.getItem("progress")) || [];
  const last = data[data.length - 1];

  if (!last) {
    const rec = { title: "Start Learning", reason: "Begin with any topic to get recommendations." };
    console.log("Recommendation:", rec);
    return rec;
  }

  // Prioritize weak areas
  if (last.weakAreas.length) {
    const rec = {
      title: `Target Weak Concepts in ${last.topic}`,
      reason: `Focus on: ${last.weakAreas.join(", ")}`
    };
    console.log("Recommendation:", rec);
    return rec;
  }

  if (last.percentage < 50) {
    const rec = {
      title: `Revise ${last.topic}`,
      reason: "Performance is below mastery. Focus on fundamentals before progressing."
    };
    console.log("Recommendation:", rec);
    return rec;
  }

  if (last.percentage < 80) {
    const rec = {
      title: `Advance in ${last.topic}`,
      reason: "You are improving. Attempt higher difficulty questions."
    };
    console.log("Recommendation:", rec);
    return rec;
  }

  const nextTopic = last.topic === "mathematics" ? "science" : "mathematics";
  const rec = {
    title: `Start ${nextTopic}`,
    reason: "You have demonstrated mastery. Move to the next topic."
  };
  console.log("Recommendation:", rec);
  return rec;
}

// ===================================
// POST-ASSESSMENT NAVIGATION
// ===================================
function recommendNextAction(action) {
  if (action === "retry") {
    // Restart same topic quiz
    startQuiz(currentTopic, examMode);
  } else if (action === "next") {
    // Go to topics page to choose next topic
    returnToAssessment();
    document.getElementById("topics").classList.add("active");
    document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
    document.querySelector("[data-page='topics']").classList.add("active");
  }
}

function returnToAssessment() {
  resetQuizState();
  resetAssessmentPage();
  document.getElementById("assessment-landing").classList.add("active");
  document.getElementById("assessment-prep").classList.remove("active");
  document.getElementById("assessment-quiz").classList.remove("active");
  document.getElementById("assessment-results").classList.remove("active");
}

// ===================================
// ANALYTICS VIEW
// ===================================
function renderProgress() {
  const practiceData = getSafeStorageData("progress");
  const examData = getSafeStorageData("exams");
  const data = [...practiceData, ...examData];
  renderMastery(practiceData); // Mastery based on practice only
  renderCharts(practiceData); // Charts based on practice
  renderTimeline(data); // Timeline includes all
}

// ===================================
// RENDER MASTERY OVERVIEW
// ===================================
function renderMastery(data) {
  const content = document.getElementById("mastery-content");

  if (!data || !Array.isArray(data) || !data.length) {
    content.innerHTML = "<p>No learning data yet.</p>";
    return;
  }

  const byTopic = {};
  data.forEach(d => {
    if (d && d.topic) {
      byTopic[d.topic] = byTopic[d.topic] || [];
      byTopic[d.topic].push(d.percentage || 0);
    }
  });

  let html = "";
  for (let topic in byTopic) {
    const avg = Math.round(safeAverage(byTopic[topic]));
    const level = avg >= 80 ? "Mastery" : avg >= 50 ? "Intermediate" : "Beginner";
    const color = avg >= 80 ? "#10b981" : avg >= 50 ? "#f59e0b" : "#ef4444";
    html += `
      <div class="mastery-item">
        <div class="mastery-topic">${topic.charAt(0).toUpperCase() + topic.slice(1)}</div>
        <div class="mastery-level" style="color: ${color};">${level}</div>
        <div class="mastery-bar">
          <div class="mastery-fill" style="width: ${Math.max(0, Math.min(100, avg))}%; background-color: ${color};"></div>
        </div>
        <div class="mastery-score">${avg}%</div>
      </div>
    `;
  }

  content.innerHTML = html || "<p>No learning data yet.</p>";
}

// ===================================
// RENDER CHARTS
// ===================================
function renderCharts(data) {
  if (!data || !Array.isArray(data) || !data.length) return;

  // Destroy existing charts BEFORE creating new ones (prevent memory leaks)
  try {
    if (progressionChart && typeof progressionChart.destroy === 'function') { 
      progressionChart.destroy(); 
      progressionChart = null; 
    }
    if (averageChart && typeof averageChart.destroy === 'function') { 
      averageChart.destroy(); 
      averageChart = null; 
    }
  } catch (e) {
    console.warn("Error destroying charts:", e);
    progressionChart = null;
    averageChart = null;
  }

  try {
    // Sort data by date safely
    data.sort((a, b) => {
      try {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } catch (e) {
        return 0;
      }
    });

    // Progression Chart (Line)
    const progEl = document.getElementById('progression-chart');
    const topics = [...new Set(data.map(d => d.topic).filter(t => t))];
    const allDates = [...new Set(data.map(d => d.date).filter(d => d))].sort((a, b) => {
      try {
        return new Date(a) - new Date(b);
      } catch (e) {
        return 0;
      }
    });
    
    const datasets = topics.map(topic => {
      const topicData = data.filter(d => d.topic === topic);
      const scores = allDates.map(date => {
        const entry = topicData.find(d => d.date === date);
        return entry ? Math.max(0, Math.min(100, entry.percentage || 0)) : null;
      });
      return {
        label: topic.charAt(0).toUpperCase() + topic.slice(1),
        data: scores,
        borderColor: topic === 'mathematics' ? '#3b82f6' : '#10b981',
        backgroundColor: 'transparent',
        tension: 0.1,
        spanGaps: true
      };
    });

    if (progEl && progEl.getContext) {
      const progressionCtx = progEl.getContext('2d');
      if (progressionCtx) {
        progressionChart = new Chart(progressionCtx, {
          type: 'line',
          data: { labels: allDates, datasets },
          options: {
        responsive: true,
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: true } }
      }
        });
      }
    }

    // Average Chart (Bar)
    const avgEl = document.getElementById('average-chart');
    const averages = topics.map(topic => {
      const topicData = data.filter(d => d.topic === topic);
      const sum = topicData.reduce((sum, d) => sum + (d.percentage || 0), 0);
      const avg = Math.round(safeDivide(sum, topicData.length, 0));
      return Math.max(0, Math.min(100, avg));
    });

    if (avgEl && avgEl.getContext) {
      const averageCtx = avgEl.getContext('2d');
      if (averageCtx) {
        averageChart = new Chart(averageCtx, {
          type: 'bar',
          data: {
            labels: topics.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
              label: 'Average Score (%)',
              data: averages,
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  } catch (e) {
    console.warn("Error rendering charts:", e);
  }
} 

// ===================================
// RENDER TIMELINE
// ===================================
function renderTimeline(data) {
  const content = document.getElementById("timeline-content");

  if (!data.length) {
    content.innerHTML = "<p>No assessment history yet.</p>";
    return;
  }

  // Sort by date descending
  data.sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = "";
  data.forEach(d => {
    const mode = d.mode || "practice";
    const modeLabel = mode === "exam" ? "Exam" : "Practice";
    const difficulty = d.difficulty ? ` (${d.difficulty})` : "";
    html += `
      <div class="timeline-item">
        <div class="timeline-date">${d.date}</div>
        <div class="timeline-details">
          <strong>${d.topic.charAt(0).toUpperCase() + d.topic.slice(1)} ${modeLabel}</strong>${difficulty}: ${d.percentage}%
        </div>
      </div>
    `;
  });

  content.innerHTML = html;
}
