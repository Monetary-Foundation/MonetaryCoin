pragma solidity ^0.4.18;

import "./MintableToken.sol";


/**
 * @title Minaable token
 * @dev ERC20 Token with Pos mining
*/
contract MinableToken is MintableToken { 
  event Commit(address indexed from, uint256 value, uint indexed onBlockNumber,uint atStake);

  uint256 totalStake_ = 0;
  uint256 blockReward_;

  struct Commitment {
    uint value;          // value commited to mining
    uint onBlockNumber;     // commitment done on block
    uint atStake; // stake during commitment
  }

  mapping( address => Commitment ) miners;

  /**
  * @dev commit amount for minning
  * @param _value The amount to be commited.
  */
  function commit(uint _value) public returns (bool) {
    require(0 < _value);
    require(_value <= balances[msg.sender]);
    //Prevent commiting more then once without withdrawing first:
    require(miners[msg.sender].value == 0); 

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    miners[msg.sender] = Commitment(_value, block.number, totalStake_);
    
    totalStake_ = totalStake_.add(_value);

    Commit(msg.sender, _value, block.number, totalStake_.sub(_value)); // solium-disable-line
    return true;
  }

  /**
  * @dev withdraw commitment + reward
  */
  function withdraw() public returns (uint256) {
    require(miners[msg.sender].value > 0); 

    Commitment storage commitment = miners[msg.sender];

    uint256 reward = getCurrentReward(msg.sender);
    uint256 additionalSupply = reward.sub(commitment.value);
    
    commitment.value = 0;

    totalStake_ = totalStake_.sub(commitment.value);
    balances[msg.sender] = balances[msg.sender].add(reward);
    totalSupply_ = totalSupply_.add(additionalSupply);
    
    return reward;
  }

  /**
  * @dev Calculate the reward if withdraw() happans on this block
  * @return An uint256 representing the reward amount
  */
  function getCurrentReward(address _miner) public view returns (uint256) {
    if (miners[_miner].value == 0) {
      return 0;
    }

    Commitment commitment = miners[_miner];

    uint256 averageStake = average(commitment.atStake, totalStake_);
    
    uint256 numberOfBlocks = block.number.sub(commitment.onBlockNumber);

    uint256 miningReward = numberOfBlocks.mul(blockReward_).mul(commitment.value) / averageStake;
    
    // uint256 miningReward = numberOfBlocks.mul(blockReward_).mul(miners[_miner].value / averageStake);   
    return miningReward;
  }

  /**
  * @dev Calculate the average of two integer numbers 
  * 1.5 will be rounded down
  * @return An uint256 representing integer average
  */
  function average(uint a, uint b) public pure returns (uint) {
    return (a+b) / 2;
  }

  /**
  * @dev Gets the commitment of the specified address.
  * @param _miner The address to query the the commitment Of
  * @return An uint256 representing the amount commited by the passed address.
  */
  function commitmentOf(address _miner) public view returns (uint256) {
    return miners[_miner].value;
  }

  /**
  * @dev total number of tokens in existence
  */
  function totalStake() public view returns (uint256) {
    return totalStake_;
  }

  /**
  * @dev the total block reward
  */
  function blockReward() public view returns (uint256) {
    return blockReward_;
  }
}