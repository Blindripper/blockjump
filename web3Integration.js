// web3Integration.js

let web3;
let contract;
let account;

const contractAddress = '0xa300CF327B3084073a4B13290abB0DC7a382c3AD'; // Replace with your actual contract address
const contractABI = [
    // Replace with your actual contract ABI
    // Example ABI (you need to replace this with your actual ABI):
    {
        "inputs": [],
        "name": "purchaseGameTries",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getGameTries",
        "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "useGameTry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getHighscores",
        "outputs": [{"components":[{"internalType":"address","name":"player","type":"address"},{"internalType":"uint256","name":"score","type":"uint256"}],"internalType":"struct YourContract.Highscore[]","name":"","type":"tuple[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "score","type": "uint256"}],
        "name": "updateHighscore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
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
        // Legacy dapp browsers...
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

async function purchaseGameTries() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const result = await contract.methods.purchaseGameTries().send({ 
            from: account, 
            value: web3.utils.toWei('0.1', 'ether') // Adjust the amount as needed
        });
        console.log('Game tries purchased successfully:', result);
        return true;
    } catch (error) {
        console.error('Error purchasing game tries:', error);
        return false;
    }
}

async function getGameTries() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return 0;
    }
    try {
        const tries = await contract.methods.getGameTries().call({ from: account });
        return parseInt(tries);
    } catch (error) {
        console.error('Error getting game tries:', error);
        return 0;
    }
}

async function useGameTry() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const result = await contract.methods.useGameTry().send({ from: account });
        console.log('Game try used successfully:', result);
        return true;
    } catch (error) {
        console.error('Error using game try:', error);
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
            score: parseInt(score.score)
        }));
    } catch (error) {
        console.error('Error getting highscores:', error);
        return [];
    }
}

async function updateHighscore(score) {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const result = await contract.methods.updateHighscore(score).send({ from: account });
        console.log('Highscore updated successfully:', result);
        return true;
    } catch (error) {
        console.error('Error updating highscore:', error);
        return false;
    }
}

// Event listeners for MetaMask account changes and network changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        account = accounts[0];
        console.log('Account changed to:', account);
        // You might want to refresh the UI or re-initialize some game state here
    });

    window.ethereum.on('chainChanged', function (chainId) {
        console.log('Network changed to:', chainId);
        // You might want to check if the user is on the correct network here
        // and prompt them to switch if they're not
    });
}

export { initWeb3, purchaseGameTries, getGameTries, getHighscores, updateHighscore, useGameTry };
