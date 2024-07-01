<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BlockJump</title>
    <link rel="shortcut icon" type="image/x-icon" href="favicon1.ico">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/web3/1.8.2/web3.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
        body {
    background: #16213e;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    font-family: 'Orbitron', sans-serif;
    color: #FFFFFF;
}
#gameWrapper {
    display: grid;
    grid-template-columns: 200px 1fr 300px;
    gap: 20px;
    width: 100%;
    max-width: 1550px;
    margin: 0 auto;
    align-items: start;
    position: relative;
}  

        #gameCenter {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        #header {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px; /* Space between buttons */
}   

.game-button {
    font-family: 'Orbitron', sans-serif;
    font-weight: bold;
    font-size: 16px;
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease;
    color: white;
    width: 200px; /* Set a fixed width for both buttons */
}

.game-button:hover {
    transform: scale(1.05);
}

.game-button:active {
    transform: scale(0.98);
}

.connect-button {
    background-color: #FF8C00;
}

.connect-button:hover {
    background-color: #FFA500;
}

.disconnect-button {
    background-color: #E74C3C;
}

.disconnect-button:hover {
    background-color: #C0392B;
}

.buy-button {
    background-color: #3498DB;
}

.buy-button:hover {
    background-color: #2980B9;
}

/* Hide the buy button initially */
#buyTriesBtn {
    display: none;
}

.connect-button {
    background-color: #FF8C00;
    color: white;
    font-family: 'Orbitron', sans-serif;
    font-weight: bold;
    font-size: 16px;
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease;
}

.connect-button:hover {
    background-color: #FFA500;
    transform: scale(1.05);
}

.connect-button:active {
    transform: scale(0.98);
}  

.disconnect-button {
    background-color: #E74C3C;
}

.disconnect-button:hover {
    background-color: #C0392B;
}


#highscoreSection {
    position: fixed;
    top: 0;
    left: 0;
    width: 25%;
}

#gameLogo {
    display: block;
    margin: 0 auto 20px;
    max-width: 150px;
    height: auto;
}
        
#gameContainer {
    grid-column: 2;
    width: 800px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-self: start;
    margin-left: 50px;
}

#powerupTimers {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
    width: 100%;
}

.powerup-timer-bar {
    width: 30px;
    height: 10px; /* Set a specific height for the bar */
    background-color: #333;
    border-radius: 5px;
    overflow: hidden;
}

.powerup-timer-progress {
    height: 100%; /* Inherit the height from the parent */
    width: 100%;
    background-color: #3FE1B0;
    transition: width 0.1s linear;
}

#powerupSection {
    position: relative;
    top: 0;
    right: 0;
    width: 100%;
}

#powerupBar {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}
        
        #highscoreTable {
        
        font-size: 12px;
        width: 100%;
        table-layout: fixed;
        position: relative;
        }

        #highscoreTable th, #highscoreTable td {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        }

        

        #highscoreTable tr:hover td {
            background: rgba(63, 225, 176, 0.2);
        }

        #highscoreTable tr td:first-child {
            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
        }

        #highscoreTable tr td:last-child {
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
        }

        .section-title {
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
            color: #FFD700;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        #tryCounter {
    font-family: 'Orbitron', sans-serif;
    font-size: 16px;
    color: #3FE1B0;
    text-align: left;
    margin-top: 10px;
}

        #gameCanvas {
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(63, 225, 176, 0.5);
    margin-top: 20px; /* Add some space above the canvas */
}
        #floorCounter {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
            text-align: center;
        }
        #startButton, #soundToggle {
            font-size: 24px;
            padding: 10px 20px;
            background-color: #3FE1B0;
            color: #16213e;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Orbitron', sans-serif;
            margin: 10px;
        }
        #startButton:hover, #soundToggle:hover {
            background-color: #ff6b6b;
            transform: scale(1.05);
        }

        #claimPrizeBtn {
    margin-top: 20px;
    background-color: #FFD700;
    color: #16213e;
    font-weight: bold;
    transition: background-color 0.3s ease;
    margin-left: 130px;
}

#claimPrizeBtn:hover {
    background-color: #FFA500;
}   
        
        #controls {
    grid-column: 2;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 20px;
}
        #achievementPopup {
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(255, 215, 0, 0.8);
            color: #16213e;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 18px;
            display: none;
        }

        #blockCounter {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-shadow: 0 0 10px rgba(233, 69, 96, 0.5);
            text-align: center;

            .powerup-content {
  display: flex;
  flex-direction: column;
  gap: 2px; /* Adjust gap for spacing between icon and description */
  justify-content: flex-end; /* Align items at the bottom */
  width: 100%; /* Occupy full width of the powerup item */
}

        }
        #windIndicator {
            position: absolute;
            font-size: 64px;
            color: rgb(238, 0, 0);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: all 0.3s ease;
            z-index: 1000; /* Ensure it's above other elements */
        }
        .section-title {
            color: #3FE1B0;
            font-size: 20px;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .powerup-content {
  display: flex;
  flex-direction: column;
  gap: 2px; /* Adjust gap for spacing between icon and description */
  justify-content: flex-end; /* Align items at the bottom */
  width: 100%; /* Occupy full width of the powerup item */
}

      


.powerup-item.active {
    background-color: rgba(255, 215, 0, 0.3);
    border: 2px solid #FFD700; /* Yellow border */
    border-radius: 5px;
    opacity: 0.8;

}




.powerup-icon {
    width: 30px;
    height: 30px;
    
}

.powerup-description {
    font-size: 12px;
}

.powerup-count {
    font-size: 12px;
    color: #FFD700;
}


        .powerup-timer {
            font-weight: bold;
            color: #FFD700;
        }



        #highscoreTable {
            width: 100%;
            border-collapse: collapse;
        }
        #highscoreTable th, #highscoreTable td {
            color: #3FE1B0;
            border: 1px solid #e94560;
            border-bottom: 2px solid #3FE1B0;
            padding: 5px;
            text-align: center;
        }
        #nameForm {
            margin-top: 20px;
            display: none;
            width: 100%;
        }
        #nameInput {
            width: 90%;
            padding: 10px;
            margin-bottom: 10px;
            background-color: rgba(63, 225, 176, 0.1);
            border: 1px solid #3FE1B0;
            color: #FFFFFF;
            font-family: 'Orbitron', sans-serif;;
        }

        .canvas-button {
    position: absolute;
    transform: translate(-50%, -50%);
    padding: 15px 30px;
    font-size: 24px;
    font-family: 'Orbitron', sans-serif;
    color: #FFFFFF;
    background-color: #3FE1B0;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(63, 225, 176, 0.5);
    text-transform: uppercase;
    z-index: 1000; /* Ensure it's above other elements */
}

.canvas-button:hover {
    background-color: #2DC898;
    box-shadow: 0 0 30px rgba(63, 225, 176, 0.8);
    transform: translate(-50%, -50%) scale(1.05);
}

.canvas-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    font-family: 'Orbitron', sans-serif;
    color: #FFFFFF;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

        #submitScore {
            width: 100%;
            padding: 10px;
            background-color: #3FE1B0;
            color: #16213e;
            border: none;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
            text-transform: uppercase;
        }

        .special-sidebar {
    /* Your custom styles here */
    background-color: hsl(204, 77%, 28%); /* Example background color */
    color: rgb(63, 225, 176, 0.8); /* Example text color */
    padding: 20px; /* Example padding */
    border-radius: 5px; /* Example border radius */
    margin-left: 75px;
}
    </style>
