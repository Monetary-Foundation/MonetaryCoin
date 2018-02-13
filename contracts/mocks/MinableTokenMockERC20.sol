pragma solidity ^0.4.18;

import "../token/ERC20/MinableToken.sol";


// mock class using StandardToken
contract MinableTokenMockERC20 is MinableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableTokenMockERC20(
    address initialAccount,
    uint256 initialBalance
    ) public 
    {
    totalSupply_ = initialBalance;
    balances[initialAccount] = initialBalance;
    Transfer(0x0, initialAccount, initialBalance);
    

    //totalSupply_ = INITIAL_SUPPLY;
    //balances[msg.sender] = INITIAL_SUPPLY;
  }

}