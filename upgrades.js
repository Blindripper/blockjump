// upgrades.js

const UPGRADES = {
    speed: [
        { cost: 30000, effect: 1.03 },
        { cost: 60000, effect: 1.06 },
        { cost: 90000, effect: 1.10 }
    ],
    jump: [
        { cost: 50000, effect: { jumps: 3, height: 1 } },
        { cost: 100000, effect: { jumps: 3, height: 1.03 } },
        { cost: 200000, effect: { jumps: 3, height: 1.08 } }
    ],
    shield: [
        { cost: 40000, effect: 1 },
        { cost: 80000, effect: 2 },
        { cost: 120000, effect: 3 }
    ],
    rapid: [
        { cost: 100000, effect: 0.9 },
        { cost: 200000, effect: 0.75 },
        { cost: 500000, effect: 0.5 }
    ],
    bomb: { cost: 50000, maxCount: 3 }
};

class PlayerUpgrades {
    constructor() {
        this.score = 0;
        this.upgrades = {
            speed: 0,
            jump: 0,
            shield: 0,
            rapid: 0,
            bomb: 0
        };
    }

    canAfford(upgradeType, tier) {
        if (upgradeType === 'bomb') {
            return this.score >= UPGRADES.bomb.cost && this.upgrades.bomb < UPGRADES.bomb.maxCount;
        }
        return this.score >= UPGRADES[upgradeType][tier].cost;
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