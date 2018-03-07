pragma solidity ^0.4.19;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title Mock used for testing
*/
contract M5LogicMock2 is GDPOraclizedToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;

  /**
  * @dev return static value
  * @return An uint256 returns the static value
  */
  function getM5Reward(address _miner) public pure returns (uint256) {
    return (2 ** 140);
  }

  function withdrawM5() public pure returns (uint256) {
    
    //WithdrawM5();
    return 1;
  }

  
}