</head>
<body>
    
    <div id="header">
        <button id="walletConnectBtn" class="game-button connect-button">Connect wallet</button>
        <button id="buyTriesBtn" class="game-button buy-button">Buy 10 Tries<br />0.01 XTZ</button>
        <div id="tryCounter" style="display: none;">Tries left: <span id="triesLeft">0</span></div>
        <button id="soundToggle" class="game-button">Sound: Off</button>
    </div>
    <div id="left-sidebar" class="special-sidebar">
        <h3>1st can claim the Jackpot</h3>
        <p id="contract-balance">Contract Balance: Loading...</p>
    </div>
    <div id="gameWrapper">
        <div id="highscoreSection">
            <div class="section-title">Highscores</div>
            <table id="highscoreTable">
                 <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Tezos Price</th>
                        <th>Score</th>
                        <th>Blks</th>
                        
                    </tr>
                </thead>
                <tbody id="highscoreBody"></tbody>
            </table>
            <button id="claimPrizeBtn" class="game-button" style="display: none;">Claim Prize</button>
            <form id="nameForm" style="display: none;">
                <input type="text" id="nameInput" placeholder="Enter your name" maxlength="10" required>
                <button type="submit" id="submitScore">Submit Score</button>
            </form>
        </div>
        <div id="gameContainer">
            <img id="gameLogo" src="https://raw.githubusercontent.com/Blindripper/blockjump/main/pics/Logo.png" alt="Game Logo">
            <div id="blockCounter">Blocks Climbed: 0</div>
            <div id="floorCounter">Tezos Price: 0000000</div>
            <div id="powerupBar"></div>
            <div id="powerupTimers"></div>
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            <div id="achievementPopup"></div>
            <div id="windIndicator"></div>
            <div id="controls">
                <p id="output"></p>
            </div>
        </div>
        
    </div>
    <script type="module" src="web3Integration.js"></script>
    <script type="module"> import { initWeb3, startGame as startGameWeb3, getGameTries, purchaseGameTries, getHighscores, submitScore, claimPrize, } from './web3Integration.js';

        // Define base URL for the GitHub repository
        const repoBaseUrl = 'https://raw.githubusercontent.com/Blindripper/blockjump/main/';

        // Define specific URLs for different resource types
        const soundUrl = `${repoBaseUrl}sound/`;
        const picsUrl = `${repoBaseUrl}pics/`;

        const BLAST_POWERUP_DURATION = 30; // Duration in seconds
        

        let lastTime = 0;
        const fixedDeltaTime = 1 / 60; // 60 FPS
        let accumulator = 0;
        let intentionalGameOver = false;
        let gameLoopId;
        

        let gameStartTime;
        // Global canvas variables
        let canvas, ctx;

        let sprites = new Map();

        let blastEffectActive = false;
        let blastEffectTimer = 0;

        // Add a new variable to track blocks climbed
        let blocksClimbed = 0;

        function initGame() {
            console.log('Initializing game...');
    if (!canvas || !ctx) {
        console.error('Canvas or context not available at start of initGame');
        console.log('canvas:', canvas);
        console.log('ctx:', ctx);
        return;
    }
    if (!ctx) {
        console.error('Context not available at start of initGame');
        return;
    }
    console.log('Canvas dimensions in initGame:', canvas.width, 'x', canvas.height);

            updateWindIndicator();
            // Initialize platforms
            platforms = [];
            for (let i = 0; i < 7; i++) {
                platforms.push(createPlatform(canvas.height - (i + 2) * 100));
            }
            nextBottomPlatformScore = 100;
            bottomPlatform.isSafe = true;
            isPlayerOnSafePlatform = false;
            gameRunning = true;
            gameOver = false 

            // Reset blast effect variables
            blastEffectActive = false;
            blastEffectTimer = 0;
            
            
        }

        function updateBlockCounter() {
            document.getElementById('blockCounter').textContent = `Blocks Climbed: ${blocksClimbed}`;
        }

       async function getContractBalance() {
  const apiUrl = 'https://explorer.etherlink.com/api/v2/addresses/0x0e8Bb7500D80701CCa627480681ABE6982E4dd8a'; // Replace if needed

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }

    const data = await response.json();
    const coinBalance = data["coin_balance"]; // Assuming "coin_balance" is the key

    const formattedBalance = formatBalance(coinBalance);
    updateBalanceDisplay(formattedBalance);
  } catch (error) {
    console.error('Error fetching contract balance:', error);
    // Handle error gracefully, e.g., display an error message in HTML
  }
}

function formatBalance(coinBalance) {
  const WEI_PER_ETHER = 1e18; // 1 followed by 18 zeros

  const balanceInEther = parseFloat(coinBalance) / WEI_PER_ETHER;

  // Function to format the number with commas (replace with your preferred logic)
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const formattedBalance = numberWithCommas(balanceInEther.toFixed(2)); // Format to 2 decimal places
  return formattedBalance;
}

function updateBalanceDisplay(formattedBalance) {
  const balanceElement = document.getElementById("contract-balance");
  balanceElement.textContent = `Contract Balance: ${formattedBalance} ETH`;
}

// Call the function to fetch and display the balance on page load
getContractBalance();



 

        const POWERUP_MESSAGE_DURATION = 1000; // Duration in milliseconds

        function showPowerupMessage(message) {
            const canvas = document.getElementById('gameCanvas');
            const canvasRect = canvas.getBoundingClientRect();

            const popup = document.createElement('div');
            popup.textContent = message;
            popup.style.position = 'absolute';
            popup.style.top = `${canvasRect.top + canvas.height / 2}px`;
            popup.style.left = `${canvasRect.left + canvas.width / 2}px`;
            popup.style.transform = 'translate(-50%, -50%)';
            popup.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
            popup.style.color = '#16213e';
            popup.style.padding = '10px 20px';
            popup.style.borderRadius = '5px';
            popup.style.fontFamily = 'Orbitron, sans-serif';
            popup.style.fontSize = '18px';
            popup.style.zIndex = '1000';
            popup.style.textAlign = 'center';
            popup.style.whiteSpace = 'nowrap';
            popup.style.pointerEvents = 'none';
            document.body.appendChild(popup);

            setTimeout(() => {
                popup.style.transition = 'opacity 0.5s';
                popup.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(popup);
                }, 500);
            }, POWERUP_MESSAGE_DURATION);
        }

        // Debug information
        let debugInfo = {
            totalBlocksClimbed: 0,
            blocksUntilNextPowerup: 0,
            powerupsGenerated: 0,
            activePowerups: 0
        };
        
        // Powerup descriptions
        const powerupDescriptions = {
            bitcoin: { points: 250, effect: "Fly for 5 seconds" },
            solana: { points: 0, effect: "Game Over" },
            ethereum: { points: 250, effect: "Shrinks platforms for 5 seconds" },
            etherLink: { points: 1000, effect: "Instant boost to score" },
            greenTezos: { points: 250, effect: "Allows triple jump for 30 seconds" },
            blast: { points: 250, effect: `Auto-collect EtherLink for ${BLAST_POWERUP_DURATION}s` },
            mintTezos: { points: 250, effect: "Slows down game for 30 seconds" },
            tezosX: { points: 250, effect: "Sets off wind for 30 seconds" }
        };

        // Powerup image mapping
        const powerupImages = {
            bitcoin: 'bitcoin.png',
            solana: 'solana.png',
            ethereum: 'ethereum1.png',
            etherLink: 'Etherlink.png',
            greenTezos: 'greenTezos.png',
            blast: 'blast.png',
            mintTezos: 'slowMotion.png',
            tezosX: 'TezosX1.png'
        };
      
        function loadSprite(name, fileName) {
    return new Promise((resolve, reject) => {
        const sprite = new Image();
        sprite.onload = () => resolve({ key: name, image: sprite });
        sprite.onerror = () => reject(new Error(`Failed to load sprite: ${name}`));
        sprite.src = `${picsUrl}${fileName}`;
    });
}

        function loadSprites() {
    return Promise.all([
        loadSprite('player', 'TezosLogo_Icon_Blue.png'),
        loadSprite('bitcoin', 'bitcoin.png'),
        loadSprite('solana', 'solana.png'),
        loadSprite('ethereum', 'ethereum1.png'),
        loadSprite('etherLink', 'Etherlink.png'),
        loadSprite('greenTezos', 'greenTezos.png'),
        loadSprite('blast', 'blast.png'),
        loadSprite('mintTezos', 'slowMotion.png'),
        loadSprite('tezosX', 'TezosX1.png')
    ]).then(loadedSprites => {
        loadedSprites.forEach(({key, image}) => sprites.set(key, image));
        console.log('All sprites loaded successfully');
    }).catch(error => {
        console.error('Error loading sprites:', error);
    });
}

