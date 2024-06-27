// web3Integration.js
<script src="https://cdnjs.cloudflare.com/ajax/libs/web3/1.8.2/web3.min.js"></script>
let web3;
let contract;
let userAddress;

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
      "inputs": [],
      "name": "getHighscores",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "player",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "score",
              "type": "uint256"
            }
          ],
          "internalType": "struct BlockJumpGame.Highscore[]",
          "name": "",
          "type": "tuple[]"
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
  ]; // You need to fill this with your contract's ABI
const contractAddress = "0xa300CF327B3084073a4B13290abB0DC7a382c3AD";

async function initWeb3() {
    console.log('initWeb3 function called');
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed');
      web3 = new Web3(window.ethereum);
      try {
        console.log('Requesting account access...');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = (await web3.eth.getAccounts())[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        console.log('Web3 initialized, user connected:', userAddress);
      } catch (error) {
        console.error('User denied account access', error);
      }
    } else {
      console.log('No Ethereum browser extension detected, install MetaMask');
    }
  }

async function purchaseGameTries() {
    if (!contract || !userAddress) {
        console.error('Web3 or contract not initialized');
        return;
    }
    
    try {
        const weiAmount = web3.utils.toWei('0.001', 'ether');
        await contract.methods.purchaseGameTries().send({
            from: userAddress,
            value: weiAmount
        });
        console.log('Successfully purchased 10 game tries');
        // Update UI to reflect new tries
    } catch (error) {
        console.error('Error purchasing game tries:', error);
    }
}

async function getGameTries() {
    if (!contract || !userAddress) {
        console.error('Web3 or contract not initialized');
        return 0;
    }
    
    try {
        const tries = await contract.methods.getGameTries(userAddress).call();
        console.log('Remaining game tries:', tries);
        return parseInt(tries);
    } catch (error) {
        console.error('Error getting game tries:', error);
        return 0;
    }
}

async function updateHighscore(score) {
    if (!contract || !userAddress) {
        console.error('Web3 or contract not initialized');
        return;
    }
    
    try {
        const result = await contract.methods.updateHighscore(score).send({ from: userAddress });
        console.log('Highscore update transaction:', result);
        if (result.events.NewHighscore) {
            const { player, score, prize } = result.events.NewHighscore.returnValues;
            console.log(`New highscore! Player: ${player}, Score: ${score}, Prize: ${prize}`);
        }
    } catch (error) {
        console.error('Error updating highscore:', error);
    }
}

async function getHighscores() {
    if (!contract) {
        console.error('Contract not initialized');
        return [];
    }
    
    try {
        const highscores = await contract.methods.getHighscores().call();
        console.log('Highscores:', highscores);
        return highscores;
    } catch (error) {
        console.error('Error getting highscores:', error);
        return [];
    }
}
window.initWeb3 = initWeb3;
