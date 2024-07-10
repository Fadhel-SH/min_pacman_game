/*-------------------------------- Constants --------------------------------*/
const canvas = document.getElementById('game-canvas'); // Get the canvas element
const ctx = canvas.getContext('2d'); // Get the 2D rendering context
const canvasWidth = canvas.width; // Store canvas width
const canvasHeight = canvas.height; // Store canvas height
const initialGameSpeed = 5; // Initial game speed
const gameSpeedIncreaseFactor = 2; // Speed increase factor per level
const gameSpeedMax = 80; // Maximum game speed

const gameTimeLimit = 60; // Set to 60 seconds for game time
const levelUpExtraTime = 30; // Extra time added per level, max 60 seconds
const ghostFleeDuration = 3000; // Duration ghosts flee after catching Pac-Man (in ms)

/*---------------------------- Variables (state) ----------------------------*/
const game = {
    score: 0,
    speed: initialGameSpeed,
    level: 1,
    lives: 3,
    gameOver: false,
    paused: false
};

let pacManX = 200; // Initial X position of Pac-Man
let pacManY = 200; // Initial Y position of Pac-Man
let pacManSpeed = 10; // Initial speed of Pac-Man
let pacManDirection = 'right'; // Initial direction of Pac-Man

let pellets = []; // Array to store pellets
const pelletsCount = 50; // Number of pellets

let bombs = []; // Array to store bombs
const bombsCount = 5; // Number of bombs

let livesPellets = []; // Array to store lives pellets
const livesPelletsCount = 5; // Number of lives pellets

let ghosts = []; // Array to store ghosts
const ghostsCount = 3; // Number of ghosts
const ghostSpeed = 2; // Speed of ghosts

let gameTimeLeft = gameTimeLimit; // Remaining game time
let gameTimerInterval; // Interval ID for game timer

/*------------------------ Cached Element References ------------------------*/
const scoreElement = document.getElementById('score'); // Reference to score display element
const levelElement = document.getElementById('level'); // Reference to level display element
const livesElement = document.getElementById('lives'); // Reference to lives display element
const speedElement = document.getElementById('speed'); // Reference to speed display element
const gameOverText = document.getElementById('gameOver'); // Reference to game over text element
const timeLeftElement = document.getElementById('timeLeft'); // Reference to time left display element

// Sound effects
const pelletSound = new Audio('sounds/eat.mp3');
const bombSound = new Audio('sounds/boom.mp3');
const lifeSound = new Audio('sounds/life.mp3');
const levelUpSound = new Audio('sounds/level_up.mp3');
const gameOverSound = new Audio('sounds/game_over.mp3');
const ghostSound = new Audio('sounds/ghost.mp3');

/*-------------------------------- Event Listeners --------------------------------*/


/*-------------------------------- Functions --------------------------------*/

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowRight':
            pacManDirection = 'right';
            break;
        case 'ArrowLeft':
            pacManDirection = 'left';
            break;
        case 'ArrowUp':
            pacManDirection = 'up';
            break;
        case 'ArrowDown':
            pacManDirection = 'down';
            break;
        case 'p':
            game.paused = !game.paused;
            break;
        case 'r':
            initGame();
            break;
    }
});


// Main game loop
function gameLoop() {
    if (!game.paused && !game.gameOver) {
        updateGame();
        drawGame();
    }
    requestAnimationFrame(gameLoop);
}

