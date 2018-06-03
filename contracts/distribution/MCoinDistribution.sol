pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC20/MineableToken.sol";


/**
 * @title MCoinDistribution
 * @dev MCoinDistribution
 * MCoinDistribution is used to distribute a fixed amount of token per window of time.
 * Users may commit Ether to a window of their choice.
 * After a window closes, a user may withdraw their reward using the withdraw(uint256 window) function or use the withdrawAll() 
 * function to get tokens from all windows in a single transaction.
 * The amount of tokens allocated to a user for a given window equals (window allocation) * (user eth) / (total eth).
 * A user can get the details of the current window with the detailsOfWindow() function.
 * The first-period allocation is larger than second-period allocation (per window). 
 */
contract MCoinDistribution is Ownable {
  using SafeMath for uint256;

  event Commit(address indexed from, uint256 value, uint256 window);
  event Withdraw(address indexed from, uint256 value, uint256 window);
  event MoveFunds(uint256 value);

  MineableToken public MCoin;

  uint256 public firstPeriodWindows;
  uint256 public firstPeriodSupply;
 
  uint256 public secondPeriodWindows;
  uint256 public secondPeriodSupply;
  
  uint256 public totalWindows;  // firstPeriodWindows + secondPeriodSupply

  address public foundationWallet;

  uint256 public startTimestamp;
  uint256 public windowLength;         // in seconds

  mapping (uint256 => uint256) public totals;
  mapping (address => mapping (uint256 => uint256)) public commitment;
  
  constructor(
    uint256 _firstPeriodWindows,
    uint256 _firstPeriodSupply,
    uint256 _secondPeriodWindows,
    uint256 _secondPeriodSupply,
    address _foundationWallet,
    uint256 _startTimestamp,
    uint256 _windowLength
  ) public 
  {
    require(0 < _firstPeriodWindows);
    require(0 < _firstPeriodSupply);
    require(0 < _secondPeriodWindows);
    require(0 < _secondPeriodSupply);
    require(0 < _startTimestamp);
    require(0 < _windowLength);
    require(_foundationWallet != address(0));
    
    firstPeriodWindows = _firstPeriodWindows;
    firstPeriodSupply = _firstPeriodSupply;
    secondPeriodWindows = _secondPeriodWindows;
    secondPeriodSupply = _secondPeriodSupply;
    foundationWallet = _foundationWallet;
    startTimestamp = _startTimestamp;
    windowLength = _windowLength;

    totalWindows = firstPeriodWindows.add(secondPeriodWindows);
    require(currentWindow() == 0);
  }

  /**
   * @dev Commit used as a fallback
   */
  function () public payable {
    commit();
  }

  /**
  * @dev initiate the distribution
  * @param _MCoin the token to distribute
  */
  function init(MineableToken _MCoin) public onlyOwner {
    require(address(MCoin) == address(0));
    require(_MCoin.owner() == address(this));
    require(_MCoin.totalSupply() == 0);

    MCoin = _MCoin;
    MCoin.mint(address(this), firstPeriodSupply.add(secondPeriodSupply));
    MCoin.finishMinting();
  }

  /**
  * @dev return allocation for given window
  * @param window the desired window
  * @return the number of tokens to distribute in the given window
  */
  function allocationFor(uint256 window) view public returns (uint256) {
    require(window < totalWindows);
    
    return (window < firstPeriodWindows) 
      ? firstPeriodSupply.div(firstPeriodWindows) 
      : secondPeriodSupply.div(secondPeriodWindows);
  }

  /**
  * @dev Return the window number for given timestamp
  * @param timestamp 
  * @return number of the current window in [0,inf)
  * zero will be returned before distribution start and during the first window.
  */
  function windowOf(uint256 timestamp) view public returns (uint256) {
    return (startTimestamp < timestamp) 
      ? timestamp.sub(startTimestamp).div(windowLength) 
      : 0;
  }

  /**
  * @dev Return information about the selected window
  * @param window number: [0-totalWindows)
  * @return {
    "uint256 start": window start timestamp
    "uint256 end": window end timestamp
    "uint256 remainingTime": remaining time (sec), zero if ended
    "uint256 allocation": number of tokens to be distributed
    "uint256 totalEth": total eth commited this window
    "uint256 number": # of requested window
    }
  */
  function detailsOf(uint256 window) view public 
    returns (
      uint256 start,  // window start timestamp
      uint256 end,    // window end timestamp
      uint256 remainingTime, // remaining time (sec), zero if ended
      uint256 allocation,    // number of tokens to be distributed
      uint256 totalEth,      // total eth commited this window
      uint256 number         // # of requested window
    ) 
    {
    require(window < totalWindows);
    start = startTimestamp.add(windowLength.mul(window));
    end = start.add(windowLength);
    remainingTime = (block.timestamp < end) // solium-disable-line
      ? end.sub(block.timestamp)            // solium-disable-line
      : 0; 

    allocation = allocationFor(window);
    totalEth = totals[window];
    return (start, end, remainingTime, allocation, totalEth, window);
  }

  /**
  * @dev Return information for the current window
  * @return {
    "uint256 start": window start timestamp
    "uint256 end": window end timestamp
    "uint256 remainingTime": remaining time (sec), zero if ended
    "uint256 allocation": number of tokens to be distributed
    "uint256 totalEth": total eth commited this window
    "uint256 number": # of requested window
    }
  */
  function detailsOfWindow() view public
    returns (
      uint256 start,  // window start timestamp
      uint256 end,    // window end timestamp
      uint256 remainingTime, // remaining time (sec), zero if ended
      uint256 allocation,    // number of tokens to be distributed
      uint256 totalEth,      // total eth commited this window
      uint256 number         // current window
    )
  {
    return (detailsOf(currentWindow()));
  }

  /**
  * @dev return the number of the current window
  * @return the window, range: [0-totalWindows)
  */
  function currentWindow() view public returns (uint256) {
    return windowOf(block.timestamp); // solium-disable-line
  }

  /**
  * @dev commit funds for a given window
  * Tokens for commited window need to be withdrawn after
  * window closes using withdraw(uint256 window) function
  * first window: 0
  * last window: totalWindows - 1
  * @param window to commit [0-totalWindows)
  */
  function commitOn(uint256 window) public payable {
    // Distribution didn't ended
    require(currentWindow() < totalWindows);
    // Commit only for present or future windows
    require(currentWindow() <= window);
    // Don't commit after distribution is finished
    require(window < totalWindows);
    // Minimum commitment
    require(0.01 ether <= msg.value);

    // Add commitment for user on given window
    commitment[msg.sender][window] = commitment[msg.sender][window].add(msg.value);
    // Add to window total
    totals[window] = totals[window].add(msg.value);
    // Log
    emit Commit(msg.sender, msg.value, window);
  }

  /**
  * @dev commit funds for the current window
  */
  function commit() public payable {
    commitOn(currentWindow());
  }
  
  /**
  * @dev Withdraw tokens after the window has closed
  * @param window to withdraw 
  * @return the calculated number of tokens
  */
  function withdraw(uint256 window) public returns (uint256 reward) {
    // Requested window already been closed
    require(window < currentWindow());
    // The sender hasn't made a commitment for requested window
    if (commitment[msg.sender][window] == 0) {
      return 0;
    }

    // The Price for given window is allocation / total_commitment
    // uint256 price = allocationFor(window).div(totals[window]);
    // The reward is price * commitment
    // uint256 reward = price.mul(commitment[msg.sender][window]);
    
    // Same calculation optimized for accuracy (without the .div rounding for price calculation):
    reward = allocationFor(window).mul(commitment[msg.sender][window]).div(totals[window]);
    
    // Init the commitment
    commitment[msg.sender][window] = 0;
    // Transfer the tokens
    MCoin.transfer(msg.sender, reward);
    // Log
    emit Withdraw(msg.sender, reward, window);
    return reward;
  }

  /**
  * @dev get the reward from all closed windows
  */
  function withdrawAll() public {
    for (uint256 i = 0; i < currentWindow(); i++) {
      withdraw(i);
    }
  }

  /**
  * @dev returns a array which contains reward for every closed window
  * a convinience function to be called for updating a GUI. 
  * To get the reward tokens use withdrawAll(), which consumes less gas.
  * @return uint256[] rewards - the calculated number of tokens for every closed window
  */
  function getAllRewards() public view returns (uint256[]) {
    uint256[] memory rewards = new uint256[](totalWindows);
    // lastClosedWindow = min(currentWindow(),totalWindows);
    uint256 lastWindow = currentWindow() < totalWindows ? currentWindow() : totalWindows;
    for (uint256 i = 0; i < lastWindow; i++) {
      rewards[i] = withdraw(i);
    }
    return rewards;
  }

  /**
  * @dev returns a array filled with commitments of address for every window
  * a convinience function to be called for updating a GUI. 
  * @return uint256[] commitments - the commited Eth per window of a given address
  */
  function getCommitmentsOf(address from) public view returns (uint256[]) {
    uint256[] memory commitments = new uint256[](totalWindows);
    for (uint256 i = 0; i < totalWindows; i++) {
      commitments[i] = commitment[from][i];
    }
    return commitments;
  }

  /**
  * @dev returns a array filled with eth totals for every window
  * a convinience function to be called for updating a GUI. 
  * @return uint256[] ethTotals - the totals for commited Eth per window
  */
  function getTotals() public view returns (uint256[]) {
    uint256[] memory ethTotals = new uint256[](totalWindows);
    for (uint256 i = 0; i < totalWindows; i++) {
      ethTotals[i] = totals[i];
    }
    return ethTotals;
  }

  /**
  * @dev moves Eth to the foundation wallet.
  * @return the amount to be moved.
  */
  function moveFunds() public onlyOwner returns (uint256 value) {
    value = address(this).balance;
    require(0 < value);

    foundationWallet.transfer(value);
    
    emit MoveFunds(value);
    return value;
  }
}
