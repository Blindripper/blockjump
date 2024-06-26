import { getAchievements, mintAchievement } from './web3Integration.js';

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

function renderAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';

    achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${userAchievements.includes(achievement.id) ? 'unlocked' : ''}`;
        achievementElement.innerHTML = `
            <div class="achievement-content">
                <img src="https://raw.githubusercontent.com/Blindripper/blockjump/main/NFT/${achievement.image}" alt="${achievement.name}">
                <div class="achievement-info">
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
                </div>
            </div>
            <button class="mint-button" data-id="${achievement.id}">Mint NFT</button>
        `;
        achievementsList.appendChild(achievementElement);

        const mintButton = achievementElement.querySelector('.mint-button');
        mintButton.addEventListener('click', () => mintAchievementNFT(achievement.id));
    });

    updateMintButtons();
}

function updateMintButtons() {
    achievements.forEach(achievement => {
        const mintButton = document.querySelector(`.mint-button[data-id="${achievement.id}"]`);
        if (mintButton) {
            mintButton.style.display = userAchievements.includes(achievement.id) ? 'none' : 'block';
        }
    });
}

async function loadUserAchievements() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        userAchievements = await getAchievements(window.ethereum.selectedAddress);
        renderAchievements();
    }
}

async function mintAchievementNFT(achievementId) {
    if (window.ethereum && window.ethereum.selectedAddress) {
        const success = await mintAchievement(window.ethereum.selectedAddress, achievementId);
        if (success) {
            userAchievements.push(achievementId);
            renderAchievements();
        }
    }
}

function checkAchievements(stats) {
    achievements.forEach(achievement => {
        if (!userAchievements.includes(achievement.id) && achievement.requirement(stats)) {
            userAchievements.push(achievement.id);
            renderAchievements();
        }
    });
}

// Initialize achievements
loadUserAchievements();

// Export functions to be used in the main game logic
export { checkAchievements, loadUserAchievements };
