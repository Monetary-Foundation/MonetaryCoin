
import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
import { duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// var GDPOraclizedToken = artifacts.require('GDPOraclizedTokenMock');

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');
const windowLength = duration.minutes(5);

contract('GDPOraclizedToken', function (accounts) {
  let token;
  let distribution;

  const GDPOracle = accounts[0];
  const initialAccount = accounts[1];
  const contractCreator = accounts[2];
  const upgradeManager = accounts[3];
  const stranger = accounts[4];

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

    token = await MCoinMock.new(initialBlockReward, GDPOracle, upgradeManager, { from: contractCreator });

    // uint256 firstPeriodWindows,
    // uint256 firstPeriodSupply,
    // uint256 secondPeriodWindows,
    // uint256 secondPeriodSupply,
    // address initialAccount,
    // uint256 initialBalance,
    // uint256 startTime,
    // uint256 windowLength
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

    await token.transferOwnership(distribution.address, { from: contractCreator });

    await distribution.init(token.address, { from: contractCreator });
  });

  it('should return the correct oracle address after init', async function () {
    let oracleAddress = await token.GDPOracle();

    assert.equal(oracleAddress, accounts[0]);
  });
  it('should transfer the oracle correctly', async function () {
    await token.transferGDPOracle(accounts[1]);
    let oracleAddress = await token.GDPOracle();

    assert.equal(oracleAddress, accounts[1]);
  });
  it('should emit event while transferring the oracle', async function () {
    const txObj = await token.transferGDPOracle(accounts[5]);

    const { previousOracle, newOracle } = txObj.logs[0].args;

    assert.equal(txObj.logs[0].event, 'GDPOracleTransferred');
    assert.equal(previousOracle, accounts[0]);
    assert.equal(newOracle, accounts[5]);
  });

  it('should fail to transfer the oracle from unauthorized address', async function () {
    await expectThrow(token.transferGDPOracle(accounts[2], { from: stranger }));
  });

  it('should fail to transfer the oracle to 0x0 address', async function () {
    await expectThrow(token.transferGDPOracle(0));
  });

  it('should prevent old oracle to do actions after transffer', async function () {
    // token = await GDPOraclizedToken.new(initialAccount, initialSupply, setBlockReward, accounts[1]);
    await token.transferGDPOracle(accounts[2]);
    await expectThrow(token.transferGDPOracle(accounts[3]));
    await expectThrow(token.setPositiveGrowth(5));
  });

  it('should correctly setPositiveGrowth', async function () {
    await token.setPositiveGrowth(50);
    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(50);
  });

  it('should emit event for setPositiveGrowth', async function () {
    // BlockRewardChanged(int oldBlockReward, int newBlockReward);
    const txObj = await token.setPositiveGrowth(50);

    assert.equal(txObj.logs[0].event, 'BlockRewardChanged');
    const { oldBlockReward, newBlockReward } = txObj.logs[0].args;
    assert.equal(oldBlockReward, 5);
    assert.equal(newBlockReward, 50);
  });

  it('should prevent from non oracle to setPositiveGrowth', async function () {
    await assertRevert(token.setPositiveGrowth(50, { from: stranger }));
  });

  it('should prevent setting negative value for setPositiveGrowth', async function () {
    await assertRevert(token.setPositiveGrowth(-50));
  });

  it('should correctly setPositiveGrowth after transfering oracle address', async function () {
    await token.transferGDPOracle(accounts[1]);
    await token.setPositiveGrowth(51, { from: accounts[1] });

    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(51);
  });

  it('should prevent original oracle to do actions after transffer', async function () {
    await token.transferGDPOracle(accounts[1]);
    await token.setPositiveGrowth(50, { from: accounts[1] });
    await expectThrow(token.setPositiveGrowth(50, { from: accounts[0] }));
  });

  it('should correctly setNegativeGrowth', async function () {
    await token.setNegativeGrowth(-60);
    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(-60);
  });

  it('should emit event for setNegativeGrowth', async function () {
    // BlockRewardChanged(int oldBlockReward, int newBlockReward);
    const txObj = await token.setNegativeGrowth(-60);

    assert.equal(txObj.logs[0].event, 'BlockRewardChanged');
    const { oldBlockReward, newBlockReward } = txObj.logs[0].args;
    assert.equal(oldBlockReward, 5);
    assert.equal(newBlockReward, -60);
  });

  it('should prevent from non oracle to setNegativeGrowth', async function () {
    await expectThrow(token.setNegativeGrowth(50, { from: stranger }));
  });

  it('should prevent setting possitive value for setNegativeGrowth', async function () {
    await expectThrow(token.setNegativeGrowth(50));
  });

  it('should correctly setNegativeGrowth after transfering oracle address', async function () {
    await token.transferGDPOracle(accounts[1]);
    await token.setNegativeGrowth(-51, { from: accounts[1] });

    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(-51);
  });

  // // ------Integration tests:

  it('should revert on withdraw() when block reward is negative', async function () {
    await token.setNegativeGrowth(-60);
    await token.commit(5, { from: initialAccount });
    await expectThrow(token.withdraw({ from: initialAccount }));
  });

  it('should getReward() correctly after changing block reward', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue, { from: initialAccount });
    // next block:
    await token.setPositiveGrowth(11);

    let reward = await token.getReward(initialAccount);
    // effectiveBlockReward (5+11) / 2 = 8
    // (commitValue * #blocks * effectiveBlockReward) / effectiveStake [integer division]
    // (4 * 2 * 8) / 4 = 32;
    let expectedReward = new BigNumber(commitValue * 2 * 8).dividedToIntegerBy(commitValue);
    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should withdraw() correctly after changing block reward', async function () {
    const commitValue = 4;

    await token.commit(commitValue, { from: initialAccount });
    // next block:
    await token.setPositiveGrowth(11);

    // effectiveBlockReward = (5+11) / 2 = 8
    // (commitValue * #blocks * effectiveBlockReward) / effectiveStake [integer division]
    // (4 * 2 * 8) / 4 = 16;
    await token.withdraw({ from: initialAccount });
    let newBalance = await token.balanceOf(initialAccount);

    let expectedReward = new BigNumber(commitValue * 2 * 8).dividedToIntegerBy(commitValue);
    let expectedBalance = expectedReward.plus(web3.toWei(new BigNumber(initialBalance), 'ether'));

    newBalance.should.be.bignumber.equal(expectedBalance);
  });

  it('should fail to return negative reward', async function () {
    const commitValue = 4;
    await token.commit(commitValue, { from: initialAccount });
    await token.setNegativeGrowth(-20);
    await assertRevert(token.getReward(initialAccount));
  });

  it('should fail to withdraw negative reward', async function () {
    const commitValue = 4;
    await token.commit(commitValue, { from: initialAccount });
    await token.setNegativeGrowth(-20);
    await assertRevert(token.withdraw({ from: initialAccount }));
  });

  it('should prevent recommit if block reward is negative', async function () {
    const commitValue = 4;

    await token.commit(commitValue, { from: initialAccount });
    await token.setNegativeGrowth(-20);
    await assertRevert(token.commit(commitValue));
  });
});
