pragma solidity ^0.4.18;

import "./MintableToken.sol";


/**
 * @title Minaable token
 * @dev ERC20 Token with Pos mining
*/
contract MinableToken is MintableToken { 
  event Commit(address indexed from, uint value, uint indexed onBlockNumber,uint atStake, int onBlockReward);
  event Withdraw(address indexed from, uint reward, uint commitment, uint indexed onBlockNumber);

  uint256 totalStake_ = 0;
  int256 blockReward_; //could be possitive or negative according to GDP change

  struct Commitment {
    uint256 value;          // value commited to mining
    uint256 onBlockNumber;     // commitment done on block
    uint256 atStake; // stake during commitment
    int256 onBlockReward;
  }

  mapping( address => Commitment ) miners;

  /**
  * @dev commit amount for minning
  * @param _value The amount to be commited.
  * @return true on successfull commit
  */
  function commit(uint _value) public returns (bool) {
    require(0 < _value);
    require(_value <= balances[msg.sender]);
    //Prevent commiting more then once without withdrawing first:
    require(miners[msg.sender].value == 0); 

    // sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    // Transfer(msg.sender, 0, _value);

    totalStake_ = totalStake_.add(_value);

    miners[msg.sender] = Commitment(
      _value, // Commitment.value
      block.number, // onBlockNumber
      totalStake_, // atStake = current stake + commitments value
      blockReward_ // onBlockReward
      );
    
    Commit(msg.sender, _value, block.number, totalStake_, blockReward_); // solium-disable-line

    return true;
  }

  /**
  * @dev withdraw reward
  * @return reward to withdraw
  */
  function withdraw() public returns (uint256 reward, uint256 commitmentValue) {
    require(miners[msg.sender].value > 0); 

    //will revert if reward is negative:
    reward = getReward(msg.sender);

    Commitment storage commitment = miners[msg.sender];

    totalStake_ = totalStake_.sub(commitment.value);
    totalSupply_ = totalSupply_.add(reward);
    
    balances[msg.sender] = balances[msg.sender].add(commitment.value.add(reward));
    // Transfer(0, msg.sender, reward);

    commitmentValue = commitment.value;

    commitment.value = 0;
    
    Withdraw(msg.sender, reward, commitmentValue, block.number);  // solium-disable-line
    return (reward, commitmentValue);
  }

  /**
  * @dev Calculate the reward if withdraw() happans on this block
  * @return An uint256 representing the reward amount
  */ 
  function getReward(address _miner) public view returns (uint256) {
    if (miners[_miner].value == 0) {
      return 0;
    }

    Commitment storage commitment = miners[_miner];

    int averageBlockReward = signedAverage(commitment.onBlockReward, blockReward_);
    
    require(0 <= averageBlockReward);
    
    uint256 effectiveBlockReward = uint(averageBlockReward);
    
    uint256 effectiveStake = average(commitment.atStake, totalStake_);
    
    uint256 numberOfBlocks = block.number.sub(commitment.onBlockNumber);

    uint256 miningReward = numberOfBlocks.mul(effectiveBlockReward).mul(commitment.value) / effectiveStake;
       
    return miningReward;
  }

  /**
  * @dev Calculate the average of two integer numbers 
  * 1.5 will be rounded down
  * @return An uint256 representing integer average
  */
  function average(uint a, uint b) public pure returns (uint) {
    return a.add(b) / 2;
  }

  /**
  * @dev Calculate the average of two signed integers numbers 
  * 1.5 will be rounded down
  * @return An int256 representing integer average
  */
  function signedAverage(int256 a, int256 b) public pure returns (int256) {
    int ans = a + b;

    if (a > 0 && b > 0 && ans < 0)
         require(false);
    if (a < 0 && b < 0 && ans > 0)
         require(false);

    return ans / 2;
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
  * @dev total stake of tokens
  * @return the total stake
  */
  function totalStake() public view returns (uint256) {
    return totalStake_;
  }

  /**
  * @dev the total block reward
  * @return the current block reward
  */
  function blockReward() public view returns (int256) {
    return blockReward_;
  }
}