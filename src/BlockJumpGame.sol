// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BlockJumpGame is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Highscore {
        address player;
        string name;
        uint256 score;
        uint256 blocksClimbed;
    }

    event ScoreSubmitted(address player, string name, uint256 score, uint256 blocksClimbed, uint256 submittedGameStartTime, uint256 storedGameStartTime);
    event GameTryPurchased(address player, uint256 tries, bool usedJump);
    event JackpotClaimed(address winner, uint256 xtzAmount, uint256 jumpAmount);
    event FundsAdded(address funder, uint256 xtzAmount, uint256 jumpAmount);

    Highscore[10] public highscores;
    uint256 public xtzBalance;
    uint256 public jumpBalance;
    address public owner;
    mapping(address => uint256) public gameTries;
    mapping(address => uint256) public lastGameStartTime;
    mapping(address => mapping(uint256 => bool)) public achievements;

    uint256 public constant TOKEN_VALIDITY_PERIOD = 1 hours;
    uint256 public constant XTZ_PRICE = 0.01 ether;
    uint256 public constant JUMP_PRICE = 20 * 10**18; // 20 JUMP tokens

    string private _baseTokenURI;
    IERC20 public jumpToken;

    constructor(address _jumpTokenAddress) ERC721("BlockJumpAchievement", "BJA") {
        owner = msg.sender;
        _baseTokenURI = "ipfs://QmZxVUxqQRUUV6hGJo96ik6cStPZJmd6PfdDStQJcKtThn/";
        jumpToken = IERC20(_jumpTokenAddress);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public {
        require(msg.sender == owner, "Only the owner can set the base URI");
        _baseTokenURI = baseURI;
    }

    function startGame() public {
        require(gameTries[msg.sender] > 0, "No game tries available");
        gameTries[msg.sender]--;
        lastGameStartTime[msg.sender] = block.timestamp;
    }

    function submitScore(string memory name, uint256 score, uint256 blocksClimbed, uint256 gameStartTime) public {
        uint256 contractStartTime = lastGameStartTime[msg.sender];
        uint256 tolerance = 1 hours;

        require(gameStartTime >= contractStartTime - tolerance && gameStartTime <= contractStartTime + TOKEN_VALIDITY_PERIOD + tolerance, "Invalid game session");
        require(block.timestamp <= gameStartTime + TOKEN_VALIDITY_PERIOD, "Game session expired");

        emit ScoreSubmitted(msg.sender, name, score, blocksClimbed, gameStartTime, lastGameStartTime[msg.sender]);
        
        for (uint i = 0; i < 10; i++) {
            if (score > highscores[i].score || highscores[i].player == address(0)) {
                for (uint j = 9; j > i; j--) {
                    highscores[j] = highscores[j-1];
                }
                highscores[i] = Highscore(msg.sender, name, score, blocksClimbed);
                break;
            }
        }
    }

    function getHighscores() public view returns (Highscore[10] memory) {
        return highscores;
    }

    function claimPrize() public {
        require(msg.sender == highscores[0].player, "Only the top scorer can claim the prize");
        uint256 xtzPrize = (xtzBalance * 90) / 100;
        uint256 jumpPrize = (jumpBalance * 90) / 100;
        uint256 ownerXtzShare = xtzBalance - xtzPrize;
        uint256 ownerJumpShare = jumpBalance - jumpPrize;
        
        xtzBalance = 0;
        jumpBalance = 0;
        
        (bool successPlayer, ) = payable(msg.sender).call{value: xtzPrize}("");
        require(successPlayer, "Failed to send XTZ prize to player");
        
        require(jumpToken.transfer(msg.sender, jumpPrize), "Failed to send JUMP prize to player");
        
        (bool successOwner, ) = payable(owner).call{value: ownerXtzShare}("");
        require(successOwner, "Failed to send XTZ share to owner");
        
        require(jumpToken.transfer(owner, ownerJumpShare), "Failed to send JUMP share to owner");
        
        emit JackpotClaimed(msg.sender, xtzPrize, jumpPrize);
    }

    function purchaseGameTries(bool useJump) public payable {
        if (useJump) {
            require(jumpToken.transferFrom(msg.sender, address(this), JUMP_PRICE), "JUMP transfer failed");
            gameTries[msg.sender] += 20;
            jumpBalance += JUMP_PRICE;
        } else {
            require(msg.value == XTZ_PRICE, "Incorrect XTZ payment amount");
            gameTries[msg.sender] += 10;
            xtzBalance += msg.value;
        }
        emit GameTryPurchased(msg.sender, useJump ? 20 : 10, useJump);
    }

    function getGameTries(address player) public view returns (uint256) {
        return gameTries[player];
    }

    function addFunds(uint256 jumpAmount) public payable {
        if (msg.value > 0) {
            xtzBalance += msg.value;
        }
        if (jumpAmount > 0) {
            require(jumpToken.transferFrom(msg.sender, address(this), jumpAmount), "JUMP transfer failed");
            jumpBalance += jumpAmount;
        }
        emit FundsAdded(msg.sender, msg.value, jumpAmount);
    }

    function mintAchievement(uint256 achievementId) public {
        require(!achievements[msg.sender][achievementId], "Achievement already minted");
        require(achievementId > 0 && achievementId <= 5, "Invalid achievement ID");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        
        _setTokenURI(newTokenId, string(abi.encodePacked(Strings.toString(achievementId), ".json")));
        
        achievements[msg.sender][achievementId] = true;
    }

    function getAchievements(address player) public view returns (uint256[] memory) {
        uint256[] memory userAchievements = new uint256[](5);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= 5; i++) {
            if (achievements[player][i]) {
                userAchievements[count] = i;
                count++;
            }
        }
        
        assembly {
            mstore(userAchievements, count)
        }
        
        return userAchievements;
    }
}
