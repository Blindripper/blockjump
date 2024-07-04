import { initWeb3, startGame as startGameWeb3, getGameTries, purchaseGameTries, getHighscores, submitScore, claimPrize } from './web3Integration.js';
import { loadUserAchievements, updateGameStats } from './achievements.js';

// Define base URL for the GitHub repository
const repoBaseUrl = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/';
const soundUrl = `${repoBaseUrl}sound/`;
const picsUrl = `${repoBaseUrl}pics/`;

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLATFORM_HEIGHT = 15;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const JUMP_VELOCITY = -800;
const GRAVITY = 2000;
const BLAST_POWERUP_DURATION = 30;
const TEZOSX_EFFECT_DURATION = 30;

// Game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isConnected = false;
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.blocksClimbed = 0;
        this.gameStartTime = 0;
        this.lastTime = 0;
        this.player = this.createPlayer();
        this.platforms = [];
        this.powerups = [];
        this.particles = [];
        this.wind = { speed: 0, direction: 1 };
        this.currentBackgroundIndex = 0;
        this.difficultyLevel = 1;
        this.platformSpeed = 50;
        this.currentBackgroundIndex = 0;
        this.bottomPlatform = this.createBottomPlatform();
        this.platforms = this.createInitialPlatforms();
        this.bottomPlatform = null;
        this.gameStarted = false;
        this.setupEventListeners();
    }

    async initializeGame() {
        try {
            const currentTries = await getGameTries();
            if (currentTries <= 0) {
                console.error('No tries left');
                displayCanvasMessage('No tries left. Please purchase more.', 'error');
                return;
            }
    
            const gameStarted = await startGameWeb3(); // Call the web3 function
            if (!gameStarted) {
                console.error('Failed to start game on blockchain');
                displayCanvasMessage('Failed to start game. Please try again.', 'error');
                return;
            }
    
            this.gameRunning = true;
            this.gameOver = false;
            this.score = 0;
            this.bottomPlatform = this.createBottomPlatform();
            this.gameStarted = false;
            this.blocksClimbed = 0;
            this.gameStartTime = Date.now();
            this.lastTime = performance.now();
            this.player = this.createPlayer();
            this.platforms = [];
            for (let i = 0; i < 7; i++) {
                this.platforms.push(this.createPlatform(GAME_HEIGHT - (i + 2) * 100));
            }
            
            this.platforms = [];
            for (let i = 0; i < 7; i++) {
            this.platforms.push(this.createPlatform(GAME_HEIGHT - (i + 2) * 100));
            }

            this.bottomPlatform = this.createBottomPlatform();
            this.powerups = [];
            await updateTryCount(); // Update the displayed try count
            
            // Remove the Start Game button
            const startButton = document.querySelector('.canvas-button');
            if (startButton) {
                startButton.remove();
            }
            
            console.log('Game initialized. Player:', this.player);
            console.log('Platforms:', this.platforms);
            
            // Start the game loop
            this.gameLoop(performance.now());
        } catch (error) {
            console.error('Error initializing game:', error);
            displayCanvasMessage('Error starting game. Please try again.', 'error');
        }
    }
    
    createPlayer() {
        return {
            x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
            y: GAME_HEIGHT - PLAYER_HEIGHT - 50,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            speed: 500,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 2,
            canJump: true
        };
    }

    createBottomPlatform() {
        return {
            x: 0,
            y: GAME_HEIGHT - PLATFORM_HEIGHT,
            width: GAME_WIDTH,
            height: PLATFORM_HEIGHT,
            isSafe: true
        };
    }

    createInitialPlatforms() {
        const platforms = [];
        for (let i = 0; i < 7; i++) {
            platforms.push(this.createPlatform(GAME_HEIGHT - (i + 2) * 100));
        }
        return platforms;
    }

    createPlatform(y) {
        const minWidth = 60;
        const maxWidth = 180;
        const width = Math.random() * (maxWidth - minWidth) + minWidth;
        return {
            x: Math.random() * (GAME_WIDTH - width),
            y: y,
            width: width,
            height: PLATFORM_HEIGHT,
            isGolden: Math.random() < 0.1,
            isSpike: Math.random() < 0.05
        };
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        if (e.code === 'ArrowLeft') this.player.velocityX = -this.player.speed;
        if (e.code === 'ArrowRight') this.player.velocityX = this.player.speed;
        if (e.code === 'ArrowUp' || e.code === 'Space') this.jump();
    }

    handleKeyUp(e) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') this.player.velocityX = 0;
    }

    jump() {
        if (this.player.jumpCount < this.player.maxJumps) {
            this.player.velocityY = JUMP_VELOCITY;
            this.player.isJumping = true;
            this.player.jumpCount++;
            this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10, '#3FE1B0');
            playSound('jump');
        }
    }



    update(dt) {
        if (!this.gameRunning || this.gameOver) return;

        this.updatePlayer(dt);
        this.updatePlatforms(dt);
        this.updatePowerups(dt);
        this.updateParticles(dt);
        this.updateWind(dt);
        this.updateDifficulty();
        this.updateUI();
    }

    
    handleCollisions() {
        let onPlatform = false;

        // Check collision with bottom platform if it exists
        if (this.bottomPlatform && this.checkCollision(this.player, this.bottomPlatform)) {
            this.landOnPlatform(this.bottomPlatform);
            onPlatform = true;
        }

        // Check collision with other platforms
        for (let platform of this.platforms) {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY >= 0) {  // Only land if moving downwards
                    this.landOnPlatform(platform);
                    onPlatform = true;
                    if (platform.isGolden) {
                        this.handleGoldenPlatform();
                    }
                    break;  // Exit the loop once we've landed
                }
            }
        }

        if (!onPlatform) {
            this.player.isJumping = true;
        }

        // Check if player has fallen off the bottom of the screen
        if (this.player.y > GAME_HEIGHT) {
            this.endGame();
        }
    } 
    

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y + obj1.height > obj2.y &&
               obj1.y < obj2.y + obj2.height;
    }

    landOnPlatform(platform) {
        this.player.y = platform.y - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpCount = 0;
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 5, '#3FE1B0');
    }

    handleGoldenPlatform() {
        this.player.velocityY = JUMP_VELOCITY * 1.5;
        this.score += 15;
        this.triggerScreenShake(5, 0.3);
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 15, '#3FE1B0');
        playSound('powerup');
    }

    updatePlatforms(dt) {
        // Update existing platforms
        this.platforms = this.platforms.filter(platform => {
            if (platform) {
                platform.y += this.platformSpeed * dt;
                return platform.y <= GAME_HEIGHT;
            }
            return false;
        });

        // Add new platforms if needed
        while (this.platforms.length < 7) {
            this.platforms.unshift(this.createPlatform(0));
            this.blocksClimbed++;
        }

        // Handle the bottom platform
        if (this.bottomPlatform) {
            this.bottomPlatform.y += this.platformSpeed * dt;
            if (this.bottomPlatform.y > GAME_HEIGHT) {
                this.bottomPlatform = null;
            }
        }
    }

    updatePlayer(dt) {
        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;
        this.player.velocityY += GRAVITY * dt;

        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.player.x, GAME_WIDTH - this.player.width));

        this.handleCollisions();

        // Check if the game has started and remove bottom platform
        if (!this.gameStarted && this.player.y < GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT) {
            this.gameStarted = true;
            this.bottomPlatform = null;
        }

        // Apply wind effect
        this.player.x += this.wind.speed * this.wind.direction * dt;
        this.player.x = Math.max(0, Math.min(this.player.x, GAME_WIDTH - this.player.width));
    }


    drawBackground() {
        const bg = backgrounds[this.currentBackgroundIndex];
        if (bg.image) {
            this.ctx.drawImage(bg.image, 0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Fallback to color if image is not loaded
            this.ctx.fillStyle = bg.color;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    }

    

    updatePowerups(dt) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].y += this.platformSpeed * dt;
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.applyPowerUpEffect(this.powerups[i].type);
                this.powerups.splice(i, 1);
            } else if (this.powerups[i].y > GAME_HEIGHT) {
                this.powerups.splice(i, 1);
            }
        }

        if (Math.random() < 0.01) {
            this.powerups.push(this.createPowerup(0));
        }
    }

    createPowerup(y) {
        const types = ['bitcoin', 'solana', 'ethereum', 'etherLink', 'greenTezos', 'blast', 'mintTezos', 'tezosX'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            x: Math.random() * (GAME_WIDTH - 30),
            y: y,
            width: 30,
            height: 30,
            type: type
        };
    }

    applyPowerUpEffect(type) {
        switch (type) {
            case 'bitcoin':
                this.player.velocityY = JUMP_VELOCITY * 1.5;
                break;
            case 'solana':
                this.endGame();
                break;
            case 'ethereum':
                this.platformSpeed *= 0.5;
                setTimeout(() => { this.platformSpeed *= 2; }, 5000);
                break;
            case 'etherLink':
                this.score += 1000;
                break;
            case 'greenTezos':
                this.player.maxJumps = 3;
                setTimeout(() => { this.player.maxJumps = 2; }, 30000);
                break;
            case 'blast':
                // Implement blast effect
                break;
            case 'mintTezos':
                this.platformSpeed *= 0.5;
                setTimeout(() => { this.platformSpeed *= 2; }, 30000);
                break;
            case 'tezosX':
                // Implement tezosX effect
                break;
        }
        playSound('powerup');
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateWind(dt) {
        if (Math.random() < 0.01) {
            this.wind.speed = Math.random() * 50;
            this.wind.direction = Math.random() < 0.5 ? -1 : 1;
        }
    }

    updateDifficulty() {
        this.difficultyLevel = Math.floor(this.score / 5000) + 1;
        this.platformSpeed = 50 + (this.difficultyLevel - 1) * 2;
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    triggerScreenShake(intensity, duration) {
        // Implement screen shake effect
    }

    updateUI() {
        this.score++;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
    
        const scaleX = this.canvas.width / GAME_WIDTH;
        const scaleY = this.canvas.height / GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        this.ctx.scale(scale, scale);
    
        const translateX = (this.canvas.width / scale - GAME_WIDTH) / 2;
        const translateY = (this.canvas.height / scale - GAME_HEIGHT) / 2;
        this.ctx.translate(translateX, translateY);
    
        this.drawBackground();
        this.drawPlatforms();
        this.drawPlayer();
        this.drawPowerups();
        this.drawParticles();
    
        // Debug information
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Game Running: ${this.gameRunning}`, 10, 80);
        this.ctx.fillText(`Player: x=${this.player.x.toFixed(2)}, y=${this.player.y.toFixed(2)}`, 10, 100);
        this.ctx.fillText(`Platforms: ${this.platforms.length}`, 10, 120);
    
        this.ctx.restore();
        this.drawHUD();
    }

    drawPlatforms() {
        this.ctx.fillStyle = '#1E293B';
        for (let platform of this.platforms) {
            if (platform.isSpike) {
                this.drawSpikePlatform(platform);
            } else if (platform.isGolden) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                this.ctx.fillStyle = '#1E293B';  // Reset fill style
            } else {
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
        
        // Draw bottom platform if it exists
        if (this.bottomPlatform) {
            this.ctx.fillStyle = '#4CAF50';  // Solid green color for the bottom platform
            this.ctx.fillRect(this.bottomPlatform.x, this.bottomPlatform.y, this.bottomPlatform.width, this.bottomPlatform.height);
        }
    }

    drawSpikePlatform(platform) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(platform.x, platform.y + platform.height);
        this.ctx.lineTo(platform.x + platform.width / 2, platform.y);
        this.ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawPlayer() {
        console.log('Drawing player:', this.player);
        const playerSprite = sprites.get('player');
        if (playerSprite && playerSprite.complete && playerSprite.naturalHeight !== 0) {
            this.ctx.drawImage(playerSprite, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            this.ctx.fillStyle = '#FF0000'; // Changed to red for visibility
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
    } 

    drawPowerups() {
        for (let powerup of this.powerups) {
            const powerupSprite = sprites.get(powerup.type);
            if (powerupSprite && powerupSprite.complete && powerupSprite.naturalHeight !== 0) {
                this.ctx.drawImage(powerupSprite, powerup.x, powerup.y, powerup.width, powerup.height);
            } else {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            }
        }
    }

    drawParticles() {
        for (let particle of this.particles) {
            particle.draw(this.ctx);
        }
    }

    drawHUD() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Orbitron, sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Blocks Climbed: ${this.blocksClimbed}`, 10, 60);
    }


    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        handleGameOver(this.score, this.blocksClimbed, this.gameStartTime);
    }

    gameLoop(currentTime) {
        if (!this.gameRunning) return;

        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * -2 - 1;
        this.alpha = 1;
        this.color = color;
        this.debug = true; 
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= dt * 2;
    }

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 2, 2);
        ctx.globalAlpha = 1;
    }
}

