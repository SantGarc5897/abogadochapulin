document.addEventListener('DOMContentLoaded', function() {

    // --- Elementos del DOM ---
    const gameContainer = document.getElementById('game-container');
    const character = document.getElementById('character');
    const powerUpMessage = document.getElementById('power-up-message'); // Renombrado a powerUpMessage
    const scoreDisplay = document.getElementById('score');
    const moneyDisplay = document.getElementById('money-count');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const scoreList = document.getElementById('score-list');
    const levelUpScreen = document.getElementById('level-up-screen');
    const continueButton = document.getElementById('continue-button');
    const winScreen = document.getElementById('win-screen');
    const playAgainButton = document.getElementById('play-again-button');
    const startGameButton = document.getElementById('start-game-button');

    // --- Configuración del Juego ---
    const gravity = 0.5;
    const jumpStrength = 12;
    const maxJumps = 2;
    const POWER_UP_DURATION = 15000;
    const BASE_SPEED_INCREASE = 0.5;
    const MONEY_FOR_POWER_UP = 5;

    // --- Variables de Estado del Juego ---
    let characterY = 0, characterVelocityY = 0;
    let score = 0, moneyCollected = 0;
    let gameSpeed = 5, jumpCount = 0;
    let isGameRunning = false;
    let obstacles = [], collectibles = [], powerUps = [];
    let clickCountForExit = 0, clickTimer = null;
    let currentLevel = 1, scoreNeededForNextLevel = 900;
    let isPoweredUp = false, powerUpTimer = null;
    let moneySinceLastPowerUp = 0, totalScoreAcrossLevels = 0;

    // --- Lógica del Juego ---
    function gameLoop() {
        if (!isGameRunning) return;
        characterVelocityY -= gravity;
        characterY += characterVelocityY;
        if (characterY < 0) { characterY = 0; characterVelocityY = 0; jumpCount = 0; }
        character.style.bottom = `${characterY}px`;
        if (characterY > 0 && !character.classList.contains('jumping')) { character.classList.remove('running'); character.classList.add('jumping'); } 
        else if (characterY === 0 && !character.classList.contains('running') && !character.classList.contains('hit')) { character.classList.remove('jumping'); character.classList.add('running'); }
        moveGameElements(obstacles);
        moveGameElements(collectibles);
        moveGameElements(powerUps);
        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    function moveGameElements(elements) {
        const gameWidth = gameContainer.offsetWidth;
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            let currentRight = parseFloat(element.style.right);
            currentRight += gameSpeed;
            element.style.right = `${currentRight}px`;
            if (currentRight > gameWidth) { element.remove(); elements.splice(i, 1); }
        }
    }

    function createItem(type) {
        if (!isGameRunning) return;
        const item = document.createElement('div');
        item.classList.add(type);

        let itemHeight, initialRight;
        if (type === 'obstacle') { itemHeight = 60; initialRight = '-80px'; } 
        else if (type === 'collectible') { itemHeight = 60; initialRight = '-70px'; }
        else { itemHeight = 50; initialRight = '-60px'; }
        
        item.style.right = initialRight;

        const lane = Math.floor(Math.random() * 3);
        const gameHeight = gameContainer.offsetHeight;
        switch (lane) {
            case 0: item.style.bottom = '10px'; break;
            case 1: item.style.bottom = `${(gameHeight / 2) - (itemHeight / 2)}px`; break;
            case 2: item.style.bottom = `${gameHeight - itemHeight - 10}px`; break;
        }
        
        gameContainer.appendChild(item);
        if (type === 'obstacle') obstacles.push(item);
        else if (type === 'collectible') collectibles.push(item);
        else if (type === 'power-up') powerUps.push(item);
    }

    function checkCollisions() {
        const charRect = character.getBoundingClientRect();
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (isColliding(charRect, obstacles[i].getBoundingClientRect())) {
                if (isPoweredUp) { destroyObstacle(obstacles[i], i); } 
                else { character.classList.add('hit'); endGame(); return; }
            }
        }
        for (let i = collectibles.length - 1; i >= 0; i--) {
            if (isColliding(charRect, collectibles[i].getBoundingClientRect())) {
                score += 50;
                moneyCollected++;
                moneySinceLastPowerUp++;
                scoreDisplay.textContent = score;
                moneyDisplay.textContent = moneyCollected;
                if (moneySinceLastPowerUp >= MONEY_FOR_POWER_UP) { createItem('power-up'); moneySinceLastPowerUp = 0; }
                collectibles[i].remove();
                collectibles.splice(i, 1);
            }
        }
        for (let i = powerUps.length - 1; i >= 0; i--) {
            if (isColliding(charRect, powerUps[i].getBoundingClientRect())) {
                activatePowerUp();
                powerUps[i].remove();
                powerUps.splice(i, 1);
            }
        }
    }

    function destroyObstacle(obstacle, index) {
        obstacle.classList.add('broken');
        obstacles.splice(index, 1);
        setTimeout(() => { if(obstacle) obstacle.remove(); }, 500);
    }

    function isColliding(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }

    function activatePowerUp() {
        isPoweredUp = true;
        character.classList.add('giant');
        powerUpMessage.classList.remove('hidden'); // Muestra el mensaje central
        clearTimeout(powerUpTimer);
        powerUpTimer = setTimeout(deactivatePowerUp, POWER_UP_DURATION);
    }

    function deactivatePowerUp() {
        isPoweredUp = false;
        character.classList.remove('giant');
        powerUpMessage.classList.add('hidden'); // Oculta el mensaje central
    }

    function updateScore() {
        if (!isGameRunning) return;
        score++;
        scoreDisplay.textContent = score;
        if (score >= scoreNeededForNextLevel) {
            currentLevel >= 4 ? winGame() : levelUp();
        }
    }

    function levelUp() {
        isGameRunning = false;
        if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
        if (isPoweredUp) deactivatePowerUp();
        totalScoreAcrossLevels += score;
        currentLevel++;
        scoreNeededForNextLevel = 900 * currentLevel;
        score = 0;
        scoreDisplay.textContent = score;
        document.getElementById('level-up-title').textContent = 'Le ganaste a la justicia';
        document.getElementById('level-up-message').textContent = `¡Vamos por el Nivel ${currentLevel}!`;
        levelUpScreen.style.display = 'flex';
    }

    function continueGame() {
        levelUpScreen.style.display = 'none';
        isGameRunning = true;
        resumeGameIntervals();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        currentLevel = 1; scoreNeededForNextLevel = 900;
        score = 0; moneyCollected = 0; totalScoreAcrossLevels = 0;
        characterY = 0; characterVelocityY = 0;
        gameSpeed = 5; jumpCount = 0;
        isPoweredUp = false; moneySinceLastPowerUp = 0;
        clearTimeout(powerUpTimer);
        character.className = 'running';
        powerUpMessage.classList.add('hidden'); // Asegura que el mensaje esté oculto al empezar
        scoreDisplay.textContent = 0; moneyDisplay.textContent = 0;
        [...obstacles, ...collectibles, ...powerUps].forEach(el => el.remove());
        obstacles = []; collectibles = []; powerUps = [];
        startScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; winScreen.style.display = 'none';
        isGameRunning = true;
        resumeGameIntervals();
        requestAnimationFrame(gameLoop);
    }

    function resumeGameIntervals() {
        if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
        const speedIncreaseRate = BASE_SPEED_INCREASE * currentLevel;
        const obstacleInterval = setInterval(() => createItem('obstacle'), 2000);
        const collectibleInterval = setInterval(() => createItem('collectible'), 3500);
        const scoreInterval = setInterval(updateScore, 100);
        const speedIncreaseInterval = setInterval(() => { if (isGameRunning) gameSpeed += speedIncreaseRate; }, 2000);
        window.gameIntervals = [obstacleInterval, collectibleInterval, scoreInterval, speedIncreaseInterval];
    }

    function endGame() {
        if (!isGameRunning) return;
        isGameRunning = false;
        deactivatePowerUp();
        if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
        const finalScore = totalScoreAcrossLevels + score;
        finalScoreDisplay.textContent = finalScore;
        saveScoreToSession(finalScore, moneyCollected);
        displayLeaderboard();
        gameOverScreen.style.display = 'flex';
    }

    function winGame() {
        if (!isGameRunning) return;
        isGameRunning = false;
        deactivatePowerUp();
        if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
        winScreen.style.display = 'flex';
    }

    function returnToStartScreen() {
        gameOverScreen.style.display = 'none';
        winScreen.style.display = 'none';
        startScreen.style.display = 'flex';
    }

    function saveScoreToSession(points, money) {
        const highScores = JSON.parse(sessionStorage.getItem('highScores')) || [];
        highScores.push({ points, money });
        highScores.sort((a, b) => b.points - a.points);
        sessionStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 5)));
    }

    function displayLeaderboard() {
        const highScores = JSON.parse(sessionStorage.getItem('highScores')) || [];
        scoreList.innerHTML = highScores.length ? highScores.map(s => `<li>Puntos: ${s.points} - 💰: ${s.money}</li>`).join('') : '<li>Aún no hay puntuaciones.</li>';
    }

    function performJump() { if (isGameRunning && jumpCount < maxJumps) { characterVelocityY = jumpStrength; jumpCount++; } }

    function handleKeyPress(e) { if (e.code === 'Space' && isGameRunning) { e.preventDefault(); performJump(); } }

    function handleScreenInteraction(e) {
        if (isGameRunning) {
            e.preventDefault();
            clickCountForExit++;
            if (clickCountForExit === 1) { clickTimer = setTimeout(() => { clickCountForExit = 0; }, 400); } 
            else if (clickCountForExit === 3) { clearTimeout(clickTimer); clickCountForExit = 0; endGame(); return; }
            performJump();
        }
    }

    // --- Event Listeners ---
    document.addEventListener('keydown', handleKeyPress);
    gameContainer.addEventListener('mousedown', handleScreenInteraction);
    gameContainer.addEventListener('touchstart', handleScreenInteraction, { passive: false });
    startGameButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', returnToStartScreen);
    playAgainButton.addEventListener('click', returnToStartScreen);
    continueButton.addEventListener('click', continueGame);
    startScreen.style.display = 'flex';

});