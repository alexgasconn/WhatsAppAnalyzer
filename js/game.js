// TRIVIA GAME - "¿Quién dijo esto?"

// Game state variable
let gameState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    started: false
};

/**
 * Initializes the "Who Said This?" game with questions from chat data.
 */
function initializeGame(data) {
    const userCounts = {};
    data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
    const users = Object.keys(userCounts);

    // Filter users with at least 5 messages
    const eligibleUsers = users.filter(user => userCounts[user] >= 5);

    if (eligibleUsers.length < 2) {
        document.getElementById('game').innerHTML = `
      <div class="game-container">
        <div class="game-unavailable">
          <h3>🎮 Juego No Disponible</h3>
          <p>Se necesitan al menos 2 usuarios con 5+ mensajes para jugar.</p>
          <p>Carga un chat con más participantes activos.</p>
        </div>
      </div>
    `;
        return;
    }

    // Generate questions
    const questions = [];
    const numberOfQuestions = Math.min(10, Math.floor(data.length / 3));

    for (let i = 0; i < numberOfQuestions; i++) {
        let sample = null;
        let attempts = 0;

        // Find a suitable message
        while (!sample && attempts < 100) {
            const randomIdx = Math.floor(Math.random() * data.length);
            const candidate = data[randomIdx];

            if (
                eligibleUsers.includes(candidate.user) &&
                candidate.message.length >= 10 &&
                candidate.message.length <= 120
            ) {
                sample = candidate;
            }
            attempts++;
        }

        if (!sample) continue;

        const correctUser = sample.user;
        let otherUsers = eligibleUsers.filter(u => u !== correctUser);
        otherUsers = shuffle(otherUsers);

        const numOptions = Math.min(3, eligibleUsers.length);
        const incorrectOptions = otherUsers.slice(0, numOptions - 1);
        const options = shuffle([correctUser, ...incorrectOptions]);

        questions.push({
            message: sample.message,
            correct: correctUser,
            options: options
        });
    }

    gameState = {
        questions: questions,
        currentQuestion: 0,
        score: 0,
        started: true
    };

    renderGameScreen();
}

/**
 * Renders the game UI
 */
function renderGameScreen() {
    const container = document.getElementById('game');
    if (!container) return;

    if (!gameState.started || gameState.questions.length === 0) {
        container.innerHTML = `
      <div class="game-container">
        <div class="game-start">
          <h2>🎮 ¿Quién Dijo Esto?</h2>
          <p>Adivina quién escribió cada mensaje en el chat.</p>
          <button class="game-start-btn" onclick="initializeGame(globalData)">
            🎯 Jugar Ahora
          </button>
        </div>
      </div>
    `;
        return;
    }

    const q = gameState.questions[gameState.currentQuestion];

    if (!q) {
        // Game over
        const accuracy = ((gameState.score / gameState.questions.length) * 100).toFixed(1);
        let emoji = '😔';
        if (accuracy >= 80) emoji = '🏆';
        else if (accuracy >= 60) emoji = '👍';
        else if (accuracy >= 40) emoji = '😐';

        container.innerHTML = `
      <div class="game-container">
        <div class="game-over">
          <h2 class="game-over-title">${emoji} ¡Juego Terminado!</h2>
          <div class="game-stats">
            <div class="stat-box">
              <div class="stat-label">Puntuación</div>
              <div class="stat-big">${gameState.score}/${gameState.questions.length}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Precisión</div>
              <div class="stat-big">${accuracy}%</div>
            </div>
          </div>
          <button class="game-start-btn" onclick="initializeGame(globalData)" style="margin-top: 20px;">
            🔄 Jugar de Nuevo
          </button>
        </div>
      </div>
    `;
        gameState.started = false;
        return;
    }

    const progress = ((gameState.currentQuestion / gameState.questions.length) * 100).toFixed(0);

    let html = `
    <div class="game-container">
      <div class="game-header">
        <h2>🎮 ¿Quién Dijo Esto?</h2>
        <div class="game-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
          <div class="progress-text">Pregunta ${gameState.currentQuestion + 1} de ${gameState.questions.length}</div>
        </div>
      </div>

      <div class="game-question">
        <p class="question-message">"${q.message}"</p>
      </div>

      <div class="game-options">
  `;

    q.options.forEach((opt, idx) => {
        html += `
      <button class="game-option" onclick="answerGame('${opt}')">
        <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
        <span class="option-text">${opt}</span>
      </button>
    `;
    });

    html += `
      </div>

      <div class="game-footer">
        <div class="score-display">
          <span>Puntos:</span>
          <strong>${gameState.score}</strong>
        </div>
      </div>
    </div>
  `;

    container.innerHTML = html;
}

/**
 * Processes the user's answer
 */
function answerGame(selected) {
    const q = gameState.questions[gameState.currentQuestion];
    const buttons = document.querySelectorAll('#game .game-option');
    const isCorrect = selected === q.correct;

    buttons.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent.includes(q.correct)) {
            btn.classList.add('game-correct');
        }
        if (btn.textContent.includes(selected) && !isCorrect) {
            btn.classList.add('game-incorrect');
        }
    });

    if (isCorrect) {
        gameState.score++;
    }

    // Show feedback and proceed
    setTimeout(() => {
        gameState.currentQuestion++;
        renderGameScreen();
    }, 1500);
}