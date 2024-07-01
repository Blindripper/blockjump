// web3Integration.js

let web3;
let contract;
let account;
let gameStartTime;

const contractAddress = '0x703793fa32AC5d35D77B245e4a5F9AAC11937af2'; // Replace if this has changed
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
            console.log('Contract initialized:', contract);
    console.log('Contract methods:', contract.methods);

            if (!contract.methods) {
              throw new Error('Contract methods not available');
          }

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
        window.gameStartTime = gameStartTime;
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
      const txHash = await contract.methods.purchaseGameTries().send({ 
          from: account, 
          value: web3.utils.toWei('0.01', 'ether')
      });

      console.log('Transaction sent:', txHash.transactionHash); // Capture the transaction hash

      // Listen for the GameTryPurchased event
      const subscription = contract.events.GameTryPurchased({ fromBlock: txHash.blockNumber }, (error, event) => {
          if (error) {
              console.error('Error in GameTryPurchased event:', error);
              return;
          }

          console.log('Game tries purchased successfully:', event.returnValues);
          
          // Update gameTries or UI based on the event data (optional)

          subscription.unsubscribe(); // Unsubscribe after receiving the event
      });

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
  
  console.log('Attempting to submit score with:', { name, score, blocksClimbed, gameStartTime });

  try {
    // Get the last game start time from the contract
    const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
    console.log('Last game start time from contract:', lastGameStartTime);

    // Check if the game session is still valid
    const currentTime = Math.floor(Date.now() / 1000);
    const tokenValidityPeriod = await contract.methods.TOKEN_VALIDITY_PERIOD().call();
    if (currentTime - gameStartTime > tokenValidityPeriod) {
      console.error('Game session expired. Current time:', currentTime, 'Game start time:', gameStartTime);
      return false;
    }

    // Convert numbers to strings to avoid potential BigNumber issues
    const scoreStr = score.toString();
    const blocksClimbedStr = blocksClimbed.toString();
    const gameStartTimeStr = gameStartTime.toString();

    // Estimate gas
    const gasEstimate = await contract.methods.submitScore(name, scoreStr, blocksClimbedStr, gameStartTimeStr).estimateGas({ from: account });
    console.log('Gas estimate:', gasEstimate);

    // Set gas limit to 1.5 times the estimate
    const gasLimit = Math.floor(gasEstimate * 1.5);

    console.log('Submitting transaction with gas limit:', gasLimit);

    const result = await contract.methods.submitScore(name, scoreStr, blocksClimbedStr, gameStartTimeStr).send({ 
      from: account,
      gas: gasLimit
    });

    console.log('Score submitted successfully:', result);
    return true;
  } catch (error) {
    console.error('Error in submitScore:', error);
    if (error.message) console.error('Error message:', error.message);
    if (error.stack) console.error('Error stack:', error.stack);
    return false;
  }
}



async function claimPrize() {
    if (!contract || !account) {
        console.error('Contract not initialized or account not available');
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
    submitScore, 
    claimPrize, 
};
