pragma solidity ^0.4.19;

import "./MinableToken.sol";


contract GDPOraclizedToken is MinableToken {

  event GDPOracleTransferred(address indexed previousOracle, address indexed newOracle);
  event BlockRewardChanged(int oldBlockReward, int newBlockReward);

  address GDPOracle_;

  /**
   * @dev The GDPOraclizedToken constructor sets the oracle account
   */
  /* 
  function GdpOraclizedToken(address oracle) public {
    GDPOracle = oracle;
  }*/

  /**
   * @dev Throws if called by any account other than the GDPOracle.
   */
  modifier onlyGDPOracle() {
    require(msg.sender == GDPOracle_);
    _;
  }

  /**
   * @dev Allows the current GDPOracle to transfer control to a newOracle.
   * @param newOracle The address to transfer ownership to.
   */
  function transferGDPOracle(address newOracle) public onlyGDPOracle {
    require(newOracle != address(0));
    GDPOracleTransferred(owner, newOracle);
    GDPOracle_ = newOracle;
  }

  /**
   * @dev Chnage block reward according to GDP 
   * @param newBlockReward the new block reward in case of possible growth
   */
  function setPossitiveGrowth(int256 newBlockReward) public onlyGDPOracle returns(bool) {
    // protect against error / overflow
    require(0 <= newBlockReward);
    
    BlockRewardChanged(blockReward_, newBlockReward);
    blockReward_ = newBlockReward;
  }

  /**
   * @dev Chnage block reward according to GDP 
   * @param newBlockReward the new block reward in case of negative growth
   */
  function setNegativeGrowth(int256 newBlockReward) public onlyGDPOracle returns(bool) {
    require(newBlockReward < 0);

    BlockRewardChanged(blockReward_, newBlockReward);
    blockReward_ = newBlockReward;
  }

  /**
  * @dev get GDPOracle
  * @return the address of the GDPOracle
  */
  function GDPOracle() public view returns (address) { // solium-disable-line mixedcase
    return GDPOracle_;
  }

}
