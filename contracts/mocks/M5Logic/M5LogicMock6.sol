pragma solidity ^0.4.19;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title Mock used for testing
*/
contract M5LogicMock6 is GDPOraclizedToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;
  address upgradeManager_;
  bool isUpgradeFinished_ = false;  
  /**
  * @dev swap M5 tokens back to normal tokens when GDP is back to possitive 
  * @param _value The amount of M5 tokens to swap for regular tokens
  * @return true
  */
  function swap(uint256 _value) public returns (bool) {
    blockReward_ = int256(_value);
    require(0 < blockReward_);
    return true;
  }

  event NewEvent(uint256 value);
  /**
  * @dev auxilery function
  * @param _value parameter 1
  * @return true
  */
  function aux(uint256 _value) public returns (bool) {
    blockReward_ = int256(_value);
    require(0 < blockReward_);
    NewEvent(_value);
    return true;
  }
}