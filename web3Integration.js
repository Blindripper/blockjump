// web3Integration.js

let web3;
let contract;
let account;
let isInitialized = false;



const contractAddress = '0xe5a0DE1E78feC1C6c77ab21babc4fF3b207618e4'; // Replace if this has changed
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
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
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
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
        "internalType": "string",
        "name": "name",
        "type": "string"
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
        "name": "submittedGameStartTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "storedGameStartTime",
        "type": "uint256"
      }
    ],
    "name": "ScoreSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "achievements",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
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
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
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
    "name": "getAchievements",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
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
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "achievementId",
        "type": "uint256"
      }
    ],
    "name": "mintAchievement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "baseURI",
        "type": "string"
      }
    ],
    "name": "setBaseURI",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function initWeb3() {
  if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          contract = new web3.eth.Contract(contractABI, contractAddress);
          isInitialized = true;  // Set this to true when initialization is successful
          return true;
      } catch (error) {
          console.error('Failed to initialize Web3:', error);
          return false;
      }
  } else {
      console.log('Please install MetaMask!');
      return false;
  }
}

function isContractInitialized() {
  return isInitialized;
}



async function connectWallet() {
  if (!web3) {
      showOverlay('Web3 not initialized. Please refresh the page.');
      return false;
  }

  try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
          console.error('No accounts found');
          return false;
      }
      account = accounts[0];
      contract = new web3.eth.Contract(contractABI, contractAddress);
      if (!contract.methods) {
          console.error('Contract methods not available');
          return false;
      }
      console.log('Wallet connected:', account);
      isInitialized = true;
      return true;
  } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
  }
}

async function getAchievements(account) {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return [];
  }
  try {
    const achievements = await contract.methods.getAchievements(account).call();
    return achievements.map(Number);
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
}


async function mintAchievement(account, achievementId) {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return false;
  }
  try {
    await contract.methods.mintAchievement(achievementId).send({ from: account });
    return true;
  } catch (error) {
    console.error('Error minting achievement:', error);
    return false;
  }
}

async function startGame() {
  if (!isInitialized) {
      console.error('Contract not initialized');
      return false;
  }
  try {
      const result = await contract.methods.startGame().send({ from: account });
      console.log('Game started successfully:', result);
      // Store the full Unix timestamp
      window.gameStartTime = Math.floor(Date.now() / 1000);
      console.log('Game start time set to:', window.gameStartTime);
      return true;
  } catch (error) {
      console.error('Error starting game:', error);
      return false;
  }
}

async function getGameTries() {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return 0;
  }
  try {
    const tries = await contract.methods.getGameTries(account).call();
    return parseInt(tries);
  } catch (error) {
    console.error('Error getting game tries:', error);
    return 0;
  }
}



async function purchaseGameTries() {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return false;
  }
  try {
    const txHash = await contract.methods.purchaseGameTries().send({
      from: account,
      value: web3.utils.toWei('0.01', 'ether')
    });
    console.log('Transaction sent:', txHash.transactionHash);
    const receipt = await web3.eth.getTransactionReceipt(txHash.transactionHash);
    const gameTryPurchasedEvent = receipt.logs.find(log =>
      log.topics[0] === web3.utils.sha3('GameTryPurchased(address,uint256)')
    );
    if (gameTryPurchasedEvent) {
      console.log('Game tries purchased successfully');
      return true;
    } else {
      console.error('GameTryPurchased event not found in transaction receipt');
      return false;
    }
  } catch (error) {
    console.error('Error purchasing game tries:', error);
    return false;
  }
}

async function getHighscores() {
  if (!isInitialized) {
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

let isSubmitting = false;

async function submitScore(name, score, blocksClimbed, gameStartTime) {
  if (!isInitialized) {
      console.error('Contract not initialized or account not available');
      return false;
  }

  console.log('Attempting to submit score with:', { name, score, blocksClimbed, gameStartTime });

  try {
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const tokenValidityPeriod = await contract.methods.TOKEN_VALIDITY_PERIOD().call();
      console.log('Token validity period:', tokenValidityPeriod);
      console.log('Current time:', currentTime);
      console.log('Game start time:', Math.floor(gameStartTime / 1000));
      console.log('Time difference (seconds):', currentTime - Math.floor(gameStartTime / 1000));

      if (currentTime - Math.floor(gameStartTime / 1000) > parseInt(tokenValidityPeriod)) {
          console.error('Game session expired. Current time:', currentTime, 'Game start time:', Math.floor(gameStartTime / 1000));
          return false;
      }

      // Convert gameStartTime to seconds for the smart contract
      const gameStartTimeSeconds = Math.floor(gameStartTime / 1000);
      
      // Check contract state before submission
      const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
      console.log('Last game start time from contract:', lastGameStartTime);
      
      const gameTries = await contract.methods.getGameTries(account).call();
      console.log('Remaining game tries:', gameTries);

      // Estimate gas before sending the transaction
      const gasEstimate = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).estimateGas({ from: account });
      console.log('Estimated gas:', gasEstimate);

      const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2), // Increase gas limit by 20%
      });

      console.log('Score submitted successfully:', result);
      return true;
  } catch (error) {
      console.error('Error in submitScore:', error);
      if (error.message) console.error('Error message:', error.message);
      if (error.data) {
          console.error('Error data:', error.data);
          try {
              const decodedError = web3.eth.abi.decodeParameter('string', error.data);
              console.error('Decoded error:', decodedError);
          } catch (decodeError) {
              console.error('Failed to decode error data:', decodeError);
          }
      }
      // Try to get more information from the contract
      try {
          const revertReason = await web3.eth.call(error.receipt);
          console.error('Revert reason:', revertReason);
      } catch (callError) {
          console.error('Failed to get revert reason:', callError);
      }
      return false;
  }
}

function getContract() {
  return contract;
}

function getCurrentAccount() {
  return account;
}



async function claimPrize() {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return false;
  }
  try {
    const result = await contract.methods.claimPrize().call({ from: account });
    if (result) {
      const tx = await contract.methods.claimPrize().send({ from: account });
      console.log('Prize claimed successfully:', tx);
      return true;
    } else {
      console.error('Prize claim failed in call');
      return false;
    }
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
  getContract, 
  submitScore, 
  claimPrize,
  getAchievements,
  mintAchievement, 
  connectWallet,
  isContractInitialized,
  getCurrentAccount
};
