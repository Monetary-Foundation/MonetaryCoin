pragma solidity ^0.4.19;

import "../token/ERC20/MinableM5Token.sol";
import "../token/ERC20/ComplianceStore.sol";


/**
 * @title MERO
 * @dev MERO
 */
contract MERO is MinableM5Token, ComplianceStore {

  string public constant name = "ERO"; // solium-disable-line uppercase
  string public constant symbol = "ERO"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  function MERO(
    uint256 blockReward, // will be transformed using toDecimals()
    address GDPOracle,
    address upgradeManager
    ) public 
    {
    require(0 < blockReward);
    require(GDPOracle != address(0));
    
    blockReward_ = toDecimals(blockReward);
    BlockRewardChanged(0, blockReward_);

    GDPOracle_ = GDPOracle;
    GDPOracleTransferred(0x0, GDPOracle_);

    M5Token_ = address(0);
    M5Logic_ = address(0);
    upgradeManager_ = upgradeManager;
  }

  function toDecimals(uint256 _value) pure internal returns (int256 value) {
    value = int256 (
      _value.mul(10 ** uint256(decimals))
    );
    assert(0 < value);
    return value;
  }

}