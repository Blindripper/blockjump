// web3Integration.js

let web3;
let contract;
let account;

const contractAddress = '0xBf43C48596720Caf9125D1022cA2f670Bb9A7abE'; // Replace with your actual contract address
const contractABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tries",
        "type": "uint256"
      }
    ],
    "name": "GameTryPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "blocksClimbed",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "prize",
        "type": "uint256"
      }
    ],
    "name": "NewHighscore",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "GAME_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_HIGHSCORES",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TRIES_PER_PURCHASE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "gameTries",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getGameTries",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "highscores",
    "outputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "blocksClimbed",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "purchaseGameTries",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "blocksClimbed",
        "type": "uint256"
      }
    ],
    "name": "updateHighscore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "useGameTry",
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
        const tries = await contract.methods.getGameTries(account).call({ from: account });
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