function createPowerupTimerBar(type, duration) {
    const powerupElement = document.getElementById(`powerup-${type}`);
    if (!powerupElement) return null;

    const timerBar = document.createElement('div');
    timerBar.className = 'powerup-timer-bar';
    timerBar.id = `powerup-timer-${type}`;
    
    const progress = document.createElement('div');
    progress.className = 'powerup-timer-progress';
    
    timerBar.appendChild(progress);
    powerupElement.appendChild(timerBar);

    return { timerBar, progress };
}

function updatePowerupTimerBar(type, timeLeft, duration) {
    const timerBar = document.getElementById(`powerup-timer-${type}`);
    if (timerBar) {
        const progress = timerBar.querySelector('.powerup-timer-progress');
        const percentage = (timeLeft / duration) * 100;
        progress.style.width = `${percentage}%`;
    }
}

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
                img.src = src;
            });
        }

        // Background images array declaration
        const backgrounds = Array.from({ length: 16 }, (_, i) => ({
            image: null,
            floorStart: i * 100,
            color: `hsl(${i * 20}, 70%, 20%)` // Fallback color
        }));

        // Load all background images
        Promise.all(backgrounds.map((bg, index) => 
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

        // Stage names
        const stageNames = [
            { name: "Athens", start: 0, end: 999 },
            { name: "Babylon", start: 1000, end: 1999 },
            { name: "Carthage", start: 2000, end: 2999 },
            { name: "Delphi", start: 3000, end: 3999 },
            { name: "Edo", start: 4000, end: 4999 },
            { name: "Florence", start: 5000, end: 5999 },
            { name: "Granada", start: 6000, end: 6999 },
            { name: "Hangzhou", start: 7000, end: 7999 },
            { name: "Ithaca", start: 8000, end: 8999 },
            { name: "Jakarta", start: 9000, end: 9999 },
            { name: "Kathmandu", start: 10000, end: 10999 },
            { name: "Lima", start: 11000, end: 11999 },
            { name: "Mumbai", start: 12000, end: 12999 },
            { name: "Nairobi", start: 13000, end: 13999 },
            { name: "Oxford", start: 14000, end: 14999 },
            { name: "Paris", start: 15000, end: Infinity }
        ];

        // Stage name display variables
        let currentStageName = "";
        let stageNameOpacity = 0;
        let stageNameTimer = 0;

        // Game constants
        const JUMP_VELOCITY = -800;
        const GRAVITY = 2000;
        let PLATFORM_SPEED = 50;

        // Game variables
        let player = {
            x: 375,
            y: 530,
            width: 50,
            height: 50,
            speed: 500,
            velocityY: 0,
            velocityX: 0,
            isJumping: false,
            jumpCount: 0,
            maxJumps: 2,
            canJump: true
        };

        let platforms = [];
        let bottomPlatform = {
            x: 0,
            y: 580,
            width: 800,
            height: 20,
            isSafe: true
        };
        let score = 0;
        let keys = {};
        let gameRunning = false;
        let gameOver = false;
        let hasLeftGround = false;
        let currentBackgroundIndex = 0;
        let fadeAlpha = 0;
        let isFading = false;
        let nextBottomPlatformScore = 100;
        let isPlayerOnSafePlatform = false;

        // New game elements
        let comboCounter = 0;
        let comboTimer = 0;
        let movingPlatforms = [];
        let wind = { speed: 0, direction: 1 }; // 1 for right, -1 for left
        let achievements = {
            highJumper: { achieved: false, requirement: 10000 },
            comboMaster: { achieved: false, requirement: 10 },
            cryptoWhale: { achieved: false, requirement: 100000 }
        };

        // Powerup variables
        let powerups = [];
        let powerupActive = false;
        let powerupTimer = 0;
        let blocksUntilNextPowerup = Math.floor(Math.random() * 10) + 5; // Increased drop rate: 5-15 blocks
        let ethereumEffectActive = false;
        let ethereumEffectTimer = 0;
        let originalPlatformWidth = 120; // Store the original platform width
        let spikeBlockProbability = 0.05; // Initial 5% chance for spike blocks
        let tezosXEffectActive = false;
        let tezosXEffectTimer = 0;
        
        
        const powerUpTypes = ['bitcoin', 'solana', 'ethereum', 'etherLink', 'greenTezos', 'blast', 'mintTezos', 'tezosX'];
        const TEZOSX_EFFECT_DURATION = 30; // 30 seconds


        async function startGame() {
    console.log('Starting game...');
    clearCanvasOverlays();
    
    if (!isConnected) {
        console.log('Wallet not connected');
        return;
    }

    try {
        const gameStarted = await startGameWeb3(); // Call the imported function
        if (gameStarted) {
            console.log('Game started successfully. Resetting game...');
            gameStartTime = Math.floor(Date.now() / 1000); // Set as Unix timestamp
            window.gameStartTime = gameStartTime;
            console.log('Game start time set:', gameStartTime);
            resetGame();
            initGame();
            console.log('Game reset. Setting gameRunning to true...');
            gameRunning = true;
            gameOver = false;
            lastTime = performance.now();
            gameLoopId = requestAnimationFrame(gameLoop);
            await updateTryCount();
        } else {
            console.log('Failed to start game');
            drawCanvasMessage('Failed to start game. Please try again.');
        }
    } catch (error) {
        console.error('Error starting game:', error);
        drawCanvasMessage('Error starting game. Please try again.');
    }
    console.log('End of startGame function. gameRunning:', gameRunning, 'gameStartTime:', gameStartTime);
}     

if (gameRunning) {
    console.log('Starting game loop');
    requestAnimationFrame(gameLoop);
}



function gameLoop(currentTime) {
    console.log('Game loop running, time:', currentTime);
    
    if (!gameRunning || gameOver) {
        console.log('Game is not running or is over');
        cancelAnimationFrame(gameLoopId);
        return;
    }

    if (isSoundOn) {
        sounds.background.play().catch(error => console.warn("Error playing background music:", error));
    }

    gameLoopId = requestAnimationFrame(gameLoop);

    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    console.log('Updating game state, dt:', dt);
    update(dt);
    
    console.log('Drawing game');
    draw();

    // Debug information
    console.log(`Debug: Blocks: ${debugInfo.totalBlocksClimbed}, Powerups: ${powerups.length}, Difficulty: ${difficultyLevel}`);
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
    if (isSoundOn) {
        enableSound();
    } else {
        disableSound();
    }
}

function enableSound() {
    Object.values(sounds).forEach(sound => {
        sound.muted = false;
    });
    if (gameRunning) {
        sounds.background.play().catch(error => console.warn("Error playing background music:", error));
    }
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

document.getElementById('soundToggle').addEventListener('click', toggleSound);

    

       

       

        function preloadSounds() {
            return Promise.all(Object.values(sounds).map(audio => {
                return new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve, { once: true });
                    audio.addEventListener('error', reject);
                    audio.load();
                });
            }));
        }

        // Particle system
        let particles = [];

        function Particle(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = Math.random() * 2 - 1;
            this.vy = Math.random() * -2 - 1;
            this.alpha = 1;
            this.color = color;
        }

        Particle.prototype.update = function(dt) {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= dt * 2;
        };

        Particle.prototype.draw = function(ctx) {
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 2, 2);
            ctx.globalAlpha = 1;
        };

        function createParticles(x, y, count, color) {
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        function checkCollision(obj1, obj2) {
            return obj1.x < obj2.x + obj2.width &&
                   obj1.x + obj1.width > obj2.x &&
                   obj1.y < obj2.y + obj2.height &&
                   obj1.y + obj1.height > obj2.y;
        }

        function updatePowerups(dt) {
            const powerupFallSpeed = PLATFORM_SPEED * 2.5; // Powerups fall 1.5 times faster than platforms
            
            for (let i = powerups.length - 1; i >= 0; i--) {
                powerups[i].y += powerupFallSpeed * dt; // Use the new powerupFallSpeed

                if (checkCollision(player, powerups[i])) {
                    applyPowerUpEffect(powerups[i].type);
                    createParticles(powerups[i].x, powerups[i].y, 10, '#3FE1B0');
                    powerups.splice(i, 1);
                    incrementCombo();
                } else if (powerups[i].y > canvas.height) {
                    powerups.splice(i, 1);
                }
            }
        }

        function updateParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update(dt);
                if (particles[i].alpha <= 0) {
                    particles.splice(i, 1);
                }
            }
        }

        function updateCombo(dt) {
            if (comboTimer > 0) {
                comboTimer -= dt;
                if (comboTimer <= 0) {
                    comboCounter = 0;
                }
            }
        }

        function updateWind(dt) {
            if (tezosXEffectActive) {
                wind.speed = 50; // Set a constant high wind speed during the effect
                wind.direction = Math.random() < 0.5 ? -1 : 1; // Randomly change direction
            } else {
                // Existing wind logic
                if (Math.random() < 0.01) {
                    wind.speed = Math.random() * 50;
                    wind.direction = Math.random() < 0.5 ? -1 : 1;
                }
            }

            // Apply wind effect to player
            player.x += wind.speed * wind.direction * dt;
            
            // Keep player within bounds
            player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

            // Update wind indicator
            updateWindIndicator();
        }

        function updateAchievements() {
            if (!achievements.highJumper.achieved && score >= achievements.highJumper.requirement) {
                achievements.highJumper.achieved = true;
                showAchievement("High Jumper");
            }
            if (!achievements.comboMaster.achieved && comboCounter >= achievements.comboMaster.requirement) {
                achievements.comboMaster.achieved = true;
                showAchievement("Combo Master");
            }
            if (!achievements.cryptoWhale.achieved && score >= achievements.cryptoWhale.requirement) {
                achievements.cryptoWhale.achieved = true;
                showAchievement("Crypto Whale");
            }
        }

        function showAchievement(name) {
            const achievementPopup = document.getElementById('achievementPopup');
            if (achievementPopup) {
                achievementPopup.textContent = `Achievement Unlocked: ${name}`;
                achievementPopup.style.display = 'block';
                setTimeout(() => {
                    achievementPopup.style.display = 'none';
                }, 3000);
            } else {
                console.error('Achievement popup element not found');
            }
        }

        function incrementCombo() {
            comboCounter++;
            comboTimer = 10; // Set combo timer to 5 seconds
            if (comboCounter > 1) {
                score += comboCounter * 10; // Bonus points for combo
            }
        }

        function drawParticles(ctx) {
            particles.forEach(particle => particle.draw(ctx));
        }

        function applyPowerUpEffect(powerupType) {
    let message = '';
    let duration = 0;

    switch (powerupType) {
        case 'bitcoin':
            powerupActive = true;
            powerupTimer = 5;
            duration = 5;
            player.velocityY = JUMP_VELOCITY * 1.5;
            message = 'Bitcoin: Fly 5s!';
            break;
        case 'blast':
            blastEffectActive = true;
            blastEffectTimer = BLAST_POWERUP_DURATION;
            duration = BLAST_POWERUP_DURATION;
            message = `Blast: Auto-collecting EtherLink for ${BLAST_POWERUP_DURATION}s!`;
            break;
        case 'ethereum':
            ethereumEffectActive = true;
            ethereumEffectTimer = 5;
            duration = 5;
            platforms.forEach(platform => {
                platform.width *= 0.5;
            });
            message = 'Ethereum: Shrunk 5s';
            break;
        case 'greenTezos':
            player.maxJumps = 3;
            duration = 30;
            setTimeout(() => { 
                player.maxJumps = 2; 
                console.log('Green Tezos effect ended');
            }, duration * 1000);
            message = 'Green Tezos: TripleJump 30s!';
            break;
        case 'solana':
            gameOver = true;
            gameRunning = false;
            playSound('gameOver');
            message = 'Solana: Game Over!';
            break;
        case 'mintTezos':
            PLATFORM_SPEED *= 0.5;
            duration = 30;
            setTimeout(() => { PLATFORM_SPEED *= 2; }, 30000);
            message = 'Mint Tezos: Slowdown 30s!';
            break;
        case 'etherLink':
            score += 1000;
            message = 'EtherLink: +1000!';
            duration = 1; // Brief duration for visual feedback
            break;
        case 'tezosX':
            tezosXEffectActive = true;
            tezosXEffectTimer = TEZOSX_EFFECT_DURATION;
            duration = TEZOSX_EFFECT_DURATION;
            message = 'TezosX: No Wind 30s!';
            break;
    }
    
    if (duration > 0) {
        const timerBarObj = createPowerupTimerBar(powerupType, duration);
        if (timerBarObj) {
            const { timerBar, progress } = timerBarObj;
            let timeLeft = duration;
            const timerInterval = setInterval(() => {
                timeLeft -= 0.1;
                const percentage = (timeLeft / duration) * 100;
                progress.style.width = `${percentage}%`;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    timerBar.remove();
                }
            }, 100);
        }
    }

    const powerupElement = document.getElementById(`powerup-${powerupType}`);
    if (powerupElement) {
        const countElement = powerupElement.querySelector('.powerup-count');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent);
            countElement.textContent = currentCount + 1;
        }
    }
    
    playSound('powerup');
    score += powerupDescriptions[powerupType].points;
    showPowerupMessage(message);
} 

