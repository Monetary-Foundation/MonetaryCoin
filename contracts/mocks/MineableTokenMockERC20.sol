pragma solidity ^0.4.24;

import "../token/ERC20/MineableToken.sol";


// mock class using StandardToken
contract MineableTokenMockERC20 is MineableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  constructor(
    address initialAccount,
    uint256 initialBalance
    ) public 
    {
    totalSupply_ = initialBalance;
    balances[initialAccount] = initialBalance;
    emit Transfer(0x0, initialAccount, initialBalance);
    

    //totalSupply_ = INITIAL_SUPPLY;
    //balances[msg.sender] = INITIAL_SUPPLY;
  }

}