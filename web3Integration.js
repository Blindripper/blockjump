// web3Integration.js

let web3;
let contract;
let account;
let gameStartTime;

const contractAddress = '0xAA9e942E9221b6954E61167b75f38987096cd8E5'; // Replace with your actual contract address
const contractABI = [
  // The entire ABI you provided goes here
];

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            account = accounts[0];
            contract = new web3.eth.Contract(contractABI, contractAddress);
            console.log('Web3 initialized, user connected:', account);
            return true;
        } catch (error) {
            console.error('User denied account access or error occurred:', error);
            return false;
        }
    } else if (typeof window.web3 !== 'undefined') {
        web3 = new Web3(window.web3.currentProvider);
        const accounts = await web3.eth.getAccounts();
        account = accounts[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log('Legacy web3 detected, user connected:', account);
        return true;
    } else {
        console.log('Non-Ethereum browser detected. Consider installing MetaMask!');
        return false;
    }
}

async function startGame() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.startGame().estimateGas({from: account});

        const result = await contract.methods.startGame().send({ 
            from: account,
            gas: Math.round(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        gameStartTime = Math.floor(Date.now() / 1000); // Current time in seconds
        console.log('Game started successfully:', result);
        return true;
    } catch (error) {
        console.error('Error starting game:', error);
        return false;
    }
}

async function getGameTries() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return 0;
    }
    try {
        const tries = await contract.methods.getGameTries(account).call({ from: account });
        return parseInt(tries);
    } catch (error) {
        console.error('Error getting game tries:', error);
        return 0;
    }
}

async function purchaseGameTries() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.purchaseGameTries().estimateGas({
            from: account,
            value: web3.utils.toWei('0.01', 'ether')
        });

        const result = await contract.methods.purchaseGameTries().send({ 
            from: account, 
            value: web3.utils.toWei('0.01', 'ether'),
            gas: Math.round(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        console.log('Game tries purchased successfully:', result);
        return true;
    } catch (error) {
        console.error('Error purchasing game tries:', error);
        return false;
    }
}

async function getHighscores() {
    if (!contract) {
        console.error('Contract not initialized');
        return [];
    }
    try {
        const highscores = await contract.methods.getHighscores().call();
        return highscores.map(score => ({
            player: score.player,
            name: score.name,
            score: parseInt(score.score),
            blocksClimbed: parseInt(score.blocksClimbed)
        }));
    } catch (error) {
        console.error('Error getting highscores:', error);
        return [];
    }
}

async function submitScore(name, score, blocksClimbed) {
    if (!contract || !account || !gameStartTime) {
        console.error('Contract not initialized, account not available, or game not started');
        return false;
    }
    
    if (typeof name !== 'string' || name.length === 0) {
        console.error('Invalid name provided');
        return false;
    }
    if (typeof score !== 'number' || isNaN(score)) {
        console.error('Invalid score provided');
        return false;
    }
    if (typeof blocksClimbed !== 'number' || isNaN(blocksClimbed)) {
        console.error('Invalid blocksClimbed provided');
        return false;
    }

    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTime).estimateGas({from: account});

        const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTime).send({ 
            from: account,
            gas: Math.round(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        console.log('Score submitted successfully:', result);
        return true;
    } catch (error) {
        console.error('Error submitting score:', error);
        return false;
    }
}

async function claimPrize() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = await contract.methods.claimPrize().estimateGas({from: account});

        const result = await contract.methods.claimPrize().send({ 
            from: account,
            gas: Math.round(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        console.log('Prize claimed successfully:', result);
        return true;
    } catch (error) {
        console.error('Error claiming prize:', error);
        return false;
    }
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        account = accounts[0];
        console.log('Account changed to:', account);
    });

    window.ethereum.on('chainChanged', function (chainId) {
        console.log('Network changed to:', chainId);
    });
}

export { 
    initWeb3, 
    startGame, 
    getGameTries, 
    purchaseGameTries, 
    getHighscores, 
    submitScore, 
    claimPrize 
};
