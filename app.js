/**
 * FLAPPY BIRD GAME - JavaScript Learning Project
 * 
 * A simple implementation of Flappy Bird using HTML5 Canvas and vanilla JavaScript.
 * This code is heavily commented to help with learning game development concepts.
 * 
 * Game Mechanics:
 * - Bird falls due to gravity
 * - Spacebar or click makes bird flap upward
 * - Pipes move from right to left
 * - Score increases when passing through pipes
 * - Game over on collision with pipes, ground, or ceiling
 */

// ===========================
// GAME CONSTANTS & VARIABLES
// ===========================

// Canvas and context - these are the main drawing tools
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state constants - helps manage what screen we're showing
const GAME_STATES = {
    MENU: 'menu',      // Starting screen with instructions
    PLAYING: 'playing', // Active gameplay
    GAME_OVER: 'gameOver' // Game over screen
};

// Current game state
let gameState = GAME_STATES.MENU;

// Game physics constants - adjust these to change game difficulty
const GRAVITY = 0.6;        // How fast the bird falls
const JUMP_STRENGTH = -10;  // How much upward force when flapping
const PIPE_SPEED = 2;       // How fast pipes move left
const PIPE_GAP = 180;       // Size of gap between upper and lower pipes
const PIPE_WIDTH = 50;      // Width of each pipe
const GROUND_HEIGHT = 50;   // Height of the ground

// Game objects - these hold the current state of game elements
let bird = {
    x: 100,              // Horizontal position (stays constant)
    y: canvas.height / 2, // Vertical position (changes with gravity/flapping)
    velocity: 0,         // Current falling/rising speed
    size: 20             // Radius of the bird circle
};

let pipes = [];              // Array to hold all pipe pairs
let score = 0;              // Current player score
let animationId;            // ID for animation frame (used to stop game loop)
let lastPipeTime = 0;       // Timer for pipe creation

// DOM elements for UI updates
const currentScoreElement = document.getElementById('currentScore');
const finalScoreElement = document.getElementById('finalScore');
const instructionsElement = document.getElementById('instructions');
const gameOverElement = document.getElementById('gameOverScreen');

// ==================
// GAME INITIALIZATION
// ==================

/**
 * Initialize the game - sets up initial state and starts the game loop
 */
function initGame() {
    // Reset bird to starting position
    bird.x = 100;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    
    // Clear any existing pipes
    pipes = [];
    
    // Reset score
    score = 0;
    lastPipeTime = 0;
    updateScoreDisplay();
    
    // Start the game loop
    gameLoop();
}

/**
 * Reset game to starting state (used when restarting)
 */
function resetGame() {
    // Stop current animation loop
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Reset all game variables
    bird.x = 100;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    lastPipeTime = 0;
    
    // Update UI
    updateScoreDisplay();
    showInstructions();
    hideGameOver();
    
    // Set state back to menu
    gameState = GAME_STATES.MENU;
    
    // Restart game loop
    initGame();
}

// =================
// DRAWING FUNCTIONS
// =================

/**
 * Clear the entire canvas - called at start of each frame
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw the background - sky gradient and ground
 */
function drawBackground() {
    // Sky gradient (light blue to darker blue)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - GROUND_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');  // Light sky blue at top
    gradient.addColorStop(1, '#98E4FF');  // Slightly different blue at bottom
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - GROUND_HEIGHT);
    
    // Ground (green rectangle at bottom)
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // Ground border
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 3);
}

/**
 * Draw the bird - a yellow circle with simple eye and beak
 */
