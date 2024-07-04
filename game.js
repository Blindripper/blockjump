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

// Game class
class Game {
    constructor() {
        this.debugMode = false;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isConnected = false;
        this.gameRunning = false;
        this.bottomPlatformRemoved = false;
        this.gameOver = false;
        this.activePowerups = new Map();
        this.score = 0;
        this.blocksClimbed = 0;
        this.gameStartTime = 0;
        this.lastTime = 0;
        this.platforms = [];
        this.powerups = [];
        this.particles = [];
        this.wind = { speed: 0, direction: 1 };
        this.backgroundChangeThreshold = 5000;
        this.lastBackgroundChange = 0;
        this.currentBackgroundIndex = 0;
        this.difficultyLevel = 1;
        this.platformSpeed = 50;
        this.bottomPlatform = null;
        this.player = null;
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
    
            const gameStarted = await startGameWeb3();
            if (!gameStarted) {
                console.error('Failed to start game on blockchain');
                displayCanvasMessage('Failed to start game. Please try again.', 'error');
                return;
            }

            this.bottomPlatform = this.createBottomPlatform();
            this.player = this.createPlayer();
            this.platforms = this.createInitialPlatforms();
            this.gameStarted = false;
    
            this.gameRunning = true;
            this.gameOver = false;
            this.score = 0;
            this.blocksClimbed = 0;
            this.gameStartTime = Date.now();
            this.lastTime = performance.now();
            this.player = this.createPlayer();
            this.platforms = this.createInitialPlatforms();
            this.powerups = [];
            this.gameStarted = false;
    
            await updateTryCount();
            
            if (this.debugMode) {
                console.log('Game initialized:');
                console.log('- Player:', this.player);
                console.log('- Platforms:', this.platforms.length);
                console.log('- Bottom platform present:', this.platforms.some(p => p.isBottomPlatform));
                this.logGameState('After initialization');
            }
            
            // Start the game loop
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error initializing game:', error);
            displayCanvasMessage('Error starting game. Please try again.', 'error');
        }
    }
    
    createPlayer() {
        return {
            x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
            y: GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT - 1, // Position above bottom platform
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            speed: 500,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 2
        };
    }

    createBottomPlatform() {
        return {
            x: 0,
            y: GAME_HEIGHT - PLATFORM_HEIGHT - 1, 
            width: GAME_WIDTH,
            height: PLATFORM_HEIGHT,
            isSafe: true,
            isBottomPlatform: true 

        };

    }

    createInitialPlatforms() {
        const platforms = [];
        // Create other initial platforms
        for (let i = 1; i < 7; i++) {
            platforms.push(this.createPlatform(GAME_HEIGHT - (i + 1) * 100));
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
        this.updateBackground();
    }

    updateBackground() {
        if (this.score - this.lastBackgroundChange >= this.backgroundChangeThreshold) {
            this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % backgrounds.length;
            this.lastBackgroundChange = this.score;
        }
    }
    
    handleCollisions() {
        let onPlatform = false;

        // Check collision with bottom platform
        if (this.bottomPlatform && this.checkCollision(this.player, this.bottomPlatform)) {
            this.landOnPlatform(this.bottomPlatform);
            onPlatform = true;
        }

        // Check collision with other platforms
        for (let platform of this.platforms) {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY >= 0 && this.player.y + this.player.height <= platform.y + this.player.velocityY * 2) {
                    // Only land if moving downwards and above the platform
                    this.landOnPlatform(platform);
                    onPlatform = true;
                    if (platform.isGolden) {
                        this.handleGoldenPlatform();
                    } else if (platform.isSpike) {
                        this.endGame();
                        return;
                    }
                    break;  // Exit the loop once we've landed
                } else {
                    // If not landing from above, adjust player position
                    if (this.player.x < platform.x) {
                        this.player.x = platform.x - this.player.width;
                    } else {
                        this.player.x = platform.x + platform.width;
                    }
                }
            }
        }
        
        if (!onPlatform) {
            this.player.isJumping = true;
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
            platform.y += this.platformSpeed * dt;
            return platform.y <= GAME_HEIGHT;
        });

        // Add new platforms if needed
        while (this.platforms.length < 7) {
            this.platforms.unshift(this.createPlatform(0));
            this.blocksClimbed++;
        }

        // Update bottom platform
        if (this.bottomPlatform && this.gameStarted) {
            this.bottomPlatform.y += this.platformSpeed * dt;
            if (this.bottomPlatform.y > GAME_HEIGHT) {
                this.bottomPlatform = null;
            }
        }

        if (this.debugMode) {
        }
    }



    updatePlayer(dt) {
        if (!this.player) {
            console.warn('Player is null in updatePlayer');
            return;
        }
    
        // Update player position
        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;
        this.player.velocityY += GRAVITY * dt;
    
        // Handle left and right wraparound
        if (this.player.x + this.player.width < 0) {
            this.player.x = GAME_WIDTH; // Wrap to right side
        } else if (this.player.x > GAME_WIDTH) {
            this.player.x = -this.player.width; // Wrap to left side
        }
    
        // Prevent player from going above the screen
        if (this.player.y < 0) {
            this.player.y = 0;
            this.player.velocityY = 0; // Stop upward movement
        }
    
        this.handleCollisions();
    
        // Check if the game has started
        if (!this.gameStarted && this.player.y < GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT * 3) {
            this.gameStarted = true;
            console.log('Game started');
        }
    
        // Apply wind effect
        this.player.x += this.wind.speed * this.wind.direction * dt;
    
        // Check for game over condition (falling below screen)
        if (this.player.y > GAME_HEIGHT) {
            this.endGame();
        }
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
        // Update active powerups
        for (const [type, powerup] of this.activePowerups.entries()) {
            powerup.duration -= dt;
            if (powerup.duration <= 0) {
                // Remove expired powerup
                this.activePowerups.delete(type);
                // Revert the powerup effect if necessary
                // You might need to implement revert logic for each powerup type
            }
        }
    
        // Update powerup items in the game world
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].y += this.platformSpeed * dt;
            if (this.checkCollision(this.player, this.powerups[i])) {
                this.applyPowerUpEffect(this.powerups[i].type);
                this.powerups.splice(i, 1);
            } else if (this.powerups[i].y > GAME_HEIGHT) {
                this.powerups.splice(i, 1);
            }
        }
    
        // Spawn new powerups
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
        const powerupConfig = {
            'bitcoin': { duration: 10, effect: () => this.player.velocityY = JUMP_VELOCITY * 1.5 },
            'ethereum': { duration: 5, effect: () => this.platformSpeed *= 0.5 },
            'greenTezos': { duration: 30, effect: () => this.player.maxJumps = 3 },
            'mintTezos': { duration: 30, effect: () => this.platformSpeed *= 0.5 },
            'etherLink': { duration: 1, effect: () => this.score += 1000 },
            'blast': { duration: 10, effect: () => { /* Implement blast effect */ } },
            'tezosX': { duration: 15, effect: () => { /* Implement tezosX effect */ } },
        };
    
        if (powerupConfig[type]) {
            if (this.activePowerups.has(type)) {
                // If powerup is already active, extend its duration
                this.activePowerups.get(type).duration += powerupConfig[type].duration;
            } else {
                // Apply the powerup effect
                powerupConfig[type].effect();
                // Add to active powerups
                this.activePowerups.set(type, {
                    duration: powerupConfig[type].duration,
                    maxDuration: powerupConfig[type].duration
                });
            }
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
        
        // Change background
        this.currentBackgroundIndex = Math.min(Math.floor(this.score / 5000), backgrounds.length - 1);
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
        if (!this.ctx) {
            console.error('Canvas context is not initialized');
            return;
        }

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
        this.drawHUD();
        this.drawPowerupHUD();
        this.ctx.restore();
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
        
        // Draw bottom platform
        if (this.bottomPlatform) {
            this.ctx.fillStyle = '#4CAF50';  // Green color for bottom platform
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
        if (!this.player) {
            console.warn('Player is null in drawPlayer');
            return;
        }
        
        const playerSprite = sprites.get('player');
        if (playerSprite && playerSprite.complete && playerSprite.naturalHeight !== 0) {
            this.ctx.drawImage(playerSprite, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            this.ctx.fillStyle = '#FF0000';
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
        this.ctx.font = '12px Orbitron, sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Blocks Climbed: ${this.blocksClimbed}`, 10, 60);
    }

    drawPowerupHUD() {
        const powerupSize = 20;
        const padding = 10;
        const barHeight = 5;
        let xOffset = GAME_WIDTH - padding;  // Start from the right edge
    
        // Draw powerups from right to left
        Array.from(this.activePowerups.entries()).reverse().forEach(([type, powerup]) => {
            xOffset -= powerupSize;  // Move left by the size of the powerup
    
            // Draw powerup icon
            const powerupSprite = sprites.get(type);
            if (powerupSprite) {
                this.ctx.drawImage(powerupSprite, xOffset, padding, powerupSize, powerupSize);
            } else {
                // Fallback if sprite is not available
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(xOffset, padding, powerupSize, powerupSize);
            }
    
            // Draw duration bar
            const barWidth = powerupSize;
            const remainingWidth = (powerup.duration / powerup.maxDuration) * barWidth;
            
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(xOffset, padding + powerupSize + 5, barWidth, barHeight);
            
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(xOffset, padding + powerupSize + 5, remainingWidth, barHeight);
    
            xOffset -= padding;  // Add padding between powerups
        });
    }


    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        showOverlay('Game Over', () => {
            handleGameOver(this.score, this.blocksClimbed, this.gameStartTime);
        });
    }

    gameLoop(currentTime) {
        if (!this.gameRunning) {
            return;
        }

        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(dt);

        try {
            this.draw();
        } catch (error) {
            this.gameRunning = false;
            return;
        }


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
        })
        .catch(error => {
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
    }).catch(error => {
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

function showOverlay(message, callback = null, includeButton = false) {
    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = `${canvasRect.left}px`;
    overlay.style.top = `${canvasRect.top}px`;
    overlay.style.width = `${canvasRect.width}px`;
    overlay.style.height = `${canvasRect.height}px`;
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
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
    messageElement.style.marginBottom = '20px';

    overlay.appendChild(messageElement);

    if (includeButton) {
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.className = 'start-button';
        startButton.style.backgroundColor = '#3FE1B0';
        startButton.style.color = '#0f1624';
        startButton.style.border = 'none';
        startButton.style.padding = '10px 20px';
        startButton.style.fontSize = '18px';
        startButton.style.fontFamily = 'Orbitron, sans-serif';
        startButton.style.fontWeight = 'bold';
        startButton.style.borderRadius = '5px';
        startButton.style.cursor = 'pointer';
        startButton.style.transition = 'all 0.3s ease';

        startButton.onmouseover = () => {
            startButton.style.backgroundColor = '#2dc898';
            startButton.style.transform = 'scale(1.05)';
        };
        startButton.onmouseout = () => {
            startButton.style.backgroundColor = '#3FE1B0';
            startButton.style.transform = 'scale(1)';
        };

        startButton.onclick = () => {
            if (callback) callback();
            document.body.removeChild(overlay);
        };

        overlay.appendChild(startButton);
    }

    document.body.appendChild(overlay);

    if (callback && !includeButton) {
        setTimeout(() => {
            document.body.removeChild(overlay);
            callback();
        }, 2000);
    }

    return overlay;
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

    const requiredElements = ['gameCanvas', 'powerupBar', 'achievementPopup', 'windIndicator'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        alert('Some game elements are missing. Please refresh the page or contact support.');
        return;
    }


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
        const web3Initialized = await initWeb3();
        if (web3Initialized) {
            await loadHighscores();
            await updateHighscoreTable();
            await getContractBalance();
            await checkAndDisplayStartButton(); // This will now show the start button
        } else {
            showOverlay('Failed to connect to blockchain. Please try again later.');
        }
    } catch (error) {
        showOverlay('An error occurred during initialization. Please refresh the page.');
    }
});

async function handleWalletConnection() {
    try {
        if (!isConnected) {
            const connected = await initWeb3();
            if (connected) {
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
                alert('Failed to connect. Please try again.');
            }
        } else {
            isConnected = false;
            updateButtonState();
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
        return;
    }

    isBuyingTries = true;
    try {
        const purchaseMessageOverlay = showOverlay("Getting Game tries from Etherlink...");
        const purchased = await purchaseGameTries();
        
        hideOverlay(purchaseMessageOverlay);
        
        if (purchased) {
            showOverlay('10 Game tries added successfully!', () => {
                updateTryCount();
                updateButtonState();
                game.draw();
            });
        } else {
            showOverlay('Failed to purchase Game tries. Please try again.');
        }
    } catch (error) {
        console.error('Failed to purchase game tries:', error);
        showOverlay('Error purchasing Game tries. Please try again.');
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
        showOverlay('Please enter a valid name');
        return;
    }

    try {
        const submitOverlay = showOverlay("Submitting score to Etherlink...");
        const submitted = await submitScore(name, game.score, game.blocksClimbed, game.gameStartTime);
        hideOverlay(submitOverlay);
        if (submitted) {
            await updateHighscoreTable();
            showOverlay('Score submitted successfully!');
        } else {
            showOverlay('Failed to submit score. Please try again.');
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        showOverlay('An error occurred while submitting your score. Please try again.');
    }

    hideScoreSubmissionForm();
}

async function updateHighscoreTable() {
    try {
        const highscores = await getHighscores();
        let currentAccount;


        if (!highscores || !Array.isArray(highscores)) {
            console.error('Invalid highscores data:', highscores);
            return;
        }

        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            currentAccount = accounts[0];
        } else {
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
    try {
        const tries = await getGameTries();
        if (tries > 0) {
            showOverlay('Ready to play?', () => {
                game.initializeGame();
            }, true);
        } else {
            showOverlay('No tries left. Please purchase more.');
        }
    } catch (error) {
        console.error('Error checking Game tries:', error);
        showOverlay('Error checking Game tries. Please try again.');
    }
}

function updateClaimPrizeButton(highscores, currentAccount) {
    const claimPrizeBtn = document.getElementById('claimPrizeBtn');
    if (claimPrizeBtn) {
        if (isConnected && highscores && highscores.length > 0) {
            const leadingAccount = highscores[0].player;
            
            if (leadingAccount && currentAccount && leadingAccount.toLowerCase() === currentAccount.toLowerCase()) {
                claimPrizeBtn.style.display = 'block';
            } else {
                claimPrizeBtn.style.display = 'none';
            }
        } else {
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
    showOverlay('Game Over', () => {
        showScoreSubmissionForm();
        window.finalScore = score;
        window.blocksClimbed = blocksClimbed;
        window.gameStartTime = gameStartTime;
    });
}

export { updateTryCount };
