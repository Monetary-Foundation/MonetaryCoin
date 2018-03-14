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
  
  uint public firstPeriodWindows;
  uint public firstPeriodSupply;
 
  uint public secondPeriodWindows;
  uint public secondPeriodSupply;

  uint public foundationReserve;
  address public foundationMultiSig;

  uint startTimestamp;
  
  function MCoinDistribution (
    uint    _firstPeriodWindows,
    uint    _firstPeriodSupply,
    uint    _secondPeriodWindows,
    uint    _secondPeriodSupply,
    address _foundationMultiSig,
    uint    _foundationReserve,
    uint    _startTimestamp
  ) public 
  {
    firstPeriodWindows = _firstPeriodWindows;
    firstPeriodSupply = _firstPeriodSupply;
    secondPeriodWindows = _secondPeriodWindows;
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
    require(0 < firstPeriodWindows);
    require(0 < firstPeriodSupply);
    require(0 < secondPeriodWindows);
    require(0 < secondPeriodSupply);
    require(0 < firstPeriodWindows);
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

  function allocationFor(uint256 day) view public returns (uint256) {
    require(day < firstPeriodWindows.add(secondPeriodWindows));
    
    return (day < firstPeriodWindows) 
      ? firstPeriodSupply.div(firstPeriodWindows) 
      : secondPeriodSupply.div(secondPeriodWindows);
  }

  function currentWindow() view public returns (uint256) {
    return windowOf(block.timestamp);
  }

  // Each window is 23 hours long
  function windowOf(uint256 timestamp) view public returns (uint256) {
    return (startTimestamp < timestamp) 
      ? timestamp.sub(startTimestamp).div(23 hours) 
      : 0;
  }

}
