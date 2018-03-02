pragma solidity ^0.4.18;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title M5 Mineable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract M5LogicMock3 is GDPOraclizedToken { 
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
    
    //original commitment will be paid in regular tokens:
    return miningReward;
  }

  event WithdrawM5(address indexed from,uint commitment, uint m5_reward, uint indexed onBlockNumber);

  /**
  * @dev withdraw reward when gdp is negative
  * msg.sender will recive original commitment back and reward will be paid in M5 tokens
  * @return reward to withdraw
  */
  function withdrawM5() public returns (uint256) {
    require(miners[msg.sender].value > 0); 
    require(M5Token_ != address(0));

    Commitment storage commitment = miners[msg.sender];

    //uint256 reward = getCurrentReward(msg.sender);
    // will throw if averageBlockReward is possitive:
    uint256 additionalSupply = getM5Reward(msg.sender);//.sub(commitment.value);

    totalStake_ = totalStake_.sub(commitment.value);
    //totalSupply_ = totalSupply_.add(additionalSupply);
    
    balances[msg.sender] = balances[msg.sender].add(commitment.value);
    // Transfer(0, msg.sender, reward);

    commitment.value = 0;
    
    //mint M5 token for msg.sender:
    require(M5Token_.call(bytes4(keccak256("mint(address,uint256)")),msg.sender,additionalSupply)); // solium-disable-line

    WithdrawM5(msg.sender, commitment.value, additionalSupply, block.number); // solium-disable-line
    return additionalSupply;
  }


  // triggered when user swaps m5Value of M5 tokens for value of regular tokens.
  event Swap(address indexed user, uint256 m5_value, uint256 value);

  /**
  * @dev swap M5 tokens back to normal tokens when GDP is back to possitive 
  * @param _value The amount of M5 tokens to swap for regular tokens
  * @return true
  */
  function swap(uint256 _value) public returns (bool) {
    // already checked: require(M5Logic_ != address(0));
    // already checked: require(M5Token_ != address(0));
    require(M5Token_.call(bytes4(keccak256("swap(address,uint)")),msg.sender,_value)); // solium-disable-line
    
    uint256 reward = _value / 10;

    balances[msg.sender] = balances[msg.sender].add(reward); 
    totalSupply_ = totalSupply_.add(reward);   

    Swap(msg.sender, _value, reward);
    return true;
  }
}