
import assertRevert from '../helpers/assertRevert';
import latestTime from '../helpers/latestTime';
import { duration, increaseTimeTo } from '../helpers/increaseTime';
import { windowTimeStamp } from '../helpers/windowTime';

const BigNumber = web3.BigNumber;
const assert = require('chai').assert;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

// var MineableM5GDPOraclizedTokenMock = artifacts.require('MineableM5TokenIntegrationMock');
const M5TokenMock = artifacts.require('M5TokenMock');
const M5LogicMock3 = artifacts.require('M5LogicMock3');

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

const windowLength = duration.minutes(5);

// for tests run: ganache-cli -u0 -u1 -u2 -u3
contract('MineableM5TokenIntegrationMock', function (accounts) {
  let token;
  let distribution;
  let M5Token;
  let M5Logic;

  const initialAccount = accounts[0];
  const GDPOracle = accounts[1];
  const contractCreator = accounts[2];
  const upgradeManager = accounts[3];

  const initialBlockReward = 5;

  let startTime = latestTime() + 60;

  const firstPeriodWindows = 3;
  const secondPeriodWindows = 7;
  const firstPeriodSupply = 300;
  const secondPeriodSupply = 450;
  
  beforeEach(async function () {
    // New startTime for each test:
    startTime = latestTime() + 60;

    token = await MCoinMock.new(initialBlockReward, GDPOracle, upgradeManager, { from: contractCreator });

    distribution = await MCoinDistributionMock.new(
      firstPeriodWindows,
      firstPeriodSupply,
      secondPeriodWindows,
      secondPeriodSupply,
      initialAccount,
      startTime,
      windowLength,
      { from: contractCreator }
    );

    await token.transferOwnership(distribution.address, { from: contractCreator });

    await distribution.init(token.address, { from: contractCreator });

    const commitWindow = 0;
    const withdrawWindow = 1;
    await distribution.commit({ from: initialAccount, value: web3.toWei(new BigNumber(0.1), 'ether') });
    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow, windowLength));
    await distribution.withdraw(commitWindow, { from: initialAccount });

    M5Token = await M5TokenMock.new();
    M5Logic = await M5LogicMock3.new();

    // upgrade token and new logic
    await token.upgradeM5(M5Token.address, M5Logic.address, { from: upgradeManager });

    // transfer ownership of M5token to token:
    await M5Token.transferOwnership(token.address);
  });

  // ---------------------------------- full upgrade example with M5 token and swap -----------------
  it('should return the correct reward if nothing was commited', async function () {
    let zeroReward = await token.getM5Reward(accounts[0]);
    assert.equal(zeroReward, 0);
  });

  it('should return correct M5 reward when growth is negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;

    await token.commit(commitValue);
    // after one block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #blocks * BlockReward) / avgStake [integer division] )
    // [(4 * 1 * abs(-10)) / 4] = 10;
    let expectedReward = new BigNumber(commitValue * 1 * Math.abs(negativeBlockReward))
      .dividedToIntegerBy(commitValue);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  it('should mint M5 token when GDP is negative and changes to negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;

    await token.commit(commitValue);
    const negativeBlockReward2 = -20;
    await token.setNegativeGrowth(negativeBlockReward2, { from: GDPOracle });
    // after two block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
    // [(4 * 2 * abs(-15)) / 4] = 30;
    let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-15))
      .dividedToIntegerBy(commitValue);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  it('should mint M5 token when GDP is negative and changes to positive (effective block reward is negative)', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;

    await token.commit(commitValue);
    await token.setPositiveGrowth(6, { from: GDPOracle });
    // after two block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
    // [(4 * 2 * abs(-2)) / 4] = 4;
    let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-2))
      .dividedToIntegerBy(commitValue);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  it('should fail on getM5reward on positive effective block reward', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;
    await token.commit(commitValue);
    await token.setPositiveGrowth(1000, { from: GDPOracle });

    await assertRevert(token.getM5Reward(accounts[0]));
  });

  it('should fail to withdrawM5() if effective reward is positive', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;
    await token.commit(commitValue);
    await token.setPositiveGrowth(1000, { from: GDPOracle });

    await assertRevert(token.withdrawM5());
  });

  it('should get commitment back after withdrawM5() on negative GDP', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 5;
    await token.commit(commitValue);

    let postCommitBalance = await token.balanceOf(accounts[0]);
    await token.withdrawM5();
    let postWithdrawM5Balance = await token.balanceOf(accounts[0]);

    postWithdrawM5Balance.should.be.bignumber.equal(postCommitBalance.plus(commitValue));
  });

  it('should successfully mint correct amount of M5 token when GDP is negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;
    await token.commit(commitValue);
    await token.withdrawM5();

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
    // [(4 * 1 * abs(-10)) / 4] = 10;
    let expectedReward = new BigNumber(commitValue * 1 * Math.abs(-10))
      .dividedToIntegerBy(commitValue);

    let M5Balance = await M5Token.balanceOf(accounts[0]);

    M5Balance.should.be.bignumber.equal(expectedReward);
  });

  it('should mint M5 token when GDP is negative and changes', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;
    await token.commit(commitValue);
    const negativeBlockReward2 = -20;
    await token.setNegativeGrowth(negativeBlockReward2, { from: GDPOracle });

    await token.withdrawM5();

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
    // [(4 * 2 * abs(-15)) / 4] = 30;
    let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-15))
      .dividedToIntegerBy(commitValue);

    let M5Balance = await M5Token.balanceOf(accounts[0]);

    M5Balance.should.be.bignumber.equal(expectedReward);
  });

  it('should successfully increase supply of M5 token when GDP is negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 4;
    await token.commit(commitValue);
    await token.withdrawM5();

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
    // [(4 * 1 * abs(-10)) / 4] = 10;
    let expectedReward = new BigNumber(commitValue * 1 * Math.abs(-10))
      .dividedToIntegerBy(commitValue);

    let totalSupply = await M5Token.totalSupply();

    totalSupply.should.be.bignumber.equal(expectedReward);
  });

  it('should emit event on withdrawM5()', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 5;
    await token.commit(commitValue);

    let txObj = await token.withdrawM5();

    // assert.equal(txObj.logs[0].event, 'WithdrawM5');

    const event = txObj.logs.find(e => e.event === 'WithdrawM5');
    assert.exists(event);

    const { from, commitment, M5Reward } = event.args;

    assert.equal(from, accounts[0]);
    assert.equal(commitment, commitValue);
    assert.equal(M5Reward, 10);
  });

  it('should fail to swap if GDP is still negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward, { from: GDPOracle });
    const commitValue = 5;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now

    // GDP still negative:
    await assertRevert(token.swap(4));
  });

  it('should revert swap if M5 token balance is too low', async function () {
    await token.setNegativeGrowth(-10, { from: GDPOracle });
    const commitValue = 5;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    // trying to swap more then we have
    await assertRevert(token.swap(100));
  });

  it('should successfully swap M5 token for regular token when GDP is back to positive', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now
    // let M5Balance = await M5Token.balanceOf(accounts[0]);
    let balance = await token.balanceOf(accounts[0]);

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    await token.swap(swapValue);
    let newBalance = await token.balanceOf(accounts[0]);
    newBalance.should.be.bignumber.equal(balance.plus(swapValue / 10));
  });

  it('should increase token supply after swap', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now

    let supply = await token.totalSupply();

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    await token.swap(swapValue);
    let newSupply = await token.totalSupply();
    newSupply.should.be.bignumber.equal(supply.plus(swapValue / 10));
  });

  it('should decrease M5 token balance after swap (burn)', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now
    let M5Balance = await M5Token.balanceOf(accounts[0]);
    // let balance = await token.balanceOf(accounts[0]);

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    await token.swap(swapValue);

    let newM5Balance = await M5Token.balanceOf(accounts[0]);
    newM5Balance.should.be.bignumber.equal(M5Balance.minus(swapValue));
  });

  it('should decrease M5 token supply after swap (burn)', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now
    let M5Supply = await M5Token.totalSupply();
    // let balance = await token.balanceOf(accounts[0]);

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    await token.swap(swapValue);

    let newM5Supply = await M5Token.totalSupply();
    newM5Supply.should.be.bignumber.equal(M5Supply.minus(swapValue));
  });

  it('should revert if user trying to swap directly from M5 token contract', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });

    await assertRevert(M5Token.swap(accounts[0], swapValue));
  });

  it('should emit event on swap for M5 token contract', async function () {
    await token.setNegativeGrowth(-100, { from: GDPOracle });
    const commitValue = 5;
    await token.commit(commitValue);

    await token.withdrawM5();
    // We have M5 tokens now

    // GDP back to positive:
    await token.setPositiveGrowth(10, { from: GDPOracle });
    let txObj = await token.swap(80);

    const event = txObj.logs.find(e => e.event === 'Swap');
    assert.exists(event);

    const { from, M5Value, value } = event.args;
    assert.equal(from, accounts[0]);
    assert.equal(M5Value, 80);
    assert.equal(value, 8);
  });
});
