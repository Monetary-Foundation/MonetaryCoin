
// import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var ComplienceStoreMock = artifacts.require('ComplienceStoreMock');

contract('ComplienceStore', function (accounts) {
  let ComplienceStore;

  beforeEach(async function () {
    ComplienceStore = await ComplienceStoreMock.new();
  });

  it('should return all zero for unset address', async function () {
    let multiHash = await ComplienceStore.getHash(accounts[0]);

    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(0);
    size.should.be.bignumber.equal(0);
    assert.equal(hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    timestamp.should.be.bignumber.equal(0);
  });

  it('should return all zero for unset address 2', async function () {
    let multiHash = await ComplienceStore.getHash(accounts[1]);

    const hashFunction = multiHash[0]; // bignumber
    const size = multiHash[1]; // bignumber
    const hash = multiHash[2]; // string 0x...
    const timestamp = multiHash[3]; // bignumber

    hashFunction.should.be.bignumber.equal(0);
    size.should.be.bignumber.equal(0);
    assert.equal(hash, '0x0000000000000000000000000000000000000000000000000000000000000000');
    timestamp.should.be.bignumber.equal(0);
  });

  it('should set multihash correctly', async function () {
    await ComplienceStore.setHash(1, 2, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    let multiHash = await ComplienceStore.getHash(accounts[0]);
    
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

  it('should correctly emmit event during set', async function () {
    const txObj =
      await ComplienceStore.setHash(2, 3, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    assert.equal(txObj.logs[0].event, 'SetHash');
    
    const { from, hashFunction, size, hash, timestamp } = txObj.logs[0].args;
    assert.equal(from, accounts[0]);

    hashFunction.should.be.bignumber.equal(2);
    size.should.be.bignumber.equal(3);
    assert.equal(hash, '0x00000000000000000000000000000abcd1000000000000000000000000000002');
    timestamp.should.be.bignumber.gt(1518978976);
  });
});
