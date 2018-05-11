pragma solidity ^0.4.21;

import "../token/ERC20/MinableToken.sol";


// mock class using StandardToken
contract MinableTokenMock is MinableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableTokenMock(
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
  }

}