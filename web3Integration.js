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
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      web3 = new Web3(window.ethereum);
      
      // Check if connected to the correct network
      const networkStatus = await checkNetwork();
      
      contract = new web3.eth.Contract(contractABI, contractAddress);
      isInitialized = true;
      return { success: true, networkStatus };
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      return { success: false, error };
    }
  } else {
    return { success: false, error: 'Web3 not available' };
  }
}

function isContractInitialized() {
  return isInitialized;
}

function showNetworkWarning() {
  const warningOverlay = document.getElementById('networkWarning');
  if (warningOverlay) {
    warningOverlay.style.display = 'flex';
  } else {
    console.error('Network warning overlay element not found');
  }
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
      // Store the full Unix timestamp
      window.gameStartTime = Math.floor(Date.now() / 1000);
      return true;
  } catch (error) {
      console.error('Error starting game:', error);
      return false;
  }
}

async function checkNetwork() {
  try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const etherlinkChainId = '0xA729'; // Correct Etherlink chain ID
      
      return {
          isCorrect: chainId === etherlinkChainId,
          currentNetwork: chainId,
          targetNetwork: etherlinkChainId
      };
  } catch (error) {
      console.error('Error checking network:', error);
      return { isCorrect: false, currentNetwork: null, targetNetwork: '0xA729' };
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
    const receipt = await web3.eth.getTransactionReceipt(txHash.transactionHash);
    const gameTryPurchasedEvent = receipt.logs.find(log =>
      log.topics[0] === web3.utils.sha3('GameTryPurchased(address,uint256)')
    );
    if (gameTryPurchasedEvent) {
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

    try {
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenValidityPeriod = await contract.methods.TOKEN_VALIDITY_PERIOD().call();

        if (currentTime - Math.floor(gameStartTime / 1000) > parseInt(tokenValidityPeriod)) {
            console.error('Game session expired.');
            return false;
        }

        const gameStartTimeSeconds = Math.floor(gameStartTime / 1000);
        
        const gasEstimate = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).estimateGas({ from: account });

        const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).send({
            from: account,
            gas: Math.floor(gasEstimate * 1.2),
        });

        return true;
    } catch (error) {
        console.error('Error in submitScore:', error);
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
  getCurrentAccount,
  checkNetwork, // Export the new function
  showNetworkWarning,
};
