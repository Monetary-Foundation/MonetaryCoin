pragma solidity ^0.4.19;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title Mock used for testing
*/
contract M5LogicMock4 is GDPOraclizedToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;
  address upgradeManager_;
  bool isUpgradeFinished_ = false;  
  // getM5Reward was ommited on purpuse
  // function getM5Reward(address _miner) public view returns (uint256) {
  //   return (2 ** 140);
  //   // return miners[_miner].value;
  // }

  
}