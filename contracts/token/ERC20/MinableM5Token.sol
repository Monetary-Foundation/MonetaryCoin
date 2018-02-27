pragma solidity ^0.4.18;

import "./MinableToken.sol";


/**
 * @title M5 Minaable token 
 * @dev ERC20 Token for mining when GDP is negative
*/
contract MinableM5Token is MinableToken { 

  address M5Token_;
  
  address M5Logic_;

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
  
  event M5LogicUpgrade(address indexed oldM5Logic, address indexed newM5Logic);

  /**
   * @dev Allows the upgrade the M5 logic Contract 
   * @param newM5Logic The address of the new contract
   */
  function upgradeM5Logic(address newM5Logic) public onlyOwner { // solium-disable-line
    require(newM5Logic != address(0));
    M5LogicUpgrade(M5Logic_, newM5Logic);
    M5Logic_ = newM5Logic;
  }


  /**
   * @dev Allows the upgrade of the M5 token Contract 
   * @param newM5Token The address of the new contract
   */
  function upgradeM5Token(address newM5Token) public onlyOwner { // solium-disable-line
    require(newM5Token != address(0));
    M5TokenUpgrade(M5Token_, newM5Token);
    M5Token_ = newM5Token;
  }


  /**
  * @dev Calculate the reward if withdrawM5() happans on this block
  * @return An uint256 representing the reward amount
  */
  function getM5Reward(address _miner) public view returns (uint256) {
    require(M5Logic_ != address(0));
    if (miners[_miner].value == 0) {
      return 0;
    }
    
    // adopted from https://gist.github.com/olekon/27710c731c58fd0e0bd2503e02f4e144
    // bytes4 sig;
    // assembly { sig := calldataload(0) }
    
    // return length
    uint16 returnSize = 256;
    // target contract
    address target = M5Logic_;
    // variable to store result (success or failure)
    uint8 callResult;
    
    assembly { // solium-disable-line
        // return _dest.delegatecall(msg.data)
        // calldatacopy(t, f, s)	-	copy s bytes from calldata at position f to mem at position t
        calldatacopy(0x0, 0x0, calldatasize)
        // delegatecall(g, a, in, insize, out, outsize)	- call contract at address a with input mem[in..(in+insize))
        // providing g gas and v wei and output area mem[out..(out+outsize)) returning 0 on error (eg. out of gas) and 1 on success
        // keep caller and callvalue
        callResult := delegatecall(sub(gas, 10000), target, 0x0, calldatasize, 0, returnSize)
        switch callResult 
        case 0 
          { revert(0,0) } 
        default 
          { return(0, returnSize) }
    }
  }

  event WithdrawM5(address indexed from, uint reward, uint indexed onBlockNumber);

  /**
  * @dev withdraw M5 reward, only appied to mining when GDP is negative
  * @return reward to withdraw
  */
  function withdrawM5() public returns (uint256) {
    require(M5Logic_ != address(0));
    require(miners[msg.sender].value > 0); 
    
    require(M5Logic_.delegatecall(bytes4(keccak256("withdrawM5()")))); // solium-disable-line
    // WithdrawM5(msg.sender);
    return 1;
  }
}