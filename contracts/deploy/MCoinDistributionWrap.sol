pragma solidity ^0.4.24;

import "../math/SafeMath.sol";
import "../distribution/MCoinDistribution.sol";


/**
 * @title MCoinDistributionWrap
 * @dev MCoinDistribution wrapper contract.
 * This contracts wraps MCoinDistribution.sol and is used to create the distribution contract. 
 * See MCoinDistribution.sol for full distribution details.
 */
contract MCoinDistributionWrap is MCoinDistribution {
  using SafeMath for uint256;
  
  uint8 public constant decimals = 18;  // solium-disable-line uppercase

  constructor(
    uint256 firstPeriodWindows,
    uint256 firstPeriodSupply,
    uint256 secondPeriodWindows,
    uint256 secondPeriodSupply,
    address foundationWallet,
    uint256 startTime,
    uint256 windowLength
    )
    MCoinDistribution (
      firstPeriodWindows,              // uint _firstPeriodWindows
      toDecimals(firstPeriodSupply),   // uint _firstPeriodSupply,
      secondPeriodWindows,             // uint _secondPeriodDays,
      toDecimals(secondPeriodSupply),  // uint _secondPeriodSupply,
      foundationWallet,                // address _foundationMultiSig,
      startTime,                       // uint _startTime
      windowLength                     // uint _windowLength
    ) public 
  {}    

  function toDecimals(uint256 _value) pure internal returns (uint256) {
    return _value.mul(10 ** uint256(decimals));
  }
}
