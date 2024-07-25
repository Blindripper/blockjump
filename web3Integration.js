// web3Integration.js

let web3;
let contract;
let account;
let jumpTokenContract;
let isInitialized = false;




const contractAddress = '0x8CF79304Da0756a2aC92967A8bc32c6C51a734DB'; // Replace if this has changed
const jumpTokenAddress = '0x02539B1825551329B3021Fa87d463E1BBa3eda80';


const jumpTokenABI = [
  // Standard ERC20 functions
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true, "name": "owner", "type": "address"}, {"indexed": true, "name": "spender", "type": "address"}, {"indexed": false, "name": "value", "type": "uint256"}],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": true, "name": "from", "type": "address"}, {"indexed": true, "name": "to", "type": "address"}, {"indexed": false, "name": "value", "type": "uint256"}],
    "name": "Transfer",
    "type": "event"
  }
];

const contractABI = [
  {
    "inputs": [
        {
          "internalType": "address",
          "name": "_jumpTokenAddress",
          "type": "address"
        }
      ],
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
          "name": "funder",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "xtzAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jumpAmount",
          "type": "uint256"
        }
      ],
      "name": "FundsAdded",
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
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "usedJump",
          "type": "bool"
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
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "xtzAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "jumpAmount",
          "type": "uint256"
        }
      ],
      "name": "JackpotClaimed",
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
      "name": "JUMP_PRICE",
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
      "name": "XTZ_PRICE",
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
      "inputs": [
        {
          "internalType": "uint256",
          "name": "jumpAmount",
          "type": "uint256"
        }
      ],
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
      "inputs": [],
      "name": "jumpBalance",
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
      "name": "jumpToken",
      "outputs": [
        {
          "internalType": "contract IERC20",
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
      "inputs": [
        {
          "internalType": "bool",
          "name": "useJump",
          "type": "bool"
        }
      ],
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
    },
    {
      "inputs": [],
      "name": "xtzBalance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];


const ETHERLINK_CHAIN_ID = '0xA729'; // Etherlink mainnet chain ID (42793 in hexadecimal)
const ETHERLINK_RPC_URL = 'https://node.mainnet.etherlink.com'; // Etherlink mainnet RPC URL

async function switchToEtherlink() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ETHERLINK_CHAIN_ID }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ETHERLINK_CHAIN_ID,
              chainName: 'Etherlink Mainnet',
              nativeCurrency: {
                name: 'Tezos',
                symbol: 'XTZ',
                decimals: 18,
              },
              rpcUrls: [ETHERLINK_RPC_URL],
              blockExplorerUrls: ['https://explorer.etherlink.com'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding Etherlink network:', addError);
        return false;
      }
    }
    console.error('Error switching to Etherlink network:', switchError);
    return false;
  }
}

async function bribeLeader(amount, useJump) {
  if (!isInitialized) {
    console.error('Web3 not initialized');
    return false;
  }

  try {
    const highscores = await getHighscores();
    if (highscores.length === 0) {
      console.error('No highscores available');
      return false;
    }

    const leader = highscores[0];
    const leaderAddress = leader.player;
    const account = await getCurrentAccount();

    let result;

    if (useJump) {
      // For JUMP token bribes
      const jumpAmount = web3.utils.toWei(amount.toString(), 'ether');
      
      // Estimate gas for JUMP transfer
      const gasEstimate = await jumpTokenContract.methods.transfer(leaderAddress, jumpAmount).estimateGas({from: account});
      
      result = await jumpTokenContract.methods.transfer(leaderAddress, jumpAmount).send({ 
        from: account,
        gas: Math.floor(gasEstimate * 1.2) // Increase gas limit by 20%
      });
    } else {
      // For XTZ bribes
      const xtzAmount = web3.utils.toWei(amount.toString(), 'ether');
      
      result = await web3.eth.sendTransaction({
        from: account,
        to: leaderAddress,
        value: xtzAmount,
        gas: 500000  // Set a manual gas limit
      });
    }

    if (result.status) {
      // If bribe was successful, update the highscores
      const gasEstimate = await contract.methods.submitScore("Briber", leader.score + 1, leader.blocksClimbed + 1, Math.floor(Date.now() / 1000)).estimateGas({from: account});
      
      await contract.methods.submitScore("Briber", leader.score + 1, leader.blocksClimbed + 1, Math.floor(Date.now() / 1000)).send({ 
        from: account,
        gas: Math.floor(gasEstimate * 1.2) // Increase gas limit by 20%
      });
      
      // Fetch updated highscores
      const updatedHighscores = await getHighscores();
      return { success: true, highscores: updatedHighscores };
    }

    return { success: false };
  } catch (error) {
    console.error('Error bribing leader:', error);
    return { success: false };
  }
}

