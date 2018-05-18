pragma solidity ^0.4.23;

import "../token/ERC20/MinableToken.sol";


// mock class using StandardToken
contract MinableTokenMockNoParams is MinableToken {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address public constant _initialAccount = address(1); // solium-disable-line uppercase
  uint256 public constant _initialSupply = 10; // solium-disable-line uppercase
  int256 public constant _blockReward = 5; // solium-disable-line uppercase

  function MinableTokenMockNoParams() public {
    totalSupply_ = _initialSupply; 
    balances[_initialAccount] = _initialSupply;
    emit Transfer(0x0, _initialAccount, _initialSupply);
    
    blockReward_ = _blockReward;   
  }

}