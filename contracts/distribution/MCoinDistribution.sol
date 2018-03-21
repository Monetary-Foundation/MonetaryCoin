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

  event Commit(address indexed from, uint256 value, uint256 window);
  event Withdraw(address indexed from, uint256 value, uint256 window);
  event MoveFunds(uint256 value);

  MinableToken public MCoin;
  
  uint256 constant MAX_WINDOWS = 365;

  uint256 public firstPeriodWindows;
  uint256 public firstPeriodSupply;
 
  uint256 public secondPeriodWindows;
  uint256 public secondPeriodSupply;
  
  uint256 public totalWindows;  // firstPeriodWindows + secondPeriodSupply

  uint256 public foundationReserve;
  address public foundationWallet;

  uint256 startTimestamp;
  uint256 windowLength;         // in seconds

  mapping (uint256 => uint256) public totals;
  mapping (address => mapping (uint256 => uint256)) public commitment;
  
  function MCoinDistribution (
    uint _firstPeriodWindows,
    uint _firstPeriodSupply,
    uint _secondPeriodWindows,
    uint _secondPeriodSupply,
    address _foundationWallet,
    uint _foundationReserve,
    uint _startTimestamp,
    uint _windowLength
  ) public 
  {
    require(0 < _firstPeriodWindows);
    require(0 < _firstPeriodSupply);
    require(0 < _secondPeriodWindows);
    require(0 < _secondPeriodSupply);
    require(0 < _foundationReserve);
    require(0 < _startTimestamp);
    require(0 < _windowLength);
    require(_foundationWallet != address(0));
    
    firstPeriodWindows = _firstPeriodWindows;
    firstPeriodSupply = _firstPeriodSupply;
    secondPeriodWindows = _secondPeriodWindows;
    secondPeriodSupply = _secondPeriodSupply;
    foundationWallet = _foundationWallet;
    foundationReserve = _foundationReserve;
    startTimestamp = _startTimestamp;
    windowLength = _windowLength;

    totalWindows = firstPeriodWindows.add(secondPeriodWindows);
    require(totalWindows <= MAX_WINDOWS);
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
  function init(MinableToken _MCoin) public onlyOwner {
    require(address(MCoin) == address(0));
    require(_MCoin.owner() == address(this));
    require(_MCoin.totalSupply() == 0);

    MCoin = _MCoin;
    MCoin.mint(this, firstPeriodSupply.add(secondPeriodSupply).add(foundationReserve));
    MCoin.finishMinting();

    MCoin.transfer(foundationWallet, foundationReserve);
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
  * Each window is 23 hours long
  * @param timestamp 
  * @return number of the current window in [0,inf)
  * 0 will be returned before distribution start and during the first window.
  */
  function windowOf(uint256 timestamp) view public returns (uint256) {
    return (startTimestamp < timestamp) 
      ? timestamp.sub(startTimestamp).div(windowLength) 
      : 0;
  }

  /**
  * @dev return the number of the current window
  * @return the window, range: [0-totalWindows)
  */
  function currentWindow() view public returns (uint256) {
    return windowOf(block.timestamp);
  }

  /**
  * @dev commit funds for the given window
  * @param window to commit 
  */
  function commitOn(uint256 window) public payable {
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
    commitment[msg.sender][window] = commitment[msg.sender][window].add(msg.value);
    // Add to window total
    totals[window] = totals[window].add(msg.value);
    // Log
    Commit(msg.sender, msg.value, window);
  }

  /**
  * @dev commit funds for the current window
  */
  function commit() public payable {
    commitOn(currentWindow());
  }
  
  /**
  * @dev Withdraw tokens after the window was closed
  * @param window to withdraw 
  * @return the calculated number pf tokens
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
    
    // Same calculation optimized for accuracy (without the rounding of .div in price calculation):
    reward = allocationFor(window).mul(commitment[msg.sender][window]).div(totals[window]);
    
    // Transfer the tokens
    MCoin.transfer(msg.sender, reward);

    // Init the commitment
    commitment[msg.sender][window] = 0;
    // Log
    Withdraw(msg.sender, reward, window);
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
  * @dev returns a array filed with reward for every closed window
  * a convinience function to be called for updating a GUI. 
  * To actually recive the rewards use withdrawAll(), which consumes less gas.
  * @return the calculated number of tokens for every closed window
  */
  function getAllRewards() public view returns (uint256[MAX_WINDOWS] rewards) {
    for (uint256 i = 0; i < currentWindow(); i++) {
      rewards[i] = withdraw(i);
    }
    return rewards;
  }

  /**
  * @dev moves Eth to the foundation wallet.
  * @return the amount to be moved.
  */
  function moveFunds() public onlyOwner returns (uint256 value) {
    value = this.balance;
    require(0 < value);

    foundationWallet.transfer(value);
    
    MoveFunds(value);
    return value;
  }
}
