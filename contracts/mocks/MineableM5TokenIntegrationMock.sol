pragma solidity ^0.4.23;

import "../token/ERC20/MineableM5Token.sol";


// mock class using StandardToken
contract MineableM5TokenIntegrationMock is MineableM5Token {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  constructor(
    address initialAccount,
    uint256 initialSupply,
    int256 blockReward,
    address GDPOracle, // solium-disable-line mixedcase
    address upgradeManager
    ) public 
    {
    require(0 < initialSupply);
    require(0 < blockReward);

    totalSupply_ = initialSupply;

    balances[initialAccount] = initialSupply;
    emit Transfer(0x0, initialAccount, initialSupply);
    
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