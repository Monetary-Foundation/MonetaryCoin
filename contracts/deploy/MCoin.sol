pragma solidity ^0.4.23;

import "../token/ERC20/MineableM5Token.sol";


/**
 * @title MCoin
 * @dev The MonetaryCoin contract
 * allows the creation of a new monetary coin.
 * The supply of the coin is defined by GDP oracle of the same country.
 * Example: If the GDP of a given country grows by 3%, there will be 3% more coins available for mining
 * Proof of stake forging is defined by the MineableToken.sol contract.
 * Initially, the coins will be distributed by the proof of stake forging mechanism.
 * After the distribution is over, new coins will be created at the same rate as the economy growths.
 */
contract MCoin is MineableM5Token {

  string public name; // solium-disable-line uppercase
  string public symbol; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  constructor(
    string tokenName,
    string tokenSymbol,
    uint256 blockReward, // will be transformed using toDecimals()
    address GDPOracle,
    address upgradeManager
    ) public 
    {
    require(GDPOracle != address(0));
    require(upgradeManager != address(0));
    
    name = tokenName;
    symbol = tokenSymbol;

    blockReward_ = toDecimals(blockReward);
    emit BlockRewardChanged(0, blockReward_);

    GDPOracle_ = GDPOracle;
    emit GDPOracleTransferred(0x0, GDPOracle_);

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