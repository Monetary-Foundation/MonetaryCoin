pragma solidity ^0.4.18;

import "../../token/ERC20/MinableToken.sol";


/**
 * @title M5 Minaable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract M5LogicMock2 is MinableToken { 
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
    return (2 ** 128);
    // return miners[_miner].value;
  }

  uint M5WithdrawResponse_;

  function withdrawM5() public returns (uint256) {
    M5WithdrawResponse_ = 31;
    //WithdrawM5();
    return 1;
  }

  
}