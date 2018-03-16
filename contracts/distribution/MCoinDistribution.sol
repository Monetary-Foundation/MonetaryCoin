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
  
  uint256 public firstPeriodWindows;
  uint256 public firstPeriodSupply;
 
  uint256 public secondPeriodWindows;
  uint256 public secondPeriodSupply;
  
  uint256 public totalWindows;  // firstPeriodWindows + secondPeriodSupply

  uint256 public foundationReserve;
  address public foundationMultiSig;

  uint256 startTimestamp;
  
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
    totalWindows = firstPeriodWindows.add(secondPeriodWindows);

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

  // Commit as a fallback
  function () public payable {
    commit();
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

  function allocationFor(uint256 window) view public returns (uint256) {
    require(window < totalWindows);
    
    return (window < firstPeriodWindows) 
      ? firstPeriodSupply.div(firstPeriodWindows) 
      : secondPeriodSupply.div(secondPeriodWindows);
  }

  function currentWindow() view public returns (uint256) {
    return windowOf(block.timestamp);
  }

  /**
   * @dev Return the window number for given timestamp
   * Each window is 23 hours long
   * @param timestamp 
   * @return number of current window in [0,inf)
   * 0 will be returned if distribution didn't started or during the first window.
   */
  function windowOf(uint256 timestamp) view public returns (uint256) {
    return (startTimestamp < timestamp) 
      ? timestamp.sub(startTimestamp).div(23 hours) 
      : 0;
  }

  mapping (uint256 => uint256) public totals;
  mapping (uint256 => mapping (address => uint256)) public commitment;
  event Commit(address indexed from, uint256 value, uint256 window);

  function commitOn(uint window) public payable {
    // Distribution have started
    require(startTimestamp < block.timestamp);
    // Distribution didn't ended
    require(currentWindow() < totalWindows);
    // Commit only for present or future windows
    require(currentWindow() <= window);
    // Don't commit after distribution is finished
    require(window < totalWindows);
    // Minimum commitment
    require(0.01 ether <= msg.value);

    // Add commitment for user on given window
    commitment[window][msg.sender] = commitment[window][msg.sender].add(msg.value);
    // Add to window total
    totals[window] = totals[window].add(msg.value);

    Commit(msg.sender, msg.value, window);
  }

  function commit() public payable {
    commitOn(currentWindow());
  }
  
  event Withdraw(address indexed from, uint256 value, uint256 window);

  function withdraw(uint256 window) public{
    require(window < currentWindow());
    // empty window
    require(0 < totals[window]);
    require(0 < commitment[window][msg.sender]);

    uint256 price = allocationFor(window).div(totals[window]);
    uint256 reward = price.mul(commitment[window][msg.sender]);

    Withdraw(msg.sender, reward, window);
  }

}