// Sound system
const sounds = {
    jump: new Audio(`${soundUrl}jump.wav`),
    powerup: new Audio(`${soundUrl}powerup.mp3`),
    gameOver: new Audio(`${soundUrl}gameover.mp3`),
    background: new Audio(`${soundUrl}main.mp3`)
};

let isSoundOn = false;

function toggleSound() {
    isSoundOn = !isSoundOn;
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.textContent = `Sound: ${isSoundOn ? 'On' : 'Off'}`;
    }
    isSoundOn ? enableSound() : disableSound();
}

function enableSound() {
    Object.values(sounds).forEach(sound => {
        sound.muted = false;
    });
}

function disableSound() {
    Object.values(sounds).forEach(sound => {
        sound.muted = true;
        if (sound.pause) {
            sound.pause();
            sound.currentTime = 0;
        }
    });
}

function playSound(soundName) {
    if (isSoundOn && sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(error => console.warn("Error playing sound:", error));
    }
}

function preloadSounds() {
    return Promise.all(Object.values(sounds).map(audio => {
        return new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject);
            audio.load();
        });
    }));
}

// Sprite loading
const sprites = new Map();

function loadSprite(name, fileName) {
    return new Promise((resolve, reject) => {
        const sprite = new Image();
        sprite.onload = () => resolve({ key: name, image: sprite });
        sprite.onerror = () => reject(new Error(`Failed to load sprite: ${name}`));
        sprite.src = `${picsUrl}${fileName}`;
    });
}

