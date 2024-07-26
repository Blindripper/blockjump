import { initWeb3, isContractInitialized, connectWallet,getContractBalance, startGame as startGameWeb3, getGameTries, purchaseGameTries, getHighscores,bribeLeader, submitScore, claimPrize, getContract, getCurrentAccount,approveJumpSpending, addFunds,} from './web3Integration.js';
import { loadUserAchievements, updateGameStats } from './achievements.js';
import { PlayerUpgrades, UPGRADES } from './upgrades.js';
import { checkpointManager } from './checkpointManager.js';

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
const PLATFORM_HEIGHT = 43;
const PLAYER_WIDTH = 65;
const PLAYER_HEIGHT = 95;
const pressedKeys = {};
const SHIELD_WIDTH = PLAYER_WIDTH * 1.1; 
const SHIELD_HEIGHT = PLAYER_HEIGHT *1.1;


// Game class
class Game {
    constructor() {
        this.nextBackgroundIndex = 0;
        this.lastShieldBlockTime = 0;
        this.baseScrollSpeed = 65; // Base scrolling speed
        this.minPlatformDistance = PLAYER_HEIGHT * 1.5; // Minimum vertical distance between platforms
        this.currentScrollSpeed = this.baseScrollSpeed;
        this.maxScrollSpeed = this.baseScrollSpeed * 2; // Maximum scrolling speed
        this.scrollSpeedIncreaseFactor = 1.5; // How much to increase the speed
        this.debugMode = false;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isConnected = false;
        this.playerUpgrades = new PlayerUpgrades();
        this.bombKey = 'KeyE';
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
        this.nomadicPowerupLevel = 0;
        this.blocksClimbed = 0;
        this.gameStartTime = 0;
        this.lastTime = 0;
        this.platforms = [];
        this.powerups = [];
        this.powerupsCollected = 0;
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
        this.baseEnemySpawnInterval = 30000; // 30 seconds
        this.enemySpawnInterval = this.baseEnemySpawnInterval;
        this.enemySpawnRate = 1; // Start with 1 enemy per spawn
        this.lastShotTime = 0;
        this.shootingCooldown = 900; // 0.9 seconds
        this.enemySpeed = 50;
        this.jump;
        this.powerupDropRate = 0.25; // 50% chance for an enemy to drop a powerup when killed
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
            this.enemySpawnRate = 1;
            this.enemySpawnInterval = this.baseEnemySpawnInterval;
            this.lastEnemySpawn = 0;
            this.activePowerups.clear();
            this.nomadicPowerupLevel = 0;

            this.enemyBullets = [];
            this.gameStarted = true;
            this.difficultyLevel = 1;
            this.platforms = this.createInitialPlatforms();
            this.gameStarted = false;
            this.hasPlayerJumped = false;
            this.score = 0;
            this.player = this.createPlayer();
            this.gameRunning = true;
            this.gameOver = false;
            this.blocksClimbed = 0;
            this.lastTime = performance.now();
            this.lastPowerupScore = 0;
            this.constantBeamActive = false;
            this.powerups = [];
            this.lastBackgroundChange = 0;
            this.currentBackgroundIndex = 0;


            setTimeout(() => {
                this.bottomPlatform = null;
            }, 5000);
    
            await updateTryCount();
            
            if (this.debugMode) {
                this.logGameState('After initialization');
            }
    
            // Start the game loop
            requestAnimationFrame((time) => this.gameLoop(time));
            } catch (error) {
            console.error('Error initializing game:', error);
            showOverlay('Error starting game. Please try again.');
        } finally {
            hideOverlay(); 
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

    updateAchievements() {
        const stats = {
            score: this.score,
            blocksClimbed: this.blocksClimbed,
            powerupsCollected: this.powerupsCollected
        };
        updateGameStats(stats);
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

    createJumpEffect() {
        // Create particles at the player's feet
        const particleCount = 10;
        const particleColor = '#FFFFFF'; // White particles
    
        for (let i = 0; i < particleCount; i++) {
            this.createParticles(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height,
                1,
                particleColor
            );
        }
    
        // Play jump sound
        this.playSound('jump');
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
    
            // Check collision with player
            if (this.checkCollision(bullet, this.player)) {
                if (this.playerShield) {
                    // Bitcoin shield active, destroy the bullet without ending the game
                    this.createParticles(bullet.x, bullet.y, 5, '#FFD700');
                    return false;
                } else if (this.player.upgradeShieldHits > 0) {
                    // Upgrade shield active
                    this.player.upgradeShieldHits--;
                    this.createParticles(bullet.x, bullet.y, 5, '#0000FF');
                    return false;
                } else {
                    // No shield active, end the game
                    this.gameOver = true;
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20, '#FF0000');
                    this.playSound('gameOver');
                    return false;
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
                    this.score += 400;
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
            this.score += enemy.isType2 ? 800 : 500;
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
                    // Bitcoin shield active, destroy enemy without decreasing shield
                    this.destroyEnemy(enemy);
                    this.enemies.splice(i, 1);
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10, '#FFD700');
                } else if (this.player.upgradeShieldHits > 0) {
                    // Upgrade shield active
                    this.destroyEnemy(enemy);
                    this.enemies.splice(i, 1);
                    this.player.upgradeShieldHits--;
                    this.createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10, '#0000FF');
                } else {
                    // No shield active, end the game
                    this.gameOver = true;
                    this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 20, '#FF0000');
                    this.playSound('gameOver');
                    return;
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
        const player = {
            x: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
            y: GAME_HEIGHT - PLAYER_HEIGHT - PLATFORM_HEIGHT - 1,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            speed: 300,
            maxJumps: 2, // Default to double jump
            upgradeShieldHits: 0, // New property for upgrade shield
            velocityY: 0,
            velocityX: 0,
            jumpCount: 0,
            isOnGround: false,
            isMovingLeft: false,
            isMovingRight: false,
            isShooting: false,
            lastDirection: 'right',
        };
    
        // Apply upgrades
        const speedEffect = this.playerUpgrades.getEffect('speed');
        if (speedEffect) player.speed *= speedEffect;
    
        const jumpEffect = this.playerUpgrades.getEffect('jump');
        if (jumpEffect) {
            player.maxJumps = jumpEffect.jumps; // This should be 3 for triple jump
            this.JUMP_VELOCITY *= jumpEffect.height;
        }
    
        const shieldEffect = this.playerUpgrades.getEffect('shield');
        if (shieldEffect) player.upgradeShieldHits = shieldEffect;
    
        const rapidEffect = this.playerUpgrades.getEffect('rapid');
        if (rapidEffect) this.shootingCooldown *= rapidEffect;
    
        return player;
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
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.jump();
            }
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent space from triggering button clicks
                this.shoot();
            }
            if ((e.code === 'ArrowDown' || e.code === 'KeyS') && this.player.isOnGround) {
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
        if (this.player.jumpCount < this.player.maxJumps) {
            this.player.velocityY = this.JUMP_VELOCITY;
            this.player.jumpCount++;
            this.player.isOnGround = false;
            this.createJumpEffect();
    
            if (!this.hasPlayerJumped) {
                this.hasPlayerJumped = true;
            }
        }
    }


    update(dt) {
        if (this.gameOver) {
            this.handleGameOver();
            return;
        }

        // Check for checkpoints
        checkpointManager.checkCheckpoint(this.blocksClimbed);


         // Check for bomb usage
         if (this.keys[this.bombKey] && this.playerUpgrades.useBomb()) {
            this.activateBomb();
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

    activateBomb() {
        this.enemies = [];
        this.powerups = this.powerups.filter(powerup => !powerup.isDebuff);
        this.clearActiveDebuffs();
        this.createParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 30, '#FF0000');
        this.playSound('explosion');  // Add this sound to your sound effects
    }

    
    
    updateBackground() {
        const targetBackgroundIndex = Math.floor(this.score / this.backgroundChangeThreshold) % backgrounds.length;
        
        if (targetBackgroundIndex !== this.currentBackgroundIndex) {
            // If we've reached the prepared next background, switch to it
            if (targetBackgroundIndex === this.nextBackgroundIndex) {
                this.currentBackgroundIndex = this.nextBackgroundIndex;
                // Prepare the next background
                this.nextBackgroundIndex = (this.currentBackgroundIndex + 1) % backgrounds.length;
            } else {
                // If we've skipped backgrounds, catch up
                this.currentBackgroundIndex = targetBackgroundIndex;
                this.nextBackgroundIndex = (targetBackgroundIndex + 1) % backgrounds.length;
            }
        }
    }

    
    handleCollisions(currentTime) {
        const platforms = [this.bottomPlatform, ...this.platforms].filter(Boolean);
        let wasOnGround = this.player.isOnGround;
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
    
                    // Increment blocksClimbed if the player wasn't on ground before
                    if (!wasOnGround) {
                        this.blocksClimbed++;
                    }
    
                } else if (this.player.velocityY < 0 && this.player.y >= platform.y + platform.height) {
                    // Hitting the bottom of the platform when jumping up
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
    }
    

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    

    handleGoldenPlatform() {
        this.player.velocityY = this.JUMP_VELOCITY * 1.5;
        this.score += 50;
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

}



updatePlayer(dt) {
    if (!this.player) {
        console.warn('Player is null in updatePlayer');
        return;
    }

    // Update player state
    this.player.isMovingLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
    this.player.isMovingRight = this.keys['ArrowRight'] || this.keys['KeyD'];
    this.player.isShooting = this.keys['Space'];

    if (this.player.isMovingLeft) this.player.lastDirection = 'left';
    if (this.player.isMovingRight) this.player.lastDirection = 'right';
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
    
    // Check for both arrow keys and WASD
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
        this.player.velocityX = -moveSpeed;
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
        this.player.velocityX = moveSpeed;
    } else {
        this.player.velocityX = 0;
    }

    // Falling through platforms
    if ((this.keys['ArrowDown'] || this.keys['KeyS']) && this.player.isOnGround) {
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
            // Calculate scaling factors
            const scaleX = GAME_WIDTH / bg.image.width;
            const scaleY = GAME_HEIGHT / bg.image.height;
            const scale = Math.max(scaleX, scaleY); // Use max to cover the entire canvas
    
            // Calculate dimensions of the scaled image
            const scaledWidth = bg.image.width * scale;
            const scaledHeight = bg.image.height * scale;
    
            // Calculate position to center the image
            const x = (GAME_WIDTH - scaledWidth) / 2;
            const y = (GAME_HEIGHT - scaledHeight) / 2;
    
            // Draw the scaled image
            this.ctx.drawImage(bg.image, x, y, scaledWidth, scaledHeight);
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
                if (powerup.isDebuff && (this.playerShield || this.player.upgradeShieldHits > 0)) {
                    // If it's a debuff and the player has any shield, destroy the powerup without applying it
                    this.createParticles(powerup.x, powerup.y, 10, this.playerShield ? '#FFD700' : '#0000FF');
                    if (this.player.upgradeShieldHits > 0 && !this.playerShield) {
                        this.player.upgradeShieldHits--; // Decrease upgrade shield hits if it's not a bitcoin shield
                    }
                    this.lastShieldBlockTime = currentTime; // Update the last shield block time
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
        let duration = 30000; // Default duration of 30 seconds for most powerups
    


        switch(type) {
            case 'bitcoin':
                this.playerShield = true;
                if (this.shieldTimer) {
                    clearTimeout(this.shieldTimer);
                }
                this.shieldTimer = setTimeout(() => { 
                    this.playerShield = false;
                    this.shieldTimer = null;
                    this.activePowerups.delete('bitcoin');
                }, duration);
                this.activePowerups.set('bitcoin', { timer: this.shieldTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'nomadic':
                this.nomadicPowerupLevel = Math.min(this.nomadicPowerupLevel + 1, 4);
                // Nomadic doesn't have a duration, so we don't add it to activePowerups
                break;
            case 'greenTezos':
                this.rapidFire = true;
                this.shootingCooldown = this.normalShootCooldown * 0.3;
                const greenTezosTimer = setTimeout(() => { 
                    this.rapidFire = false; 
                    this.shootingCooldown = this.normalShootCooldown;
                    this.activePowerups.delete('greenTezos');
                }, duration);
                this.activePowerups.set('greenTezos', { timer: greenTezosTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'etherLink':
                this.constantBeamActive = true;
                const etherLinkTimer = setTimeout(() => { 
                    this.constantBeamActive = false;
                    this.activePowerups.delete('etherLink');
                }, duration);
                this.activePowerups.set('etherLink', { timer: etherLinkTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'mintTezos':
                this.lowGravity = true;
                this.currentGravity = this.normalGravity * 0.5;
                const mintTezosTimer = setTimeout(() => { 
                    this.lowGravity = false; 
                    this.currentGravity = this.normalGravity;
                    this.activePowerups.delete('mintTezos');
                }, duration);
                this.activePowerups.set('mintTezos', { timer: mintTezosTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'tezosX':
                this.powerupsCollected++;
                // Clear all enemies
                this.enemies.forEach(enemy => {
                    enemy.isDestroyed = true;
                    enemy.destroyedTime = 0;
                    this.score += enemy.isType2 ? 800 : 500;
                });
                // Clear all debuff powerups from the screen
                this.powerups = this.powerups.filter(powerup => !powerup.isDebuff);
                // Clear all active debuffs
                this.clearActiveDebuffs();
                // TezosX is an instant effect, so we don't add it to activePowerups
                break;
            case 'solana':
                duration = 5000; // 5 seconds duration for Solana
                this.fastGameSpeed = true;
                this.gameSpeed = 1.2; // 1.2x normal speed
                this.platformSpeed = this.basePlatformSpeed * 1.2;
                const solanaTimer = setTimeout(() => { 
                    this.fastGameSpeed = false;
                    this.gameSpeed = 1; // Reset to normal speed
                    this.platformSpeed = this.basePlatformSpeed; // Reset to base speed
                    this.activePowerups.delete('solana');
                }, duration);
                this.activePowerups.set('solana', { timer: solanaTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'blast':
                duration = 10000; // 10 seconds duration for Blast
                this.highGravity = true;
                this.currentGravity = this.normalGravity * 1.5;
                const blastTimer = setTimeout(() => { 
                    this.highGravity = false; 
                    this.currentGravity = this.normalGravity;
                    this.activePowerups.delete('blast');
                }, duration);
                this.activePowerups.set('blast', { timer: blastTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
            case 'ethereum':
                duration = 20000; // 20 seconds duration for Ethereum
                this.slowMovement = true;
                this.player.speed = this.normalMoveSpeed * 0.25;
                const ethereumTimer = setTimeout(() => { 
                    this.slowMovement = false; 
                    this.player.speed = this.normalMoveSpeed;
                    this.activePowerups.delete('ethereum');
                }, duration);
                this.activePowerups.set('ethereum', { timer: ethereumTimer, duration: duration, maxDuration: duration, startTime: currentTime });
                break;
        }
    
        this.powerupsCollected++;
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
        if (this.gameRunning) {
            // Increment score continuously once the game is running
            this.score++;
    
            // Check if it's time to drop a nomadic powerup
            if (this.score - this.lastPowerupScore >= 5000) {
                const x = Math.random() * (GAME_WIDTH - 30);
                const y = 0; // Drop from the top of the screen
                this.powerups.push(this.createPowerup(x, y, false, true)); // Force nomadic powerup
                this.lastPowerupScore = this.score;
            }
        }
    
        // Update score display
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = this.score;
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
        
        // Add this line to explicitly call drawPowerupHUD
        this.drawPowerupHUD();
        
        // Add debug logging
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
            const currentTime = Date.now();
            const flashDuration = 200; // milliseconds
    
            if (this.playerShield) {
                // Draw gold circle for bitcoin shield
                this.ctx.beginPath();
                this.ctx.arc(x + this.player.width / 2, y + this.player.height / 2,
                             Math.max(this.player.width, this.player.height) / 2 + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)'; // Gold color
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
    
                // Flash effect when blocking debuff
                if (currentTime - this.lastShieldBlockTime < flashDuration) {
                    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                    this.ctx.fill();
                }
            } else if (this.player.upgradeShieldHits > 0) {
                // Draw blue circle for upgrade shield
                this.ctx.beginPath();
                this.ctx.arc(x + this.player.width / 2, y + this.player.height / 2,
                             Math.max(this.player.width, this.player.height) / 2 + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)'; // Blue color
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
    
                // Flash effect when blocking debuff
                if (currentTime - this.lastShieldBlockTime < flashDuration) {
                    this.ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
                    this.ctx.fill();
                }
            }
    
            // Determine which sprite to use based on player state
            let spriteKey;
            if (this.player.isShooting) {
                if (this.player.isMovingLeft) {
                    spriteKey = 'playerLeftShooting';
                } else if (this.player.isMovingRight) {
                    spriteKey = 'playerRightShooting';
                } else {
                    spriteKey = 'playerShootingStance';
                }
            } else if (this.player.isMovingLeft) {
                spriteKey = 'playerLeftMove';
            } else if (this.player.isMovingRight) {
                spriteKey = 'playerRightMove';
            } else {
                spriteKey = 'playerStance';
            }
    
            const playerSprite = sprites.get(spriteKey);
            if (playerSprite && playerSprite.complete) {
                this.ctx.drawImage(playerSprite,
                                   Math.round(x), Math.round(y),
                                   this.player.width, this.player.height);
            } else {
                this.ctx.fillStyle = '#00FF00';  // Bright green color
                this.ctx.fillRect(Math.round(x), Math.round(y),
                                  this.player.width, this.player.height);
            }
    
            // Draw upgrade shield hit counter
            if (this.player.upgradeShieldHits > 0) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.player.upgradeShieldHits.toString(),
                                  x + this.player.width / 2,
                                  y - 5);
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
                // Draw colored circle based on powerup type
                this.ctx.beginPath();
                this.ctx.arc(
                    powerup.x + powerup.width / 2, 
                    powerup.y + powerup.height / 2, 
                    powerup.width / 2 + 2, // Slightly larger than the powerup
                    0, 
                    2 * Math.PI
                );
                
                // Set circle color based on buff/debuff
                if (this.isDebuff(powerup.type)) {
                    this.ctx.strokeStyle = 'red';
                } else {
                    this.ctx.strokeStyle = 'green';
                }
                
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
    
                // Draw the powerup sprite
                this.ctx.drawImage(powerupSprite, powerup.x, powerup.y, powerup.width, powerup.height);
            } else {
                // Fallback if sprite is not loaded
                this.ctx.fillStyle = this.isDebuff(powerup.type) ? '#FF6B6B' : '#4CAF50';
                this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            }
        }
    }
    
    // Helper method to determine if a powerup is a debuff
    isDebuff(powerupType) {
        const debuffs = ['solana', 'blast', 'ethereum'];
        return debuffs.includes(powerupType);
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
    
        // Display current background name
        const backgroundName = this.getBackgroundName(this.currentBackgroundIndex);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Orbitron, sans-serif';
        this.ctx.fillText(`Tez Price: ${this.score}`, 10, 30);
        this.ctx.fillText(`Blocks Climbed: ${this.blocksClimbed}`, 10, 60);
        this.ctx.fillText(`Location: ${backgroundName}`, 10, 90);
    
        // Draw bomb count
        const bombCount = this.playerUpgrades.getEffect('bomb');
        this.ctx.fillText(`Bombs: ${bombCount}`, 10, 120);
    
        // Draw active powerups/debuffs on the right side
        let yOffset = 30;
        const rightMargin = this.canvas.width - 10; // 10px from the right edge
    
        this.ctx.textAlign = 'right'; // Align text to the right
        if (this.playerShield) this.drawPowerupIndicator('Shield', rightMargin, yOffset += 30);
        if (this.rapidFire) this.drawPowerupIndicator('Rapid Fire', rightMargin, yOffset += 30);
        if (this.constantBeamActive) this.drawPowerupIndicator('Constant Beam', rightMargin, yOffset += 30);
        if (this.lowGravity) this.drawPowerupIndicator('Low Gravity', rightMargin, yOffset += 30);
        if (this.highGravity) this.drawPowerupIndicator('High Gravity', rightMargin, yOffset += 30);
        if (this.slowMovement) this.drawPowerupIndicator('Slow Movement', rightMargin, yOffset += 30);
        if (this.gameSpeed > 1) this.drawPowerupIndicator('Fast Game', rightMargin, yOffset += 30);
    
        this.ctx.textAlign = 'left'; // Reset text alignment
        this.ctx.restore();

        // Call drawPowerupHUD to display icons and bars
    this.drawPowerupHUD();
    }
    
    drawPowerupIndicator(text, x, y) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Orbitron, sans-serif';
        this.ctx.fillText(text, x, y);
    }

    drawPowerupHUD() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the transformation
      
        const powerupSize = 30; // Size of the powerup icon
        const padding = 10; // Padding between powerups
        const barHeight = 5; // Height of the duration bar
        const powerupSpacing = 40; // Vertical spacing between powerups
        
        // Calculate the scaling factor
        const scaleX = this.canvas.width / GAME_WIDTH;
        const scaleY = this.canvas.height / GAME_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate the offset to center the game area horizontally if needed
        const offsetX = (this.canvas.width - GAME_WIDTH * scale) / 2;
        
        // Start drawing from the top-right corner of the game area, with some padding
        let startX = offsetX + GAME_WIDTH * scale - padding - powerupSize;
        let startY = padding;
      
        // Loop through activePowerups
        for (const [type, powerup] of this.activePowerups.entries()) {
            // Calculate position for this powerup
            const x = startX;
            const y = startY;
      
            // Draw powerup icon
            const powerupSprite = sprites.get(type);
            if (powerupSprite) {
                this.ctx.drawImage(powerupSprite, x, y, powerupSize, powerupSize);
            } else {
                // Fallback if sprite is not available
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(x, y, powerupSize, powerupSize);
            }
      
            // Draw duration bar
            const barWidth = powerupSize;
            const currentTime = Date.now();
            const elapsedTime = currentTime - powerup.startTime;
            const remainingDuration = Math.max(0, powerup.duration - elapsedTime);
            const remainingWidth = (remainingDuration / powerup.maxDuration) * barWidth;
      
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(x, y + powerupSize + 2, barWidth, barHeight);
      
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(x, y + powerupSize + 2, remainingWidth, barHeight);
      
            // Move to the next position (to the left)
            startX -= (powerupSize + padding);
            
            // If we've reached the left side, move to the next row
            if (startX < offsetX) {
                startX = offsetX + GAME_WIDTH * scale - padding - powerupSize;
                startY += powerupSpacing;
            }
        }
      
        this.ctx.restore();
    }
      


    gameLoop(currentTime) {
        if (!this.gameRunning) return;
        
        if (!this.lastTime) this.lastTime = currentTime;
        let deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        
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
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '2000',
        padding: '20px'
    });

    const gameOverContainer = document.createElement('div');
    gameOverContainer.id = 'gameOverContainer';
    gameOverContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;';

    // Add this block to display the message
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = '#3FE1B0';
    messageElement.style.fontSize = '24px';
    messageElement.style.textAlign = 'center';
    messageElement.style.marginBottom = '20px';
    gameOverContainer.appendChild(messageElement);

    const nameFormContainer = document.createElement('div');
    nameFormContainer.id = 'nameFormContainer';
    nameFormContainer.style.marginBottom = '20px';

    if (includeNameForm) {
        const nameForm = createNameForm();
        nameFormContainer.appendChild(nameForm);
    } else if (includeButton) {
        const button = createButton(buttonText, callback);
        nameFormContainer.appendChild(button);
    }

    gameOverContainer.appendChild(nameFormContainer);
    overlay.appendChild(gameOverContainer);
    document.body.appendChild(overlay);

}

function createNameForm() {
    const nameForm = document.createElement('form');
    nameForm.id = 'nameForm';
    nameForm.style.display = 'flex';
    nameForm.style.flexDirection = 'column';
    nameForm.style.alignItems = 'center';
    nameForm.style.width = '100%';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'nameInput';
    nameInput.placeholder = 'Enter your name';
    nameInput.required = true;
    nameInput.maxLength = 10;
    nameInput.style.width = '100%';
    nameInput.style.padding = '10px';
    nameInput.style.marginBottom = '15px';
    nameInput.style.fontSize = '16px';
    nameInput.style.textAlign = 'center';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.width = '100%';

    const submitButton = createButton('Submit and Claim', () => handleScoreSubmission(nameInput.value));
    const claimScoreButton = createButton('Claim Score and Try Again', () => claimScore(window.finalScore + checkpointManager.getAccumulatedReward()));
    const shopButton = createButton('Shop', () => {
        hideOverlay();
        showUpgradeShop();
    });

    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(claimScoreButton);
    buttonContainer.appendChild(shopButton);

    nameForm.appendChild(nameInput);
    nameForm.appendChild(buttonContainer);

    return nameForm;
}

function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'game-button';
    button.onclick = onClick;
    button.style.padding = '10px 20px';
    button.style.fontSize = '16px';
    button.style.margin = '5px';
    return button;
}

async function handleBribeLeader() {
    if (!checkWalletConnection()) return;
  
    try {
      const highscores = await getHighscores();
      if (highscores.length === 0) {
        showOverlay('No highscores available');
        return;
      }
  
      const leaderScore = highscores[0].score;
      const bribeModal = document.getElementById('bribeModal');
      bribeModal.style.display = 'block';
  
      const closeBtn = bribeModal.querySelector('.close');
      closeBtn.onclick = () => {
        bribeModal.style.display = 'none';
      };
  
      const bribeXtzBtn = document.getElementById('bribeXtzBtn');
      const bribeJumpBtn = document.getElementById('bribeJumpBtn');
  
      bribeXtzBtn.onclick = async () => {
        bribeModal.style.display = 'none';
        await processBribe(leaderScore, false);
      };
  
      bribeJumpBtn.onclick = async () => {
        bribeModal.style.display = 'none';
        await processBribe(leaderScore, true);
      };
    } catch (error) {
      console.error('Error handling bribe:', error);
      showOverlay('An error occurred while preparing the bribe. Please try again.');
    }
  }
  
  function claimScore(totalScore) {
    if (!checkWalletConnection()) return;

    try {
        if (isNaN(totalScore) || typeof totalScore !== 'number') {
            console.error('Invalid total score:', totalScore);
            totalScore = 0; // Set to 0 if invalid
        }
        game.playerUpgrades.addScore(totalScore);
        checkpointManager.resetAccumulatedReward();
        updateAvailableScoreDisplay();
        showOverlay('Score claimed successfully!', checkAndDisplayStartButton, true, 'Play Again');
    } catch (error) {
        console.error('Error claiming score:', error);
        showOverlay('An error occurred while claiming the score. Please try again.', null, true, 'Try Again');
    }
}
  
  async function processBribe(amount, useJump) {
    try {
      showOverlay("Processing bribe...");
      
      const bribed = await bribeLeader(amount, useJump);
      
      hideOverlay();
      
      if (bribed) {
        showOverlay('Bribe successful! Claim Prize Button is now available!.', async () => {
          await handleSuccessfulBribe();
        }, true, 'OK');
      } else {
        showOverlay('Failed to bribe. The transaction was not successful. Please check your wallet for any error messages.', null, true, 'OK');
      }
    } catch (error) {
      console.error('Failed to process bribe:', error);
      hideOverlay();
      showOverlay(`Error processing bribe: ${error.message}. Please try again.`, null, true, 'OK');
    }
  }
  
  async function handleSuccessfulBribe(amount, useJump) {
    showOverlay('Processing bribe...');
    
    try {
      const result = await bribeLeader(amount, useJump);
      
      hideOverlay();
      
      if (result.success) {
        if (result.error) {
          showOverlay(`Bribe transaction successful, but there was an issue: ${result.error}. The leaderboard may not reflect your bribe immediately.`, async () => {
            if (Array.isArray(result.highscores)) {
              await updateHighscoreTable(result.highscores);
            } else {
              await updateHighscoreTable(); // Fetch fresh highscores
            }
            checkAndDisplayStartButton();
          }, true, 'OK');
        } else {
          showOverlay('Bribe successful! Your new score has been submitted. You should now be at the top of the leaderboard!', async () => {
            if (Array.isArray(result.highscores)) {
              await updateHighscoreTable(result.highscores);
            } else {
              await updateHighscoreTable(); // Fetch fresh highscores
            }
            checkAndDisplayStartButton();
          }, true, 'OK');
        }
        
        // Update the claim prize button visibility
        if (Array.isArray(result.highscores)) {
          updateClaimPrizeButton(result.highscores);
        } else {
          const freshHighscores = await getHighscores();
          updateClaimPrizeButton(freshHighscores);
        }
      } else {
        showOverlay(`Failed to complete the bribe process. Error: ${result.error}`, null, true, 'OK');
      }
    } catch (error) {
      console.error('Failed to process bribe:', error);
      hideOverlay();
      showOverlay(`Error during the bribe process: ${error.message}. Please try again or contact support if the issue persists.`, null, true, 'OK');
    }
  }

  async function showUpgradeShop() {
    await game.playerUpgrades.updateJumpBalance();
    updateAvailableScoreDisplay();
    const upgradeShop = document.getElementById('upgradeShop');
    const upgradeOptions = document.getElementById('upgradeOptions');

    if (!upgradeShop || !upgradeOptions) {
        console.error('Required elements not found');
        return;
    }

    upgradeOptions.innerHTML = '';

    // Populate upgrade options
    Object.entries(UPGRADES).forEach(([type, tiers]) => {
        if (type === 'bomb') {
            const option = createUpgradeOption(type, -1, tiers);
            upgradeOptions.appendChild(option);
        } else {
            const currentTier = game.playerUpgrades.upgrades[type];
            if (currentTier < tiers.length) {
                const option = createUpgradeOption(type, currentTier, tiers[currentTier]);
                upgradeOptions.appendChild(option);
            }
        }
    });

    // Create a single Start Game button and append it to upgradeOptions
    const startGameBtn = document.createElement('button');
    startGameBtn.id = 'startGameBtn';
    startGameBtn.textContent = 'START GAME';
    startGameBtn.className = 'game-button';
    startGameBtn.style.width = '100%';
    startGameBtn.style.marginTop = '20px';
    startGameBtn.style.padding = '15px';
    startGameBtn.style.fontSize = '18px';
    startGameBtn.style.backgroundColor = '#3FE1B0';
    startGameBtn.style.color = '#1a2333';
    startGameBtn.onclick = () => {
        upgradeShop.style.display = 'none';
        showEtherlinkWaitMessage(); // Show the message before initializing the game
        game.initializeGame();
        hideOverlay(); // Hide the overlay after game initialization

    };
    upgradeOptions.appendChild(startGameBtn);

    upgradeShop.style.display = 'block';

    // Remove any Start Game button outside the shop
    const outsideStartGameBtn = document.querySelector('button:not(#upgradeShop button)');
    if (outsideStartGameBtn && outsideStartGameBtn.textContent.trim().toLowerCase() === 'start game') {
        outsideStartGameBtn.remove();
    }
}

function createUpgradeOption(type, tier, upgradeInfo) {
    const option = document.createElement('div');
    option.className = 'upgrade-option';
    
    if (game.playerUpgrades.upgrades[type] > tier) {
        option.classList.add('purchased');
    }

    const imgAndInfo = document.createElement('div');
    imgAndInfo.style.display = 'flex';
    imgAndInfo.style.alignItems = 'center';
    imgAndInfo.style.flexGrow = '1';

    const img = document.createElement('img');
    img.src = `https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/${type}.jpg`;
    imgAndInfo.appendChild(img);

    const info = document.createElement('div');
    info.className = 'upgrade-info';
    info.textContent = getUpgradeDescription(type, tier, upgradeInfo);
    imgAndInfo.appendChild(info);

    option.appendChild(imgAndInfo);

    if (type !== 'bomb') {
        const tierProgress = document.createElement('div');
        tierProgress.className = 'tier-progress';
        tierProgress.textContent = `Tier ${game.playerUpgrades.upgrades[type]}/${UPGRADES[type].length}`;
        option.appendChild(tierProgress);
    } else {
        const bombCount = document.createElement('div');
        bombCount.className = 'bomb-count';
        bombCount.textContent = `Bombs: ${game.playerUpgrades.upgrades.bomb}/${UPGRADES.bomb.maxCount}`;
        option.appendChild(bombCount);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const scoreButton = createBuyButton(type, tier, upgradeInfo, false);
    const jumpButton = createBuyButton(type, tier, upgradeInfo, true);
    const scoreMaxButton = createBuyMaxButton(type, tier, false);
    const jumpMaxButton = createBuyMaxButton(type, tier, true);

    buttonContainer.appendChild(scoreButton);
    buttonContainer.appendChild(jumpButton);
    buttonContainer.appendChild(scoreMaxButton);
    buttonContainer.appendChild(jumpMaxButton);

    option.appendChild(buttonContainer);

    return option;
}

function calculateMaxPrice(type, useJump) {
    if (type === 'bomb') {
        const currentBombs = game.playerUpgrades.upgrades.bomb;
        const remainingBombs = UPGRADES.bomb.maxCount - currentBombs;
        const pricePerBomb = useJump ? UPGRADES.bomb.jumpCost : UPGRADES.bomb.cost;
        return remainingBombs * pricePerBomb;
    }

    let totalPrice = 0;
    const currentTier = game.playerUpgrades.upgrades[type];
    for (let i = currentTier; i < UPGRADES[type].length; i++) {
        totalPrice += useJump ? UPGRADES[type][i].jumpCost : UPGRADES[type][i].cost;
    }
    return totalPrice;
}



function createBuyMaxButton(type, tier, useJump) {
    const buttonAndPrice = document.createElement('div');
    buttonAndPrice.className = 'button-price-container';

    const button = document.createElement('button');
    button.className = 'upgrade-button buy-max-button';
    button.textContent = useJump ? 'Max with JUMP' : 'Max with Score';
    
    const maxPrice = calculateMaxPrice(type, useJump);
    const canAfford = game.playerUpgrades.canAfford(type, tier, useJump, maxPrice);
    
    if (canAfford) {
        button.classList.add('available');
        button.style.backgroundColor = '#FFD700'; // Golden color
        button.style.color = '#1a2333'; // Dark text for contrast
    } else {
        button.disabled = true;
        button.style.backgroundColor = '#888'; // Grey out when not available
        button.style.color = '#ccc';
    }

    button.onclick = () => purchaseMaxUpgrade(type, tier, useJump);

    const price = document.createElement('div');
    price.className = 'upgrade-price';
    price.textContent = formatPrice(maxPrice);

    buttonAndPrice.appendChild(button);
    buttonAndPrice.appendChild(price);

    return buttonAndPrice;
}

async function purchaseMaxUpgrade(type, tier, useJump) {
    showUpgradeOverlay('Upgrading to max...');
    try {
        const currentTier = game.playerUpgrades.upgrades[type];
        const maxTier = UPGRADES[type].length - 1;
        let success = true;

        for (let i = currentTier; i <= maxTier; i++) {
            const purchased = await game.playerUpgrades.purchase(type, i, useJump);
            if (!purchased) {
                success = false;
                break;
            }
        }

        await updateAvailableScoreDisplay();
        hideUpgradeOverlay();

        if (success) {
            showUpgradeOverlay('Upgraded to max!');
        } else {
            showUpgradeOverlay('Upgrade to max failed. Please try again.');
        }

        setTimeout(() => {
            hideUpgradeOverlay();
            showUpgradeShop();  // Refresh the shop
        }, 1500);
    } catch (error) {
        console.error('Error during max upgrade:', error);
        hideUpgradeOverlay();
        showUpgradeOverlay('An error occurred. Please try again.');
        setTimeout(hideUpgradeOverlay, 2000);
    }
}



function createBuyButton(type, tier, upgradeInfo, useJump) {
    const buttonAndPrice = document.createElement('div');
    buttonAndPrice.className = 'button-price-container';

    const button = document.createElement('button');
    button.className = 'upgrade-button';
    button.textContent = useJump ? 'Buy with JUMP' : 'Buy with Score';
    button.onclick = () => purchaseUpgrade(type, tier, useJump);
    
    const canAfford = game.playerUpgrades.canAfford(type, tier, useJump);
    button.disabled = !canAfford;

    const price = document.createElement('div');
    price.className = 'upgrade-price';

    let priceValue;
    if (type === 'bomb') {
        priceValue = useJump ? UPGRADES.bomb.jumpCost : UPGRADES.bomb.cost;
    } else {
        priceValue = useJump ? upgradeInfo.jumpCost : upgradeInfo.cost;
    }

    price.textContent = formatPrice(priceValue);

    buttonAndPrice.appendChild(button);
    buttonAndPrice.appendChild(price);

    return buttonAndPrice;
}

function getUpgradeDescription(type, tier, upgradeInfo) {
    switch (type) {
        case 'speed':
            return `Speed Tier ${tier + 1}: +${((upgradeInfo.effect - 1) * 100).toFixed(1)}% speed`;
        case 'jump':
            return `Jump Tier ${tier + 1}: ${upgradeInfo.effect.jumps} jumps, +${((upgradeInfo.effect.height - 1) * 100).toFixed(1)}% height`;
        case 'shield':
            return `Shield Tier ${tier + 1}: ${upgradeInfo.effect} hit(s) protection`;
        case 'rapid':
            return `Rapid Fire Tier ${tier + 1}: -${((1 - upgradeInfo.effect) * 100).toFixed(1)}% cooldown`;
        case 'bomb':
            return `Bomb: Clear all enemies and debuffs`;
    }
}

async function updateAvailableScoreDisplay() {
    const availableScoreHeader = document.getElementById('availableScoreHeader');
    const availableScoreShop = document.getElementById('availableScore');
  
    await game.playerUpgrades.updateJumpBalance();
  
    const score = game.playerUpgrades.score;
    const jumpBalance = game.playerUpgrades.jumpBalance;
  
  
    const formattedScore = formatPrice(score);
    const formattedJumpBalance = formatPrice(jumpBalance);
  
  
    if (availableScoreHeader) {
      availableScoreHeader.textContent = `${formattedScore} | JUMP: ${formattedJumpBalance}`;
    }
    if (availableScoreShop) {
      availableScoreShop.textContent = `Score: ${formattedScore} | JUMP: ${formattedJumpBalance}`;
    }
  }
  

  
  function formatPrice(price) {
  
    // Ensure price is a number
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
  
    if (isNaN(price)) {
      return 'N/A';
    }
  
    // Formatting logic here
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(1) + 'k';
    } else {
      return price.toString();
    }
  }
  



function showUpgradeOverlay(message) {
    const existingOverlay = document.getElementById('upgradeOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'upgradeOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '10000';

    const messageBox = document.createElement('div');
    messageBox.style.backgroundColor = '#1a2333';
    messageBox.style.color = '#3FE1B0';
    messageBox.style.padding = '20px';
    messageBox.style.borderRadius = '10px';
    messageBox.style.fontSize = '24px';
    messageBox.style.textAlign = 'center';
    messageBox.textContent = message;

    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
}

function hideUpgradeOverlay() {
    const overlay = document.getElementById('upgradeOverlay');
    if (overlay) {
        overlay.remove();
    }
}


async function purchaseUpgrade(type, tier, useJump) {
    showUpgradeOverlay('Upgrading...');
    try {
        const purchased = await game.playerUpgrades.purchase(type, tier, useJump);
        if (purchased) {
            await updateAvailableScoreDisplay();
            hideUpgradeOverlay();
            showUpgradeOverlay('Upgraded!');
            setTimeout(() => {
                hideUpgradeOverlay();
                showUpgradeShop();  // Refresh the shop
            }, 1500);  // Show "Upgraded!" message for 1.5 seconds
        } else {
            hideUpgradeOverlay();
            showUpgradeOverlay('Upgrade failed. Please try again.');
            setTimeout(hideUpgradeOverlay, 2000);
        }
    } catch (error) {
        console.error('Error during upgrade:', error);
        hideUpgradeOverlay();
        showUpgradeOverlay('An error occurred. Please try again.');
        setTimeout(hideUpgradeOverlay, 2000);
    }
}

function handleOpenShop() {
    showUpgradeShop();
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
        { name: 'playerStance', file: 'stance.png' },
        { name: 'playerLeftMove', file: 'leftmove.png' },
        { name: 'playerRightMove', file: 'rightmove.png' },
        { name: 'playerRightShooting', file: 'rightshooting.png' },
        { name: 'playerLeftShooting', file: 'leftshooting.png' },
        { name: 'playerShootingStance', file: 'shootingstance.png' },
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
        new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                bg.image = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load background ${index + 1}`);
                reject();
            };
            img.src = `${picsUrl}bg${index + 1}.jpg`;
        })
    ));
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
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
          hideOverlay();
          showUpgradeShop();
        }, true, 'Start Game');
      } else {
        showOverlay('No tries left. Please purchase more.', handleBuyTries, true, 'Buy Tries');
      }
    } catch (error) {
      console.error('Error checking Game tries:', error);
      showOverlay('Error checking Game tries. Please try again.');
    }
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

    try {
        // Show loading message
        showOverlay('Loading game assets...');

        // Load all assets concurrently
        await Promise.all([
            loadSprites(),
            loadBackgrounds(),
            preloadSounds()
        ]);


        // Hide loading message
        hideOverlay();

        // Initialize the game
        game = new Game();
    
        // Setup event listeners
        document.getElementById('walletConnectBtn').addEventListener('click', handleWalletConnection);
        document.getElementById('buyTriesBtn').addEventListener('click', handleBuyTries);
        document.getElementById('addFundsBtn').addEventListener('click', handleAddFunds);
        document.getElementById('shopBtn').addEventListener('click', handleOpenShop);
        document.getElementById('claimPrizeBtn').addEventListener('click', handleClaimPrize);
        document.getElementById('nameForm').addEventListener('submit', handleScoreSubmission);
        document.getElementById('bribeLeaderBtn').addEventListener('click', handleBribeLeader);
        document.getElementById('soundToggle').addEventListener('click', toggleSound);

        if (!isConnected) {
            showOverlay('Please connect Wallet', handleWalletConnection, true, 'Connect Wallet');
        }
    } catch (error) {
        console.error('Error loading game assets:', error);
        showOverlay('Failed to load game assets. Please refresh and try again.');
    }

    
});

async function handleWalletConnection() {
    try {
      if (!isConnected) {
        showEtherlinkWaitMessage(); 
        const web3Instance = await initWeb3();
        if (web3Instance) {
          const connected = await connectWallet(web3Instance);
          if (connected) {
            isConnected = true;
            updateButtonState();
            await updateTryCount(web3Instance);
            await loadUserAchievements(web3Instance);
            await updateAvailableScoreDisplay();
            showBuyTriesButton();
            document.getElementById('addFundsBtn').style.display = 'block';
            const highscores = await getHighscores();
            await updateHighscoreTable(highscores);
            showAchievements();
            await updateContractBalance();
            hideOverlay();
            await checkAndDisplayStartButton(web3Instance);
          } else {
            showOverlay('Failed to connect. Please ensure you are on the Etherlink Mainnet.');
          }
        } else {
          showOverlay('Web3 initialization failed. Please check your connection and ensure you have a compatible wallet.');
        }
      } else {
        // Disconnect wallet logic
        isConnected = false;
        updateButtonState();
        hideBuyTriesButton();
        document.getElementById('addFundsBtn').style.display = 'none';
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
            showOverlay('Prize claimed! Congratulations!');
            await updateHighscoreTable();
            await updateContractBalance();

            // Hide the claim prize button after successful claim
            const claimPrizeBtn = document.getElementById('claimPrizeBtn');
            if (claimPrizeBtn) {
                claimPrizeBtn.style.display = 'none';
            }

            // If it was a briber claim, reset the briber status
            if (claimPrizeBtn && claimPrizeBtn.dataset.isBriber === 'true') {
                claimPrizeBtn.dataset.isBriber = 'false';
            }
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

    const buyTriesModal = document.getElementById('buyTriesModal');
    buyTriesModal.style.display = 'block';

    const closeBtn = buyTriesModal.querySelector('.close');
    closeBtn.onclick = () => {
        buyTriesModal.style.display = 'none';
    };

    const buyXtzBtn = document.getElementById('buyXtzBtn');
    const buyJumpBtn = document.getElementById('buyJumpBtn');

    buyXtzBtn.onclick = async () => {
        buyTriesModal.style.display = 'none';
        await processPurchase(false);
    };

    buyJumpBtn.onclick = async () => {
        buyTriesModal.style.display = 'none';
        await processPurchase(true);
    };
}

async function processPurchase(useJump) {
    try {
        showOverlay("Processing purchase...");
        const purchased = await purchaseGameTries(useJump);
        
        hideOverlay();
        
        if (purchased) {
            const triesAdded = useJump ? 20 : 10;
            showOverlay(`${triesAdded} Game tries added successfully!`, async () => {
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
        showEtherlinkWaitMessage(); // Add this line
        game.initializeGame().finally(() => {
            hideOverlay(); // Ensure overlay is hidden after game initialization
        });
    }, true, 'Start Game');
}

async function updateContractBalance() {
    try {
        const balances = await getContractBalance();
        
        const xtzBalanceElement = document.getElementById("contract-balance");
        const jumpBalanceElement = document.getElementById("jump-balance");
        
        if (xtzBalanceElement && jumpBalanceElement) {
            xtzBalanceElement.textContent = `XTZ Balance: ${balances.xtz} XTZ`;
            jumpBalanceElement.textContent = `JUMP Balance: ${balances.jump} JUMP`;
        } else {
            console.error('Balance elements not found in the DOM');
        }
    } catch (error) {
        console.error('Error updating contract balance:', error);
    }
}

async function handleAddFunds() {
    if (!checkWalletConnection()) return;

    const addFundsModal = document.getElementById('addFundsModal');
    addFundsModal.style.display = 'block';

    const closeBtn = addFundsModal.querySelector('.close');
    closeBtn.onclick = () => {
        addFundsModal.style.display = 'none';
    };

    const confirmAddFundsBtn = document.getElementById('confirmAddFundsBtn');
    confirmAddFundsBtn.onclick = async () => {
        const xtzAmount = parseFloat(document.getElementById('xtzAmount').value) || 0;
        const jumpAmount = parseFloat(document.getElementById('jumpAmount').value) || 0;

        if (xtzAmount === 0 && jumpAmount === 0) {
            alert('Please enter an amount for XTZ or JUMP.');
            return;
        }

        addFundsModal.style.display = 'none';
        await processAddFunds(xtzAmount, jumpAmount);
    };
}

async function processAddFunds(xtzAmount, jumpAmount) {
    try {
        showOverlay("Adding funds...");
        const added = await addFunds(xtzAmount, jumpAmount);
        
        hideOverlay();
        
        if (added) {
            showOverlay('Funds added successfully!', async () => {
                await updateContractBalance();
                hideOverlay();
                // Check if the player has any tries left
                const tries = await getGameTries();
                if (tries > 0) {
                    // If tries are available, show the start game overlay
                    showOverlay('Ready to play?', () => {
                        game.initializeGame();
                    }, true, 'Start Game');
                } else {
                    // If no tries are left, show the buy tries overlay
                    showOverlay('No tries left. Please purchase more.', handleBuyTries, true, 'Buy Tries');
                }
            }, true, 'OK');
        } else {
            showOverlay('Failed to add funds. Please try again.', null, true, 'OK');
        }
    } catch (error) {
        console.error('Failed to add funds:', error);
        showOverlay('Error adding funds. Please try again.', null, true, 'OK');
    }
}




function handleGameOver(score, blocksClimbed, gameStartTime) {
    const checkpointReward = checkpointManager.getAccumulatedReward();
    const totalScore = score + checkpointReward;

    window.finalScore = totalScore;

    showOverlay("", null, false, '', false); // We'll add content manually

    const overlay = document.getElementById('game-overlay');
    if (!overlay) {
        console.error('Game overlay not found');
        return;
    }

    const gameOverContainer = document.getElementById('gameOverContainer');
    if (!gameOverContainer) {
        console.error('Game over container not found');
        return;
    }

    // Clear existing content
    gameOverContainer.innerHTML = '';

    // Create and append game over content
    const title = document.createElement('h2');
    title.textContent = 'Game Over!';
    title.style.color = '#3FE1B0';
    title.style.marginBottom = '20px';

    const scoreInfo = document.createElement('div');
    scoreInfo.innerHTML = `
        <p>Score: ${score}</p>
        <p>Blocks Climbed: ${blocksClimbed}</p>
        <p>Checkpoint Reward: ${checkpointReward}</p>
        <p>Total Score: ${totalScore}</p>
    `;

    gameOverContainer.appendChild(title);
    gameOverContainer.appendChild(scoreInfo);

    createGameOverForm(totalScore);
}


// Create a new function to generate the game over form
function createGameOverForm(totalScore) {
    const gameOverContainer = document.getElementById('gameOverContainer');
    if (!gameOverContainer) {
        console.error('Game over container not found');
        return;
    }

    const nameForm = document.createElement('form');
    nameForm.id = 'nameForm';
    nameForm.style.display = 'flex';
    nameForm.style.flexDirection = 'column';
    nameForm.style.alignItems = 'center';
    nameForm.style.gap = '10px';
    nameForm.style.marginTop = '20px';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'nameInput';
    nameInput.placeholder = 'Enter your name';
    nameInput.required = true;
    nameInput.maxLength = 10;
    nameInput.style.marginBottom = '10px';
    nameInput.style.padding = '5px';
    nameInput.style.fontSize = '16px';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.width = '100%';

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit and Claim';
    submitButton.className = 'game-button';
    submitButton.onclick = (e) => {
        e.preventDefault();
        handleScoreSubmission(nameInput.value);
    };

    const claimScoreAndTryAgainBtn = document.createElement('button');
    claimScoreAndTryAgainBtn.textContent = 'Claim Score and Try Again';
    claimScoreAndTryAgainBtn.className = 'game-button';
    claimScoreAndTryAgainBtn.onclick = async () => {
        await claimScore(totalScore);
        hideOverlay();
        game.initializeGame();
    };

    const shopBtn = document.createElement('button');
    shopBtn.textContent = 'Shop';
    shopBtn.className = 'game-button';
    shopBtn.onclick = () => {
        showUpgradeShop();
    };

    buttonsContainer.appendChild(submitButton);
    buttonsContainer.appendChild(claimScoreAndTryAgainBtn);
    buttonsContainer.appendChild(shopBtn);

    nameForm.appendChild(nameInput);
    nameForm.appendChild(buttonsContainer);

    gameOverContainer.appendChild(nameForm);
}
  
async function handleScoreSubmission(name) {
    if (!checkWalletConnection()) return;

    try {
        showOverlay("Submitting score to Etherlink...");
        
        const contract = getContract();
        const account = getCurrentAccount();

        if (!contract || !account) {
            console.error('Contract not initialized or account not available');
            showOverlay('Error: Unable to connect to the blockchain. Please refresh and try again.', null, true, 'Refresh');
            return;
        }

        const checkpointReward = checkpointManager.getAccumulatedReward();
        const totalScore = window.finalScore + checkpointReward;

        const submitted = await submitScore(name, totalScore, window.blocksClimbed, window.gameStartTime);
        
        if (submitted) {
            game.playerUpgrades.addScore(totalScore);
            checkpointManager.resetAccumulatedReward();
            await updateHighscoreTable();
            showOverlay('Score submitted and claimed successfully!', async () => {
                await updateTryCount();
                await checkAndDisplayStartButton();
            }, true, 'Play Again');
        } else {
            const gameTries = await getGameTries();
            if (parseInt(gameTries) <= 0) {
                showOverlay('No game tries remaining. Please purchase more.', handleBuyTries, true, 'Buy Tries');
            } else {
                showOverlay('Failed to submit score. Please try again.', null, true, 'Try Again');
            }
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        showOverlay('An error occurred while submitting your score. Please try again.', null, true, 'Try Again');
    }
}

async function checkContractState() {
    try {
        const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
        
        const gameTries = await contract.methods.getGameTries(account).call();
        
        // Add any other relevant contract state checks here
        
        return true;
    } catch (error) {
        console.error('Error checking contract state:', error);
        return false;
    }
}

  
async function updateHighscoreTable(providedHighscores = null) {
    if (!checkWalletConnection()) return;
  
    try {
      let highscores = providedHighscores || await getHighscores();
  
      // Check if highscores is the Web3 contract instance
      if (highscores && highscores._requestManager) {
        highscores = await getHighscores();
      }
  
      // Ensure highscores is an array
      if (!Array.isArray(highscores)) {
        console.error('Highscores is not an array:', highscores);
        highscores = [];
      }
  
      const highscoreBody = document.getElementById('highscoreBody');
      if (!highscoreBody) {
        console.error('Highscore table body not found');
        return;
      }
  
      highscoreBody.innerHTML = '';
      if (highscores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5">No highscores available</td>';
        highscoreBody.appendChild(row);
      } else {
        highscores.forEach((entry, index) => {
          if (entry && typeof entry === 'object') {
            const row = document.createElement('tr');
            if (index === 0) {
              row.classList.add('first-place');
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
      }
  
      updateClaimPrizeButton(highscores);
    } catch (error) {
      console.error('Error updating highscore table:', error);
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


function updateButtonState() {
    const connectButton = document.getElementById('walletConnectBtn');
    const buyButton = document.getElementById('buyTriesBtn');
    const addFundsButton = document.getElementById('addFundsBtn');
    const shopButton = document.getElementById('shopBtn');
    const tryCounter = document.getElementById('tryCounter');
    const scoreCounter = document.getElementById('scoreCounter');
    
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

    if (addFundsButton) {
        addFundsButton.style.display = isConnected ? 'block' : 'none';
    }

    if (shopButton) {
        shopButton.style.display = isConnected ? 'block' : 'none';
    }

    if (tryCounter) {
        tryCounter.style.display = isConnected ? 'block' : 'none';
    }

    if (scoreCounter) {
        scoreCounter.style.display = isConnected ? 'block' : 'none';
    }

    if (isConnected) {
        updateTryCount();
        updateAvailableScoreDisplay();
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


async function updateClaimPrizeButton(highscores) {
    const claimPrizeBtn = document.getElementById('claimPrizeBtn');
    if (!claimPrizeBtn) {
      console.error('Claim prize button not found in the DOM');
      return;
    }
  
    try {
      const currentAccount = await getCurrentAccount();
      if (!currentAccount) {
        console.error('No current account available');
        claimPrizeBtn.style.display = 'none';
        return;
      }
  
      if (!Array.isArray(highscores) || highscores.length === 0) {
        console.error('Invalid or empty highscores:', highscores);
        claimPrizeBtn.style.display = 'none';
        return;
      }
  
      const leadingAccount = highscores[0].player;
      
      if (leadingAccount && leadingAccount.toLowerCase() === currentAccount.toLowerCase()) {
        claimPrizeBtn.style.display = 'block';
      } else {
        claimPrizeBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating claim prize button:', error);
      claimPrizeBtn.style.display = 'none';
    }
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
