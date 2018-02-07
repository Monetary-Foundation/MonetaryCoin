pragma solidity ^0.4.18;

import "./MintableToken.sol";


/**
 * @title Minaable token
 * @dev ERC20 Token with Pos mining
*/
contract MinableToken is MintableToken { 
  event Commit(address indexed from, uint256 value, uint indexed blockNumber,uint commitmentStake);

  uint256 totalStake_ = 0;
  uint256 blockReward_;

  struct Commitment {
    uint amount;          // amount commited to mining
    uint blockNumber;     // commitment done on block
    uint commitmentStake; // stake during commitment
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
    require(miners[msg.sender].amount == 0); 

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    miners[msg.sender] = Commitment(_value, block.number, totalStake_);
    
    totalStake_ = totalStake_.add(_value);

    Commit(msg.sender, _value, block.number, totalStake_); // solium-disable-line
    return true;
  }

   /**
  * @dev withdraw from mining 
  */
  function withdraw() public returns (uint256) {
    require(miners[msg.sender].amount > 0); 

    uint256 averageStake = average(miners[msg.sender].commitmentStake, totalStake_);
    
    uint256 numberOfBlocks = block.number - miners[msg.sender].blockNumber;

    uint256 withdrawAmount = miners[msg.sender].amount * numberOfBlocks * blockReward_ / averageStake;

    

    return withdrawAmount;
  }

  /**
  * @dev Gets the commitment of the specified address.
  * @param _miner The address to query the the balance of.
  * @return An uint256 representing the amount commited by the passed address.
  */
  function commitmentOf(address _miner) public view returns (uint256 balance) {
    return miners[_miner].amount;
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