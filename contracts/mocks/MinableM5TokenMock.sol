pragma solidity ^0.4.18;

import "../token/ERC20/MinableM5Token.sol";


// mock class using StandardToken
contract MinableM5TokenMock is MinableM5Token {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableM5TokenMock(
    address initialAccount,
    uint256 initialSupply,
    int256 blockReward
    ) public 
    {
    require(0 < initialSupply);
    require(0 < blockReward);

    totalSupply_ = initialSupply; // * (10 ** uint256(decimals));

    balances[initialAccount] = initialSupply;
    Transfer(0x0, initialAccount, initialSupply);
    
    blockReward_ = blockReward;   

    //M5 specific:
    M5Token_ = address(0);
  
    M5Logic_ = address(0);

  }

}