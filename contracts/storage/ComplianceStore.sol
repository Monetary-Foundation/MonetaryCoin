pragma solidity ^0.4.23;

import "./MultihashStore.sol";


/**
 * @title ComplianceStore
 * @dev enables to store optional compliance data
 * supports one multihash per address
 * more information about multihash can be found on https://github.com/multiformats/multihash
 * Important hash functions:
 * (Name, hashFunction, size in bytes)
 * (sha1, 0x11, 20)
 * (sha2-256, 0x12, 32)
 * (sha3-256, 0x16, 32)
 * Full list can be found on https://github.com/multiformats/multihash/blob/master/hashtable.csv
 */
contract ComplianceStore is MultihashStore {
  event SetHash(address indexed from, uint8 hashFunction, uint8 size, bytes32 hash, uint256 timestamp);

  struct Multihash {
    uint8 hashFunction; // id of the hash function
    uint8 size;         // size in bytes
    bytes32 hash;       // the digest
    uint256 timestamp;  // when modified last time
  }

  mapping( address => Multihash ) store;


  /** @dev add a multihash into the store
  * @param _hashFunction id of the function
  * @param _size lenght of digest
  * @param _hash the digest
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
    emit SetHash(msg.sender, _hashFunction, _size, _hash, block.timestamp); // solium-disable-line
    return true;
  }

  /** 
  * @dev removes a multihash from the store 
  * @return true on success
  */
  function clearHash() public returns (bool) {
    delete store[msg.sender]; 
    return true;
  }

  /** 
  * @dev updates the timestamp for existing hash
  * @return true on success
  */
  function touch() public returns (bool) {
    Multihash storage multihash = store[msg.sender];
    require(0 < multihash.timestamp);
    setHash(multihash.hashFunction, multihash.size, multihash.hash);
    return true;
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
