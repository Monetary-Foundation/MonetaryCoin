pragma solidity ^0.4.18;


/**
 * @title MultihashStore
 * @dev interface for storing and retriving a multihash
 * @dev supports one multihash per address
 */
contract MultihashStore {
  
  function setHash(
    uint8 hashFunction,
    uint8 size,
    bytes32 hash
    ) public 
    returns (bool);
  
  function getHash(address from) public view
  returns (
    uint8 hashFunction,
    uint8 size,
    bytes32 hash,
    uint256 setTime
    );
  
  event SetHash(address indexed from, uint8 hashFunction, uint8 size, bytes32 hash, uint256 setTime);
}
