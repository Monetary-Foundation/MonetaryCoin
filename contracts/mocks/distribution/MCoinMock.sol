pragma solidity ^0.4.23;

import "../../token/ERC20/MineableM5Token.sol";


// mock class for Mcoin
contract MCoinMock is MineableM5Token {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  constructor(
    int256 blockReward,
    address GDPOracle,
    address upgradeManager
    ) public 
    {
    require(0 < blockReward);
    require(GDPOracle != address(0));
    
    blockReward_ = blockReward;
    emit BlockRewardChanged(0, blockReward_);

    GDPOracle_ = GDPOracle;
    emit GDPOracleTransferred(0x0, GDPOracle_);

    //M5 specific:
    M5Token_ = address(0);
    M5Logic_ = address(0);
    upgradeManager_ = upgradeManager;
  }

}