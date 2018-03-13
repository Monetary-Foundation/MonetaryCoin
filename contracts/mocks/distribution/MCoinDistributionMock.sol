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
    uint16 firstPeriodDays,
    uint16 secondPeriodDays
    )
    MCoinDistribution (
      firstPeriodDays,             // uint16  _firstPeriodDays,
      toDecimals(initialBalance),  // uint    _firstPeriodSupply,
      secondPeriodDays,            // uint16  _secondPeriodDays,
      toDecimals(initialBalance),  // uint    _secondPeriodSupply,
      initialAccount,              // address _foundationMultiSig,
      toDecimals(initialBalance),  // uint    _foundationReserve,
      startTime                    // uint    _startTime
    ) public 
  {}    

  function toDecimals(uint256 _value) internal returns (uint256) {
    return _value.mul(10 ** uint256(decimals));
  }
}
