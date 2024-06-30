// web3Integration.js

let web3;
let contract;
let account;
let gameStartTime;

const contractAddress = '0x1C3b222a48ab06AA000fc988286c542a935Cdb7D'; // Replace if this has changed
const contractABI = [{
  "inputs": [],
  "stateMutability": "nonpayable",
  "type": "constructor"
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
      "name": "tries",
      "type": "uint256"
    }
  ],
  "name": "GameTryPurchased",
  "type": "event"
},
{
  "inputs": [],
  "name": "TOKEN_VALIDITY_PERIOD",
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
  "name": "addFunds",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
},
{
  "inputs": [],
  "name": "claimPrize",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [],
  "name": "contractBalance",
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
          "internalType": "string",
          "name": "name",
          "type": "string"
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
      "internalType": "struct BlockJumpGame.Highscore[10]",
      "name": "",
      "type": "tuple[10]"
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
      "internalType": "string",
      "name": "name",
      "type": "string"
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
  "inputs": [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ],
  "name": "lastGameStartTime",
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
  "name": "startGame",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
},
{
  "inputs": [
    {
      "internalType": "string",
      "name": "name",
      "type": "string"
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
    },
    {
      "internalType": "uint256",
      "name": "gameStartTime",
      "type": "uint256"
    }
  ],
  "name": "submitScore",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}
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
        const result = await contract.methods.startGame().send({ from: account });
        gameStartTime = Math.floor(Date.now() / 1000);
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
        const result = await contract.methods.purchaseGameTries().send({ 
            from: account, 
            value: web3.utils.toWei('0.01', 'ether')
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

async function submitScore(name, score, blocksClimbed, gameStartTime) {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
        return false;
    }
    try {
        const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTime).send({ from: account });
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
        const result = await contract.methods.claimPrize().send({ from: account });
        console.log('Prize claimed successfully:', result);
        return true;
    } catch (error) {
        console.error('Error claiming prize:', error);
        return false;
    }
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
