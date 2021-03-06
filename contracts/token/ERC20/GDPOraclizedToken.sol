pragma solidity ^0.4.24;

import "./MineableToken.sol";


/**
 * @title GDPOraclizedToken
 * @dev This is an interface for the GDP Oracle to control the mining rate.
 * For security reasons, two distinct functions were created: 
 * setPositiveGrowth() and setNegativeGrowth()
 */
contract GDPOraclizedToken is MineableToken {

  event GDPOracleTransferred(address indexed previousOracle, address indexed newOracle);
  event BlockRewardChanged(int oldBlockReward, int newBlockReward);

  address GDPOracle_;
  address pendingGDPOracle_;

  /**
   * @dev Modifier Throws if called by any account other than the GDPOracle.
   */
  modifier onlyGDPOracle() {
    require(msg.sender == GDPOracle_);
    _;
  }
  
  /**
   * @dev Modifier throws if called by any account other than the pendingGDPOracle.
   */
  modifier onlyPendingGDPOracle() {
    require(msg.sender == pendingGDPOracle_);
    _;
  }

  /**
   * @dev Allows the current GDPOracle to transfer control to a newOracle.
   * The new GDPOracle need to call claimOracle() to finalize
   * @param newOracle The address to transfer ownership to.
   */
  function transferGDPOracle(address newOracle) public onlyGDPOracle {
    pendingGDPOracle_ = newOracle;
  }

  /**
   * @dev Allows the pendingGDPOracle_ address to finalize the transfer.
   */
  function claimOracle() onlyPendingGDPOracle public {
    emit GDPOracleTransferred(GDPOracle_, pendingGDPOracle_);
    GDPOracle_ = pendingGDPOracle_;
    pendingGDPOracle_ = address(0);
  }

  /**
   * @dev Chnage block reward according to GDP 
   * @param newBlockReward the new block reward in case of possible growth
   */
  function setPositiveGrowth(int256 newBlockReward) public onlyGDPOracle returns(bool) {
    // protect against error / overflow
    require(0 <= newBlockReward);
    
    emit BlockRewardChanged(blockReward_, newBlockReward);
    blockReward_ = newBlockReward;
  }

  /**
   * @dev Chnage block reward according to GDP 
   * @param newBlockReward the new block reward in case of negative growth
   */
  function setNegativeGrowth(int256 newBlockReward) public onlyGDPOracle returns(bool) {
    require(newBlockReward < 0);

    emit BlockRewardChanged(blockReward_, newBlockReward);
    blockReward_ = newBlockReward;
  }

  /**
  * @dev get GDPOracle
  * @return the address of the GDPOracle
  */
  function GDPOracle() public view returns (address) { // solium-disable-line mixedcase
    return GDPOracle_;
  }

  /**
  * @dev get GDPOracle
  * @return the address of the GDPOracle
  */
  function pendingGDPOracle() public view returns (address) { // solium-disable-line mixedcase
    return pendingGDPOracle_;
  }
}
