function showOverlay(message, callback = null, includeButton = false) {
    hideOverlay(); // Remove any existing overlay

    const canvas = document.getElementById('gameCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.id = 'game-overlay';
    overlay.className = 'game-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = `${canvasRect.left}px`;
    overlay.style.top = `${canvasRect.top}px`;
    overlay.style.width = `${canvasRect.width}px`;
    overlay.style.height = `${canvasRect.height}px`;
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
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
    messageElement.style.marginBottom = '20px';

    overlay.appendChild(messageElement);

    if (includeButton) {
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Game';
        startButton.className = 'start-button';
        startButton.style.backgroundColor = '#3FE1B0';
        startButton.style.color = '#0f1624';
        startButton.style.border = 'none';
        startButton.style.padding = '10px 20px';
        startButton.style.fontSize = '18px';
        startButton.style.fontFamily = 'Orbitron, sans-serif';
        startButton.style.fontWeight = 'bold';
        startButton.style.borderRadius = '5px';
        startButton.style.cursor = 'pointer';
        startButton.style.transition = 'all 0.3s ease';

        startButton.onmouseover = () => {
            startButton.style.backgroundColor = '#2dc898';
            startButton.style.transform = 'scale(1.05)';
        };
        startButton.onmouseout = () => {
            startButton.style.backgroundColor = '#3FE1B0';
            startButton.style.transform = 'scale(1)';
        };

        startButton.onclick = () => {
            if (callback) callback();
        };

        overlay.appendChild(startButton);
    }

    document.body.appendChild(overlay);

    if (callback && !includeButton) {
        setTimeout(() => {
            hideOverlay();
            callback();
        }, 2000);
    }

    return overlay;
}
