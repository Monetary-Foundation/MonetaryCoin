pragma solidity ^0.4.23;

import "./MintableToken.sol";


/**
 * @title Mineable token
 * @dev ERC20 Token with Pos mining
 * The blockReward_ is controlled by GDP.
 * This type of mining will be used and during initial distribution period and when the growth is positive.
 * for mining during negative growth period refer to MineableM5Token.sol
 * Unlike standard erc20 token, the totalSupply is equal sum(all user balances) + totalStake
 * instead of sum(all user balances).
*/
contract MineableToken is MintableToken { 
  event Commit(address indexed from, uint value,uint atStake, int onBlockReward);
  event Withdraw(address indexed from, uint reward, uint commitment);

  uint256 totalStake_ = 0;
  int256 blockReward_; //could be positive or negative according to GDP change

  struct Commitment {
    uint256 value;          // value commited to mining
    uint256 onBlockNumber;     // commitment done on block
    uint256 atStake; // stake during commitment
    int256 onBlockReward;
  }

  mapping( address => Commitment ) miners;

  /**
  * @dev commit _value for minning
  * the _value will be substructed from user balance and added to the stake.
  * if user previously commited, add to an existing commitment. 
  * this is done by calling withdraw() 
  * then commit back previous commit + reward + new commit 
  * @param _value The amount to be commited.
  * @return the commit value 
  * _value or prevCommit + reward + _value
  */
  function commit(uint256 _value) public returns (uint256 commitmentValue) {
    require(0 < _value);
    require(_value <= balances[msg.sender]);
    
    commitmentValue = _value;
    uint256 prevCommit = miners[msg.sender].value;
    //In case user already commited, withdraw and recommit 
    // new commitment value: prevCommit + reward + _value
    if (0 < prevCommit) {
      // withdraw Will revert if reward is negative
      uint256 prevReward;
      (prevReward, prevCommit) = withdraw();
      commitmentValue = prevReward.add(prevCommit).add(_value);
    }

    // sub will revert if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(commitmentValue);
    emit Transfer(msg.sender, address(0), commitmentValue);

    totalStake_ = totalStake_.add(commitmentValue);

    miners[msg.sender] = Commitment(
      commitmentValue, // Commitment.value
      block.number, // onBlockNumber
      totalStake_, // atStake = current stake + commitments value
      blockReward_ // onBlockReward
      );
    
    emit Commit(msg.sender, commitmentValue, totalStake_, blockReward_); // solium-disable-line

    return commitmentValue;
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
    commitmentValue = commitment.value;

    uint256 withdrawnSum = commitmentValue.add(reward);
    
    totalStake_ = totalStake_.sub(commitmentValue);
    totalSupply_ = totalSupply_.add(reward);
    
    balances[msg.sender] = balances[msg.sender].add(withdrawnSum);
    emit Transfer(address(0), msg.sender, commitmentValue.add(reward));
    
    delete miners[msg.sender];
    
    emit Withdraw(msg.sender, reward, commitmentValue);  // solium-disable-line
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

    int256 averageBlockReward = signedAverage(commitment.onBlockReward, blockReward_);
    
    require(0 <= averageBlockReward);
    
    uint256 effectiveBlockReward = uint256(averageBlockReward);
    
    uint256 effectiveStake = average(commitment.atStake, totalStake_);
    
    uint256 numberOfBlocks = block.number.sub(commitment.onBlockNumber);

    uint256 miningReward = numberOfBlocks.mul(effectiveBlockReward).mul(commitment.value).div(effectiveStake);
       
    return miningReward;
  }

  /**
  * @dev Calculate the average of two integer numbers 
  * 1.5 will be rounded toward zero
  * @return An uint256 representing integer average
  */
  function average(uint256 a, uint256 b) public pure returns (uint) {
    return a.add(b).div(2);
  }

  /**
  * @dev Calculate the average of two signed integers numbers 
  * 1.5 will be toward zero
  * @return An int256 representing integer average
  */
  function signedAverage(int256 a, int256 b) public pure returns (int256) {
    int256 ans = a + b;

    if (a > 0 && b > 0 && ans <= 0) {
      require(false);
    }
    if (a < 0 && b < 0 && ans >= 0) {
      require(false);
    }

    return ans / 2;
  }

  /**
  * @dev Gets the commitment of the specified address.
  * @param _miner The address to query the the commitment Of
  * @return the amount commited.
  */
  function commitmentOf(address _miner) public view returns (uint256) {
    return miners[_miner].value;
  }

  /**
  * @dev Gets the all fields for commitment of the specified address.
  * @param _miner The address to query the the commitment Of
  * @return value the amount commited.
  * @return onBlockNumber block number of commitment.
  * @return atStake stake when commited.
  * @return onBlockReward block reward when commited.
  */
  function getCommitment(address _miner) public view 
  returns (
    uint256 value,             // value commited to mining
    uint256 onBlockNumber,     // commited on block
    uint256 atStake,           // stake during commit
    int256 onBlockReward       // block reward during commit
    ) 
  {
    value = miners[_miner].value;
    onBlockNumber = miners[_miner].onBlockNumber;
    atStake = miners[_miner].atStake;
    onBlockReward = miners[_miner].onBlockReward;
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