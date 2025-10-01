// Game state is now managed in main.js, but game-specific functions are here.

/**
 * Initializes the "Who Said This?" game with questions from chat data.
 * @param {Array} data The parsed chat data.
 */
function initializeGame(data) {
    const userCounts = {};
    data.forEach(d => userCounts[d.user] = (userCounts[d.user] || 0) + 1);
    const users = Object.keys(userCounts);

    // Filter out users with very few messages if necessary to avoid trivial questions
    const eligibleUsers = users.filter(user => userCounts[user] > 5); // Example: user must have > 5 messages
    if (eligibleUsers.length < 2) {
        document.getElementById('game').innerHTML =
            `<div class="game-container"><h3>Game Unavailable</h3><p>Not enough unique active users for a game. Try a chat with more participants!</p></div>`;
        return;
    }

    const questions = [];
    const numberOfQuestions = 5; // You can adjust this

    for (let i = 0; i < numberOfQuestions; i++) {
        // Select a message from an eligible user
        let sample = null;
        let attempts = 0;
        while (!sample && attempts < 100) { // Prevent infinite loop if no good messages
            const randomMessageIndex = Math.floor(Math.random() * data.length);
            const candidateMessage = data[randomMessageIndex];
            // Ensure the message is by an eligible user and not too short (e.g., just an emoji or "ok")
            if (
                eligibleUsers.includes(candidateMessage.user) &&
                candidateMessage.message.length >= 10 &&
                candidateMessage.message.length <= 100
            ) {
                sample = candidateMessage;
            }

            attempts++;
        }

        if (!sample) {
            // Fallback if no suitable messages are found after many attempts
            console.warn("Could not find a suitable message for a game question.");
            continue;
        }

        const correctUser = sample.user;

        // Generate incorrect options
        let otherUsers = eligibleUsers.filter(u => u !== correctUser);
        otherUsers = shuffle(otherUsers); // Shuffle to get random incorrect options
        const incorrectOptions = otherUsers.slice(0, 2); // Take 2 incorrect options

        // Combine correct and incorrect, then shuffle all options
        const options = shuffle([...incorrectOptions, correctUser]);

        questions.push({
            message: sample.message,
            correct: correctUser,
            options: options
        });
    }

    gameState.questions = questions;
    gameState.currentQuestion = 0;
    gameState.score = 0;
    renderGame();
}

/**
 * Renders the current game question or the game over screen.
 */
function renderGame() {
    const q = gameState.questions[gameState.currentQuestion];
    if (!q) {
        document.getElementById('game').innerHTML =
            `<div class="game-container">
         <h3>Game Over!</h3>
         <div class="game-score">Final Score: ${gameState.score}/${gameState.questions.length}</div>
         <div class="game-controls">
           <button class="game-btn" onclick="initializeGame(globalData)">Play Again</button>
         </div>
       </div>`;
        return;
    }

    let html = `<div class="game-container">
    <h3>Who said this? (Question ${gameState.currentQuestion + 1} of ${gameState.questions.length})</h3>
    <div class="game-message">"${q.message}"</div>
    <div class="game-options">`;

    q.options.forEach(opt => {
        html += `<button class="game-btn" onclick="answerGame('${opt}')">${opt}</button>`;
    });

    html += `</div><div class="game-score">Current Score: ${gameState.score}</div></div>`;
    document.getElementById('game').innerHTML = html;
}

/**
 * Processes the user's answer for the current game question.
 * @param {string} selected The user's selected option.
 */
function answerGame(selected) {
    const q = gameState.questions[gameState.currentQuestion];
    const buttons = document.querySelectorAll('#game .game-btn'); // Target buttons within the game tab
    buttons.forEach(btn => {
        if (btn.textContent === q.correct) btn.classList.add('correct');
        if (btn.textContent === selected && selected !== q.correct) btn.classList.add('incorrect');
        btn.disabled = true; // Disable all buttons after an answer
    });

    if (selected === q.correct) {
        gameState.score++;
    }

    // Move to the next question after a short delay
    setTimeout(() => {
        gameState.currentQuestion++;
        renderGame();
    }, 1500); // 1.5 second delay
}