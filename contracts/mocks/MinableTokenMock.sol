pragma solidity ^0.4.18;

import "../token/ERC20/MinableToken.sol";


// mock class using StandardToken
contract MinableTokenMock is MinableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableTokenMock(
    address initialAccount,
    uint256 initialBalance,
    uint256 totalSupply,
    uint256 blockReward
    ) public 
    {
    require(initialBalance <= totalSupply);
    require(0 < blockReward);

    // SafeMath.sub will throw if there is not enough balance.
    totalSupply_ = totalSupply; // * (10 ** uint256(decimals));
    balances[this] = totalSupply_.sub(initialBalance);
    Transfer(0x0, this, totalSupply_);

    balances[initialAccount] = initialBalance;
    Transfer(0x0, initialAccount, initialBalance);
    
    blockReward_ = blockReward;
    
  }

}