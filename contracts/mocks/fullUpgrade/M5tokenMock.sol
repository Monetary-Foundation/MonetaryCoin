pragma solidity ^0.4.18;

import "../../token/ERC20/BurnableToken.sol";
import "../../token/ERC20/MintableToken.sol";


contract M5tokenMock is BurnableToken, MintableToken {

  // function M5tokenMock(address initialAccount, uint initialBalance) public {
  //   balances[initialAccount] = initialBalance;
  //   totalSupply_ = initialBalance;
  // }
  function M5tokenMock() public {}

}
