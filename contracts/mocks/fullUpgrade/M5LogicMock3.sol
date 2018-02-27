pragma solidity ^0.4.18;

import "../../token/ERC20/MinableToken.sol";


/**
 * @title M5 Minaable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract M5LogicMock3 is MinableToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;

  /**
  * @dev Calculate the reward if withdrawM5() happans on this block
  * @return An uint256 representing the reward amount
  */
  function getM5Reward(address _miner) public view returns (uint256) {
    if (miners[_miner].value == 0) {
      return 0;
    }

    Commitment storage commitment = miners[_miner];

    int averageBlockReward = signedAverage(commitment.onBlockReward, blockReward_);
    
    require(averageBlockReward < 0);
    
    uint256 effectiveBlockReward = uint(0 - averageBlockReward);
    
    uint256 effectiveStake = average(commitment.atStake, totalStake_);
    
    uint256 numberOfBlocks = block.number.sub(commitment.onBlockNumber);

    uint256 miningReward = numberOfBlocks.mul(effectiveBlockReward).mul(commitment.value) / effectiveStake;
    
    return miningReward;
  }

  /**
  * @dev withdraw reward when gdp is negative
  * msg.sender will recive original commitment back and reward will be paid in M5tokens
  * @return reward to withdraw
  */
  function withdrawM5() public returns (uint256) {
    require(miners[msg.sender].value > 0); 
    require(M5Token_ != address(0));

    Commitment storage commitment = miners[msg.sender];

    //uint256 reward = getCurrentReward(msg.sender);
    // will throw if averageBlockReward is possitive:
    uint256 additionalSupply = getCurrentReward(msg.sender).sub(commitment.value);

    totalStake_ = totalStake_.sub(commitment.value);
    //totalSupply_ = totalSupply_.add(additionalSupply);
    
    balances[msg.sender] = balances[msg.sender].add(commitment.value);
    // Transfer(0, msg.sender, reward);

    commitment.value = 0;
    
    //mint M5 token for msg.sender:
    require(M5Token_.call(bytes4(keccak256("mint(address,uint256)")),msg.sender,additionalSupply)); // solium-disable-line

    //withdrawM5(msg.sender, reward, block.number);
    return additionalSupply;
  }
}