import { getAchievements, mintAchievement, initWeb3 } from './web3Integration.js';

const achievements = [
    {
        id: 1,
        name: "666 Climber",
        description: "Game over exactly at 66 Blocks climbed",
        image: "666.jpg",
        requirement: (stats) => stats.blocksClimbed === 66
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
        description: "100 or more Blocks climbed",
        image: "highfall.jpg",
        requirement: (stats) => stats.blocksClimbed >= 100
    },
    {
        id: 4,
        name: "Paris Explorer",
        description: "Reach the Paris background",
        image: "paris.jpg",
        requirement: (stats) => stats.score >= 80000
    },
    {
        id: 5,
        name: "Pro Gamer",
        description: "Score 200k",
        image: "progamer.jpg",
        requirement: (stats) => stats.score >= 200000
    }
];

let userAchievements = [];
let gameStats = {};

function renderAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) {
        console.error('Achievements list element not found');
        return;
    }
    achievementsList.innerHTML = '';

    achievements.forEach(achievement => {
        const isUnlocked = achievement.requirement(gameStats);
        const isAlreadyMinted = userAchievements.includes(achievement.id);
        
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
            mintButton.addEventListener('click', () => mintAchievement(achievement.id));
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
                return;
            }
            
            userAchievements = await getAchievements(window.ethereum.selectedAddress);
            renderAchievements();
        } else {
        }
    } catch (error) {
        console.error('Error loading achievements:', error);
    }
}

// Export functions to be used in the main game logic
export { updateGameStats, loadUserAchievements };
