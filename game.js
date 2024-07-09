import { initWeb3,isContractInitialized, connectWallet, startGame as startGameWeb3, getGameTries, purchaseGameTries, getHighscores, submitScore, claimPrize, getContract, getCurrentAccount } from './web3Integration.js';
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
const PLATFORM_HEIGHT = 35;
const PLAYER_WIDTH = 35;
const PLAYER_HEIGHT = 45;
const pressedKeys = {};
const SHIELD_WIDTH = PLAYER_WIDTH * 1.1; 
const SHIELD_HEIGHT = PLAYER_HEIGHT *1.1;


// Game class
class Game {
    constructor() {
        this.baseScrollSpeed = 65; // Base scrolling speed
        this.minPlatformDistance = PLAYER_HEIGHT * 1.5; // Minimum vertical distance between platforms
        this.currentScrollSpeed = this.baseScrollSpeed;
        this.maxScrollSpeed = this.baseScrollSpeed * 2; // Maximum scrolling speed
        this.scrollSpeedIncreaseFactor = 1.5; // How much to increase the speed
        this.debugMode = false;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isConnected = false;
        this.minEnemyShootInterval = 2000; // Minimum 2 seconds between shots
        this.maxEnemyShootInterval = 10000; // Maximum 10 seconds between shots
        this.keys = {};
        this.fallThroughDelay = 400; // Milliseconds to ignore platform collision after pressing down
        this.lastFallThroughTime = 0
        this.normalGravity = 1200; // The default gravity value
        this.currentGravity = this.normalGravity; // Current gravity that can be modified
        this.enemyShootInterval = 10000; // Start with 10 seconds
        this.lastEnemyShot = 0;
        this.enemyBullets = [];
        this.lastPowerupScore = 0;
        this.nomadicPowerupLevel = 0;
        this.JUMP_VELOCITY = -550;
        this.GRAVITY = 1200;
        this.minEnemyShootInterval = 2000; // Minimum 2 seconds between shots
        this.bottomPlatformTimer = 0;
        this.fixedTimeStep = 1000 / 60; 
        this.bottomPlatformDuration = 5000
        this.bottomPlatform = null;
        this.gameRunning = false;
        this.gameSpeed = 1; // Add this line to set the default game speed
        this.normalGameSpeed = 1; // Add this line to store the normal game speed
        this.fastGameSpeed = false; // Add this to track if fast game speed is active
        this.hasPlayerJumped = false;
        this.bottomPlatformRemoved = false;
        this.constantBeam = null;
        this.constantBeamActive = false;
        this.constantBeamDamageInterval = 100; // Damage interval in milliseconds
        this.lastConstantBeamDamageTime = 0;
        this.gameOver = false;
        this.lastRandomSpawn = 0;
        this.randomSpawnInterval = 3000;
        this.activePowerups = new Map();
        this.score = 0;
        this.blocksClimbed = 0;
        this.gameStartTime = 0;
        this.lastTime = 0;
        this.platforms = [];
        this.powerups = [];
        this.debuffDriftSpeed = 30; // pixels per second
        this.particles = [];
        this.wind = { speed: 0, direction: 1 };
        this.backgroundChangeThreshold = 5000;
        this.lastBackgroundChange = 0;
        this.currentBackgroundIndex = 0;
        this.difficultyLevel = 1;
        this.platformSpeed = 65;
        this.bottomPlatform = null;
        this.platformCount = 25;
        this.player = null;
        this.gameStarted = false;
        this.bullets = [];
        this.missileShootDelay = 2000; // 2 seconds delay for missile shot after spawning
        this.enemies = [];
        this.lastEnemySpawn = 0;
        this.baseEnemySpawnInterval = 20000; // 20 seconds
        this.enemySpawnInterval = this.baseEnemySpawnInterval;
        this.enemySpawnRate = 1; // Start with 1 enemy per spawn
        this.lastShotTime = 0;
        this.shootingCooldown = 900; // 0.9 seconds
        this.enemySpeed = 50;
        this.jump;
        this.powerupDropRate = 0.5; // 50% chance for an enemy to drop a powerup when killed
        this.debuffDropRate = 0.50; // 10% chance for a random debuff to spawn
        this.lastDebuffSpawn = 0;
        this.debuffSpawnInterval = 8000; 
        this.spacecraftDropRate = 0.75; // 75% drop rate for normal spacecraft
        this.spacecraft2DropRate = 0.90; // 90% drop rate for spacecraft2
        this.activePowerups = new Map();
        this.playerShield = false;
        this.shieldTimer = null;
        this.rapidFire = false;
        this.constantBeam = null;
        this.lowGravity = false;
        this.highGravity = false;
        this.slowMovement = false;
        this.normalGravity = 1500;
        this.normalMoveSpeed = 350;
        this.normalShootCooldown = 900;
        this.isKeyPressed;
        this.platformSprites = {
            normal: [new Image(), new Image()],
            spike: new Image(),
            golden: new Image()
        };
        this.loadPlatformSprites();
        this.enemyDirection = 1;
        this.enemyDropDistance = 20;
        this.enemyType2Sprite = new Image();
        this.enemyType2Sprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraft2small.png';
        this.enemyType2DestroyedSprite = new Image();
        this.enemyType2DestroyedSprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraft2firesmall.png';
        this.sounds = {
            friendlyLaser: new Audio(`${soundUrl}friendlylaser.mp3`),
            enemyLaser: new Audio(`${soundUrl}Lasershot.mp3`),
            missile: new Audio(`${soundUrl}missile.mp3`),
            destroyed: new Audio(`${soundUrl}destroyed.mp3`),
            background: new Audio(`${soundUrl}main.mp3`),
            jump: new Audio(`${soundUrl}jump.wav`),
            powerup: new Audio(`${soundUrl}powerup.mp3`),
            gameOver: new Audio(`${soundUrl}gameover.mp3`)
        };
        this.loadSprites();
        this.loadSounds();
        this.setupEventListeners();
    }