function drawBird() {
    // Save the current canvas state
    ctx.save();
    
    // Translate to bird position for easier drawing
    ctx.translate(bird.x, bird.y);
    
    // Main body (yellow circle)
    ctx.fillStyle = '#FFD700'; // Golden yellow
    ctx.beginPath();
    ctx.arc(0, 0, bird.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Body outline
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Eye (small white circle with black center)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak (orange triangle)
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(bird.size, 0);
    ctx.lineTo(bird.size + 15, -5);
    ctx.lineTo(bird.size + 15, 5);
    ctx.closePath();
    ctx.fill();
    
    // Restore canvas state
    ctx.restore();
}

/**
 * Draw all pipes on the screen
 */
function drawPipes() {
    pipes.forEach(pipe => {
        // Upper pipe (green rectangle)
        ctx.fillStyle = '#228B22'; // Forest green
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Lower pipe (green rectangle)
        const lowerPipeY = pipe.topHeight + PIPE_GAP;
        const lowerPipeHeight = canvas.height - GROUND_HEIGHT - lowerPipeY;
        ctx.fillRect(pipe.x, lowerPipeY, PIPE_WIDTH, lowerPipeHeight);
        
        // Pipe borders (darker green for 3D effect)
        ctx.strokeStyle = '#006400'; // Dark green
        ctx.lineWidth = 3;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.strokeRect(pipe.x, lowerPipeY, PIPE_WIDTH, lowerPipeHeight);
        
        // Pipe caps (wider rectangles at ends)
        const capHeight = 30;
        const capOverhang = 5;
        
        // Upper pipe cap
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x - capOverhang, pipe.topHeight - capHeight, 
                     PIPE_WIDTH + capOverhang * 2, capHeight);
        ctx.strokeRect(pipe.x - capOverhang, pipe.topHeight - capHeight, 
                       PIPE_WIDTH + capOverhang * 2, capHeight);
        
        // Lower pipe cap
        ctx.fillRect(pipe.x - capOverhang, lowerPipeY, 
                     PIPE_WIDTH + capOverhang * 2, capHeight);
        ctx.strokeRect(pipe.x - capOverhang, lowerPipeY, 
                       PIPE_WIDTH + capOverhang * 2, capHeight);
    });
}

/**
 * Draw the current score on the canvas
 */
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    
    // Draw score with outline for better visibility
    ctx.strokeText(score.toString(), canvas.width / 2, 50);
    ctx.fillText(score.toString(), canvas.width / 2, 50);
}

// ==================
// GAME LOGIC FUNCTIONS
// ==================

/**
 * Make the bird flap (jump upward)
 */
function flapBird() {
    bird.velocity = JUMP_STRENGTH;
}

/**
 * Update bird physics - apply gravity and move bird
 */
function updateBird() {
    // Apply gravity (increases downward velocity)
    bird.velocity += GRAVITY;
    
    // Limit maximum fall speed to prevent going through pipes
    if (bird.velocity > 12) {
        bird.velocity = 12;
    }
    
    // Update bird position based on velocity
    bird.y += bird.velocity;
}

/**
 * Create a new pipe pair at the right edge of screen
 */
function createPipe() {
    // Random height for the gap between pipes
    const minGapStart = 80;
    const maxGapStart = canvas.height - GROUND_HEIGHT - PIPE_GAP - 80;
    const gapStart = Math.random() * (maxGapStart - minGapStart) + minGapStart;
    
    pipes.push({
        x: canvas.width,           // Start at right edge
        topHeight: gapStart,       // Height of upper pipe
        passed: false              // Track if bird has passed this pipe (for scoring)
    });
}

/**
 * Update all pipes - move them left and remove off-screen pipes
 */
function updatePipes() {
    // Move all pipes to the left
    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED;
    });
    
    // Remove pipes that have moved off the left side of screen
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > -50);
    
    // Check for scoring (bird passed through pipe)
    pipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x - bird.size) {
            pipe.passed = true;
            score++;
            updateScoreDisplay();
        }
    });
}

/**
 * Check if bird collides with pipes, ground, or ceiling
 * Returns true if collision detected
 */