async function initWeb3() {
  if (typeof window.ethereum !== 'undefined') {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      contract = new web3.eth.Contract(contractABI, contractAddress);
      jumpTokenContract = new web3.eth.Contract(jumpTokenABI, jumpTokenAddress);
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];
      isInitialized = true;
      return web3;
    } catch (error) {
      console.error('Failed to initialize Web3:', error);
      return null;
    }
  } else {
    console.error('No Ethereum provider detected');
    return null;
  }
}

function isContractInitialized() {
  return isInitialized;
}

async function getJumpBalance(address) {
  if (!isInitialized) {
    console.error('Web3 not initialized');
    return 0;
  }
  try {
    const balance = await jumpTokenContract.methods.balanceOf(address).call();
    return web3.utils.fromWei(balance, 'ether');
  } catch (error) {
    console.error('Error getting JUMP balance:', error);
    return 0;
  }
}

async function approveJumpSpending(amount) {
  if (!isInitialized) {
    console.error('Web3 not initialized');
    return false;
  }
  try {
    const account = await getCurrentAccount();
    await jumpTokenContract.methods.approve(contractAddress, amount).send({ from: account });
    return true;
  } catch (error) {
    console.error('Error approving JUMP spending:', error);
    return false;
  }
}

async function addFunds(xtzAmount, jumpAmount) {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return false;
  }
  try {
    const account = await getCurrentAccount();
    if (jumpAmount > 0) {
      await approveJumpSpending(web3.utils.toWei(jumpAmount.toString(), 'ether'));
    }
    await contract.methods.addFunds(web3.utils.toWei(jumpAmount.toString(), 'ether')).send({
      from: account,
      value: web3.utils.toWei(xtzAmount.toString(), 'ether')
    });
    return true;
  } catch (error) {
    console.error('Error adding funds:', error);
    return false;
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

    // Check if the current network is Etherlink Mainnet
    const chainId = await web3.eth.getChainId();
    if (chainId !== parseInt(ETHERLINK_CHAIN_ID, 16)) {
      const switched = await switchToEtherlink();
      if (!switched) {
        showOverlay('Please switch to the Etherlink Mainnet in your wallet.');
        return false;
      }
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



async function purchaseGameTries(useJump) {
  if (!isInitialized) {
    console.error('Contract not initialized');
    return false;
  }
  try {
    const account = await getCurrentAccount();
    if (useJump) {
      const jumpAmount = web3.utils.toWei('20', 'ether');
      await approveJumpSpending(jumpAmount);
      await contract.methods.purchaseGameTries(true).send({ from: account });
    } else {
      await contract.methods.purchaseGameTries(false).send({
        from: account,
        value: web3.utils.toWei('0.01', 'ether')
      });
    }
    return true;
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
    console.log('Raw highscores data:', highscores);

    // The contract likely returns an array of structs, which Web3 converts to an array of objects
    // We need to filter out any empty entries and map the data to our expected format
    return highscores
      .filter(score => score.player !== '0x0000000000000000000000000000000000000000')
      .map(score => ({
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
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const tokenValidityPeriod = await contract.methods.TOKEN_VALIDITY_PERIOD().call();

      if (currentTime - Math.floor(gameStartTime / 1000) > parseInt(tokenValidityPeriod)) {
          console.error('Game session expired. Current time:', currentTime, 'Game start time:', Math.floor(gameStartTime / 1000));
          return false;
      }

      // Convert gameStartTime to seconds for the smart contract
      const gameStartTimeSeconds = Math.floor(gameStartTime / 1000);
      
      // Check contract state before submission
      const lastGameStartTime = await contract.methods.lastGameStartTime(account).call();
      
      const gameTries = await contract.methods.getGameTries(account).call();

      // Estimate gas before sending the transaction
      const gasEstimate = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).estimateGas({ from: account });

      const result = await contract.methods.submitScore(name, score, blocksClimbed, gameStartTimeSeconds).send({
          from: account,
          gas: Math.floor(gasEstimate * 1.2), // Increase gas limit by 20%
      });

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

async function getContractBalance() {
  if (!isInitialized) {
      console.error('Contract not initialized');
      return { xtz: 0, jump: 0 };
  }

  try {
      const xtzBalance = await contract.methods.xtzBalance().call();

      const jumpBalance = await contract.methods.jumpBalance().call();

      const formattedXtzBalance = web3.utils.fromWei(xtzBalance, 'ether');
      const formattedJumpBalance = web3.utils.fromWei(jumpBalance, 'ether');


      return {
          xtz: formattedXtzBalance,
          jump: formattedJumpBalance
      };
  } catch (error) {
      console.error('Error fetching contract balances:', error);
      return { xtz: 0, jump: 0 };
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
  switchToEtherlink,
  getJumpBalance,
  approveJumpSpending,
  addFunds,
  getContractBalance,
  bribeLeader,
};
