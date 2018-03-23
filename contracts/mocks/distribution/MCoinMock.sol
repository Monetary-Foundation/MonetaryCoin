pragma solidity ^0.4.19;

import "../../token/ERC20/MinableM5Token.sol";
import "../../token/ERC20/ComplianceStore.sol";


// mock class for Mcoin
contract MCoinMock is MinableM5Token, ComplianceStore {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  function MCoinMock(
    int256 blockReward,
    address GDPOracle,
    address upgradeManager
    ) public 
    {
    require(0 < blockReward);
    require(GDPOracle != address(0));
    
    blockReward_ = blockReward;
    BlockRewardChanged(0, blockReward_, block.number);

    GDPOracle_ = GDPOracle;
    GDPOracleTransferred(0x0, GDPOracle_);

    //M5 specific:
    M5Token_ = address(0);
    M5Logic_ = address(0);
    upgradeManager_ = upgradeManager;
  }

}