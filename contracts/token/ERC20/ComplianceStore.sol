pragma solidity ^0.4.21;

import "./MultihashStore.sol";


/**
 * @title ComplianceStore
 * @dev enables to store optional Compliance data
 * @dev supports one multihash per address
 */
contract ComplianceStore is MultihashStore {
  event SetHash(address indexed from, uint8 hashFunction, uint8 size, bytes32 hash, uint256 timestamp);

  struct Multihash {
    uint8 hashFunction;
    uint8 size;
    bytes32 hash;
    uint256 timestamp;
  }

  mapping( address => Multihash ) store;


  /** @dev add a multihash into the store
      * @param _hashFunction Width of the rectangle.
      * @param _size Height of the rectangle.
      * @param _hash Height of the rectangle.
      * @return true on success
      */
  function setHash(
    uint8 _hashFunction,
    uint8 _size,
    bytes32 _hash
  ) public 
    returns (bool) 
  {
    store[msg.sender] = Multihash(_hashFunction, _size, _hash, block.timestamp); // solium-disable-line
    SetHash(msg.sender, _hashFunction, _size, _hash, block.timestamp); // solium-disable-line
  }
  
  /** @dev get hash from store for specific address
  * @return hashFunction
  * @return size
  * @return hash
  * @return timestamp      
  */
  function getHash(address from) public view
    returns (
      uint8 hashFunction,
      uint8 size,
      bytes32 hash,
      uint256 timestamp
    )
  {
    Multihash storage multihash = store[from];
    return(multihash.hashFunction, multihash.size, multihash.hash, multihash.timestamp);
  }
}
