pragma solidity ^0.4.18;

import "./MinableM5TokenLogic.sol";


// mock class using StandardToken
contract M5LogicMock1 is MinableM5TokenLogic {

  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  //uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  function MinableM5TokenMock() public {}

}