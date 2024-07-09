import { getAchievements, mintAchievementNFT, initWeb3 } from './web3Integration.js';

const achievements = [
    {
        id: 1,
        name: "666 Climber",
        description: "Game over exactly at 666 Blocks climbed",
        image: "666.jpg",
        requirement: (stats) => stats.blocksClimbed === 666
    },
    {
        id: 2,
        name: "Power Collector",
        description: "Collect 100 Powerups in 1 Run",
        image: "colectoor.jpg",
        requirement: (stats) => stats.powerupsCollected >= 100
    },
    {
        id: 3,
        name: "High Climber",
        description: "1000 or more Blocks climbed",
        image: "highfall.jpg",
        requirement: (stats) => stats.blocksClimbed >= 1000
    },
    {
        id: 4,
        name: "Paris Explorer",
        description: "Reach the Paris background",
        image: "paris.jpg",
        requirement: (stats) => stats.score >= 15000
    },
    {
        id: 5,
        name: "Pro Gamer",
        description: "Score 100k",
        image: "progamer.jpg",
        requirement: (stats) => stats.score >= 100000
    }
];

let userAchievements = [];
let gameStats = {};

function renderAchievements() {
    console.log('Current game stats:', gameStats);
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) {
        console.error('Achievements list element not found');
        return;
    }
    achievementsList.innerHTML = '';

    achievements.forEach(achievement => {
        const isUnlocked = achievement.requirement(gameStats);
        const isAlreadyMinted = userAchievements.includes(achievement.id);
        console.log(`Achievement ${achievement.name} unlocked:`, isUnlocked, 'Already minted:', isAlreadyMinted);
        
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : ''} ${isAlreadyMinted ? 'minted' : ''}`;
        achievementElement.innerHTML = `
            <div class="achievement-content">
                <img src="https://raw.githubusercontent.com/Blindripper/blockjump/main/NFT/${achievement.image}" alt="${achievement.name}">
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            </div>
            ${isAlreadyMinted ? '<span class="minted-label">Minted</span>' : '<button class="mint-button" data-id="${achievement.id}">Mint NFT</button>'}
        `;
        achievementsList.appendChild(achievementElement);

        if (!isAlreadyMinted) {
            const mintButton = achievementElement.querySelector('.mint-button');
            mintButton.style.display = isUnlocked ? 'block' : 'none';
            mintButton.addEventListener('click', () => mintAchievementNFT(achievement.id));
        }
    });

    const achievementsSection = document.getElementById('achievementsSection');
    if (achievementsSection) {
        achievementsSection.style.display = 'block';
    }
}

function updateGameStats(stats) {
    gameStats = { ...gameStats, ...stats };
    renderAchievements();
}

async function loadUserAchievements() {
    try {
        if (window.ethereum && window.ethereum.selectedAddress) {
            const web3Initialized = await initWeb3();
            if (!web3Initialized) {
                console.log('Web3 not initialized, cannot load achievements');
                return;
            }
            
            userAchievements = await getAchievements(window.ethereum.selectedAddress);
            console.log('Loaded user achievements:', userAchievements);
            renderAchievements();
        } else {
            console.log('Wallet not connected');
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

// Export functions to be used in the main game logic
export { updateGameStats, loadUserAchievements };
