pragma solidity ^0.4.21;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title Mock used for testing
*/
contract M5LogicMock7 is GDPOraclizedToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;
  address upgradeManager_;
  bool isUpgradeFinished_ = false;  

  /**
  * @dev return static value
  * @return An uint256 returns the static value
  */
  function getM5Reward(address _miner) public pure returns (uint256) {
    require(_miner != address(0));
    return (2 ** 140);
  }

  //for testing storage value change
  function withdrawM5() public returns (uint256) {
    M5Logic_ = address(0);
    //WithdrawM5();
    return 1;
  }

  
}