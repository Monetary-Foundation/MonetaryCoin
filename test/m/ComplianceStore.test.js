import { duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ComplianceStoreMock = artifacts.require('ComplianceStoreMock');

contract('ComplianceStore', function (accounts) {
  let ComplianceStore;
  const contractCreator = accounts[2];
  
  beforeEach(async function () {
    ComplianceStore = await ComplianceStoreMock.new({ from: contractCreator });
  });

  it('should return empty digest for unset address', async function () {
    let multiHash = await ComplianceStore.getHash(accounts[0]);

    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(0);
    size.should.be.bignumber.equal(0);
    assert.equal(hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    timestamp.should.be.bignumber.equal(0);
  });

  it('should return empty digest for unset address 2', async function () {
    let multiHash = await ComplianceStore.getHash(accounts[1]);

    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(0);
    size.should.be.bignumber.equal(0);
    assert.equal(hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    timestamp.should.be.bignumber.equal(0);
  });

  it('should set and get multihash correctly', async function () {
    await ComplianceStore.setHash(1, 2, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    let multiHash = await ComplianceStore.getHash(accounts[0]);
    
    // console.log(multiHash);
    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(1);
    size.should.be.bignumber.equal(2);
    assert.equal(hash, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    timestamp.should.be.bignumber.gt(1518978976);
  });

  it('should correctly emit event during set', async function () {
    const txObj =
      await ComplianceStore.setHash(2, 3, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    assert.equal(txObj.logs[0].event, 'SetHash');
    
    const { from, hashFunction, size, hash, timestamp } = txObj.logs[0].args;
    assert.equal(from, accounts[0]);

    hashFunction.should.be.bignumber.equal(2);
    size.should.be.bignumber.equal(3);
    assert.equal(hash, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    timestamp.should.be.bignumber.gt(1518978976);
  });

  it('should clear the multihash', async function () {
    await ComplianceStore.setHash(1, 2, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    await ComplianceStore.clearHash();
    let multiHash = await ComplianceStore.getHash(accounts[0]);
    
    // console.log(multiHash);
    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(0);
    size.should.be.bignumber.equal(0);
    assert.equal(hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    timestamp.should.be.bignumber.equal(0);
  });

  it('should correctly emit event during touch', async function () {
    let txObj = await ComplianceStore.setHash(2, 3, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    const firstTimestamp = txObj.logs[0].args.timestamp;
    setTimeout(async function (){
      txObj = await ComplianceStore.touch();
      assert.equal(txObj.logs[0].event, 'SetHash');
      
      const { from, hashFunction, size, hash, timestamp } = txObj.logs[0].args;
      assert.equal(from, accounts[0]);

      hashFunction.should.be.bignumber.equal(2);
      size.should.be.bignumber.equal(3);
      assert.equal(hash, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
      timestamp.should.be.bignumber.gt(firstTimestamp);
    }, 1100);
  });
});