    loadPlatformSprites() {
        this.platformSprites.normal[0].src = `${picsUrl}normalplat0.png`;
        this.platformSprites.normal[1].src = `${picsUrl}normalplat1.png`;
        this.platformSprites.spike.src = `${picsUrl}spikeplat1.png`;
        this.platformSprites.golden.src = `${picsUrl}jumppad.png`;
    }

    dropNomadicPowerup() {
        const x = Math.random() * (GAME_WIDTH - 30);
        const y = 0; // Drop from the top of the screen
        this.powerups.push(this.createPowerup(x, y, false, true)); // Force nomadic powerup
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
            this.gameStartTime = Date.now(); // Store full millisecond timestamp  

            this.gameSpeed = 1;
            this.platformSpeed = this.basePlatformSpeed;
    
            this.bottomPlatform = this.createBottomPlatform();
            this.bottomPlatformTimer = 0;
            this.player = this.createPlayer();
            this.player.y = this.bottomPlatform.y - this.player.height;
            this.resetPowerupEffects();
            this.sounds.background.loop = true;
            this.sounds.background.play().catch(error => console.warn("Error playing background music:", error));
            this.enemies = [];
            this.enemyBullets = [];
            this.gameStarted = true;
            this.platforms = this.createInitialPlatforms();
            this.gameStarted = false;
            this.hasPlayerJumped = false;
            this.score = 0;
            this.player = this.createPlayer();
            this.gameRunning = true;
            this.gameOver = false;
            this.blocksClimbed = 0;
            this.lastTime = performance.now();
            this.constantBeamActive = false;
            this.powerups = [];

            setTimeout(() => {
                this.bottomPlatform = null;
                console.log('Bottom platform removed after 5 seconds');
            }, 5000);
    
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
        this.enemySprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraft1small.png';
        this.enemyDestroyedSprite = new Image();
        this.enemyDestroyedSprite.src = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/spacecraftfire.png';
    }

