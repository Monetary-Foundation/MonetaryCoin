pragma solidity ^0.4.18;

import "../../token/ERC20/MinableToken.sol";


/**
 * @title M5 Minaable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract MinableM5TokenLogic is MinableToken { 

  address M5Token_;
  
  address M5Logic_;


  uint M5rewardResponse_;

  /**
  * @dev Calculate the reward if withdrawM5() happans on this block
  * @return An uint256 representing the reward amount
  */
  function getM5Reward(address _miner) public returns (uint256) {
    M5rewardResponse_ = 39;

    return 78;
  }

  
}