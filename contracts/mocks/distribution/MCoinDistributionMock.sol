pragma solidity ^0.4.19;

import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";
import "../../distribution/MCoinDistribution.sol";


/**
 * @title MCoinDistribution
 * @dev MCoinDistribution
 */
contract MCoinDistributionMock is MCoinDistribution {
  using SafeMath for uint256;
  
  uint8 public constant decimals = 18;

  function MCoinDistributionMock (
    address initialAccount,
    uint256 initialBalance,
    uint256 startTime,
    uint256 firstPeriodWindows,
    uint256 secondPeriodWindows
    )
    MCoinDistribution (
      firstPeriodWindows,             // uint  _firstPeriodWindows
      toDecimals(initialBalance),  // uint    _firstPeriodSupply,
      secondPeriodWindows,            // uint  _secondPeriodDays,
      toDecimals(initialBalance),  // uint    _secondPeriodSupply,
      initialAccount,              // address _foundationMultiSig,
      toDecimals(initialBalance),  // uint    _foundationReserve,
      startTime                    // uint    _startTime
    ) public 
  {}    

  function toDecimals(uint256 _value) pure internal returns (uint256) {
    return _value.mul(10 ** uint256(decimals));
  }
}