function loadSprites() {
    const spritesToLoad = [
        { name: 'player', file: 'TezosLogo_Icon_Blue.png' },
        { name: 'bitcoin', file: 'bitcoin.png' },
        { name: 'solana', file: 'solana.png' },
        { name: 'ethereum', file: 'ethereum1.png' },
        { name: 'etherLink', file: 'Etherlink.png' },
        { name: 'greenTezos', file: 'greenTezos.png' },
        { name: 'blast', file: 'blast.png' },
        { name: 'mintTezos', file: 'slowMotion.png' },
        { name: 'tezosX', file: 'TezosX1.png' }
    ];

    return Promise.all(spritesToLoad.map(sprite => loadSprite(sprite.name, sprite.file)))
        .then(loadedSprites => {
            loadedSprites.forEach(({key, image}) => sprites.set(key, image));
            console.log('All sprites loaded successfully');
        })
        .catch(error => {
            console.error('Error loading sprites:', error);
        });
}

// Background loading
const backgrounds = Array.from({ length: 16 }, (_, i) => ({
    image: null,
    floorStart: i * 100,
    color: `hsl(${i * 20}, 70%, 20%)`
}));

function loadBackgrounds() {
    return Promise.all(backgrounds.map((bg, index) => 
        loadImage(`${picsUrl}bg${index + 1}.jpg`)
            .then(img => { bg.image = img; })
            .catch(error => { 
                console.error(error);
                // Keep the fallback color
            })
    )).then(() => {
        console.log("All background images loaded (or failed gracefully)");
    }).catch(error => {
        console.error("Error in background loading:", error);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

// UI functions
function showBlockchainWaitMessage(message = "Waiting for Etherlink...", xOffset = 0.5, yOffset = 0.5) {
    const canvas = document.getElementById('gameCanvas');
    const overlay = document.createElement('div');
    overlay.className = 'blockchain-wait-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = canvas.offsetLeft + 'px';
    overlay.style.top = canvas.offsetTop + 'px';
    overlay.style.width = GAME_WIDTH + 'px';
    overlay.style.height = GAME_HEIGHT + 'px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = '#3FE1B0';
    messageElement.style.fontSize = '24px';
    messageElement.style.fontFamily = 'Orbitron, sans-serif';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.textAlign = 'center';
    messageElement.style.maxWidth = '80%';
    messageElement.style.position = 'absolute';
    messageElement.style.left = `${GAME_WIDTH * xOffset}px`;
    messageElement.style.top = `${GAME_HEIGHT * yOffset}px`;
    messageElement.style.transform = 'translate(-50%, -50%)';

    overlay.appendChild(messageElement);
    document.body.appendChild(overlay);

    return overlay;
}

function hideBlockchainWaitMessage() {
    const waitMessage = document.getElementById('blockchain-wait-message');
    if (waitMessage) {
        waitMessage.remove();
    }
}

function displayCanvasMessage(message, type = 'info', yOffset = 0.3) {
    const canvas = document.getElementById('gameCanvas');
    const overlay = document.createElement('div');
    
    overlay.style.position = 'absolute';
    overlay.style.left = canvas.offsetLeft + 'px';
    overlay.style.top = canvas.offsetTop + 'px';
    overlay.style.width = GAME_WIDTH + 'px';
    overlay.style.height = GAME_HEIGHT + 'px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = type === 'error' ? '#F44336' : (type === 'success' ? '#4CAF50' : '#3FE1B0');
    messageElement.style.fontSize = '24px';
    messageElement.style.fontFamily = 'Orbitron, sans-serif';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.textAlign = 'center';
    messageElement.style.maxWidth = '80%';
    messageElement.style.marginTop = `${GAME_HEIGHT * yOffset}px`;

    overlay.appendChild(messageElement);
    document.body.appendChild(overlay);

    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 3000);
}

let game;
let isConnected = false;

// Main initialization
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM fully loaded and parsed');

    const requiredElements = ['gameCanvas', 'powerupBar', 'achievementPopup', 'windIndicator'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        alert('Some game elements are missing. Please refresh the page or contact support.');
        return;
    }

    console.log('All required elements found');

    await Promise.all([
        loadSprites(),
        loadBackgrounds(),
        preloadSounds()
    ]);

    game = new Game();
    
    // Setup event listeners
    document.getElementById('walletConnectBtn').addEventListener('click', handleWalletConnection);
    document.getElementById('buyTriesBtn').addEventListener('click', handleBuyTries);
    document.getElementById('claimPrizeBtn').addEventListener('click', handleClaimPrize);
    document.getElementById('nameForm').addEventListener('submit', handleScoreSubmission);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    
    try {
        console.log('Initializing Web3...');
        const web3Initialized = await initWeb3();
        if (web3Initialized) {
            console.log('Web3 initialized successfully');
            await loadHighscores();
            await updateHighscoreTable();
            await getContractBalance();
        } else {
            console.error('Failed to initialize Web3');
            displayCanvasMessage('Failed to connect to blockchain. Please try again later.', 'error', 0.3);
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        displayCanvasMessage('An error occurred during initialization. Please refresh the page.', 'error', 0.3);
    }
});

async function handleWalletConnection() {
    console.log('Wallet connect button clicked');
    try {
        if (!isConnected) {
            const connected = await initWeb3();
            if (connected) {
                console.log('Successfully connected to Web3');
                isConnected = true;
                updateButtonState();
                await updateTryCount();
                await loadUserAchievements();
                showBuyTriesButton();
                await updateHighscoreTable();
                showAchievements();
                await checkAndDisplayStartButton(); 
                if (game.gameRunning) {
                    requestAnimationFrame(() => game.draw());
                }
            } else {
                console.log('Failed to connect to Web3');
                alert('Failed to connect. Please try again.');
            }
        } else {
            isConnected = false;
            updateButtonState();
            console.log('Disconnected from Web3');
            hideBuyTriesButton();
            hideAchievements();
            if (game.gameRunning) {
                requestAnimationFrame(() => game.draw());
            }
        }
    } catch (error) {
        console.error('Error in handleWalletConnection:', error);
        alert('An error occurred. Please try again.');
    }
}



let isBuyingTries = false;

async function handleBuyTries() {
    if (isBuyingTries) {
        console.log('Already processing a purchase. Please wait.');
        return;
    }

    isBuyingTries = true;
    try {
        const purchaseMessageOverlay = showBlockchainWaitMessage("Getting Game tries from Etherlink...", 0.5, 0.5);
        const purchased = await purchaseGameTries();
        
        if (purchaseMessageOverlay) {
            document.body.removeChild(purchaseMessageOverlay);
        }
        
        if (purchased) {
            console.log('Game tries purchased successfully');
            displayCanvasMessage('10 Game tries added successfully!', 'success', 0.3);
            await updateTryCount();
            updateButtonState();
            game.draw();
        } else {
            displayCanvasMessage('Failed to purchase Game tries. Please try again.', 'error', 0.3);
        }
    } catch (error) {
        console.error('Failed to purchase game tries:', error);
        displayCanvasMessage('Error purchasing Game tries. Please try again.', 'error', 0.3);
    } finally {
        isBuyingTries = false;
    }
}

async function handleClaimPrize() {
    try {
        const claimMessageOverlay = showBlockchainWaitMessage("Claiming prize on Etherlink...", 0.5, 0.5);
        const result = await claimPrize();

        if (claimMessageOverlay) {
            document.body.removeChild(claimMessageOverlay);
        }
        
        if (result) {
            displayCanvasMessage('Prize claimed successfully! Congratulations!', 'success', 0.3);
            await updateHighscoreTable();
        } else {
            displayCanvasMessage('Failed to claim prize. Not eligible.', 'error', 0.3);
        }
    } catch (error) {
        console.error('Error claiming prize:', error);
        displayCanvasMessage('An error occurred while claiming the prize. Please try again.', 'error', 0.3);
    }
}

async function handleScoreSubmission(e) {
    e.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    
    if (!name) {
        displayCanvasMessage('Please enter a valid name', 'error');
        return;
    }

    try {
        showBlockchainWaitMessage("Waiting for Etherlink...", 0.5, 0.5);
        const submitted = await submitScore(name, game.score, game.blocksClimbed, game.gameStartTime);
        hideBlockchainWaitMessage();
        if (submitted) {
            console.log('Score submitted successfully');
            await updateHighscoreTable();
            displayCanvasMessage('Score submitted successfully!', 'success');
        } else {
            console.error('Failed to submit score');
            displayCanvasMessage('Failed to submit score. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        hideBlockchainWaitMessage();
        displayCanvasMessage('An error occurred while submitting your score. Please try again.', 'error');
    }

    hideScoreSubmissionForm();
}

async function updateHighscoreTable() {
    try {
        const highscores = await getHighscores();
        let currentAccount;

        console.log('Fetched highscores:', highscores);

        if (!highscores || !Array.isArray(highscores)) {
            console.error('Invalid highscores data:', highscores);
            return;
        }

        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            currentAccount = accounts[0];
            console.log('Current account:', currentAccount);
        } else {
            console.log('Ethereum provider not found. Using alternative method.');
        }

        const highscoreBody = document.getElementById('highscoreBody');
        if (!highscoreBody) {
            console.error('Highscore table body not found');
            return;
        }

        highscoreBody.innerHTML = '';
        highscores.forEach((entry, index) => {
            if (entry && typeof entry === 'object') {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.name || 'Anonymous'}</td>
                    <td>${entry.player ? (entry.player.substring(0, 6) + '...' + entry.player.substring(38)) : 'N/A'}</td>
                    <td>${entry.score ? entry.score.toString().padStart(7, '0') : '0000000'}</td>
                    <td>${entry.blocksClimbed || 0}</td>
                `;
                highscoreBody.appendChild(row);
            }
        });

        if (currentAccount) {
            console.log('Calling updateClaimPrizeButton with:', { highscores, currentAccount });
            updateClaimPrizeButton(highscores, currentAccount);
        } else {
            console.log('No account connected, not updating claim prize button');
        }

    } catch (error) {
        console.error('Error updating highscore table:', error);
    }
}

async function loadHighscores() {
    try {
        const highscores = await getHighscores();
        updateHighscoreTable(highscores);
    } catch (error) {
        console.error('Error loading highscores:', error);
    }
}

async function getContractBalance() {
    const apiUrl = 'https://explorer.etherlink.com/api/v2/addresses/0xe5a0DE1E78feC1C6c77ab21babc4fF3b207618e4';

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.status}`);
        }

        const data = await response.json();
        const coinBalance = data["coin_balance"];

        const formattedBalance = formatBalance(coinBalance);
        updateBalanceDisplay(formattedBalance);
    } catch (error) {
        console.error('Error fetching contract balance:', error);
    }
}

async function updateTryCount() {
    try {
        const tries = await getGameTries();
        const triesLeftSpan = document.getElementById('triesLeft');
        if (triesLeftSpan) {
            triesLeftSpan.textContent = tries;
        } else {
            console.warn('Element with ID "triesLeft" not found in DOM.');
        }
    } catch (error) {
        console.error('Failed to get Game tries:', error);
    }
}

function updateButtonState() {
    const connectButton = document.getElementById('walletConnectBtn');
    const buyButton = document.getElementById('buyTriesBtn');
    const tryCounter = document.getElementById('tryCounter');
    
    if (connectButton) {
        if (isConnected) {
            connectButton.textContent = 'Disconnect wallet';
            connectButton.classList.add('disconnect-button');
            connectButton.classList.remove('connect-button');
        } else {
            connectButton.textContent = 'Connect wallet';
            connectButton.classList.remove('disconnect-button');
            connectButton.classList.add('connect-button');
        }
    }

    if (buyButton) {
        buyButton.style.display = isConnected ? 'block' : 'none';
    }

    if (tryCounter) {
        tryCounter.style.display = isConnected ? 'block' : 'none';
    }

    if (isConnected) {
        updateTryCount();
    }
}

function showBuyTriesButton() {
    const buyButton = document.getElementById('buyTriesBtn');
    if (buyButton) {
        buyButton.style.display = 'block';
    }
}

function hideBuyTriesButton() {
    const buyButton = document.getElementById('buyTriesBtn');
    if (buyButton) {
        buyButton.style.display = 'none';
    }
}

function showAchievements() {
    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.style.display = 'block';
    }
}

function hideAchievements() {
    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.style.display = 'none';
    }
}

