pragma solidity ^0.4.23;

import "../../token/ERC20/BurnableToken.sol";
import "../../token/ERC20/MintableToken.sol";


contract M5tokenMock is MintableToken {

  // function M5tokenMock(address initialAccount, uint initialBalance) public {
  //   balances[initialAccount] = initialBalance;
  //   totalSupply_ = initialBalance;
  // }
  function M5tokenMock() public {}

  event Swap(address indexed from, uint256 _value);

  /**
   * @dev Swap M5 Tokens for Mcoin after GDP is back to positive
   * This function is triggered by the monetary coin contract
   * to swap M5 tokens trigger swap function in monetary coin contract
   * @param from owner of M5 tokens
   * @param _value The amount of token to be swapped (burned).
   */
  function swap(address from, uint256 _value) public onlyOwner {
    require(_value <= balances[from]);

    balances[from] = balances[from].sub(_value);
    totalSupply_ = totalSupply_.sub(_value);
    Transfer(msg.sender, 0x0, _value);
    Swap(from, _value);
  }
}