function checkCollisions() {
    // Check collision with ground
    if (bird.y + bird.size >= canvas.height - GROUND_HEIGHT) {
        return true;
    }
    
    // Check collision with ceiling
    if (bird.y - bird.size <= 0) {
        return true;
    }
    
    // Check collision with pipes
    for (let pipe of pipes) {
        // Check if bird is horizontally aligned with pipe
        if (bird.x + bird.size > pipe.x && bird.x - bird.size < pipe.x + PIPE_WIDTH) {
            // Check collision with upper pipe
            if (bird.y - bird.size < pipe.topHeight) {
                return true;
            }
            // Check collision with lower pipe
            if (bird.y + bird.size > pipe.topHeight + PIPE_GAP) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Handle game over - stop game and show game over screen
 */
function gameOver() {
    gameState = GAME_STATES.GAME_OVER;
    hideInstructions();
    showGameOver();
}

// ==================
// UI HELPER FUNCTIONS
// ==================

/**
 * Update the score display in the HTML
 */
function updateScoreDisplay() {
    currentScoreElement.textContent = score;
    finalScoreElement.textContent = score;
}

/**
 * Show the instructions overlay
 */
function showInstructions() {
    instructionsElement.classList.remove('hidden');
}

/**
 * Hide the instructions overlay
 */
function hideInstructions() {
    instructionsElement.classList.add('hidden');
}

/**
 * Show the game over screen
 */
function showGameOver() {
    gameOverElement.classList.remove('hidden');
}

/**
 * Hide the game over screen
 */
function hideGameOver() {
    gameOverElement.classList.add('hidden');
}

// ===============
// MAIN GAME LOOP
// ===============

/**
 * Main game loop - runs continuously while game is active
 * This function is called ~60 times per second
 */
function gameLoop() {
    // Clear the canvas for new frame
    clearCanvas();
    
    // Always draw background
    drawBackground();
    
    // Game behavior depends on current state
    if (gameState === GAME_STATES.PLAYING) {
        // Update game physics
        updateBird();
        updatePipes();
        
        // Create new pipes periodically (every 200 frames roughly)
        lastPipeTime++;
        if (lastPipeTime > 120 && (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200)) {
            createPipe();
            lastPipeTime = 0;
        }
        
        // Check for collisions
        if (checkCollisions()) {
            gameOver();
        }
        
        // Draw game objects
        drawPipes();
        drawBird();
        drawScore();
        
    } else {
        // In menu or game over state, just draw the bird (stationary)
        drawBird();
        
        // Still draw pipes if they exist (for game over screen)
        if (pipes.length > 0) {
            drawPipes();
        }
        
        // Only draw score if we're not in menu state
        if (gameState !== GAME_STATES.MENU) {
            drawScore();
        }
    }
    
    // Schedule next frame
    animationId = requestAnimationFrame(gameLoop);
}

// ===================
// EVENT HANDLERS
// ===================

/**
 * Handle spacebar press
 */
function handleKeyPress(event) {
    if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scrolling
        handleInput();
    }
}

/**
 * Handle mouse click on canvas
 */
function handleCanvasClick(event) {
    event.preventDefault();
    handleInput();
}

/**
 * Handle input (spacebar or click) - behavior depends on game state
 */
function handleInput() {
    if (gameState === GAME_STATES.MENU) {
        // Start the game
        gameState = GAME_STATES.PLAYING;
        hideInstructions();
        flapBird();
    } else if (gameState === GAME_STATES.PLAYING) {
        // Make bird flap
        flapBird();
    } else if (gameState === GAME_STATES.GAME_OVER) {
        // Restart the game
        resetGame();
    }
}

// ===================
// GAME STARTUP
// ===================

/**
 * Set up event listeners and start the game
 */
function startGame() {
    // Add event listeners for controls
    document.addEventListener('keydown', handleKeyPress);
    canvas.addEventListener('click', handleCanvasClick);
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Make canvas focusable for keyboard events
    canvas.tabIndex = 0;
    canvas.focus();
    
    // Initialize and start the game
    initGame();
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', startGame);

/**
 * LEARNING NOTES:
 * 
 * Key Game Development Concepts Demonstrated:
 * 
 * 1. GAME LOOP: The gameLoop() function runs continuously using requestAnimationFrame()
 *    - Clears screen, updates game state, draws everything, repeats
 * 
 * 2. GAME STATES: Using constants to track what screen/mode the game is in
 *    - Helps organize code and control game flow
 * 
 * 3. PHYSICS SIMULATION: Simple gravity and velocity system
 *    - Bird falls due to gravity, flapping gives upward velocity
 * 
 * 4. COLLISION DETECTION: Checking if game objects overlap
 *    - Uses simple rectangular/circular boundary checking
 * 
 * 5. OBJECT MANAGEMENT: Creating, updating, and removing game objects
 *    - Pipes are created, moved, and removed as needed
 * 
 * 6. EVENT HANDLING: Responding to user input
 *    - Same input (spacebar/click) does different things in different game states
 * 
 * 7. CANVAS DRAWING: Using 2D canvas context to draw shapes and images
 *    - Circles, rectangles, gradients, text
 * 
 * This code structure is common in many 2D games and provides a solid foundation
 * for learning game development concepts!
 */