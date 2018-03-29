import { duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
// import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// const ComplianceStoreMock = artifacts.require('ComplianceStoreMock');

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');
const windowLength = duration.minutes(5);

contract('ComplianceStore', function (accounts) {
  let ComplianceStore;
  let distribution;

  const GDPOracle = accounts[0];
  const initialAccount = accounts[1];
  const contractCreator = accounts[2];
  const upgradeManager = accounts[3];
  // const stranger = accounts[8];

  const initialBlockReward = 5;

  let startTime = latestTime() + 60;

  const firstPeriodWindows = 3;
  const secondPeriodWindows = 7;
  const firstPeriodSupply = 100;
  const secondPeriodSupply = 150;
  const initialBalance = 50;

  beforeEach(async function () {
    // New startTime for each test:
    startTime = latestTime() + 60;

    ComplianceStore = await MCoinMock.new(initialBlockReward, GDPOracle, upgradeManager, { from: contractCreator });

    distribution = await MCoinDistributionMock.new(
      firstPeriodWindows,
      firstPeriodSupply,
      secondPeriodWindows,
      secondPeriodSupply,
      initialAccount,
      initialBalance,
      startTime,
      windowLength,
      { from: contractCreator }
    );

    await ComplianceStore.transferOwnership(distribution.address, { from: contractCreator });

    await distribution.init(ComplianceStore.address, { from: contractCreator });
  });

  it('should return zeros for unset address', async function () {
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

  it('should return zeros for unset address 2', async function () {
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
});
