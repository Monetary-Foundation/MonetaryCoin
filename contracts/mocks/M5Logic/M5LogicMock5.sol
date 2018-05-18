pragma solidity ^0.4.23;

import "../../token/ERC20/GDPOraclizedToken.sol";


/**
 * @title Mock used for testing
*/
contract M5LogicMock5 is GDPOraclizedToken { 
  string public constant name = "Token"; // solium-disable-line uppercase
  string public constant symbol = "SIMb"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase

  address M5Token_;
  address M5Logic_;
  address upgradeManager_;
  bool isUpgradeFinished_ = false;  
  /**
  * @dev preform a require and return storage value
  * @return An uint256 returns the static value
  */
  function getM5Reward(address _miner) public view returns (uint256) {
    require(blockReward_ < 0);
    return (miners[_miner].value + 1);
  }

  /**
  * @dev set miners commitment to zero
  * @return reward
  * @return commitmentValue
  */
  function withdrawM5() public returns (uint256 reward, uint256 commitmentValue) {
    require(blockReward_ < 0);
    
    reward = getM5Reward(msg.sender);
    commitmentValue = miners[msg.sender].value;

    miners[msg.sender].value = 0;

    emit WithdrawM5(msg.sender, commitmentValue, reward); // solium-disable-line
    return (reward,commitmentValue);
  }

  event WithdrawM5(address indexed from,uint commitment, uint M5Reward);
}