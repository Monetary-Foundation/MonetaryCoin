pragma solidity ^0.4.23;

import "../../token/ERC20/BurnableToken.sol";
import "../../token/ERC20/MintableToken.sol";


/**
 * @title M5tokenMock
 * @dev M5 ERC20 Token for mining when GDP is negative - Reference implementation of M5 token 
*/
contract M5tokenMock is MintableToken {

  constructor() public {}

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
    emit Transfer(msg.sender, 0x0, _value);
    emit Swap(from, _value);
  }
}
