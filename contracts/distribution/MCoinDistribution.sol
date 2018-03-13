pragma solidity ^0.4.19;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC20/MinableToken.sol";


/**
 * @title MCoinDistribution
 * @dev MCoinDistribution
 */
contract MCoinDistribution is Ownable {
  using SafeMath for uint256;

  MinableToken public MCoin;
  
  uint16 public firstPeriodDays;
  uint public firstPeriodSupply;
 
  uint16 public secondPeriodDays;
  uint public secondPeriodSupply;

  uint public foundationReserve;
  address public foundationMultiSig;

  uint startTimestamp;
  
  function MCoinDistribution (
    uint16  _firstPeriodDays,
    uint    _firstPeriodSupply,
    uint16  _secondPeriodDays,
    uint    _secondPeriodSupply,
    address _foundationMultiSig,
    uint    _foundationReserve,
    uint    _startTimestamp
  ) public 
  {
    firstPeriodDays = _firstPeriodDays;
    firstPeriodSupply = _firstPeriodSupply;
    secondPeriodDays = _secondPeriodDays;
    secondPeriodSupply = _secondPeriodSupply;
    foundationMultiSig = _foundationMultiSig;
    foundationReserve = _foundationReserve;
    startTimestamp = _startTimestamp;
    
    // createFirstDay = wmul(totalSupply, 0.2 ether);
    // createPerDay = div(
    //     sub(sub(totalSupply, foundersAllocation), createFirstDay),
    //     numberOfDays
    // );

    // uint distributionSupply = totalSupply.sub(foundationReserve);
    // firstPeriodPerDay = distributionSupply / (numberOfDays / 2);
    // secondPeriodPerDay = distributionSupply.sub(firstPeriodPerDay) / (numberOfDays / 2);

    require(foundationMultiSig != address(0));
    require(0 < firstPeriodDays);
    require(0 < firstPeriodSupply);
    require(0 < secondPeriodDays);
    require(0 < secondPeriodSupply);
    require(0 < firstPeriodDays);
    require(0 < startTimestamp);
  }

  function init(MinableToken _MCoin) public onlyOwner returns (bool) {
    require(address(MCoin) == address(0));
    require(_MCoin.owner() == address(this));
    require(_MCoin.totalSupply() == 0);

    MCoin = _MCoin;
    MCoin.mint(this, firstPeriodSupply.add(secondPeriodSupply).add(foundationReserve));
    MCoin.finishMinting();

    MCoin.transfer(foundationMultiSig, foundationReserve);
    return true;
  }

  function allocationFor(uint16 day) view public returns (uint) {
    require(day < firstPeriodDays + secondPeriodDays);
    return (day < firstPeriodDays) ? firstPeriodSupply / firstPeriodDays : secondPeriodSupply / secondPeriodDays;
  }

  function currentPeriod() view public returns (uint) {
    return periodOf(block.timestamp);
  }

  // Each period is 23 hours long
  function periodOf(uint timestamp) view public returns (uint) {
    return (startTimestamp < timestamp) ? timestamp.sub(startTimestamp) / 23 hours : 0;
  }

}