// Draw the game
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Pac-Man
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(pacManX, pacManY, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Draw the pellets
    ctx.fillStyle = 'green';
    for (let pellet of pellets) {
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw the bombs
    ctx.fillStyle = 'red';
    for (let bomb of bombs) {
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw the lives pellets
    ctx.fillStyle = 'blue';
    for (let livesPellet of livesPellets) {
        ctx.beginPath();
        ctx.moveTo(livesPellet.x, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x - 5, livesPellet.y - 15, livesPellet.x - 15, livesPellet.y - 15, livesPellet.x - 20, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x - 25, livesPellet.y - 2, livesPellet.x - 20, livesPellet.y + 8, livesPellet.x, livesPellet.y + 10);
        ctx.bezierCurveTo(livesPellet.x + 20, livesPellet.y + 8, livesPellet.x + 25, livesPellet.y - 2, livesPellet.x + 20, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x + 15, livesPellet.y - 15, livesPellet.x + 5, livesPellet.y - 15, livesPellet.x, livesPellet.y - 8);
        ctx.fill();
    }

    // Draw the ghosts
    ctx.fillStyle = 'purple';
    for (let ghost of ghosts) {
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 15, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// Update the game
function updateGame() {
    updatePacMan();
    updateGhosts();

    // Check for collisions with pellets
    for (let i = 0; i < pellets.length; i++) {
        let pellet = pellets[i];
        if (Math.hypot(pacManX - pellet.x, pacManY - pellet.y) < 20) {
            game.score++;
            pellets.splice(i, 1);
            pelletSound.play();
            if (game.score % 50 === 0) {
                levelUp();
            }
        }
    }

    // Check for collisions with bombs
    for (let i = 0; i < bombs.length; i++) {
        let bomb = bombs[i];
        if (Math.hypot(pacManX - bomb.x, pacManY - bomb.y) < 20) {
            game.lives--;
            bombs.splice(i, 1);
            bombSound.play();
            if (game.lives <= 0) {
                endGame();
            }
        }
    }

    // Check for collisions with lives pellets
    for (let i = 0; i < livesPellets.length; i++) {
        let livesPellet = livesPellets[i];
        if (Math.hypot(pacManX - livesPellet.x, pacManY - livesPellet.y) < 20) {
            game.lives++;
            livesPellets.splice(i, 1);
            lifeSound.play();
        }
    }

    // Check for collisions with ghosts
    for (let i = 0; i < ghosts.length; i++) {
        let ghost = ghosts[i];
        if (Math.hypot(pacManX - ghost.x, pacManY - ghost.y) < 20 && !ghost.fleeing) {
            game.lives--;
            ghost.fleeing = true;
            ghost.fleeStartTime = Date.now();
            ghostSound.play();
            if (game.lives <= 0) {
                endGame();
            }
        }
    }

    // Check for collisions with walls
    if (pacManX < 0) pacManX = 0;
    if (pacManX > canvas.width) pacManX = canvas.width;
    if (pacManY < 0) pacManY = 0;
    if (pacManY > canvas.height) pacManY = canvas.height;

    // Add more pellets if all are eaten
    if (pellets.length === 0) {
        pellets = createPellets(pelletsCount);
    }

    // Add more bombs if all are cleared
    if (bombs.length === 0) {
        bombs = createPellets(bombsCount);
    }

    // Add more lives pellets if all are collected
    if (livesPellets.length === 0) {
        livesPellets = createPellets(livesPelletsCount);
    }

    // Update UI
    updateGameUI();
}

// Update Pac-Man's movement
function updatePacMan() {
    switch (pacManDirection) {
        case 'right':
            pacManX += pacManSpeed;
            break;
        case 'left':
            pacManX -= pacManSpeed;
            break;
        case 'up':
            pacManY -= pacManSpeed;
            break;
        case 'down':
            pacManY += pacManSpeed;
            break;
    }
}

// Update Ghosts' movement
function updateGhosts() {
    for (let ghost of ghosts) {
        if (ghost.fleeing) {
            // Move the ghost away from Pac-Man
            const dx = ghost.x - pacManX;
            const dy = ghost.y - pacManY;
            const distance = Math.hypot(dx, dy);
            if (distance > 0) {
                ghost.x += (dx / distance) * ghostSpeed;
                ghost.y += (dy / distance) * ghostSpeed;
            }
            // Check if fleeing duration is over
            if (Date.now() - ghost.fleeStartTime > ghostFleeDuration) {
                ghost.fleeing = false;
            }
        } else {
            // Move the ghost towards Pac-Man
            const dx = pacManX - ghost.x;
            const dy = pacManY - ghost.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0) {
                ghost.x += (dx / distance) * ghostSpeed;
                ghost.y += (dy / distance) * ghostSpeed;
            }
        }
    }
}

// Initialize the game
function initGame() {
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.paused = false;
    game.gameOver = false;
    gameTimeLeft = gameTimeLimit;
    game.speed = initialGameSpeed;
    pellets = createPellets(pelletsCount);
    bombs = createPellets(bombsCount);
    livesPellets = createPellets(livesPelletsCount);
    ghosts = createGhosts(ghostsCount); // Use a function to create initial positions for ghosts
    clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(updateGameTimer, 1000);
    updateGameUI();
    gameOverText.style.display = 'none';
}

// Update the game timer
function updateGameTimer() {
    gameTimeLeft--;
    if (gameTimeLeft <= 0) {
        endGame();
    }
    updateGameUI();
}

// End the game
function endGame() {
    clearInterval(gameTimerInterval);
    game.paused = true;
    game.gameOver = true;
    gameOverText.style.display = 'block';
    gameOverSound.play();
}

// Update the game UI
function updateGameUI() {
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;
    livesElement.textContent = game.lives;
    speedElement.textContent = game.speed;
    timeLeftElement.textContent = Math.min(gameTimeLeft, gameTimeLimit);
}

// Create initial pellets, bombs, lives pellets, and ghosts
function createPellets(count) {
    const newPellets = [];
    for (let i = 0; i < count; i++) {
        newPellets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return newPellets;
}

// Create initial ghosts
function createGhosts(count) {
    const newGhosts = [];
    for (let i = 0; i < count; i++) {
        newGhosts.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            fleeing: false,
            fleeStartTime: 0
        });
    }
    return newGhosts;
}

// Level up the game
function levelUp() {
    game.level++;
    game.speed = Math.min(game.speed + gameSpeedIncreaseFactor, gameSpeedMax);
    game.lives++;
    gameTimeLeft = Math.min(gameTimeLeft + levelUpExtraTime, gameTimeLimit);
    levelUpSound.play();
    // Add more bombs and lives pellets each level
    bombs = bombs.concat(createPellets(bombsCount));
    livesPellets = livesPellets.concat(createPellets(livesPelletsCount));
}

// Start the game loop
gameLoop();
initGame();
