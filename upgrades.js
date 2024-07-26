// upgrades.js

import { getJumpBalance, getCurrentAccount, addFunds } from './web3Integration.js';

const UPGRADES = {
    speed: [
        { cost: 30000, jumpCost: 300, effect: 1.03 },
        { cost: 60000, jumpCost: 600, effect: 1.06 },
        { cost: 90000, jumpCost: 900, effect: 1.10 }
    ],
    jump: [
        { cost: 50000, jumpCost: 500, effect: { jumps: 3, height: 1 } },
        { cost: 100000, jumpCost: 1000, effect: { jumps: 3, height: 1.03 } },
        { cost: 200000, jumpCost: 2000, effect: { jumps: 3, height: 1.08 } }
    ],
    shield: [
        { cost: 40000, jumpCost: 400, effect: 1 },
        { cost: 80000, jumpCost: 800, effect: 2 },
        { cost: 120000, jumpCost: 1200, effect: 3 }
    ],
    rapid: [
        { cost: 100000, jumpCost: 1000, effect: 0.9 },
        { cost: 200000, jumpCost: 2000, effect: 0.75 },
        { cost: 500000, jumpCost: 5000, effect: 0.5 }
    ],
    bomb: { cost: 50000, jumpCost: 500, maxCount: 3 }
};

class PlayerUpgrades {
    constructor() {
        this.score = 0;
        this.jumpBalance = 0;
        this.upgrades = {
            speed: 0,
            jump: 0,
            shield: 0,
            rapid: 0,
            bomb: 0
        };
    }

    async updateJumpBalance() {
        try {
            const account = await getCurrentAccount();
            if (account) {
              this.jumpBalance = await getJumpBalance(account);
              console.log('Updated jumpBalance:', this.jumpBalance); // For debugging
            } else {
              console.error('No account found');
              this.jumpBalance = 0; // Or handle this case appropriately
            }
          } catch (error) {
            console.error('Error updating JUMP balance:', error);
            this.jumpBalance = 0; // Or handle this case appropriately
          }
        }

    canAfford(upgradeType, tier, useJump, maxPrice = null) {
        if (maxPrice !== null) {
            const balance = useJump ? this.jumpBalance : this.score;
            return balance >= maxPrice;
        }

        const price = useJump ? 
            (upgradeType === 'bomb' ? UPGRADES.bomb.jumpCost : UPGRADES[upgradeType][tier].jumpCost) :
            (upgradeType === 'bomb' ? UPGRADES.bomb.cost : UPGRADES[upgradeType][tier].cost);
        
        const balance = useJump ? this.jumpBalance : this.score;
        
        
        if (upgradeType === 'bomb') {
            const canAfford = balance >= price && this.upgrades.bomb < UPGRADES.bomb.maxCount;
            return canAfford;
        }
        
        const canAfford = balance >= price;
        return canAfford;
    }

    calculateMaxPrice(upgradeType, useJump) {
        let totalPrice = 0;
        const currentTier = this.upgrades[upgradeType];
        
        if (upgradeType === 'bomb') {
            const remainingBombs = UPGRADES.bomb.maxCount - currentTier;
            return useJump ? UPGRADES.bomb.jumpCost * remainingBombs : UPGRADES.bomb.cost * remainingBombs;
        }

        for (let i = currentTier; i < UPGRADES[upgradeType].length; i++) {
            totalPrice += useJump ? UPGRADES[upgradeType][i].jumpCost : UPGRADES[upgradeType][i].cost;
        }
        return totalPrice;
    }

    async purchase(upgradeType, tier, useJump, buyMax = false) {
        const maxTier = upgradeType === 'bomb' ? UPGRADES.bomb.maxCount : UPGRADES[upgradeType].length;
        const startTier = this.upgrades[upgradeType];
        const endTier = buyMax ? maxTier : tier + 1;

        let totalCost = 0;
        for (let i = startTier; i < endTier; i++) {
            const price = useJump ? 
                (upgradeType === 'bomb' ? UPGRADES.bomb.jumpCost : UPGRADES[upgradeType][i].jumpCost) :
                (upgradeType === 'bomb' ? UPGRADES.bomb.cost : UPGRADES[upgradeType][i].cost);
            totalCost += price;
        }

        if (this.canAfford(upgradeType, tier, useJump, totalCost)) {
            if (useJump) {
                try {
                    // Call the smart contract function to add JUMP to the jackpot
                    const added = await addFunds(0, totalCost);
                    if (!added) {
                        console.error('Failed to add JUMP to jackpot');
                        return false;
                    }
                    this.jumpBalance -= totalCost;
                } catch (error) {
                    console.error('Error adding JUMP to jackpot:', error);
                    return false;
                }
            } else {
                this.score -= totalCost;
            }

            if (upgradeType === 'bomb') {
                this.upgrades.bomb = Math.min(this.upgrades.bomb + (endTier - startTier), UPGRADES.bomb.maxCount);
            } else {
                this.upgrades[upgradeType] = endTier;
            }
            return true;
        }
        return false;
    }

    getEffect(upgradeType) {
        const tier = this.upgrades[upgradeType];
        if (upgradeType === 'bomb') {
            return this.upgrades.bomb;
        }
        return tier > 0 ? UPGRADES[upgradeType][tier - 1].effect : null;
    }

    addScore(amount) {
        console.log('Adding score:', amount, 'Current score:', this.score);
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error('Invalid score amount:', amount);
            return;
        }
        this.score += amount;
        this.updatePlayerScoreDisplay();
    }

    updatePlayerScoreDisplay() {
        console.log('Updating score display. Current score:', this.score);
        const availableScoreElement = document.getElementById('availableScore');
        const availableScoreHeader = document.getElementById('availableScoreHeader');
        const formattedScore = this.formatScore(this.score);
        if (availableScoreElement) {
            availableScoreElement.textContent = formattedScore;
        }
        if (availableScoreHeader) {
            availableScoreHeader.textContent = formattedScore;
        }
    }

    formatScore(score) {
        if (typeof score !== 'number' || isNaN(score)) {
            return 'N/A';
        }
        return score.toLocaleString();
    }

    useBomb() {
        if (this.upgrades.bomb > 0) {
            this.upgrades.bomb--;
            return true;
        }
        return false;
    }
}

export { PlayerUpgrades, UPGRADES };
