pragma solidity ^0.4.18;

import "../token/ERC20/MinableToken.sol";


// mock class using StandardToken
contract MinableTokenMock is MinableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableTokenMock(uint256 supply, uint256 blockReward) public {
    totalSupply_ = supply * (10 ** uint256(decimals));
    balances[this] = totalSupply_;
    Transfer(0x0, this, totalSupply_);
    
    blockReward_ = blockReward;
    
  }

}