function hideScoreSubmissionForm() {
    const nameForm = document.getElementById('nameForm');
    if (nameForm) {
        nameForm.style.display = 'none';
    }
}

function showScoreSubmissionForm() {
    const nameForm = document.getElementById('nameForm');
    if (nameForm) {
        nameForm.style.display = 'block';
    }
}

async function checkAndDisplayStartButton() {
    console.log('checkAndDisplayStartButton called');
    try {
        const tries = await getGameTries();
        console.log('Current Game tries:', tries);
        if (tries > 0) {
            console.log('Drawing Start Game button');
            drawCanvasButton('Start Game', () => {
                console.log('Start Game button clicked');
                game.initializeGame();
            });
        } else {
            console.log('No tries left, not displaying Start Game button');
        }
    } catch (error) {
        console.error('Error checking Game tries:', error);
        drawCanvasMessage('Error checking Game tries. Please try again.');
    }
}

function updateClaimPrizeButton(highscores, currentAccount) {
    console.log('Updating claim prize button:', { isConnected, highscores, currentAccount });
    const claimPrizeBtn = document.getElementById('claimPrizeBtn');
    if (claimPrizeBtn) {
        if (isConnected && highscores && highscores.length > 0) {
            const leadingAccount = highscores[0].player;
            console.log('Leading account:', leadingAccount);
            console.log('Current account:', currentAccount);
            
            if (leadingAccount && currentAccount && leadingAccount.toLowerCase() === currentAccount.toLowerCase()) {
                console.log('Showing claim prize button - account matches leading highscore');
                claimPrizeBtn.style.display = 'block';
            } else {
                console.log('Hiding claim prize button - account does not match leading highscore');
                claimPrizeBtn.style.display = 'none';
            }
        } else {
            console.log('Hiding claim prize button - not connected or no highscores');
            claimPrizeBtn.style.display = 'none';
        }
    } else {
        console.error('Claim prize button not found in the DOM');
    }
}

function formatBalance(coinBalance) {
    const WEI_PER_ETHER = 1e18;
    const balanceInEther = parseFloat(coinBalance) / WEI_PER_ETHER;
    return numberWithCommas(balanceInEther.toFixed(2));
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateBalanceDisplay(formattedBalance) {
    const balanceElement = document.getElementById("contract-balance");
    balanceElement.textContent = `Contract Balance: ${formattedBalance} XTZ`;
}


function drawCanvasButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'canvas-button';
    button.onclick = onClick;
    
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / GAME_WIDTH;
    const scaleY = canvas.height / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    button.style.position = 'absolute';
    button.style.left = `${canvasRect.left + (GAME_WIDTH * scale) / 2}px`;
    button.style.top = `${canvasRect.top + (GAME_HEIGHT * scale) / 2}px`;
    button.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(button);
}

function drawCanvasMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.className = 'canvas-message';
    document.body.appendChild(message);
}

function handleGameOver(score, blocksClimbed, gameStartTime) {
    showScoreSubmissionForm();
    window.finalScore = score;
    window.blocksClimbed = blocksClimbed;
    window.gameStartTime = gameStartTime;
}

export { updateTryCount };
