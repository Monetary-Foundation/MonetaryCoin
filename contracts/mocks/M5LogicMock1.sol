pragma solidity ^0.4.18;


// mock class for M5Logic
contract M5LogicMock1 {
  uint M5rewardResponse_;
  function getM5Reward() public returns (uint256) {
    M5rewardResponse_ = 33;
    return 77;
  }

}
