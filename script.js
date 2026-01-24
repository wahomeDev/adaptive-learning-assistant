/* =================================================
   NAVIGATION LOGIC
   ================================================= */
const navButtons = document.querySelectorAll(".nav button");
const pages = document.querySelectorAll(".page");

function showPage(pageId) {
  pages.forEach(page => page.classList.remove("active"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    const pageId = button.getAttribute("data-page");
    showPage(pageId);
  });
});

/* =================================================
   QUIZ DATA (SERIOUS STRUCTURE)
   ================================================= */
const quizData = {
  mathematics: {
    easy: [
      {
        id: 1,
        question: "What is 5 × 6?",
        options: ["11", "30", "20", "56"],
        correct: 1,
        concept: "multiplication"
      },
      {
        id: 2,
        question: "12 ÷ 3 equals?",
        options: ["6", "4", "9", "3"],
        correct: 1,
        concept: "division"
      }
    ],
    medium: [
      {
        id: 3,
        question: "What is 15% of 200?",
        options: ["20", "25", "30", "35"],
        correct: 2,
        concept: "percentages"
      }
    ],
    hard: [
      {
        id: 4,
        question: "Solve: 2x + 5 = 15",
        options: ["3", "5", "10", "15"],
        correct: 1,
        concept: "algebra"
      }
    ]
  },

  science: {
    easy: [
      {
        id: 5,
        question: "Which part of a plant makes food?",
        options: ["Root", "Stem", "Leaf", "Flower"],
        correct: 2,
        concept: "photosynthesis"
      }
    ],
    medium: [
      {
        id: 6,
        question: "Which gas is required for photosynthesis?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correct: 2,
        concept: "photosynthesis"
      }
    ],
    hard: [
      {
        id: 7,
        question: "Which organelle contains chlorophyll?",
        options: ["Nucleus", "Mitochondria", "Chloroplast", "Ribosome"],
        correct: 2,
        concept: "cell biology"
      }
    ]
  }
};

/* =================================================
   QUIZ STATE
   ================================================= */
let currentTopic = "";
let currentDifficulty = "easy";
let currentQuestionIndex = 0;
let score = 0;
let answeredQuestions = [];
let weakConcepts = {};

/* =================================================
   QUIZ ENGINE
   ================================================= */
function startQuiz(topic) {
  currentTopic = topic;
  currentDifficulty = "easy";
  currentQuestionIndex = 0;
  score = 0;
  answeredQuestions = [];
  weakConcepts = {};
  showQuestion();
}

function getCurrentQuestions() {
  return quizData[currentTopic][currentDifficulty];
}

function showQuestion() {
  const quizContainer = document.getElementById("quiz-container");
  const questions = getCurrentQuestions();
  const question = questions[currentQuestionIndex];

  quizContainer.innerHTML = `
    <p><strong>Difficulty:</strong> ${currentDifficulty.toUpperCase()}</p>
    <p>${question.question}</p>
    ${question.options
      .map(
        (option, index) =>
          `<button onclick="checkAnswer(${index})">${option}</button>`
      )
      .join("")}
  `;
}

function checkAnswer(selectedIndex) {
  const questions = getCurrentQuestions();
  const question = questions[currentQuestionIndex];

  if (selectedIndex === question.correct) {
    score++;
  } else {
    weakConcepts[question.concept] =
      (weakConcepts[question.concept] || 0) + 1;
  }

  answeredQuestions.push(question.id);
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    advanceDifficultyOrFinish();
  }
}

function advanceDifficultyOrFinish() {
  if (currentDifficulty === "easy") {
    currentDifficulty = "medium";
    currentQuestionIndex = 0;
    showQuestion();
  } else if (currentDifficulty === "medium") {
    currentDifficulty = "hard";
    currentQuestionIndex = 0;
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const quizContainer = document.getElementById("quiz-container");
  const total = answeredQuestions.length;
  const percentage = Math.round((score / total) * 100);

  const weaknesses =
    Object.keys(weakConcepts).length > 0
      ? Object.keys(weakConcepts).join(", ")
      : "None detected";

  quizContainer.innerHTML = `
    <h3>Assessment Result</h3>
    <p>Score: ${score} / ${total} (${percentage}%)</p>
    <p><strong>Weak Areas:</strong> ${weaknesses}</p>
    <button onclick="startQuiz('${currentTopic}')">Reattempt Assessment</button>
  `;
}
