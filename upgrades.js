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
            }
        } catch (error) {
            console.error('Error updating JUMP balance:', error);
        }
    }

    canAfford(upgradeType, tier, useJump) {
        const price = useJump ? 
            (upgradeType === 'bomb' ? UPGRADES.bomb.jumpCost : UPGRADES[upgradeType][tier].jumpCost) :
            (upgradeType === 'bomb' ? UPGRADES.bomb.cost : UPGRADES[upgradeType][tier].cost);
        
        const balance = useJump ? this.jumpBalance : this.score;
        
        console.log(`Checking affordability for ${upgradeType} (Tier ${tier})`);
        console.log(`Using JUMP: ${useJump}`);
        console.log(`Price: ${price}`);
        console.log(`Balance: ${balance}`);
        
        if (upgradeType === 'bomb') {
            const canAfford = balance >= price && this.upgrades.bomb < UPGRADES.bomb.maxCount;
            console.log(`Can afford bomb: ${canAfford}`);
            return canAfford;
        }
        
        const canAfford = balance >= price;
        console.log(`Can afford: ${canAfford}`);
        return canAfford;
    }

    async purchase(upgradeType, tier, useJump) {
        if (this.canAfford(upgradeType, tier, useJump)) {
            const price = useJump ? 
                (upgradeType === 'bomb' ? UPGRADES.bomb.jumpCost : UPGRADES[upgradeType][tier].jumpCost) :
                (upgradeType === 'bomb' ? UPGRADES.bomb.cost : UPGRADES[upgradeType][tier].cost);

            if (useJump) {
                // Call the smart contract function to add JUMP to the jackpot
                const added = await addFunds(0, price);
                if (!added) {
                    console.error('Failed to add JUMP to jackpot');
                    return false;
                }
                this.jumpBalance -= price;
            } else {
                this.score -= price;
            }

            if (upgradeType === 'bomb') {
                this.upgrades.bomb++;
            } else {
                this.upgrades[upgradeType] = tier + 1;
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
        this.score += amount;
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
