pragma solidity ^0.4.18;

import "./MinableToken.sol";


/**
 * @title M5 Minaable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract MinableM5Token is MinableToken { 
  
  event withdrawM5(address indexed from, uint reward, uint indexed onBlockNumber);

  address M5Token;
  
  address M5LogicContract;

  /* Minable Token data structs:
  uint256 totalStake_ = 0;
  int256 blockReward_;

  struct Commitment {
    uint256 value;          // value commited to mining
    uint256 onBlockNumber;     // commitment done on block
    uint256 atStake; // stake during commitment
    int256 onBlockReward;
  }
  mapping( address => Commitment ) miners;
  */

  event M5TokenUpgrade(address indexed oldM5Token, address indexed newM5Token);
  
  event M5LogicContractUpgrade(address indexed oldM5LogicContract, address indexed newM5LogicContract);


  /**
   * @dev Allows the upgrade the M5 logic Contract 
   * @param newM5LogicContract The address of the new contract
   */
  function upgradeM5LogicContract(address newM5LogicContract) public onlyOwner {
    require(newM5LogicContract != address(0));
    M5RewardContractUpgrade(M5LogicContract, newM5LogicContract);
    M5LogicContract = newM5LogicContract;
  }


  /**
   * @dev Allows the upgrade of the M5 token Contract 
   * @param newM5Token The address of the new contract
   */
  function upgradeM5LogicContract(address newM5Token) public onlyOwner {
    require(newM5Token != address(0));
    M5TokenUpgrade(M5Token, newM5Token);
    M5Token = newM5Token;
  }


  /**
  * @dev Calculate the reward if withdrawM5() happans on this block
  * @return An uint256 representing the reward amount
  */
  function getM5Reward(address _miner) public view returns (uint256) {
    if (miners[_miner].value == 0) {
      return 0;
    }
    
    
    return 2;
  }

  /**
  * @dev withdraw M5 reward, only appied to mining when GDP is negative
  * @return reward to withdraw
  */
  function withdrawM5() public returns (uint256) {
    require(miners[msg.sender].value > 0); 

    
    return 1;
  }
}