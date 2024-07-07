import { initWeb3,isContractInitialized, connectWallet, startGame as startGameWeb3, getGameTries, purchaseGameTries, getHighscores, submitScore, claimPrize } from './web3Integration.js';
import { loadUserAchievements, updateGameStats } from './achievements.js';

let game;
let isConnected = false;

function checkWalletConnection() {
    if (!isConnected) {
        showOverlay('Please connect wallet', handleWalletConnection, true, 'Connect Wallet');
        showOverlay('Please connect your wallet first.');
        return false;
    }
    return true;
}

async function updateTryCount() {
    if (!checkWalletConnection()) return;

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
const JUMP_VELOCITY = -600;
const GRAVITY = 1500;
const pressedKeys = {};



// Game class
class Game {
    constructor() {
        this.debugMode = false;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isConnected = false;
        this.keys = {}; 
        this.bottomPlatformTimer = 0;
        this.fixedTimeStep = 1000 / 60; 
        this.bottomPlatformDuration = 5
        this.gameRunning = false;
        this.hasPlayerJumped = false;
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
        this.bullets = [];
        this.enemies = [];
        this.lastEnemySpawn = 0;
        this.baseEnemySpawnInterval = 45000; // 45 seconds
        this.enemySpawnInterval = this.baseEnemySpawnInterval;
        this.lastShotTime = 0;
        this.shootingCooldown = 900; // 0.9 seconds
        this.enemySpeed = 50;
        this.jump;
        this.isKeyPressed;
        this.enemyDirection = 1;
        this.enemyDropDistance = 20;
        this.loadSprites();
        this.loadSounds();
        this.setupEventListeners();
    }


    async initializeGame() {
        if (!checkWalletConnection()) return;
    
        try {
            showEtherlinkWaitMessage();
    
            const currentTries = await getGameTries();
            if (currentTries <= 0) {
                hideOverlay();
                showOverlay('No tries left. Please purchase more.', handleBuyTries, true, 'Buy Tries');
                return;
            }
    
            const gameStarted = await startGameWeb3();
            if (!gameStarted) {
                console.error('Failed to start game on blockchain');
                hideOverlay();
                showOverlay('Failed to start game. Please try again.');
                return;
            }
    
            hideOverlay();
    
            this.bottomPlatform = this.createBottomPlatform();
            this.bottomPlatformTimer = 0;
            this.player = this.createPlayer();
            
            // Explicitly set player position
            this.player.x = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
            this.player.y = GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT - 1;
    
            this.platforms = this.createInitialPlatforms();
            this.gameStarted = false;
            this.hasPlayerJumped = false;
            this.score = 0;
            this.player = this.createPlayer();
            this.gameRunning = true;
            this.gameOver = false;
            this.blocksClimbed = 0;
            this.gameStartTime = Date.now();
            this.lastTime = performance.now();
            this.powerups = [];
    
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
            showOverlay('Error starting game. Please try again.');
        }
    }
    
    loadSprites() {
        this.enemySprite = new Image();
        this.enemySprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraft.png';
        this.enemyDestroyedSprite = new Image();
        this.enemyDestroyedSprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraftfire.png';
    }

    loadSounds() {
        this.shootSound = new Audio('https://raw.githubusercontent.com/Blindripper/blockjump/main/sound/Lasershot.wav');
        this.enemyDestroyedSound = new Audio('https://raw.githubusercontent.com/Blindripper/blockjump/main/sound/destroyed.wav');
    }
 
    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootingCooldown) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2.5,
                y: this.player.y,
                width: 5,
                height: 10,
                speed: 500
            });
            this.lastShotTime = currentTime;
            this.shootSound.currentTime = 0;
            this.shootSound.play();
        }
    }

    updateBullets(dt) {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed * dt;
            return bullet.y + bullet.height > 0;
        });
    }

    spawnEnemies() {
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.enemies.push({
                x: Math.random() * (GAME_WIDTH -80),
                y: 50,
                width: 80,
                height: 80,
                isDestroyed: false,
                destroyedTime: 0
            });
            this.lastEnemySpawn = currentTime;
        }
    }

    updateEnemies(dt) {
        this.enemies.forEach(enemy => {
            if (enemy.isDestroyed) {
                enemy.destroyedTime += dt;
                if (enemy.destroyedTime > 0.5) {
                    this.enemies = this.enemies.filter(e => e !== enemy);
                }
                return;
            }

            // Move enemies horizontally only
            enemy.x += this.enemySpeed * this.enemyDirection * dt;

            // Reverse direction if reaching screen edges
            if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) {
                this.enemyDirection *= -1;
            }
        });
    }

    checkBulletEnemyCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            let bulletHit = false;
            this.enemies.forEach(enemy => {
                if (!enemy.isDestroyed && this.checkCollision(bullet, enemy)) {
                    bulletHit = true;
                    enemy.isDestroyed = true;
                    enemy.destroyedTime = 0;
                    this.score += 1000;
                    this.enemyDestroyedSound.currentTime = 0;
                    this.enemyDestroyedSound.play();
                }
            });
            return !bulletHit;
        });
    }

    checkPlayerEnemyCollisions() {
        this.enemies.forEach(enemy => {
            if (!enemy.isDestroyed && this.checkCollision(this.player, enemy)) {
                this.gameOver = true;
                // You can add additional effects here, like:
                this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20, '#FF0000');
            }
        });
    }



    createPlayer() {
        return {
            x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
            y: GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT - 1,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            speed: 300,
            velocityY: 0,
            velocityX: 0,
            jumpCount: 0,
            isOnGround: false
        };
    }

    createJumpEffect() {
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10, '#3FE1B0');
        playSound('jump');
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
            isSpike: Math.random() < 0.05  // Keep spike platforms, but ensure they're rare
        };
    }
    

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'ArrowUp') {
                this.jump();
            }
            if (e.code === 'Space') {
                this.shoot();
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    handleKeyDown(e) {
        if (e.code === 'ArrowLeft') this.player.velocityX = -this.player.speed;
        if (e.code === 'ArrowRight') this.player.velocityX = this.player.speed;
        if (e.code === 'ArrowUp' && (this.player.isOnGround || this.player.jumpCount < this.player.maxJumps)) {
          // Call the jump function here
          this.jump();
        }
        if (e.code === 'Space') this.shoot();
      }
      

      jump() {
        if (this.player.jumpCount < 2) {
            const jumpVelocity = -600;
            this.player.velocityY = jumpVelocity;
            this.player.jumpCount++;
            this.player.isOnGround = false;
            this.createJumpEffect();
    
            console.log(`Jump executed. Jump count: ${this.player.jumpCount}`);
    
            if (!this.hasPlayerJumped) {
                this.hasPlayerJumped = true;
                this.score = 0;
            }
        }
    }


    update(dt) {
        if (this.gameOver) {
            this.handleGameOver();
            return;
        }

        if (!this.gameRunning) return;

        this.updatePlayer(dt);
        this.updatePlatforms(dt);
        this.updatePowerups(dt);
        this.updateParticles(dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.checkBulletEnemyCollisions();
        this.checkPlayerEnemyCollisions();
        this.spawnEnemies();
        this.updateDifficulty();
        this.updateUI();
        this.updateBackground();

        if (this.player.y > GAME_HEIGHT) {
            this.gameOver = true;
        }
    }
    
    
    updateBackground() {
        if (this.score - this.lastBackgroundChange >= this.backgroundChangeThreshold) {
            this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % backgrounds.length;
            this.lastBackgroundChange = this.score;
        }
    }
    
    handleCollisions() {
        const platforms = [this.bottomPlatform, ...this.platforms].filter(Boolean);
        this.player.isOnGround = false;
    
        for (let platform of platforms) {
            if (this.checkCollision(this.player, platform)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y) {
                    // Landing on top of the platform
                    this.player.y = platform.y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isOnGround = true;
                    this.player.jumpCount = 0; // Reset jump count when landing
                } else if (this.player.velocityY < 0 && this.player.y >= platform.y + platform.height) {
                    // Hitting the bottom of the platform
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                }
    
                if (platform.isGolden) {
                    this.handleGoldenPlatform();
                } else if (platform.isSpike) {
                    this.gameOver = true;
                    return;
                }
            }
        }
    
        // Check if player has fallen off the screen
        if (this.player.y > GAME_HEIGHT) {
            this.gameOver = true;
        }
    }
    
    landOnPlatform(platform) {
        this.player.y = platform.y - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.jumpCount = 0;
    }



    
    checkPlayerEnemyCollisions() {
        this.enemies.forEach(enemy => {
            if (!enemy.isDestroyed && this.checkCollision(this.player, enemy)) {
                this.gameOver = true;
            }
        });
    }
    

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    

    handleGoldenPlatform() {
        this.player.velocityY = JUMP_VELOCITY * 1.5;
        this.score += 15;
        this.triggerScreenShake(5, 0.3);
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 15, '#3FE1B0');
        playSound('powerup');
    }

    updatePlatforms(dt) {
        // Update bottom platform timer
        if (this.gameStarted && this.bottomPlatform) {
            this.bottomPlatformTimer += dt;
            if (this.bottomPlatformTimer >= this.bottomPlatformDuration) {
                this.bottomPlatform = null;
            }
        }

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
    }



    updatePlayer(dt) {
        if (!this.player) {
            console.warn('Player is null in updatePlayer');
            return;
        }
    
        const moveSpeed = 300;
    
        // Apply gravity
        this.player.velocityY += GRAVITY * dt;
    
        // Horizontal movement
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -moveSpeed;
        } else if (this.keys['ArrowRight']) {
            this.player.velocityX = moveSpeed;
        } else {
            this.player.velocityX = 0;
        }
    
        // Update position
        this.player.x += this.player.velocityX * dt;
        this.player.y += this.player.velocityY * dt;
    
        // Keep player within game bounds
        this.player.x = Math.max(0, Math.min(this.player.x, GAME_WIDTH - this.player.width));
        this.player.y = Math.max(0, Math.min(this.player.y, GAME_HEIGHT - this.player.height));
    
        // Check for platform collisions
        this.handleCollisions();
    
        // Reset jump count when on ground
        if (this.player.isOnGround) {
            this.player.jumpCount = 0;
        }
    
        // Debug logging
        console.log(`Player position: (${this.player.x.toFixed(2)}, ${this.player.y.toFixed(2)})`);
        console.log(`Player velocity: (${this.player.velocityX.toFixed(2)}, ${this.player.velocityY.toFixed(2)})`);
    }

    
    handleGameOver() {
        this.gameRunning = false;
        this.gameOver = true;

        // Stop any ongoing sounds
        Object.values(sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        playSound('gameOver');

        handleGameOver(this.score, this.blocksClimbed, this.gameStartTime);
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


    updateDifficulty() {
        this.difficultyLevel = Math.floor(this.score / 5000) + 1;
        this.platformSpeed = 50 + (this.difficultyLevel - 1) * 2;

        // Update enemy spawn interval
        this.enemySpawnInterval = Math.max(
            5000, // Minimum spawn interval of 5 seconds
            this.baseEnemySpawnInterval - (this.difficultyLevel - 1) * 2000
        );
        
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
        if (this.hasPlayerJumped) {
            this.score++;
        }
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
        this.drawBullets();
        this.drawEnemies();
        this.ctx.restore();
    }

    drawPlatforms() {
        for (let platform of this.platforms) {
            if (platform.isSpike) {
                // Draw spike platform
                this.ctx.fillStyle = '#FF0000';  // Red color for spike platforms
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, platform.y + platform.height);
                this.ctx.lineTo(platform.x + platform.width / 2, platform.y);
                this.ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
                this.ctx.closePath();
                this.ctx.fill();
            } else if (platform.isGolden) {
                // Draw golden platform
                this.ctx.fillStyle = '#FFD700';  // Gold color
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            } else {
                // Draw normal platform
                this.ctx.fillStyle = '#1E293B';  // Dark blue-gray color for normal platforms
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            }
        }
        
        // Draw bottom platform
        if (this.bottomPlatform) {
            this.ctx.fillStyle = '#4CAF50';  // Green color for bottom platform
            this.ctx.fillRect(this.bottomPlatform.x, this.bottomPlatform.y, this.bottomPlatform.width, this.bottomPlatform.height);
        }
    }

    drawBullets() {
        this.ctx.fillStyle = '#00FF00';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    drawEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.isDestroyed) {
                this.ctx.drawImage(this.enemyDestroyedSprite, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                this.ctx.drawImage(this.enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
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
        if (!this.player || typeof this.player.x === 'undefined' || typeof this.player.y === 'undefined') {
            console.warn('Player or its position is undefined in drawPlayer');
            return;
        }
        
        
        const playerSprite = sprites.get('player');
        if (playerSprite && playerSprite.complete) {
            this.ctx.drawImage(playerSprite, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            this.ctx.fillStyle = '#00FF00';  // Bright green color
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }
        
        // Draw player bounding box for debugging
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
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
        const powerupSpacing = 35; // Increased spacing between powerups
        let xOffset = GAME_WIDTH - padding;
    
        // Draw powerups from right to left
        Array.from(this.activePowerups.entries()).reverse().forEach(([type, powerup]) => {
            xOffset -= powerupSize;
    
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
    
            xOffset -= powerupSpacing; // Use the new spacing value
        });
    }


    gameLoop(currentTime) {
        if (!this.gameRunning) {
            return;
        }
    
        if (!this.lastTime) this.lastTime = currentTime;
    
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
    
        // Ensure deltaTime is not too large
        deltaTime = Math.min(deltaTime, 50); // Cap at 50ms (20 fps)
    
        this.update(deltaTime / 1000);
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

function isKeyPressed(key) {
    return pressedKeys[key] === true;
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

function showOverlay(message, callback = null, includeButton = false, buttonText = 'Start Game', includeNameForm = false) {
    hideOverlay(); // Remove any existing overlay

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Game canvas not found');
        return;
    }
    const canvasRect = canvas.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.className = 'game-overlay';
    Object.assign(overlay.style, {
        position: 'absolute',
        left: `${canvasRect.left}px`,
        top: `${canvasRect.top}px`,
        width: `${canvasRect.width}px`,
        height: `${canvasRect.height}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '2000',
        padding: '20px'
    });

    const messageElement = document.createElement('div');
    Object.assign(messageElement.style, {
        color: '#3FE1B0',
        fontSize: '24px',
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: '80%',
        marginBottom: '20px'
    });
    messageElement.textContent = message;
    overlay.appendChild(messageElement);

    if (includeNameForm) {
        const nameForm = document.createElement('form');
        nameForm.id = 'nameForm';
        Object.assign(nameForm.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px'
        });

        const nameInput = document.createElement('input');
        Object.assign(nameInput, {
            type: 'text',
            id: 'nameInput',
            placeholder: 'Enter your name',
            required: true,
            maxLength: 10
        });
        Object.assign(nameInput.style, {
            marginBottom: '10px',
            padding: '5px',
            fontSize: '16px'
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit Score';
        submitButton.className = 'game-button';

        const tryAgainButton = document.createElement('button');
        tryAgainButton.type = 'button';
        tryAgainButton.textContent = 'Try Again';
        tryAgainButton.className = 'game-button';
        tryAgainButton.onclick = (e) => {
            e.preventDefault();
            hideOverlay();
            if (typeof game.initializeGame === 'function') {
                game.initializeGame();
            } else {
                console.error('game.initializeGame is not a function');
            }
        };

        buttonContainer.appendChild(submitButton);
        buttonContainer.appendChild(tryAgainButton);

        nameForm.appendChild(nameInput);
        nameForm.appendChild(buttonContainer);

        nameForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            if (name) {
                if (typeof handleScoreSubmission === 'function') {
                    await handleScoreSubmission(name);
                } else {
                    console.error('handleScoreSubmission is not a function');
                }
            }
        };

        overlay.appendChild(nameForm);
    } else if (includeButton) {
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.className = 'game-button';
        button.onclick = async () => {
            if (callback && typeof callback === 'function') {
                await callback();
            }
        };
        overlay.appendChild(button);
    }

    document.body.appendChild(overlay);
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

function showEtherlinkWaitMessage() {
    showOverlay("Waiting for Etherlink...", null, false, '', false);
}


function hideOverlay() {
    const existingOverlay = document.getElementById('game-overlay');
    if (existingOverlay && existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }
}


// Main initialization
document.addEventListener('DOMContentLoaded', async function() {

    const requiredElements = ['gameCanvas', 'powerupBar','windIndicator'];
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

    

    if (!isConnected) {
        showOverlay('Please connect Wallet', handleWalletConnection, true, 'Connect Wallet');
    }
    });

async function handleWalletConnection() {
    try {
        if (!isConnected) {
            const web3Initialized = await initWeb3();
            if (web3Initialized) {
                const connected = await connectWallet();
                if (connected) {
                    isConnected = true;
                    updateButtonState();
                    await updateTryCount();
                    await loadUserAchievements();
                    showBuyTriesButton();
                    await loadHighscores();
                    await updateHighscoreTable();
                    showAchievements();
                    await getContractBalance();
                    hideOverlay();
                    await checkAndDisplayStartButton();
                } else {
                    showOverlay('Failed to connect. Please try again.');
                }
            } else {
                showOverlay('Web3 initialization failed. Please check your connection.');
            }
        } else {
            // Disconnect wallet
            isConnected = false;
            updateButtonState();
            hideBuyTriesButton();
            hideAchievements();
            showOverlay('Wallet disconnected. Please connect to play.');
        }
    } catch (error) {
        console.error('Error in handleWalletConnection:', error);
        showOverlay('An error occurred. Please try again.');
    }
}

async function handleClaimPrize() {
    if (!checkWalletConnection()) return;

    try {
        const claimMessageOverlay = showBlockchainWaitMessage("Claiming prize on Etherlink...", 0.5, 0.5);
        const result = await claimPrize();

        if (claimMessageOverlay) {
            document.body.removeChild(claimMessageOverlay);
        }
        
        if (result) {
            showOverlay('Prize claimed! Congratz!');
            await updateHighscoreTable();
        } else {
            showOverlay('Failed to claim prize. Not eligible.', 'error', 0.3);
        }
    } catch (error) {
        console.error('Error claiming prize:', error);
        showOverlay('An error occurred while claiming the prize. Please try again.', 'error', 0.3);
    }
}

async function handleBuyTries() {
    if (!checkWalletConnection()) return;

    try {
        showOverlay("Getting Game tries from Etherlink...");
        const purchased = await purchaseGameTries();
        
        hideOverlay();
        
        if (purchased) {
            showOverlay('10 Game tries added successfully!', async () => {
                await updateTryCount();
                updateButtonState();
                game.draw();
                hideOverlay();
                showStartButton(); // New function to show the start button overlay
            }, true, 'OK');
        } else {
            showOverlay('Failed to purchase Game tries. Please try again.', null, true, 'OK');
        }
    } catch (error) {
        console.error('Failed to purchase game tries:', error);
        showOverlay('Error purchasing Game tries. Please try again.', null, true, 'OK');
    }
}

function showStartButton() {
    showOverlay('Ready to play?', () => {
        game.initializeGame();
    }, true, 'Start Game');
}


function handleGameOver(score, blocksClimbed, gameStartTime) {

    // Store the game data for later use
    window.finalScore = score;
    window.blocksClimbed = blocksClimbed;
    window.gameStartTime = gameStartTime;

    // Show the game over overlay with the name form and Try Again button
    showOverlay(`Game Over\nScore: ${score}\nBlocks Climbed: ${blocksClimbed}`, null, false, '', true);
}

  
  async function handleScoreSubmission(name) {
    if (!checkWalletConnection()) return;

    try {
        showOverlay("Submitting score to Etherlink...");
        const submitted = await submitScore(name, window.finalScore, window.blocksClimbed, window.gameStartTime);
        
        if (submitted) {
            await updateHighscoreTable();
            showOverlay('Score submitted successfully!', async () => {
                await checkAndDisplayStartButton();
            }, true, 'Play Again');
        } else {
            showOverlay('Failed to submit score. Please try again.');
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        showOverlay('An error occurred while submitting your score. Please try again.');
    }
}  

  
async function updateHighscoreTable() {
    if (!checkWalletConnection()) return;

    try {
        const highscores = await getHighscores();
        let currentAccount;

        if (!highscores || !Array.isArray(highscores)) {
            console.error('Invalid highscores data:', highscores);
            return;
        }

        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const currentAccount = accounts[0];
            if (currentAccount) {
                updateClaimPrizeButton(highscores, currentAccount);
            } else {
            }
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
                if (index === 0) {
                    row.classList.add('first-place'); // Add this line to highlight first place
                }
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
        }

    } catch (error) {
    }
}

async function loadHighscores() {
    if (!checkWalletConnection()) return;

    try {
        const highscores = await getHighscores();
        updateHighscoreTable(highscores);
    } catch (error) {
        console.error('Error loading highscores:', error);
    }
}

async function getContractBalance() {
    if (!checkWalletConnection()) return;

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

async function checkAndDisplayStartButton() {
    if (!isConnected) {
        showOverlay('Please connect wallet');
        return;
    }

    try {
        const tries = await getGameTries();
        if (tries > 0) {
            showOverlay('Ready to play?', () => {
                game.initializeGame();
            }, true, 'Start Game');
        } else {
            showOverlay('No tries left. Please purchase more.', null, true, 'Buy Tries');
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


export { updateTryCount };
