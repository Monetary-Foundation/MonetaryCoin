pragma solidity ^0.4.18;

import "../../token/ERC20/BurnableToken.sol";
import "../../token/ERC20/MintableToken.sol";


contract M5tokenMock is BurnableToken, MintableToken {

  // function M5tokenMock(address initialAccount, uint initialBalance) public {
  //   balances[initialAccount] = initialBalance;
  //   totalSupply_ = initialBalance;
  // }
  function M5tokenMock() public {}

  event Swap(address indexed user, uint256 _value);

  /**
   * @dev Swap M5 Tokens for Mcoin after GDP is back to possitive
   * This function is triggered by the monetary coin contract
   * to swap M5 tokens trigger swap function in monetary coin contract
   * @param user owner of M5 tokens
   * @param _value The amount of token to be swapped (burned).
   */
  function swap(address user, uint256 _value) public onlyOwner {
    require(_value <= balances[user]);

    balances[user] = balances[user].sub(_value);
    totalSupply_ = totalSupply_.sub(_value);
    Swap(user, _value);
  }
}