    loadSounds() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
            sound.muted = !isSoundOn; // Set initial mute state based on isSoundOn
        });
    }

    getBackgroundName(index) {
        const backgroundNames = [
            'Athens', 'Babylon', 'Carthage', 'Delphi', 'Edo',
            'Florence', 'Granada', 'Hangzhou', 'Ithaca', 'Jakarta',
            'Kathmandu', 'Lima', 'Mumbai', 'Nairobi', 'Oxford', 'Paris'
        ];
        return backgroundNames[index] || 'Unknown';
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(error => console.warn("Error playing sound:", error));
        }
    }

    updateScrollSpeed() {
        const topThreshold = GAME_HEIGHT * 0.2; // 20% of screen height from the top
    
        if (this.player.y < topThreshold) {
            // Player is near or above the top of the screen, increase scroll speed
            const distanceAboveThreshold = Math.max(0, topThreshold - this.player.y);
            const speedIncreaseFactor = 1 + (distanceAboveThreshold / topThreshold) * (this.scrollSpeedIncreaseFactor - 1);
            this.currentScrollSpeed = Math.min(
                this.maxScrollSpeed,
                this.baseScrollSpeed * speedIncreaseFactor
            );
        } else {
            // Player is within the normal play area, use base speed
            this.currentScrollSpeed = this.baseScrollSpeed;
        }
    }




    shoot() {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootingCooldown) {
            switch (this.nomadicPowerupLevel) {
                case 0:
                    this.createBullet(this.player.x + this.player.width / 2, this.player.y, 0, -1);
                    break;
                case 1:
                    this.createBullet(this.player.x, this.player.y, 0, -1);
                    this.createBullet(this.player.x + this.player.width, this.player.y, 0, -1);
                    break;
                case 2:
                    this.createBullet(this.player.x, this.player.y, -1, -1);
                    this.createBullet(this.player.x + this.player.width, this.player.y, 1, -1);
                    this.createBullet(this.player.x, this.player.y + this.player.height, -1, 1);
                    this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height, 1, 1);
                    break;
                case 3:
                    this.createBullet(this.player.x, this.player.y, -1, -1);
                    this.createBullet(this.player.x + this.player.width, this.player.y, 1, -1);
                    this.createBullet(this.player.x, this.player.y + this.player.height, -1, 1);
                    this.createBullet(this.player.x + this.player.width, this.player.y + this.player.height, 1, 1);
                    this.createBullet(this.player.x + this.player.width / 2, this.player.y, 0, -1);
                    this.createBullet(this.player.x + this.player.width / 2, this.player.y + this.player.height, 0, 1);
                    break;
                case 4:
                    for (let i = 0; i < 8; i++) {
                        const angle = i * Math.PI / 4;
                        this.createBullet(
                            this.player.x + this.player.width / 2,
                            this.player.y + this.player.height / 2,
                            Math.cos(angle),
                            Math.sin(angle)
                        );
                    }
                    break;
            }
            this.lastShotTime = currentTime;
            this.playSound('friendlyLaser');
        }
    }


    createBullet(x, y, dirX, dirY) {
        this.bullets.push({
            x: x,
            y: y,
            width: 5,
            height: 10,
            speed: 500,
            dirX: dirX,
            dirY: dirY
        });
    }

    damageEnemiesInBeamPath() {
        const beamX = this.player.x + this.player.width / 2;
        this.enemies.forEach(enemy => {
            if (!enemy.isDestroyed && 
                enemy.x < beamX && 
                enemy.x + enemy.width > beamX &&
                enemy.y < this.player.y) {
                this.damageEnemy(enemy);
            }
        });
    }

    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2.5,
            y: enemy.y + enemy.height,
            width: 5,
            height: 10,
            speed: 300
        });
        this.playSound('enemyLaser');
    }

    updateBullets(dt) {
        const currentTime = Date.now();
    
        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dirX * bullet.speed * dt;
            bullet.y += bullet.dirY * bullet.speed * dt;
            return bullet.x >= 0 && bullet.x <= GAME_WIDTH && bullet.y >= 0 && bullet.y <= GAME_HEIGHT;
        });
    
        // Update enemy bullets and missiles
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (bullet.angle !== undefined) {
                // This is a tracking missile
                if (currentTime - bullet.creationTime > 6000) {
                    return false; // Remove missile after 6 seconds
                }
                bullet.x += Math.cos(bullet.angle) * bullet.speed * dt;
                bullet.y += Math.sin(bullet.angle) * bullet.speed * dt;
                // Recalculate angle to track player
                bullet.angle = Math.atan2(this.player.y - bullet.y, this.player.x - bullet.x);
            } else {
                // Regular bullet
                bullet.y += bullet.speed * dt;
            }
    
            // Check collision with player bullets
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                if (this.checkCollision(this.bullets[i], bullet)) {
                    this.createParticles(bullet.x, bullet.y, 5, '#FF0000');
                    this.bullets.splice(i, 1);
                    return false; // Remove enemy bullet
                }
            }
    
            return bullet.y < GAME_HEIGHT && bullet.x > 0 && bullet.x < GAME_WIDTH;
        });
    
        // Handle constant beam damage
        if (this.constantBeamActive) {
            this.damageEnemiesInBeamPath();
            this.checkConstantBeamCollisions();
        }
    
        // Check for collisions
        this.checkBulletCollisions();
    }
    
    checkConstantBeamCollisions() {
        if (!this.constantBeamActive) return;
        const beamX = this.player.x + this.player.width / 2;
       
        // Check collisions with enemies
        this.enemies.forEach(enemy => {
            if (!enemy.isDestroyed &&
                enemy.x < beamX &&
                enemy.x + enemy.width > beamX &&
                enemy.y < this.player.y) {
                this.damageEnemy(enemy);
            }
        });
    
        // Check collisions with debuffs
        this.powerups = this.powerups.filter(powerup => {
            if (powerup.isDebuff &&
                powerup.x < beamX &&
                powerup.x + powerup.width > beamX &&
                powerup.y < this.player.y) {
                this.createParticles(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 10, '#FF0000');
                this.playSound('destroyed');
                return false; // Remove the debuff
            }
            return true;
        });
    
        // Check collisions with enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (bullet.x < beamX &&
                bullet.x + bullet.width > beamX &&
                bullet.y < this.player.y) {
                this.createParticles(bullet.x, bullet.y, 5, '#FF0000');
                return false; // Remove the enemy bullet
            }
            return true;
        });
    }

    createMissile(enemy) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        return {
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            width: 15,
            height: 25,
            speed: 60, 
            angle: angle + (Math.random() - 0.5) * 0.2, 
            creationTime: Date.now()
        };
    }
    
    enemyShootMissile(enemy) {
        this.enemyBullets.push(this.createMissile(enemy));
        this.playSound('missile');
    }

    spawnEnemies() {
        const currentTime = Date.now();
        if (currentTime - this.lastEnemySpawn > this.enemySpawnInterval) {
            for (let i = 0; i < this.enemySpawnRate; i++) {
                if (Math.random() < 0.2) {  // 20% chance to spawn the new enemy type
                    this.enemies.push(this.createEnemy(true));
                } else {
                    this.enemies.push(this.createEnemy(false));
                }
            }
            this.lastEnemySpawn = currentTime;
        }
    }

    createEnemy() {
        const isType2 = Math.random() < 0.3; // 30% chance for the new enemy type
        const width = isType2 ? 100 : 80;
        const height = isType2 ? 75 : 40; // Reduced heights for both enemy types
        return {
            x: Math.random() * (GAME_WIDTH - width),
            y: 50,
            width: width,
            height: height, // Use the new height
            isType2: isType2,
            health: isType2 ? 3 : 1,
            lastMoveDown: Date.now(),
            moveDownInterval: 10000,
            isDestroyed: false,
            destroyedTime: 0,
            lastShot: 0,
            shootInterval: isType2 ? this.maxEnemyShootInterval * 1.5 : this.maxEnemyShootInterval,
            spawnTime: Date.now() // Add spawn time to track when the enemy was created
        };
    }

    updateEnemies(dt) {
        const currentTime = Date.now();
        this.enemies.forEach((enemy, index) => {
            if (enemy.isDestroyed) {

                enemy.destroyedTime += dt;
                if (enemy.destroyedTime > 0.5) {
                    // Check for powerup drop
                    const dropRate = enemy.isType2 ? this.spacecraft2DropRate : this.spacecraftDropRate;
                    if (Math.random() < dropRate) {
                        this.powerups.push(this.createPowerup(enemy.x, enemy.y, false));
                    }
                    this.enemies.splice(index, 1);
                }
                return;
            }
    
            // Move enemies down
            if (currentTime - enemy.lastMoveDown > enemy.moveDownInterval) {
                enemy.y += 50; // Move down by 50 pixels
                enemy.lastMoveDown = currentTime;
            }
    
            // Move enemies horizontally
            enemy.x += this.enemySpeed * this.enemyDirection * dt;
    
            // Reverse direction if reaching screen edges
            if (enemy.x <= 0 || enemy.x + enemy.width >= GAME_WIDTH) {
                this.enemyDirection *= -1;
            }
    
            // Handle enemy shooting
            if (currentTime - enemy.spawnTime > this.missileShootDelay &&  // Apply delay to all enemy types
                currentTime - enemy.lastShot > enemy.shootInterval) {
                if (enemy.isType2) {
                    this.enemyShootMissile(enemy);
                } else {
                    this.enemyShoot(enemy);
                }
                enemy.lastShot = currentTime;
                
                // Adjust shoot interval based on difficulty
                enemy.shootInterval = Math.max(
                    this.minEnemyShootInterval,
                    enemy.isType2 ? this.maxEnemyShootInterval * 1.5 : this.maxEnemyShootInterval - (this.difficultyLevel - 1) * 1000
                );
            }
        });
    }

    resetPowerupEffects() {
        this.playerShield = false;
        if (this.shieldTimer) {
            clearTimeout(this.shieldTimer);
            this.shieldTimer = null;
        }
        this.rapidFire = false;
        this.constantBeam = null;
        this.lowGravity = false;
        this.highGravity = false;
        this.constantBeamActive = false; 
        this.slowMovement = false;
        this.fastGameSpeed = false;
        this.gameSpeed = 1;
        this.currentGravity = this.normalGravity;
        this.shootingCooldown = this.normalShootCooldown;
        this.platformSpeed = this.basePlatformSpeed;
        
        // Only reset player speed if player exists
        if (this.player) {
            this.player.speed = this.normalMoveSpeed;
        }
        
        // Clear any active powerup timers
        this.activePowerups.forEach((powerup, key) => {
            clearTimeout(powerup.timer);
        });
        this.activePowerups.clear();
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

    checkBulletCollisions() {
        // Check regular bullet collisions with enemies and debuffs
        this.bullets = this.bullets.filter(bullet => {
            let bulletHit = false;
            
            // Check collisions with enemies
            this.enemies.forEach(enemy => {
                if (!enemy.isDestroyed && this.checkCollision(bullet, enemy)) {
                    bulletHit = true;
                    this.damageEnemy(enemy);
                }
            });

            // Check collisions with debuffs
            this.powerups = this.powerups.filter(powerup => {
                if (powerup.isDebuff && this.checkCollision(bullet, powerup)) {
                    bulletHit = true;
                    this.createParticles(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 10, '#FF0000');
                    this.playSound('destroyed');
                    return false; // Remove the debuff
                }
                return true;
            });

            return !bulletHit;
        });
    
        // Check constant beam collisions
        if (this.constantBeam) {
            this.enemies.forEach(enemy => {
                if (!enemy.isDestroyed && 
                    enemy.x < this.constantBeam.x && 
                    enemy.x + enemy.width > this.constantBeam.x &&
                    enemy.y < this.player.y) {
                    this.damageEnemy(enemy);
                }
            });
        }
    
        // Check enemy bullet - player collisions
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            if (this.checkCollision(bullet, this.player)) {
                if (this.playerShield) {
                    // Destroy the bullet without ending the game
                    return false;
                } else {
                    this.gameOver = true;
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20, '#FF0000');
                    this.playSound('gameOver');
                    return false;
                }
            }
            return true;
        });
    }

    damageEnemy(enemy) {
        enemy.health--;
        this.playSound('destroyed');
        if (enemy.health <= 0) {
            enemy.isDestroyed = true;
            enemy.destroyedTime = 0;
            this.score += enemy.isType2 ? 3000 : 1000;
        }
    }


        checkPreciseCollision(player, enemy) {
        // Increase these values to make hitboxes larger
        const playerVisibleWidth = player.width * 0.7;
        const playerVisibleHeight = player.height * 0.7;
        const enemyVisibleWidth = enemy.width * 0.7;
        const enemyVisibleHeight = enemy.height * 0.7;
        
      
        // Player hitbox with shield consideration (if shield active)
        let playerHitboxX = player.x + (player.width - playerVisibleWidth) / 2;
        let playerHitboxY = player.y + (player.height - playerVisibleHeight) / 2;
        if (player.isShieldActive) {
          playerHitboxX += player.shieldOffsetX || 0; // Use default offset of 0 if not defined
          playerHitboxY += player.shieldOffsetY || 0; // Use default offset of 0 if not defined
        }
        const playerVisibleWidthAdjusted = player.isShieldActive ? (SHIELD_WIDTH || playerVisibleWidth) : playerVisibleWidth;
        const playerVisibleHeightAdjusted = player.isShieldActive ? (SHIELD_HEIGHT || playerVisibleHeight) : playerVisibleHeight;
      
        // Enemy hitbox calculations remain the same
        const enemyHitboxX = enemy.x + (enemy.width - enemyVisibleWidth) / 2;
        const enemyHitboxY = enemy.y + (enemy.height - enemyVisibleHeight) / 2;
      
        // Check for collision
        return !(playerHitboxX + playerVisibleWidthAdjusted <= enemyHitboxX ||
                 playerHitboxX >= enemyHitboxX + enemyVisibleWidth ||
                 playerHitboxY + playerVisibleHeightAdjusted <= enemyHitboxY ||
                 playerHitboxY >= enemyHitboxY + enemyVisibleHeight);
      }
      
    

      checkPlayerEnemyCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          if (!enemy.isDestroyed && this.checkPreciseCollision(this.player, enemy)) {
            if (this.playerShield) {
              // Destroy enemy and update score (same logic from previous response)
              this.destroyEnemy(enemy);
              this.enemies.splice(i, 1); // Remove the enemy from the array
            } else {
              // Player doesn't have shield, end the game
              this.gameOver = true;
              this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20, '#FF0000');
              this.playSound('gameOver');
              return; // Exit the function after handling the collision
            }
          }
        }
      }
      
      

    destroyEnemy(enemy) {
        enemy.isDestroyed = true;
        enemy.destroyedTime = 0;
        // Score increase is now handled in checkPlayerEnemyCollisions
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
        let lastY = GAME_HEIGHT; // Start from the bottom of the screen
    
        while (lastY > -GAME_HEIGHT) { // Generate platforms up to one screen height above the visible area
            lastY -= this.getRandomPlatformSpacing();
            platforms.push(this.createPlatform(lastY, false)); // Pass false to disallow spike platforms
        }
    
        return platforms;
    }

    
    createPlatform(y, allowSpikes = true) {
        const minWidth = 60;
        const maxWidth = 180;
        const width = Math.random() * (maxWidth - minWidth) + minWidth;
        
        const spikeChance = 0.01; // 1% chance for spike platforms

        return {
            x: Math.random() * (GAME_WIDTH - width),
            y: y,
            width: width,
            height: PLATFORM_HEIGHT,
            isGolden: Math.random() < 0.1,
            isSpike: allowSpikes && Math.random() < spikeChance,
            spriteIndex: Math.floor(Math.random() * 2)
        };
    }

    getRandomPlatformSpacing() {
        // Adjust these values to control the vertical spacing between platforms
        const minSpacing = PLAYER_HEIGHT * 1.2;
        const maxSpacing = PLAYER_HEIGHT * 2.2;
        return Math.random() * (maxSpacing - minSpacing) + minSpacing;
    }
    

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'ArrowUp') {
                this.jump();
            }
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent space from triggering button clicks
                this.shoot();
            }
            if (e.code === 'ArrowDown' && this.player.isOnGround) {
                this.lastFallThroughTime = Date.now();
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
            this.player.velocityY = this.JUMP_VELOCITY;
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
    
        dt *= this.gameSpeed;
    
        this.updateScrollSpeed();
        this.updatePlayer(dt);
        this.updatePlatforms(dt);
        this.updatePowerups(dt);
        this.updateParticles(dt);
        this.updateBullets(dt);
        this.updateEnemies(dt);
        this.checkPlayerEnemyCollisions();
        this.spawnEnemies();
        this.updateDifficulty();
        this.updateUI();
        this.updateBackground();
    
        if (this.constantBeamActive) {
            this.checkConstantBeamCollisions();
        }
    }

    
    
    updateBackground() {
        if (this.score - this.lastBackgroundChange >= this.backgroundChangeThreshold) {
            this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % 16;
            this.lastBackgroundChange = this.score;
            
        }
    }

    
    handleCollisions(currentTime) {
        const platforms = [this.bottomPlatform, ...this.platforms].filter(Boolean);
        this.player.isOnGround = false;
    
        for (let platform of platforms) {
            if (this.checkCollision(this.player, platform)) {
                // Ignore collision if we're in the fall-through delay period
                if (currentTime - this.lastFallThroughTime < this.fallThroughDelay) {
                    continue;
                }

                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= platform.y + 5) { // Added small tolerance
                    // Landing on top of the platform
                    this.player.y = platform.y - this.player.height + 14; // Adjust this value as needed
                    this.player.velocityY = 0;
                    this.player.isOnGround = true;
                    this.player.jumpCount = 0; // Reset jump count when landing
                    console.log('Player landed on platform');
                } else if (this.player.velocityY < 0 && this.player.y >= platform.y + platform.height) {
                    // Hitting the bottom of the platform when jumping up
                    this.player.y = platform.y + platform.height;
                    this.player.velocityY = 0;
                    console.log('Player hit bottom of platform');
                }
    
                if (platform.isGolden) {
                    this.handleGoldenPlatform();
                } else if (platform.isSpike) {
                    this.gameOver = true;
                    console.log('Game over: Player hit spike platform');
                    return;
                }
            }
        }
    }


    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    

    handleGoldenPlatform() {
        this.player.velocityY = this.JUMP_VELOCITY * 1.5;
        this.score += 15;
        this.triggerScreenShake(5, 0.3);
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height, 15, '#3FE1B0');
        this.playSound('powerup');
    }

    updatePlatforms(dt) {
    // Update bottom platform timer
    if (this.gameStarted && this.bottomPlatform) {
        this.bottomPlatformTimer += dt * this.gameSpeed;
        if (this.bottomPlatformTimer >= this.bottomPlatformDuration) {
            this.bottomPlatform = null;
        }
    }

    // Move existing platforms down
    this.platforms.forEach(platform => {
        platform.y += this.currentScrollSpeed * dt;
    });

    // Remove platforms that are below the bottom of the screen
    this.platforms = this.platforms.filter(platform => platform.y <= GAME_HEIGHT);

    // Add new platforms if needed
    while (this.platforms.length < this.platformCount) {
        const highestPlatform = this.platforms.reduce((highest, platform) => 
            platform.y < highest.y ? platform : highest, 
            {y: GAME_HEIGHT}
        );
        
        const newY = highestPlatform.y - this.minPlatformDistance - Math.random() * (PLAYER_HEIGHT * 0.5);
        this.platforms.push(this.createPlatform(newY, true));
    }

    // Update blocks climbed
    if (this.platforms.length > 0) {
        const lowestPlatformY = Math.min(...this.platforms.map(p => p.y));
        const newBlocksClimbed = Math.max(0, Math.floor(-lowestPlatformY / PLATFORM_HEIGHT));
        if (newBlocksClimbed > this.blocksClimbed) {
            this.blocksClimbed = newBlocksClimbed;
        }
    }
}



    updatePlayer(dt) {
        if (!this.player) {
            console.warn('Player is null in updatePlayer');
            return;
        }

        const currentTime = Date.now();

        // Adjust player's y position based on scroll speed
        this.player.y += this.currentScrollSpeed * dt;

    
        // Apply gravity (use this.gameSpeed instead of this.normalGameSpeed)
        this.player.velocityY += this.currentGravity * dt * this.gameSpeed;
        
        if (this.highGravity && this.player.velocityY > 0) {
            this.player.velocityY *= 1.1; // Increase downward velocity by 10%
        }
        
        // Horizontal movement (adjusted for slow movement debuff)
        let moveSpeed = this.slowMovement ? this.player.speed : this.normalMoveSpeed;
        
        if (this.keys['ArrowLeft']) {
            this.player.velocityX = -moveSpeed;
        } else if (this.keys['ArrowRight']) {
            this.player.velocityX = moveSpeed;
        } else {
            this.player.velocityX = 0;
        }

        // Falling through platforms
        if (this.keys['ArrowDown'] && this.player.isOnGround) {
            this.lastFallThroughTime = currentTime;
            this.player.isOnGround = false;
            this.player.y += 1; // Move the player down slightly to trigger the fall
        }
    
        // Update position (use this.gameSpeed)
        this.player.x += this.player.velocityX * dt * this.gameSpeed;
        this.player.y += this.player.velocityY * dt * this.gameSpeed;

        // Wrap-around logic for horizontal movement
        if (this.player.x + this.player.width < 0) {
            this.player.x = GAME_WIDTH;
        } else if (this.player.x > GAME_WIDTH) {
            this.player.x = -this.player.width;
        }

        // Keep player within vertical game bounds
        this.player.y = Math.max(0, Math.min(this.player.y, GAME_HEIGHT - this.player.height));

    
        // Check for platform collisions
        this.handleCollisions(currentTime);
    
        // Reset jump count when on ground
        if (this.player.isOnGround) {
            this.player.jumpCount = 0;
        }
    
        // Check if player has fallen off the screen
        if (this.player.y >= GAME_HEIGHT - this.player.height) {
            this.gameOver = true;
            console.log('Game over: Player fell off screen');
        }
    }

    
    handleGameOver() {
        this.gameRunning = false;
        this.gameOver = true;

        // Stop any ongoing sounds
        Object.values(sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        
    
        this.playSound('gameOver');
        window.gameStartTime = this.gameStartTime; // Ensure this is set correctly
        handleGameOver(this.score, this.blocksClimbed, this.gameStartTime);
    }

    drawBackground() {
        const bg = backgrounds[this.currentBackgroundIndex];
        if (bg.image && bg.image.complete) {
            // Draw the background image
            const pattern = this.ctx.createPattern(bg.image, 'repeat');
            this.ctx.fillStyle = pattern;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        } else {
            // Fallback to color if image is not loaded
            this.ctx.fillStyle = bg.color;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    }


    

    updatePowerups(dt) {
        const currentTime = Date.now();
    
        // Update existing powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            
            // If powerup has been removed (e.g., by tezosX), skip processing
            if (!powerup) continue;
            
            // Move powerup down
            powerup.y += this.platformSpeed * dt * this.gameSpeed;
    
            // If it's a debuff, make it drift towards the player
            if (powerup.isDebuff && this.player) {
                const dx = this.player.x - powerup.x;
                const dy = this.player.y - powerup.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    const directionX = dx / distance;
                    const directionY = dy / distance;
                    powerup.x += directionX * this.debuffDriftSpeed * dt;
                    powerup.y += directionY * this.debuffDriftSpeed * dt;
                }
            }
    
            if (this.checkCollision(this.player, powerup)) {
                if (powerup.isDebuff && this.playerShield) {
                    // If it's a debuff and the player has a shield, destroy the powerup without applying it
                    this.createParticles(powerup.x, powerup.y, 10, '#FFD700');
                } else {
                    this.applyPowerUpEffect(powerup.type);
                }
                this.powerups.splice(i, 1);
            } else if (powerup.y > GAME_HEIGHT) {
                this.powerups.splice(i, 1);
            }
        }
    
        // Random debuff spawn logic
    if (currentTime - this.lastDebuffSpawn > this.debuffSpawnInterval) {
        if (Math.random() < this.debuffDropRate) {
            const x = Math.random() * (GAME_WIDTH - 30);
            this.powerups.push(this.createPowerup(x, 0, true));
            this.lastDebuffSpawn = currentTime;
        } else {
            // Even if we don't spawn a debuff, update the last spawn time
            this.lastDebuffSpawn = currentTime;
        }
    }
    
    }

    collectNomadicPowerup() {
        this.nomadicPowerupLevel = Math.min(this.nomadicPowerupLevel + 1, 4);
        this.playSound('powerup');
    }


    createPowerup(x, y, isDebuff = false, forceNomadic = false) {
        if (forceNomadic) {
            return {
                x: x,
                y: y,
                width: 30,
                height: 30,
                type: 'nomadic',
                isDebuff: false
            };
        }
    
        let powerupPool;
        if (isDebuff) {
            powerupPool = ['solana', 'blast', 'ethereum'];
        } else {
            powerupPool = ['bitcoin', 'greenTezos', 'etherLink', 'mintTezos', 'tezosX'];
        }
        
        // Shuffle the powerup pool for better randomness
        powerupPool = this.shuffleArray(powerupPool);
        
        const type = powerupPool[0]; // Take the first item from the shuffled array
        
        return {
            x: x,
            y: y,
            width: 30,
            height: 30,
            type: type,
            isDebuff: isDebuff
        };
    }




    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    applyPowerUpEffect(type) {
        const currentTime = Date.now();
        
        switch(type) {
            case 'bitcoin':
                this.playerShield = true;
                if (this.shieldTimer) {
                    clearTimeout(this.shieldTimer);
                }
                this.shieldTimer = setTimeout(() => { 
                    this.playerShield = false;
                    this.shieldTimer = null;
                }, 30000);
                break;
                case 'nomadic':
                    this.nomadicPowerupLevel = Math.min(this.nomadicPowerupLevel + 1, 4);
                    this.playSound('powerup');
                    break;

                case 'greenTezos':
                this.rapidFire = true;
                this.shootingCooldown = this.normalShootCooldown * 0.3;
                setTimeout(() => { 
                    this.rapidFire = false; 
                    this.shootingCooldown = this.normalShootCooldown;
                }, 30000);
                break;
                case 'etherLink':
                this.constantBeamActive = true;
                setTimeout(() => { 
                    this.constantBeamActive = false;
                }, 30000);
                break;
                    case 'mintTezos':
                        this.lowGravity = true;
                        this.currentGravity = this.normalGravity * 0.5;
                        setTimeout(() => { 
                            this.lowGravity = false; 
                            this.currentGravity = this.normalGravity;
                        }, 30000);
                        break;
                        case 'tezosX':
                // Clear all enemies
                this.enemies.forEach(enemy => {
                    enemy.isDestroyed = true;
                    enemy.destroyedTime = 0;
                    this.score += enemy.isType2 ? 3000 : 1000;
                });
                
                // Clear all debuff powerups from the screen
                this.powerups = this.powerups.filter(powerup => !powerup.isDebuff);
                
                // Clear all active debuffs
                this.clearActiveDebuffs();
                
                break;
                case 'solana':
                this.fastGameSpeed = true;
                this.gameSpeed = 1.2; // 1.2x normal speed
                this.platformSpeed = this.basePlatformSpeed * 1.2;
                const solanaTimer = setTimeout(() => { 
                    this.fastGameSpeed = false;
                    this.gameSpeed = 1; // Reset to normal speed
                    this.platformSpeed = this.basePlatformSpeed; // Reset to base speed
                }, 5000); // 5 seconds duration
                this.activePowerups.set('solana', { timer: solanaTimer, duration: 12000 });
                break;
            case 'blast':
                this.highGravity = true;
                this.currentGravity = this.normalGravity * 1.5;
                setTimeout(() => { 
                    this.highGravity = false; 
                    this.currentGravity = this.normalGravity;
                }, 10000);
                break;
            case 'ethereum':
                this.slowMovement = true;
                this.player.speed = this.normalMoveSpeed * 0.25;
                setTimeout(() => { 
                    this.slowMovement = false; 
                    this.player.speed = this.normalMoveSpeed;
                }, 20000);
                break;
        }
        
        this.playSound('powerup');
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    clearActiveDebuffs() {
        // Reset high gravity
        this.highGravity = false;
        this.currentGravity = this.normalGravity;

        // Reset slow movement
        this.slowMovement = false;
        if (this.player) {
            this.player.speed = this.normalMoveSpeed;
        }

        // Reset fast game speed (Solana debuff)
        this.fastGameSpeed = false;
        this.gameSpeed = 1;
        this.platformSpeed = this.basePlatformSpeed;

        // Clear any active debuff timers
        if (this.activePowerups.has('solana')) {
            clearTimeout(this.activePowerups.get('solana').timer);
            this.activePowerups.delete('solana');
        }
        if (this.activePowerups.has('blast')) {
            clearTimeout(this.activePowerups.get('blast').timer);
            this.activePowerups.delete('blast');
        }
        if (this.activePowerups.has('ethereum')) {
            clearTimeout(this.activePowerups.get('ethereum').timer);
            this.activePowerups.delete('ethereum');
        }

        // Add visual feedback for clearing debuffs
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 30, '#00FF00');
    } 


    updateDifficulty() {
        this.difficultyLevel = Math.floor(this.score / 5000) + 1;
        this.platformSpeed = 50 + (this.difficultyLevel - 1) * 2;
    
        // Update enemy spawn rate
        this.enemySpawnRate = Math.min(5, Math.floor(this.score / 5000) + 1);
    
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
            
            // Check if it's time to drop a nomadic powerup
            if (this.score - this.lastPowerupScore >= 5000) {
                const x = Math.random() * (GAME_WIDTH - 30);
                const y = 0; // Drop from the top of the screen
                this.powerups.push(this.createPowerup(x, y, false, true)); // Force nomadic powerup
                this.lastPowerupScore = this.score;
                console.log('Nomadic powerup dropped at score:', this.score);
            }
        }
    }

    draw() {
        if (!this.ctx) {
            console.error('Canvas context is not initialized');
            return;
        }

    
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save the current context state
        this.ctx.save();
        
        // Apply scaling
        const scaleX = this.canvas.width / GAME_WIDTH;
        const scaleY = this.canvas.height / GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        this.ctx.scale(scale, scale);
        
        // Draw background
        this.drawBackground();
        
        // Draw game elements
        this.drawPlatforms();
        this.drawConstantBeam();
        this.drawPlayer();
        this.drawEnemyBullets();
        this.drawPowerups();
        this.drawParticles();
        this.drawBullets();
        if (this.constantBeamActive) {
            this.drawConstantBeam();
        }
        this.drawEnemies();
    
        // Restore the context state
        this.ctx.restore();
    
        // Draw HUD elements (fixed to screen)
        this.drawHUD();
        this.drawPowerupHUD();
    }

    drawPlatforms() {
        for (let platform of this.platforms) {
            // Only draw platforms that are within or partially within the screen
            if (platform.y + platform.height > 0 && platform.y < GAME_HEIGHT) {
                let sprite;
                if (platform.isSpike) {
                    sprite = this.platformSprites.spike;
                } else if (platform.isGolden) {
                    sprite = this.platformSprites.golden;
                } else {
                    sprite = this.platformSprites.normal[platform.spriteIndex];
                }
    
                this.ctx.drawImage(sprite, platform.x, platform.y, platform.width, PLATFORM_HEIGHT);
            }
        }
        
        if (this.bottomPlatform) {
            this.ctx.drawImage(this.platformSprites.normal[0], this.bottomPlatform.x, this.bottomPlatform.y, this.bottomPlatform.width, PLATFORM_HEIGHT);
        }
    }

    drawBullets() {
        this.ctx.fillStyle = '#00FF00';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }

    drawConstantBeam() {
        if (this.constantBeamActive) {
            const beamX = this.player.x + this.player.width / 2;
            this.ctx.strokeStyle = '#00FFFF'; // Cyan color for the beam
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(beamX, this.player.y);
            this.ctx.lineTo(beamX, 0);
            this.ctx.stroke();
        }
    }

    drawEnemyBullets() {
        this.ctx.fillStyle = '#FF0000';
        for (let bullet of this.enemyBullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }

        // Draw constant beam
        if (this.constantBeam) {
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = this.constantBeam.width;
            this.ctx.beginPath();
            this.ctx.moveTo(this.constantBeam.x, this.player.y);
            this.ctx.lineTo(this.constantBeam.x, 0);
            this.ctx.stroke();
        }
    }

    drawEnemies() {
        for (let enemy of this.enemies) {
            const sprite = enemy.isDestroyed ? 
                (enemy.isType2 ? this.enemyType2DestroyedSprite : this.enemyDestroyedSprite) : 
                (enemy.isType2 ? this.enemyType2Sprite : this.enemySprite);
            
            this.ctx.drawImage(
                sprite, 
                enemy.x, 
                enemy.y,
                enemy.width, 
                enemy.height
            );
        }
    }

    checkCollision(obj1, obj2) {
        // Check normal collision
        if (this.normalCollision(obj1, obj2)) return true;

        // Check wrap-around collision
        const wrappedObj1 = {
            x: obj1.x < GAME_WIDTH / 2 ? obj1.x + GAME_WIDTH : obj1.x - GAME_WIDTH,
            y: obj1.y,
            width: obj1.width,
            height: obj1.height
        };

        return this.normalCollision(wrappedObj1, obj2);
    }

    normalCollision(obj1, obj2) {
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
    
        const drawPlayerAt = (x, y) => {
            if (this.playerShield) {
                this.ctx.beginPath();
                this.ctx.arc(x + this.player.width / 2, y + this.player.height / 2, 
                             Math.max(this.player.width, this.player.height) / 2 + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; // Golden color for the shield
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
    
            const playerSprite = sprites.get('player');
            if (playerSprite && playerSprite.complete) {
                this.ctx.drawImage(playerSprite, 
                                   Math.round(x), Math.round(y), 
                                   this.player.width, this.player.height);
            } else {
                this.ctx.fillStyle = '#00FF00';  // Bright green color
                this.ctx.fillRect(Math.round(x), Math.round(y), 
                                  this.player.width, this.player.height);
            }
        };
    
        // Draw main player
        drawPlayerAt(this.player.x, this.player.y);
    
        // Draw wrap-around player if necessary
        if (this.player.x + this.player.width > GAME_WIDTH) {
            drawPlayerAt(this.player.x - GAME_WIDTH, this.player.y);
        } else if (this.player.x < 0) {
            drawPlayerAt(this.player.x + GAME_WIDTH, this.player.y);
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
        // HUD elements should be drawn relative to the canvas, not the game world
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transformation

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Orbitron, sans-serif';
        this.ctx.fillText(`Tez Price: ${this.score}`, 10, 30);
        this.ctx.fillText(`Blocks Climbed: ${this.blocksClimbed}`, 10, 60);

        // Draw active powerups/debuffs
        let yOffset = 90;
        if (this.playerShield) this.drawPowerupIndicator('Shield', yOffset += 30);
        if (this.rapidFire) this.drawPowerupIndicator('Rapid Fire', yOffset += 30);
        if (this.constantBeamActive) this.drawPowerupIndicator('Constant Beam', yOffset += 30);
        if (this.lowGravity) this.drawPowerupIndicator('Low Gravity', yOffset += 30);
        if (this.highGravity) this.drawPowerupIndicator('High Gravity', yOffset += 30);
        if (this.slowMovement) this.drawPowerupIndicator('Slow Movement', yOffset += 30);
        if (this.gameSpeed > 1) this.drawPowerupIndicator('Fast Game', yOffset += 30);

        this.ctx.restore();
    }

    drawPowerupIndicator(text, y) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Orbitron, sans-serif';
        this.ctx.fillText(text, 10, y);
    }

    drawPowerupHUD() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transformation

        const powerupSize = 20;
        const padding = 10;
        const barHeight = 5;
        const powerupSpacing = 35; // Increased spacing between powerups
        let xOffset = this.canvas.width - padding;
    
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

        this.ctx.restore();
    }


    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        if (!this.lastTime) this.lastTime = currentTime;
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        console.log('Game loop running, delta time:', deltaTime);
        
        this.update(deltaTime);
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
    if (game && game.sounds) {
        Object.values(game.sounds).forEach(sound => {
            sound.muted = !isSoundOn;
        });
    }
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
        justifyContent: 'flex-start',
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
        marginTop: '190px',
        marginBottom: '20px'
    });

    messageElement.innerHTML = message.replace(/\n/g, '<br>'); // Replace newlines with <br> tags
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
            } else if (buttonText === 'Buy Tries') {
                await handleBuyTries();
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
        { name: 'player', file: 'TezosLogo_Icon_Bluesmall.png' },
        { name: 'bitcoin', file: 'bitcoin.png' },
        { name: 'solana', file: 'solana.png' },
        { name: 'ethereum', file: 'ethereum1.png' },
        { name: 'etherLink', file: 'Etherlink.png' },
        { name: 'greenTezos', file: 'greenTezos.png' },
        { name: 'nomadic', file: 'nomadic.png' },
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
            .then(img => {
                bg.image = img;
                console.log(`Background ${index + 1} loaded successfully`);
            })
            .catch(error => { 
                console.error(`Failed to load background ${index + 1}:`, error);
                // Keep the fallback color
            })
    )).then(() => {
        console.log('All backgrounds loaded');
    }).catch(error => {
        console.error('Error loading backgrounds:', error);
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
                showStartButton();
            }, true, 'OK');
        } else {
            showOverlay('Failed to purchase Game tries. Please try again.', checkAndDisplayStartButton, true, 'OK');
        }
    } catch (error) {
        console.error('Failed to purchase game tries:', error);
        showOverlay('Error purchasing Game tries. Please try again.', checkAndDisplayStartButton, true, 'OK');
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

    console.log('Game over. Start time:', gameStartTime, 'Score:', score, 'Blocks climbed:', blocksClimbed);

    // Show the game over overlay with the name form and Try Again button
    showOverlay(`<h2>Game Over</h2>Tezos Price: ${score}<br>Blocks Climbed: ${blocksClimbed}`, null, false, '', true);
}

  
async function handleScoreSubmission(name) {
    if (!checkWalletConnection()) return;

    try {
        showOverlay("Checking game state...");
        
        const contract = getContract(); // Get the contract instance
        const account = getCurrentAccount(); // Get the current account

        if (!contract) {
            console.error('Contract not initialized');
            showOverlay('Error: Contract not initialized. Please refresh and try again.', null, true, 'Refresh');
            return;
        }

        if (!account) {
            console.error('Account not available');
            showOverlay('Error: Account not available. Please connect your wallet and try again.', null, true, 'Connect Wallet');
            return;
        }

        // Check contract state
        const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
        const gameTries = await contract.methods.getGameTries(account).call();
        console.log('Contract state - Last game start time:', lastGameStartTime, 'Remaining tries:', gameTries);

        if (parseInt(gameTries) <= 0) {
            showOverlay('No game tries remaining. Please purchase more.', null, true, 'Buy Tries');
            return;
        }

        showOverlay("Submitting score to Etherlink...");
        console.log('Submitting score with:', {
            name,
            score: window.finalScore,
            blocksClimbed: window.blocksClimbed,
            gameStartTime: window.gameStartTime
        });

        const submitted = await submitScore(name, window.finalScore, window.blocksClimbed, window.gameStartTime);
        
        if (submitted) {
            await updateHighscoreTable();
            showOverlay('Score submitted successfully!', async () => {
                await checkAndDisplayStartButton();
            }, true, 'Play Again');
        } else {
            showOverlay('Failed to submit score. Please try again.', null, true, 'Try Again');
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        showOverlay('An error occurred while submitting your score. Please try again.', null, true, 'Try Again');
    }
}

async function checkContractState() {
    try {
        const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
        console.log('Last game start time from contract:', lastGameStartTime);
        
        const gameTries = await contract.methods.getGameTries(account).call();
        console.log('Remaining game tries:', gameTries);
        
        // Add any other relevant contract state checks here
        
        return true;
    } catch (error) {
        console.error('Error checking contract state:', error);
        return false;
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
