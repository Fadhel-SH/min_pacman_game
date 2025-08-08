// --- MAZE LAYOUTS ---
const mazeLayouts = [
    // Level 1: simple border
    [
        {x: 0, y: 0, w: 400, h: 10}, // top
        {x: 0, y: 390, w: 400, h: 10}, // bottom
        {x: 0, y: 0, w: 10, h: 400}, // left
        {x: 390, y: 0, w: 10, h: 400} // right
    ],
    // Level 2: border + center block
    [
        {x: 0, y: 0, w: 400, h: 10},
        {x: 0, y: 390, w: 400, h: 10},
        {x: 0, y: 0, w: 10, h: 400},
        {x: 390, y: 0, w: 10, h: 400},
        {x: 150, y: 150, w: 100, h: 100}
    ]
    // Add more layouts for higher levels
];

function getCurrentMaze() {
    return mazeLayouts[Math.min(game.level - 1, mazeLayouts.length - 1)];
}
    // Draw maze walls
    const maze = getCurrentMaze();
    ctx.fillStyle = '#444';
    for (let wall of maze) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
// --- DESIGN CONSTANTS ---
const PACMAN_COLOR = 'yellow';
const PACMAN_RADIUS = 20;
const PELLET_COLOR = 'green';
const PELLET_RADIUS = 5;
const POWER_PELLET_COLOR = 'white';
const POWER_PELLET_RADIUS = 10;
const BOMB_COLOR = 'red';
const BOMB_RADIUS = 10;
const LIVES_PELLET_COLOR = 'blue';
const GHOST_COLOR = 'purple';
const GHOST_EDIBLE_COLOR = 'blue';
const GHOST_RADIUS = 15;
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
const powerPelletsCount = 3; // Number of power pellets
let powerPellets = []; // Array to store power pellets
const powerPelletRadius = 10;
const powerPelletDuration = 5000; // ms ghosts are edible
let ghostsEdible = false;
let ghostsEdibleTimeout = null;

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
// Removed ghostSound (file missing)

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

    // Animate Pac-Man mouth
    ctx.save();
    ctx.translate(pacManX, pacManY);
    let mouthOpen = Math.abs(Math.sin(Date.now() / 150)) * 0.5 + 0.2;
    let startAngle = 0.25 * Math.PI * mouthOpen;
    let endAngle = 2 * Math.PI - startAngle;
    let directionAngle = 0;
    if (pacManDirection === 'right') directionAngle = 0;
    if (pacManDirection === 'left') directionAngle = Math.PI;
    if (pacManDirection === 'up') directionAngle = -0.5 * Math.PI;
    if (pacManDirection === 'down') directionAngle = 0.5 * Math.PI;
    ctx.rotate(directionAngle);
    ctx.fillStyle = PACMAN_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, PACMAN_RADIUS, startAngle, endAngle, false);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw the pellets
    ctx.fillStyle = PELLET_COLOR;
    for (let pellet of pellets) {
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, PELLET_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw power pellets
    ctx.fillStyle = POWER_PELLET_COLOR;
    for (let pp of powerPellets) {
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, POWER_PELLET_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw the bombs
    ctx.fillStyle = BOMB_COLOR;
    for (let bomb of bombs) {
        ctx.beginPath();
        ctx.arc(bomb.x, bomb.y, BOMB_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw the lives pellets
    ctx.fillStyle = LIVES_PELLET_COLOR;
    for (let livesPellet of livesPellets) {
        ctx.beginPath();
        ctx.moveTo(livesPellet.x, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x - 5, livesPellet.y - 15, livesPellet.x - 15, livesPellet.y - 15, livesPellet.x - 20, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x - 25, livesPellet.y - 2, livesPellet.x - 20, livesPellet.y + 8, livesPellet.x, livesPellet.y + 10);
        ctx.bezierCurveTo(livesPellet.x + 20, livesPellet.y + 8, livesPellet.x + 25, livesPellet.y - 2, livesPellet.x + 20, livesPellet.y - 8);
        ctx.bezierCurveTo(livesPellet.x + 15, livesPellet.y - 15, livesPellet.x + 5, livesPellet.y - 15, livesPellet.x, livesPellet.y - 8);
        ctx.fill();
    }

    // Draw the ghosts with animated eyes
    for (let ghost of ghosts) {
        ctx.save();
        ctx.translate(ghost.x, ghost.y);
        ctx.fillStyle = ghostsEdible ? GHOST_EDIBLE_COLOR : GHOST_COLOR;
        ctx.beginPath();
        ctx.arc(0, 0, GHOST_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-5, -5, 4, 0, 2 * Math.PI);
        ctx.arc(5, -5, 4, 0, 2 * Math.PI);
        ctx.fill();
        // Pupils follow Pac-Man
        let dx = pacManX - ghost.x;
        let dy = pacManY - ghost.y;
        let dist = Math.hypot(dx, dy);
        let px = dist > 0 ? (dx / dist) * 2 : 0;
        let py = dist > 0 ? (dy / dist) * 2 : 0;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-5 + px, -5 + py, 1.5, 0, 2 * Math.PI);
        ctx.arc(5 + px, -5 + py, 1.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
    // Check for collisions with power pellets
    for (let i = 0; i < powerPellets.length; i++) {
        let pp = powerPellets[i];
        if (Math.hypot(pacManX - pp.x, pacManY - pp.y) < powerPelletRadius + 20) {
            powerPellets.splice(i, 1);
            ghostsEdible = true;
            if (ghostsEdibleTimeout) clearTimeout(ghostsEdibleTimeout);
            ghostsEdibleTimeout = setTimeout(() => { ghostsEdible = false; }, powerPelletDuration);
        }
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
            if (ghostsEdible) {
                // Eat ghost for bonus points
                game.score += 10;
                // Respawn ghost at random position
                ghost.x = Math.random() * canvas.width;
                ghost.y = Math.random() * canvas.height;
            } else {
                game.lives--;
                ghost.fleeing = true;
                ghost.fleeStartTime = Date.now();
                // ghostSound.play();
                if (game.lives <= 0) {
                    endGame();
                }
            }
        }
    }
    // Add more power pellets if all are eaten
    if (powerPellets.length === 0) {
        powerPellets = createPowerPellets(powerPelletsCount);
    }
// Create initial power pellets
function createPowerPellets(count) {
    const newPP = [];
    for (let i = 0; i < count; i++) {
        newPP.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return newPP;
}

    // Check for collisions with walls (Pac-Man stays fully inside canvas)
    const pacManRadius = 20;
    if (pacManX < pacManRadius) pacManX = pacManRadius;
    if (pacManX > canvas.width - pacManRadius) pacManX = canvas.width - pacManRadius;
    if (pacManY < pacManRadius) pacManY = pacManRadius;
    if (pacManY > canvas.height - pacManRadius) pacManY = canvas.height - pacManRadius;

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
    // Save previous position
    const prevX = pacManX;
    const prevY = pacManY;
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
    // Maze collision: revert if hit wall
    const maze = getCurrentMaze();
    for (let wall of maze) {
        if (
            pacManX + PACMAN_RADIUS > wall.x &&
            pacManX - PACMAN_RADIUS < wall.x + wall.w &&
            pacManY + PACMAN_RADIUS > wall.y &&
            pacManY - PACMAN_RADIUS < wall.y + wall.h
        ) {
            pacManX = prevX;
            pacManY = prevY;
        }
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
            // Smarter movement: chase Pac-Man with some randomness
            let dx = pacManX - ghost.x;
            let dy = pacManY - ghost.y;
            // Add randomness to direction
            dx += (Math.random() - 0.5) * 40;
            dy += (Math.random() - 0.5) * 40;
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
    powerPellets = createPowerPellets(powerPelletsCount);
    bombs = createBombs(bombsCount);
    livesPellets = createLivesPellets(livesPelletsCount);
    ghosts = createGhosts(ghostsCount); // Use a function to create initial positions for ghosts
    // Add more power pellets each level
    powerPellets = powerPellets.concat(createPowerPellets(powerPelletsCount));
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
    // Save high score
    const prevHighScore = localStorage.getItem('pacmanHighScore') || 0;
    if (game.score > prevHighScore) {
        localStorage.setItem('pacmanHighScore', game.score);
    }
}

// Update the game UI
function updateGameUI() {
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;
    livesElement.textContent = game.lives;
    speedElement.textContent = game.speed;
    timeLeftElement.textContent = gameTimeLeft > 0 ? gameTimeLeft : 0;
    // High score
    const highScore = localStorage.getItem('pacmanHighScore') || 0;
    if (typeof highScoreElement !== 'undefined' && highScoreElement) highScoreElement.textContent = highScore;
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

// Create initial bombs
function createBombs(count) {
    const newBombs = [];
    for (let i = 0; i < count; i++) {
        newBombs.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return newBombs;
}

// Create initial lives pellets
function createLivesPellets(count) {
    const newLivesPellets = [];
    for (let i = 0; i < count; i++) {
        newLivesPellets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        });
    }
    return newLivesPellets;
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
    bombs = bombs.concat(createBombs(bombsCount));
    livesPellets = livesPellets.concat(createLivesPellets(livesPelletsCount));
}

// Start the game loop
gameLoop();
initGame();
