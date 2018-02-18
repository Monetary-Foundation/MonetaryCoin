pragma solidity ^0.4.18;

import "./MultihashStore.sol";


/**
 * @title ComplienceStore
 * @dev unables to store optional complience data
 * @dev supports one multihash per address
 */
contract ComplienceStore is MultihashStore {
  event SetHash(address indexed from, uint8 hashFunction, uint8 size, bytes32 hash, uint256 timestamp);

  struct Multihash {
    uint8 hashFunction;
    uint8 size;
    bytes32 hash;
    uint256 timestamp;
  }

  mapping( address => Multihash ) store;


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
