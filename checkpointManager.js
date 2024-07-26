// checkpointManager.js

const CHECKPOINT_INTERVAL = 50; // Blocks climbed between each checkpoint
const BASE_REWARD = 25000; // Base reward for the first checkpoint

class CheckpointManager {
    constructor() {
        this.checkpoints = 0;
        this.accumulatedReward = 0;
    }

    checkCheckpoint(blocksClimbed) {
        const newCheckpoints = Math.floor(blocksClimbed / CHECKPOINT_INTERVAL);
        if (newCheckpoints > this.checkpoints) {
            for (let i = this.checkpoints + 1; i <= newCheckpoints; i++) {
                const reward = this.calculateReward(i);
                this.accumulatedReward += reward;
                this.showCheckpointMessage(reward);
            }
            this.checkpoints = newCheckpoints;
        }
    }

    calculateReward(checkpointNumber) {
        return Math.floor(BASE_REWARD * Math.pow(1.25, checkpointNumber - 1));
    }

    showCheckpointMessage(reward) {
        const message = `Checkpoint reached - ${reward} Score added`;
        // Create a new div for the message
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.color = 'gold';
        messageDiv.style.fontSize = '24px';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.width = '100%';
        messageDiv.style.pointerEvents = 'none'; // Ensure it doesn't interfere with game interactions
    
        // Get the game canvas
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Game canvas not found');
            return;
        }
    
        // Position the message relative to the canvas
        const canvasRect = canvas.getBoundingClientRect();
        messageDiv.style.top = `${canvasRect.top + canvasRect.height / 2}px`;
        messageDiv.style.left = `${canvasRect.left + canvasRect.width / 2}px`;
    
        document.body.appendChild(messageDiv);
    
        // Remove the message after 3 seconds
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }

    getAccumulatedReward() {
        return this.accumulatedReward;
    }

    resetAccumulatedReward() {
        this.accumulatedReward = 0;
        this.checkpoints = 0;
    }
}

export const checkpointManager = new CheckpointManager();