function removeAllPowerupTimerBars() {
    const timerBars = document.querySelectorAll('.powerup-timer-bar');
    timerBars.forEach(bar => bar.remove());
}

        function handleBlastEffect() {
            const blastRadius = 200; // Adjust this value to change the collection range
            let collectedCount = 0;

            for (let i = powerups.length - 1; i >= 0; i--) {
                if (powerups[i].type === 'etherLink') {
                    const dx = powerups[i].x - (player.x + player.width / 2);
                    const dy = powerups[i].y - (player.y + player.height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= blastRadius) {
                        score += powerupDescriptions['etherLink'].points;
                        createParticles(powerups[i].x, powerups[i].y, 10, '#3FE1B0');
                        powerups.splice(i, 1);
                        collectedCount++;
                    }
                }
            }

            if (collectedCount > 0) {
                showPowerupMessage(`Collected ${collectedCount} EtherLink${collectedCount > 1 ? 's' : ''}!`);
            }
        }

        // Screen shake effect
        let screenShake = {
            intensity: 0,
            duration: 0
        };

        function triggerScreenShake(intensity, duration) {
            screenShake.intensity = intensity;
            screenShake.duration = duration;
        }

        function updateScreenShake(dt) {
            if (screenShake.duration > 0) {
                screenShake.duration -= dt;
                if (screenShake.duration <= 0) {
                    screenShake.intensity = 0;
                }
            }
        }

        function applyScreenShake(ctx) {
            if (screenShake.intensity > 0) {
                const dx = Math.random() * screenShake.intensity * 2 - screenShake.intensity;
                const dy = Math.random() * screenShake.intensity * 2 - screenShake.intensity;
                ctx.save();
                ctx.translate(dx, dy);
            }
        }

        function resetScreenShake(ctx) {
            if (screenShake.intensity > 0) {
                ctx.restore();
            }
        }

        

   

        async function endGame(finalScore, finalBlocksClimbed) {
            if (typeof gameStartTime === 'undefined') {
        console.error('gameStartTime is not defined');
        alert('There was an issue with the game session. Please try starting a new game.');
        return;
    }
    window.finalScore = score;
    window.blocksClimbed = blocksClimbed;
    window.gameStartTime = gameStartTime;
    console.log('Game ended:', { score: window.finalScore, blocksClimbed: window.blocksClimbed, gameStartTime: window.gameStartTime });

    gameOver = true;
    gameRunning = false;
    removeAllPowerupTimerBars();
    console.log('Game ended with score:', window.finalScore, 'and blocks climbed:', window.blocksClimbed);
    cancelAnimationFrame(gameLoopId);
    // Display game over text
    ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3FE1B0';
    ctx.font = 'bold 48px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = '24px Orbitron, sans-serif';
    ctx.fillText(`Score: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 10);
    drawGameOver();
    console.log('Game ended:', { score: finalScore, blocksClimbed: finalBlocksClimbed, gameStartTime: window.gameStartTime });

    sounds.background.pause();
    sounds.background.currentTime = 0;
    if (isSoundOn) {
        playSound('gameOver');
    }
    // Show the name input form
    document.getElementById('nameForm').style.display = 'block';

    try {
        // Any async operations you need to perform at game end
        await updateHighscoreTable();
        // You could also update the contract state here if needed
    } catch (error) {
        console.error('Error updating end game state:', error);
    }
    intentionalGameOver = false; 
    draw();
}

async function submitHighscore(name) {
    try {
        await submitScore(name, score, blocksClimbed);
        const highscores = await getHighscores();
        updateHighscoreTable(highscores);

        if (!window.gameStartTime) {
        console.error('Game not started yet. Please start the game before submitting score');
        alert('Please start the game before submitting your score');
        return;
    }

        if (highscores[0].player === account) {
            showClaimPrizeButton();
        }
    } catch (error) {
        console.error('Error submitting highscore:', error);
    }
}

function showClaimPrizeButton() {
    const claimButton = document.createElement('button');
    claimButton.textContent = 'Claim Prize';
    claimButton.onclick = claimPrize;
    document.body.appendChild(claimButton);
}

        // Dynamic difficulty system
        let difficultyLevel = 1;
        let scoreThreshold = 2500; // Increased initial threshold
        const maxDifficultyLevel = 10; // Increased max difficulty level

        function updateDifficulty() {
            const newDifficultyLevel = Math.floor(score / 2000) + 1;
            if (newDifficultyLevel > difficultyLevel) {
                difficultyLevel = newDifficultyLevel;
                adjustGameParameters();
                console.log(`Difficulty increased to level ${difficultyLevel}. New platform speed: ${PLATFORM_SPEED}`);
            }
        }



        function adjustGameParameters() {
            // Adjust game parameters based on difficulty level
            PLATFORM_SPEED = 50 + (difficultyLevel - 1) * 5; // Slower speed increase
            player.speed = 500 + (difficultyLevel - 1) * 10; // Slower player speed increase
            
            // Adjust platform generation
            let platformWidthReduction = Math.min(40, (difficultyLevel - 1) * 5); // Cap the width reduction
            originalPlatformWidth = Math.max(80, 120 - platformWidthReduction);
            
            // Increase frequency of powerups and hazards more slowly
            blocksUntilNextPowerup = Math.max(5, 15 - (difficultyLevel - 1)); // Increased drop rate
            spikeBlockProbability = Math.min(0.15, 0.05 + (difficultyLevel - 1) * 0.01); // Cap at 15% chance

            // Add moving platforms
            if (difficultyLevel >= 3 && movingPlatforms.length < 2) {
                movingPlatforms.push({
                    x: Math.random() * (canvas.width - 100),
                    y: Math.random() * (canvas.height / 2),
                    width: 100,
                    height: 15,
                    speed: 50 + Math.random() * 50
                });
            }

            // Increase wind probability and max speed
            if (difficultyLevel >= 5) {
                wind.speed = Math.random() * (50 + difficultyLevel * 5);
            }
        }

        function createPlatform(y) {
            if (!canvas) {
                console.error('Canvas not initialized in createPlatform');
                return null;
            }
            let platformType = Math.random();
            let platform = {
                x: Math.random() * (canvas.width - (ethereumEffectActive ? originalPlatformWidth * 0.5 : originalPlatformWidth)),
                y: y,
                width: ethereumEffectActive ? originalPlatformWidth * 0.5 : originalPlatformWidth,
                height: 15,
                isGolden: (score + platforms.length) % 15 === 0
            };

            if (platformType < spikeBlockProbability) {
                platform.isSpike = true;
            }

            return platform;
        }

        function createPowerup(y) {
    if (!canvas) {
        console.error('Canvas not initialized in createPowerup');
        return null;
    }
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    debugInfo.powerupsGenerated++;
    console.log(`Powerup generated. Total: ${debugInfo.powerupsGenerated}, Type: ${type}`);
    return {
        x: Math.random() * (canvas.width - 30),
        y: y,
        width: 30,
        height: 30,
        type: type
    };
}  

        

        function updateBackground() {
            let newBackgroundIndex = Math.min(Math.floor(score / 1000), backgrounds.length - 1);
            if (newBackgroundIndex !== currentBackgroundIndex) {
                currentBackgroundIndex = newBackgroundIndex;
                isFading = true;
                fadeAlpha = 0;
                
                // Update stage name when background changes
                updateStageName();
            }
            draw();
        }

         // Make sure game is in a startable state
         gameRunning = false;
        gameOver = false;

        function updateStageName() {
            const currentStage = stageNames.find(stage => score >= stage.start && score <= stage.end) || stageNames[stageNames.length - 1];
            if (currentStage && currentStage.name !== currentStageName) {
                currentStageName = currentStage.name;
                stageNameOpacity = 1;
                stageNameTimer = 3; // 3 seconds display time
            }
        }

        function update(dt) {
            if (!gameRunning || gameOver) return;
console.log('Updating game state, dt:', dt);
    console.log('Player position:', player.x, player.y);
    console.log('Update function called, dt:', dt);
            if (!gameRunning || gameOver) return;
            
            updateWindIndicator();

            if (blastEffectActive) {
                blastEffectTimer -= dt;
                if (blastEffectTimer <= 0) {
                    blastEffectActive = false;
                    blastEffectTimer = 0;
                } else {
                    handleBlastEffect();
                }
            }

            if (tezosXEffectActive) {
                tezosXEffectTimer -= dt;
                if (tezosXEffectTimer <= 0) {
                    tezosXEffectActive = false;
                    tezosXEffectTimer = 0;
                }
            }

            // Add a safety check to prevent infinite loops
            if (debugInfo.totalBlocksClimbed > 10000) {
                console.error("Game loop safety limit reached");
                gameOver = true;
                gameRunning = false;
                return;
            }

            updateDifficulty();
            updateScreenShake(dt);
            updateParticles(dt);
            updateCombo(dt);
            updateWind(dt);
            updateAchievements();
            updatePowerups(dt);

            // Update stage name
            if (stageNameTimer > 0) {
                stageNameTimer -= dt;
                if (stageNameTimer <= 0) {
                    stageNameOpacity = Math.max(0, stageNameOpacity - dt);
                }
            }

            // Player movement
            let moveSpeed = player.speed;

            if (keys.ArrowLeft) {
                player.velocityX = -moveSpeed;
            } else if (keys.ArrowRight) {
                player.velocityX = moveSpeed;
            } else {
                player.velocityX = 0; // Stop horizontal movement when no key is pressed
            }

            player.x += player.velocityX * dt;

            // Keep player within bounds
            player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

            // Jumping
            if (keys.ArrowUp && player.jumpCount < player.maxJumps && player.canJump) {
                player.velocityY = JUMP_VELOCITY;
                player.isJumping = true;
                player.jumpCount++;
                player.canJump = false;
                if (!hasLeftGround) {
                    hasLeftGround = true;
                }
                if (isPlayerOnSafePlatform) {
                    isPlayerOnSafePlatform = false;
                }
                createParticles(player.x + player.width / 2, player.y + player.height, 10, '#3FE1B0');
                playSound('jump');
            }

            // Reset canJump when the up arrow key is released
            if (!keys.ArrowUp) {
                player.canJump = true;
            }

            // Powerup jumping (unlimited jumps)
            if (powerupActive && keys.ArrowUp && player.canJump) {
                player.velocityY = JUMP_VELOCITY;
                player.canJump = false;
                if (!hasLeftGround) {
                    hasLeftGround = true;
                }
                if (isPlayerOnSafePlatform) {
                    isPlayerOnSafePlatform = false;
                }
                createParticles(player.x + player.width / 2, player.y + player.height, 10, '#3FE1B0');
                playSound('jump');
            }

            // Apply gravity
            player.velocityY += GRAVITY * dt;
            player.y += player.velocityY * dt;

            // Handle platform collisions
            let onPlatform = false;
            if (player.velocityY >= 0) {
                if (player.y + player.height > bottomPlatform.y && 
                    player.y + player.height < bottomPlatform.y + bottomPlatform.height &&
                    bottomPlatform.y < canvas.height) {
                    player.y = bottomPlatform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                    player.jumpCount = 0;
                    if (bottomPlatform.isSafe) {
                        isPlayerOnSafePlatform = true;
                    }
                    createParticles(player.x + player.width / 2, player.y + player.height, 5, '#3FE1B0');
                    onPlatform = true;
                }

                platforms.forEach(platform => {
                    if (player.y + player.height > platform.y &&
                        player.y + player.height < platform.y + platform.height &&
                        player.x < platform.x + platform.width &&
                        player.x + player.width > platform.x) {
                        if (platform.isSpike) {
                            intentionalGameOver = true;
                            gameOver = true;
                            gameRunning = false;
                            endGame(score, blocksClimbed);
                            playSound('gameOver');
                            return;
                        } else {
                            player.y = platform.y - player.height;
                            player.velocityY = 0;
                            player.isJumping = false;
                            player.jumpCount = 0;
                            onPlatform = true;

                            if (platform.isGolden) {
                                player.velocityY = JUMP_VELOCITY * 1.5; // 1.5x jump height for golden platforms
                                score += 15;
                                triggerScreenShake(5, 0.3);
                                createParticles(player.x + player.width / 2, player.y + player.height, 15, '#3FE1B0');
                                playSound('powerup');
                            } else {
                                createParticles(player.x + player.width / 2, player.y + player.height, 15, '#3FE1B0');
                            }
                        }
                    }
                });

                // Check collision with moving platforms
                movingPlatforms.forEach(platform => {
                    if (player.y + player.height > platform.y &&
                        player.y + player.height < platform.y + platform.height &&
                        player.x < platform.x + platform.width &&
                        player.x + player.width > platform.x) {
                        player.y = platform.y - player.height;
                        player.velocityY = 0;
                        player.isJumping = false;
                        player.jumpCount = 0;
                        onPlatform = true;
                        createParticles(player.x + player.width / 2, player.y + player.height, 5, '#3FE1B0');
                    }
                });
            }

            if (!onPlatform) {
                player.isJumping = true;
            }

            // Move platforms and generate new ones
            if (hasLeftGround && !isPlayerOnSafePlatform) {
                platforms.forEach((platform, index) => {
                    platform.y += PLATFORM_SPEED * dt;
                    
                    if (platform.y > canvas.height) {
                        score++;
                        blocksClimbed++; // Increment blocks climbed
                        updateBlockCounter(); // Update the block counter display
                        debugInfo.totalBlocksClimbed++;
                        document.getElementById('floorCounter').textContent = `Tezos Price: ${score.toString().padStart(7, '0')}`;
                        platforms[index] = createPlatform(0);
                        
                        updateBackground();

                        // Check if it's time to generate a new powerup
                        if (debugInfo.totalBlocksClimbed >= blocksUntilNextPowerup) {
                            powerups.push(createPowerup(0));
                            blocksUntilNextPowerup = debugInfo.totalBlocksClimbed + Math.floor(Math.random() * 10) + 5; // Increased drop rate
                            console.log(`Powerup generated. Next at ${blocksUntilNextPowerup}`);
                        }
                    }
                });

                // Move bottom platform
                bottomPlatform.y += PLATFORM_SPEED * dt;

                // Create new bottom platform every 100 floors
                if (score >= nextBottomPlatformScore) {
                    bottomPlatform = {
                        x: 0,
                        y: 0,
                        width: 800,
                        height: 20,
                        isSafe: true
                    };
                    nextBottomPlatformScore += 100;
                }

                // Move and update moving platforms
                movingPlatforms.forEach(platform => {
                    platform.x += platform.speed * dt;
                    platform.y += PLATFORM_SPEED * dt;
                    if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
                        platform.speed *= -1;
                    }
                    if (platform.y > canvas.height) {
                        platform.y = 0;
                        platform.x = Math.random() * (canvas.width - platform.width);
                    }
                });
            }

            // Keep player in view
            if (player.y < 300 && !isPlayerOnSafePlatform) {
                let diff = 300 - player.y;
                player.y = 300;
                platforms.forEach(platform => {
                    platform.y += diff;
                });
                movingPlatforms.forEach(platform => {
                    platform.y += diff;
                });
                bottomPlatform.y += diff;
            }

            // Game over condition
            if (player.y > canvas.height) {
                if (!bottomPlatform.isSafe || player.y > bottomPlatform.y + bottomPlatform.height) {
                    gameOver = true;
                    gameRunning = false;
                    playSound('gameOver');
                    endGame(score);  // Call the new endGame function instead of showNameForm
                }
            }
            // Reset bottom platform safety when player leaves it
            if (player.y + player.height < bottomPlatform.y) {
                bottomPlatform.isSafe = false;
                isPlayerOnSafePlatform = false;
            }

            // Apply wind effect to player
            player.x += wind.speed * wind.direction * dt;
            player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

            // Powerup timer
            if (powerupActive) {
                powerupTimer -= dt;
                if (powerupTimer <= 0) {
                    powerupActive = false;
                }
            }

            // Ethereum effect timer
            if (ethereumEffectActive) {
                ethereumEffectTimer -= dt;
                if (ethereumEffectTimer <= 0) {
                    ethereumEffectActive = false;
                    // Reset platform sizes
                    platforms.forEach(platform => {
                        platform.width = originalPlatformWidth;
                    });
                }
            }

            // Update wind indicator
            updateWindIndicator();

            // Add debug info display
            console.log(`Debug: Blocks: ${debugInfo.totalBlocksClimbed}, Powerups: ${powerups.length}, Difficulty: ${difficultyLevel}`);

            if (gameOver && !intentionalGameOver) {
        console.error('Unexpected game over condition');
        endGame(score, blocksClimbed);
            }
        }

        function draw() {
            console.log('Drawing. gameRunning:', gameRunning, 'isConnected:', isConnected, 'gameOver:', gameOver);
console.log('Drawing frame');
ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 50, 50);
            if (!ctx) {
                console.error('Canvas context not initialized in draw');
                return;
            }
            applyScreenShake(ctx);
            
            // Draw current background
            const currentBg = backgrounds[currentBackgroundIndex];
            const playerSprite = sprites.get('player');
            if (currentBg.image && currentBg.image.complete && currentBg.image.naturalHeight !== 0) {
                ctx.drawImage(currentBg.image, 0, 0, canvas.width, canvas.height);
            } else {
                // Use fallback color if image not loaded or invalid
                ctx.fillStyle = currentBg.color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (isConnected) {
            const tries = parseInt(document.getElementById('triesLeft').textContent);
            if (tries > 0) {
                drawCanvasButton('Start Game', startGame);
            } else {
                drawCanvasMessage('Please buy more tries');
            }
        } else {
            drawCanvasMessage('Please connect your wallet to play');
        }
    }

            // Draw player
            
            if (playerSprite && playerSprite.complete && playerSprite.naturalHeight !== 0) {
                if (powerupActive) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(63, 225, 176, 0.5)';
                    ctx.fillRect(player.x, player.y, player.width, player.height);
                    ctx.restore();
                }
                ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
            } else {
                ctx.fillStyle = powerupActive ? '#3FE1B0' : '#FFFFFF';
                ctx.fillRect(player.x, player.y, player.width, player.height);
            }
            
            // Draw stage name
            if (stageNameOpacity > 0) {
                ctx.globalAlpha = stageNameOpacity;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 48px Orbitron, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(currentStageName, canvas.width / 2, canvas.height / 2);
                ctx.globalAlpha = 1;
            }

            // Update player color
            if (playerSprite && playerSprite.complete && playerSprite.naturalHeight !== 0) {
                if (powerupActive) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'source-atop';
                    ctx.fillStyle = 'rgba(63, 225, 176, 0.5)';
                    ctx.fillRect(player.x, player.y, player.width, player.height);
                    ctx.restore();
                }
                ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
            } else {
                ctx.fillStyle = powerupActive ? '#3FE1B0' : '#FFFFFF';
                ctx.fillRect(player.x, player.y, player.width, player.height);
            }

            // If fading, draw the next background with increasing opacity
            if (isFading) {
                ctx.globalAlpha = fadeAlpha;
                const nextBg = backgrounds[Math.min(currentBackgroundIndex + 1, backgrounds.length - 1)];
                if (nextBg.image && nextBg.image.complete && nextBg.image.naturalHeight !== 0) {
                    ctx.drawImage(nextBg.image, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = nextBg.color;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.globalAlpha = 1;
                
                fadeAlpha += 0.02;
                if (fadeAlpha >= 1) {
                    isFading = false;
                }
            }

            if (gameOver) {
                document.dispatchEvent(new Event('gameOver'));
                drawGameOver();
            } else {
                // Draw bottom platform
                ctx.fillStyle = bottomPlatform.isSafe ? '#4CAF50' : '#0f3460';
                ctx.fillRect(bottomPlatform.x, bottomPlatform.y, bottomPlatform.width, bottomPlatform.height);

                // Draw platforms
                platforms.forEach(platform => {
                    if (platform.isSpike) {
                        ctx.fillStyle = '#FF0000';
                        ctx.beginPath();
                        ctx.moveTo(platform.x, platform.y + platform.height);
                        ctx.lineTo(platform.x + platform.width / 2, platform.y);
                        ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
                        ctx.closePath();
                        ctx.fill();
                    } else if (platform.isGolden) {
                        ctx.fillStyle = '#3FE1B0';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    } else {
                        ctx.fillStyle = '#1E293B';
                        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                    }
                });

                // Draw moving platforms
                movingPlatforms.forEach(platform => {
                    ctx.fillStyle = '#3FE1B0';
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                });

                // Draw powerups
                if (powerups.length > 0) {
        console.log(`Drawing ${powerups.length} powerups`);
        powerups.forEach(powerup => {
            const sprite = sprites.get(powerup.type);
            if (sprite && sprite.complete && sprite.naturalHeight !== 0) {
                ctx.drawImage(sprite, powerup.x, powerup.y, powerup.width, powerup.height);
            } else {
                console.warn(`Sprite for ${powerup.type} not found or not loaded`);
                // Draw a colored rectangle as a fallback
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            }
        });
    } else {
        console.log('No powerups to draw');
    }

                // Draw blast radius indicator if active
                if (blastEffectActive) {
                    ctx.beginPath();
                    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 200, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Draw particles
                drawParticles(ctx);

                // Draw combo counter
                if (comboCounter > 1) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 24px Orbitron, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Combo: ${comboCounter}x`, canvas.width / 2, 30);
                }
            }
            // Update wind indicator position
            updateWindIndicator();
            resetScreenShake(ctx);
        }

        function drawGameOver() {
            if (!ctx) {
                console.error('Canvas context not initialized in drawGameOver');
                return;
            }
            ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#3FE1B0';
            ctx.font = 'bold 48px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

            ctx.font = '24px Orbitron, sans-serif';
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

            ctx.font = '20px Orbitron, sans-serif';
            ctx.fillText('Enter your name to save your score', canvas.width / 2, canvas.height / 2 + 50);

            
        }

        function drawCanvasButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'canvas-button';
    button.onclick = onClick;
    
    const canvasRect = canvas.getBoundingClientRect();
    button.style.position = 'absolute';
    button.style.left = `${canvasRect.left + canvas.width / 2}px`;
    button.style.top = `${canvasRect.top + canvas.height / 2}px`;
    button.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(button);
}

function drawCanvasMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.className = 'canvas-message';
    document.body.appendChild(message);
}

function clearCanvasOverlays() {
    const overlays = document.querySelectorAll('.canvas-button, .canvas-message');
    overlays.forEach(overlay => overlay.remove());
} 


function resetGame() {
    console.log('Resetting game...');
    document.dispatchEvent(new Event('gameReset'));
    clearCanvasOverlays();
    removeAllPowerupTimerBars();

    const powerupTimers = document.getElementById('powerupTimers');
    if (powerupTimers) {
        powerupTimers.innerHTML = '';
    }

    // Reset powerup counts
    const powerUpTypes = ['bitcoin', 'solana', 'ethereum', 'etherLink', 'greenTezos', 'blast', 'mintTezos', 'tezosX'];
    for (const type of powerUpTypes) {
        const powerupElement = document.getElementById(`powerup-${type}`);
        if (powerupElement) {
            const countElement = powerupElement.querySelector('.powerup-count');
            if (countElement) {
                countElement.textContent = '0';
            }
        }
    }

    // Rest of your reset code...
    gameRunning = true;
    gameOver = false;
    lastTime = performance.now();
    blocksClimbed = 0;
    score = 0;
    
    // Reset powerup-related variables
    powerups = [];
    powerupActive = false;
    powerupTimer = 0;
    blocksUntilNextPowerup = Math.floor(Math.random() * 10) + 5;
    ethereumEffectActive = false;
    ethereumEffectTimer = 0;
    blastEffectActive = false;
    blastEffectTimer = 0;
    tezosXEffectActive = false;
    tezosXEffectTimer = 0;

    // Reset player position and properties
    player.x = 375;
    player.y = 530;
    player.velocityY = 0;
    player.velocityX = 0;
    player.isJumping = false;
    player.jumpCount = 0;
    player.canJump = true;
    player.maxJumps = 2;

    // Reset game state
    platforms = [];
    bottomPlatform = {
        x: 0,
        y: 580,
        width: 800,
        height: 20,
        isSafe: true
    };
    hasLeftGround = false;
    currentBackgroundIndex = 0;
    isFading = false;
    fadeAlpha = 0;
    nextBottomPlatformScore = 100;
    isPlayerOnSafePlatform = false;
    
    // Reset difficulty parameters
    difficultyLevel = 1;
    PLATFORM_SPEED = 50;
    player.speed = 500;
    originalPlatformWidth = 120;
    spikeBlockProbability = 0.05;

    // Reset gameplay elements
    comboCounter = 0;
    comboTimer = 0;
    movingPlatforms = [];
    wind = { speed: 0, direction: 1 };

    // Reset achievements
    achievements = {
        highJumper: { achieved: false, requirement: 10000 },
        comboMaster: { achieved: false, requirement: 10 },
        cryptoWhale: { achieved: false, requirement: 100000 }
    };

    // Update UI
    updateBlockCounter();
    document.getElementById('floorCounter').textContent = 'Tezos Price: 0000000';
    updateWindIndicator();

    // Reinitialize game
    initGame();

    console.log('Game reset complete.');
    draw();
}

        function updateWindIndicator() {
            const windIndicator = document.getElementById('windIndicator');
            if (!windIndicator) {
                console.error('Wind indicator element not found');
                return;
            }
            const arrow = wind.direction === 1 ? '→' : '←';
            const strength = Math.floor(wind.speed / 10); // Normalize wind speed to 0-5 range
            windIndicator.textContent = `${arrow}${'•'.repeat(strength)}`;
            windIndicator.style.opacity = wind.speed / 20
            // Position the indicator above the player using percentages
            const leftPercentage = (player.x + player.width / 2) / canvas.width * 100;
            const topPercentage = (player.y - 30) / canvas.height * 100;
            
            windIndicator.style.left = `${leftPercentage}%`;
            windIndicator.style.top = `${topPercentage}%`;
            windIndicator.style.transform = 'translate(-50%, -50%)'; // Center the indicator
        }

        

        async function loadHighscores() {
            try {
                const highscores = await getHighscores();
                updateHighscoreTable(highscores);
            } catch (error) {
                console.error('Error loading highscores:', error);
                // Handle the error appropriately, maybe show an error message to the user
            }
        }

        async function updateTryCount() {
    try {
        const tries = await getGameTries();
        const triesLeftSpan = document.getElementById('triesLeft');
        if (triesLeftSpan) {
            triesLeftSpan.textContent = tries;
        }
    } catch (error) {
        console.error('Failed to get game tries:', error);
    }
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

    // Get the current account - adjust this based on your blockchain and wallet provider
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      currentAccount = accounts[0];
      console.log('Current account:', currentAccount);
    } else {
      console.log('Ethereum provider not found. Using alternative method.');
      // currentAccount = ... (get account from your blockchain provider)
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

    // Call updateClaimPrizeButton only once, with the correct account
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

async function checkAndDisplayStartButton() {
    try {
        const tries = await getGameTries();
        console.log('Current game tries:', tries);
        if (tries > 0) {
            console.log('Drawing Start Game button');
            drawCanvasButton('Start Game', startGame);
        } else {
            clearCanvasOverlays();
            drawCanvasMessage('No more tries left. Please purchase more.');
        }
    } catch (error) {
        console.error('Error checking game tries:', error);
        drawCanvasMessage('Error checking game tries. Please try again.');
    }
}


function populatePowerupBar() {
    console.log('Populating powerup bar...');
    const powerupBar = document.getElementById('powerupBar');
    if (!powerupBar) {
        console.error('Powerup bar not found in the DOM');
        return;
    }
    powerupBar.innerHTML = ''; // Clear existing content
    for (const [type, info] of Object.entries(powerupDescriptions)) {
        console.log(`Creating powerup icon for ${type}`);
        const powerupItem = document.createElement('div');
        powerupItem.className = 'powerup-item';
        powerupItem.id = `powerup-${type}`;
        const imageName = powerupImages[type] || `${type}.png`;
        powerupItem.innerHTML = `
            <img src="${picsUrl}${imageName}" alt="${type}" class="powerup-icon">
            <span class="powerup-count">0</span>
        `;
        powerupBar.appendChild(powerupItem);
        console.log(`Added powerup icon for ${type}`);
    }
    console.log('Finished populating powerup bar');
}

        function initialize() {
    console.log('Initializing...');
    canvas = document.getElementById('gameCanvas');
    console.log('Canvas element:', canvas);
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    ctx = canvas.getContext('2d');
    console.log('Canvas context:', ctx);
    if (!ctx) {
        console.error('Unable to get 2D context');
        return;
    }
    console.log('Canvas initialized, dimensions:', canvas.width, 'x', canvas.height);
    canvas.style.border = '2px solid red';
    canvas.style.zIndex = '1000';

    populatePowerupBar();
    loadSprites();
    preloadSounds();


    
    console.log('Initialization complete');
}  


    const floorCounter = document.getElementById('floorCounter');
    const achievementPopup = document.getElementById('achievementPopup');
    const nameForm = document.getElementById('nameForm');


    // Web3 button event listeners
    let isConnected = false;

    document.getElementById('walletConnectBtn').addEventListener('click', async () => {
        console.log('Wallet connect button clicked');
    if (!isConnected) {
        try {
            const connected = await initWeb3();
            console.log('Web3 initialization result:', connected);
            if (connected) {
                console.log('Successfully connected to Web3');
                isConnected = true;
                updateButtonState();
                updateTryCount();
                document.getElementById('buyTriesBtn').style.display = 'block';
                await updateHighscoreTable();
                checkAndDisplayStartButton();
                updateButtonState();
                draw();
            }
        } catch (error) {
            console.error('Failed to connect to Web3:', error);
            alert('Failed to connect to Web3. Please try again.');
        }
    } else {
        try {
            // Implement your disconnect logic here
            // For example: await disconnectWeb3();
            isConnected = false;
            updateButtonState();
            console.log('Disconnected from Web3');
            document.getElementById('buyTriesBtn').style.display = 'none';
            draw();
        } catch (error) {
            console.error('Failed to disconnect from Web3:', error);
            alert('Failed to disconnect from Web3. Please try again.');
        }
        
    }
});



document.getElementById('buyTriesBtn').addEventListener('click', async () => {
    try {
        const purchased = await purchaseGameTries();
        if (purchased) {
            console.log('Game tries purchased successfully');
            alert('10 game tries purchased successfully!');
            updateTryCount();
            updateButtonState();
            draw();
        }
    } catch (error) {
        console.error('Failed to purchase game tries:', error);
        alert('Failed to purchase game tries. Please try again.');
    }
});

document.getElementById('claimPrizeBtn').addEventListener('click', async () => {
    try {
        const result = await claimPrize();
        if (result) {
            alert('Prize claimed successfully! Congratz!');
            updateHighscoreTable(); // Refresh the table and button state
        } else {
            alert('Failed to claim prize. Not eligble.');
        }
    } catch (error) {
        console.error('Error claiming prize:', error);
        alert('An error occurred while claiming the prize. Please try again.');
    }
});

function updateButtonState() {
    const connectButton = document.getElementById('walletConnectBtn');
    const buyButton = document.getElementById('buyTriesBtn');
    const tryCounter = document.getElementById('tryCounter');
    
    if (isConnected) {
        connectButton.textContent = 'Disconnect wallet';
        connectButton.classList.add('disconnect-button');
        connectButton.classList.remove('connect-button');
        buyButton.style.display = 'block';
        tryCounter.style.display = 'block';
        updateTryCount(); // We'll create this function next
        checkAndDisplayStartButton();
    } else {
        connectButton.textContent = 'Connect wallet';
        connectButton.classList.remove('disconnect-button');
        connectButton.classList.add('connect-button');
        buyButton.style.display = 'none';
        tryCounter.style.display = 'none';
        clearCanvasOverlays();
    }

    draw();
}


    document.getElementById('nameForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('nameInput').value.trim();
    
    if (!name) {
        alert('Please enter a valid name');
        return;
    }

    console.log('Form submitted. Current game data:', { 
        finalScore: window.finalScore, 
        blocksClimbed: window.blocksClimbed, 
        gameStartTime: window.gameStartTime 
    });

    try {
        const submitted = await submitScore(name, window.finalScore, window.blocksClimbed, window.gameStartTime);
        if (submitted) {
            console.log('Score submitted successfully');
            await updateHighscoreTable();
            alert('Score submitted successfully!');
        } else {
            console.error('Failed to submit score');
            alert('Failed to submit score. Please check the console for more details.');
        }
    } catch (error) {
        console.error('Error during score submission:', error);
        alert('An error occurred while submitting your score. Please check the console for more details.');
    }

    this.style.display = 'none';
});

    // Keyboard input handling
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Initialize Web3
    console.log('Initializing Web3...');
    initWeb3().then(() => {
        console.log('Web3 initialized');
        loadHighscores().catch(error => console.error('Failed to load highscores:', error));
    }).catch(error => {
        console.error('Failed to initialize Web3:', error);
        // You might want to display an error message to the user here
    });

    // Load sprites, populate powerup descriptions, preload sounds, etc.
    // ... (rest of your initialization code)

    (function() {
    document.addEventListener('DOMContentLoaded', initialize);
})();
        
    </script>
</body>
</html>
