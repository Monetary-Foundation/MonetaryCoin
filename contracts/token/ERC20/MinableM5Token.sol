pragma solidity ^0.4.23;

import "./GDPOraclizedToken.sol";


/**
 * @title M5 mining ability.
 * @dev This contract adds the ability to mine for M5 tokens when growth is negative.
 * M5 token is a distinct ERC20 token which could be obtained only when the GDP growth is negative.
 * The logic for M5 mining will be determined after all economic considerations were addressed.
 * After upgrading this contract with the final M5 logic, finishUpgrade() will be called to permenently seal the upgrade ability.
*/
contract MinableM5Token is GDPOraclizedToken { 
  
  event M5TokenUpgrade(address indexed oldM5Token, address indexed newM5Token);
  event M5LogicUpgrade(address indexed oldM5Logic, address indexed newM5Logic);
  event FinishUpgrade();

  // The M5 token contract
  address M5Token_;
  // The contract to manage M5 mining logic.
  address M5Logic_;
  // The address which controls the upgrade process
  address upgradeManager_;
  // When isUpgradeFinished_ is true, no more upgrades is allowed
  bool isUpgradeFinished_ = false;

  /**
  * @dev get the M5 token address
  * @return M5 token address
  */
  function M5Token() public view returns (address) {
    return M5Token_;
  }

  /**
  * @dev get the M5 logic contract address
  * @return M5 logic contract address
  */
  function M5Logic() public view returns (address) {
    return M5Logic_;
  }

  /**
  * @dev get the upgrade manager address
  * @return the upgrade manager address
  */
  function upgradeManager() public view returns (address) {
    return upgradeManager_;
  }

  /**
  * @dev get the upgrade status
  * @return the upgrade status. if true, no more upgrades are possible.
  */
  function isUpgradeFinished() public view returns (bool) {
    return isUpgradeFinished_;
  }

  /**
  * @dev Throws if called by any account other than the GDPOracle.
  */
  modifier onlyUpgradeManager() {
    require(msg.sender == upgradeManager_);
    require(!isUpgradeFinished_);
    _;
  }

  /**
   * @dev Allows to set the M5 token contract 
   * @param newM5Token The address of the new contract
   */
  function upgradeM5Token(address newM5Token) public onlyUpgradeManager { // solium-disable-line
    require(newM5Token != address(0));
    M5TokenUpgrade(M5Token_, newM5Token);
    M5Token_ = newM5Token;
  }

  /**
   * @dev Allows the upgrade the M5 logic contract 
   * @param newM5Logic The address of the new contract
   */
  function upgradeM5Logic(address newM5Logic) public onlyUpgradeManager { // solium-disable-line
    require(newM5Logic != address(0));
    M5LogicUpgrade(M5Logic_, newM5Logic);
    M5Logic_ = newM5Logic;
  }

  /**
   * @dev Allows the upgrade the M5 logic contract and token at the same transaction
   * @param newM5Token The address of a new M5 token
   * @param newM5Logic The address of the new contract
   */
  function upgradeM5(address newM5Token, address newM5Logic) public onlyUpgradeManager { // solium-disable-line
    require(newM5Token != address(0));
    require(newM5Logic != address(0));
    M5TokenUpgrade(M5Token_, newM5Token);
    M5LogicUpgrade(M5Logic_, newM5Logic);
    M5Token_ = newM5Token;
    M5Logic_ = newM5Logic;
  }

  /**
  * @dev Function to dismiss the upgrade capability
  * @return True if the operation was successful.
  */
  function finishUpgrade() onlyUpgradeManager public returns (bool) {
    isUpgradeFinished_ = true;
    FinishUpgrade();
    return true;
  }

  /**
  * @dev Calculate the reward if withdrawM5() happans on this block
  * @param _miner The address of the _miner
  * @return An uint256 representing the reward amount
  */
  function getM5Reward(address _miner) public view returns (uint256) {
    require(M5Logic_ != address(0));
    if (miners[_miner].value == 0) {
      return 0;
    }
    // check that effective block reward is indeed negative
    require(signedAverage(miners[_miner].onBlockReward, blockReward_) < 0);

    // return length (bytes)
    uint32 returnSize = 32;
    // target contract
    address target = M5Logic_;
    // method signeture for target contract
    bytes32 signature = keccak256("getM5Reward(address)");
    // size of calldata for getM5Reward function: 4 for signeture and 32 for one variable (address)
    uint32 inputSize = 4 + 32;
    // variable to check delegatecall result (success or failure)
    uint8 callResult;
    // result from target.getM5Reward()
    uint256 result;
    
    assembly { // solium-disable-line
        // return _dest.delegatecall(msg.data)
        mstore(0x0, signature) // 4 bytes of method signature
        mstore(0x4, _miner)    // 20 bytes of address
        // delegatecall(g, a, in, insize, out, outsize)	- call contract at address a with input mem[in..(in+insize))
        // providing g gas and v wei and output area mem[out..(out+outsize)) returning 0 on error (eg. out of gas) and 1 on success
        // keep caller and callvalue
        callResult := delegatecall(sub(gas, 10000), target, 0x0, inputSize, 0x0, returnSize)
        switch callResult 
        case 0 
          { revert(0,0) } 
        default 
          { result := mload(0x0) }
    }
    return result;
  }

  event WithdrawM5(address indexed from,uint commitment, uint M5Reward);

  /**
  * @dev withdraw M5 reward, only appied to mining when GDP is negative
  * @return reward
  * @return commitmentValue
  */
  function withdrawM5() public returns (uint256 reward, uint256 commitmentValue) {
    require(M5Logic_ != address(0));
    require(M5Token_ != address(0));
    require(miners[msg.sender].value > 0); 
    
    // will revert if reward is positive
    reward = getM5Reward(msg.sender);
    commitmentValue = miners[msg.sender].value;
    
    require(M5Logic_.delegatecall(bytes4(keccak256("withdrawM5()")))); // solium-disable-line
    
    return (reward,commitmentValue);
  }

  //triggered when user swaps m5Value of M5 tokens for value of regular tokens.
  event Swap(address indexed from, uint256 M5Value, uint256 value);

  /**
  * @dev swap M5 tokens back to regular tokens when GDP is back to positive 
  * @param _value The amount of M5 tokens to swap for regular tokens
  * @return true
  */
  function swap(uint256 _value) public returns (bool) {
    require(M5Logic_ != address(0));
    require(M5Token_ != address(0));

    require(M5Logic_.delegatecall(bytes4(keccak256("swap(uint256)")),_value)); // solium-disable-line
    
    return true;
  }
}