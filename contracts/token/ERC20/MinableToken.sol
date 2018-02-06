pragma solidity ^0.4.18;

import "./MintableToken.sol";


/**
 * @title Minaable token
 * @dev ERC20 Token with Pos mining
*/
contract MinableToken is MintableToken { 
  
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
  */
  function commit() public returns (bool) {
    return true;
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