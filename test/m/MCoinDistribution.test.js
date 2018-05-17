
import assertRevert from '../helpers/assertRevert';
import { increaseTimeTo, duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';

// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;
const assert = require('chai').assert;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

// var M5TokenMock = artifacts.require('M5TokenMock');
// var M5LogicMock3 = artifacts.require('M5LogicMock3');

const windowLength = duration.minutes(5);

/**
   * Returns possible window timestamp for specific window
   * @param {number} startTime - timestamp of the distribution start
   * @param {number} windowNumber - Number of window, range: [0-lastWindow-1]
   * @returns {number} possible timestamp for window
   */
const windowTimeStamp = (startTime, windowNumber) =>
  startTime + duration.seconds(5) + windowNumber * windowLength;

// for tests run: ganache-cli -u0 -u1 -u2 -u3 -u4 -u5
contract('MCoinDistributionMock', function (accounts) {
  let token;
  let distribution;

  const initialAccount = accounts[0];
  const GDPOracle = accounts[1];
  const contractCreator = accounts[2];
  const upgradeManager = accounts[3];

  const buyer = accounts[4];
  const buyer2 = accounts[5];

  const initialBlockReward = 5;

  let startTime = latestTime() + 60;

  const firstPeriodWindows = 3;
  const secondPeriodWindows = 7;
  const firstPeriodSupply = 100;
  const secondPeriodSupply = 150;
  const initialBalance = 50;

  beforeEach(async function () {
    // New startTime for each test:
    startTime = latestTime() + 120;

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

  it('should return the correct reward if nothing was commited', async function () {
    let zeroReward = await token.getReward(accounts[0]);
    assert.equal(zeroReward, 0);
  });

  it('should return the correct balance for initial address', async function () {
    let balance = await token.balanceOf(accounts[0]);
    web3.fromWei(balance, 'ether').should.be.bignumber.equal(initialBalance);
  });

  it('should return the correct totalSupply', async function () {
    let supply = await token.totalSupply();
    web3.fromWei(supply, 'ether').should.be.bignumber.equal(firstPeriodSupply + secondPeriodSupply + initialBalance);
  });

  it('should return the correct allocation for firstPeriodWindows', async function () {
    for (let i = 0; i < firstPeriodWindows; i++) {
      let allocation = await distribution.allocationFor(i);
      let firstPeriodSupplyWei = web3.toWei(new BigNumber(firstPeriodSupply), 'ether');
      allocation.should.be.bignumber.equal(firstPeriodSupplyWei.dividedToIntegerBy(firstPeriodWindows));
    }
  });

  it('should return the correct allocation for secondPeriodWindows', async function () {
    const totalDuration = firstPeriodWindows + secondPeriodWindows;
    for (let i = firstPeriodWindows; i < totalDuration; i++) {
      let allocation = await distribution.allocationFor(i);
      let secondPeriodSupplyWei = web3.toWei(new BigNumber(secondPeriodSupply), 'ether');
      allocation.should.be.bignumber.equal(secondPeriodSupplyWei.dividedToIntegerBy(secondPeriodWindows));
    }
  });

  it('should revert if asked for allocation on illegal window', async function () {
    await assertRevert(distribution.allocationFor(firstPeriodWindows + secondPeriodWindows));
  });

  it('should return zero for currentWindow before start', async function () {
    let window = await distribution.currentWindow();
    window.should.be.bignumber.equal(0);
  });

  it('should return correct window details before start', async function () {
    const totalWindows = firstPeriodWindows + secondPeriodWindows;
    let start, end, remainingTime, allocation, commitment, window;
    for (let i = 0; i < totalWindows; i++) {
      [start, end, remainingTime, allocation, commitment, window] = await distribution.detailsOf(i);
      start.should.be.bignumber.equal(startTime + windowLength * i);
      end.should.be.bignumber.equal(startTime + windowLength + windowLength * i);
      remainingTime.should.be.bignumber.at.least(windowTimeStamp(startTime, i) - latestTime());
      remainingTime.should.be.bignumber.at.most(windowTimeStamp(startTime, i) + windowLength - latestTime());
      const expectedAlloc = (i < firstPeriodWindows)
        ? new BigNumber(web3.toWei(firstPeriodSupply, 'ether')).dividedToIntegerBy(firstPeriodWindows)
        : new BigNumber(web3.toWei(secondPeriodSupply, 'ether')).dividedToIntegerBy(secondPeriodWindows);
      allocation.should.be.bignumber.equal(expectedAlloc);
      commitment.should.be.bignumber.equal(0);
      window.should.be.bignumber.equal(i);
    }
  });

  it('should return correct window details during the distrebution', async function () {
    const totalWindows = firstPeriodWindows + secondPeriodWindows;
    let start, end, remainingTime, allocation, commitment, window;
    for (let i = 0; i < totalWindows; i++) {
      await increaseTimeTo(windowTimeStamp(startTime, i));
      [start, end, remainingTime, allocation, commitment, window] = await distribution.detailsOfWindow();
      start.should.be.bignumber.equal(startTime + windowLength * i);
      end.should.be.bignumber.equal(startTime + windowLength + windowLength * i);
      remainingTime.should.be.bignumber.at.most(windowLength);
      const expectedAlloc = (i < firstPeriodWindows)
        ? new BigNumber(web3.toWei(firstPeriodSupply, 'ether')).dividedToIntegerBy(firstPeriodWindows)
        : new BigNumber(web3.toWei(secondPeriodSupply, 'ether')).dividedToIntegerBy(secondPeriodWindows);
      allocation.should.be.bignumber.equal(expectedAlloc);
      commitment.should.be.bignumber.equal(0);
      window.should.be.bignumber.equal(i);
    }
  });

  it('should return 0 for currentWindow() (first window marked 0)', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));
    let window = await distribution.currentWindow();
    window.should.be.bignumber.equal(0);
  });

  it('should return the correct currentWindow() on every window', async function () {
    const totalWindows = firstPeriodWindows + secondPeriodWindows;
    for (let i = 0; i < totalWindows; i++) {
      await increaseTimeTo(windowTimeStamp(startTime, i));
      let window = await distribution.currentWindow();
      window.should.be.bignumber.equal(i);
    }
  });

  it('should return the correct window for a given timestamp', async function () {
    const totalWindows = firstPeriodWindows + secondPeriodWindows;
    for (let i = 0; i < totalWindows; i++) {
      let window = await distribution.windowOf(windowTimeStamp(startTime, i));
      window.should.be.bignumber.equal(i);
    }
  });

  it('should allow a commitOn() before first window is started', async function () {
    const window = 0;
    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.2), 'ether'),
    };
    await distribution.commitOn(window, txObj);
  });

  it('should revert a commitOn() after distribution is over', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, firstPeriodWindows + secondPeriodWindows));

    const window = 0;
    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.2), 'ether'),
    };
    await assertRevert(distribution.commitOn(window, txObj));
  });

  it('should revert a commitOn() to past window', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, firstPeriodWindows));

    const window = 0;
    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.2), 'ether'),
    };
    await assertRevert(distribution.commitOn(window, txObj));
  });

  it('should revert a commitOn() to window after finish', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = firstPeriodWindows + secondPeriodWindows;
    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.2), 'ether'),
    };
    await assertRevert(distribution.commitOn(window, txObj));
  });

  it('should revert a commitOn() for less then 0.1 eth', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 1;
    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.005), 'ether'),
    };
    await assertRevert(distribution.commitOn(window, txObj));
  });

  it('should commitOn() successfully', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 0;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commitOn(window, txObj);
    const commitment = await distribution.commitment(buyer, window);
    commitment.should.be.bignumber.equal(ethValue);
  });

  it('should commitOn() twice to same window successfully by summing up the commitment', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 1;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commitOn(window, txObj);
    await distribution.commitOn(window, txObj);
    const commitment = await distribution.commitment(buyer, window);
    commitment.should.be.bignumber.equal(ethValue.mul(2));
  });

  it('should commitOn() twice to same window successfully by different buyers', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 2;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    const txObj2 = {
      from: buyer2,
      value: ethValue,
    };
    await distribution.commitOn(window, txObj);
    await distribution.commitOn(window, txObj2);
    const commitment = await distribution.commitment(buyer, window);
    commitment.should.be.bignumber.equal(ethValue);
  });

  it('should count totals for window succesfully after commitOn()', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 3;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commitOn(window, txObj);
    const total = await distribution.totals(window);
    total.should.be.bignumber.equal(ethValue);
  });

  it('should count totals for window succesfully after two commitOn()', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));

    const window = 4;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    const txObj2 = {
      from: buyer2,
      value: ethValue,
    };
    await distribution.commitOn(window, txObj);
    await distribution.commitOn(window, txObj2);
    const total = await distribution.totals(window);
    total.should.be.bignumber.equal(ethValue.mul(2));
  });

  it('should emit event for commitOn()', async function () {
    await increaseTimeTo(windowTimeStamp(startTime, 0));
    const commitWindow = 1;
    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    const tx = await distribution.commitOn(commitWindow, txObj);

    const event = tx.logs.find(e => e.event === 'Commit');
    assert.exists(event);

    const { from, value, window } = event.args;

    assert.equal(from, buyer);
    value.should.be.bignumber.equal(ethValue);
    window.should.be.bignumber.equal(commitWindow);
  });

  it('should commit() for current window if none is given', async function () {
    const commitWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    const tx = await distribution.commit(txObj);

    const event = tx.logs.find(e => e.event === 'Commit');
    assert.exists(event);

    const { from, value, window } = event.args;

    assert.equal(from, buyer);
    value.should.be.bignumber.equal(ethValue);
    window.should.be.bignumber.equal(commitWindow);
  });

  it('should commit() as fallback function', async function () {
    const commitWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    const tx = await distribution.sendTransaction(txObj);

    const event = tx.logs.find(e => e.event === 'Commit');
    assert.exists(event);

    const { from, value, window } = event.args;

    assert.equal(from, buyer);
    value.should.be.bignumber.equal(ethValue);
    window.should.be.bignumber.equal(commitWindow);
  });

  it('should revert if trying to withdraw() for current window', async function () {
    const commitWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);

    await assertRevert(distribution.withdraw(commitWindow, { from: buyer }));
  });

  it('should not change balance if trying to withdraw() without making a commitment', async function () {
    const commitWindow = 3;
    const withdrawWindow = 4;

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));

    let currentBalance = await token.balanceOf(buyer);
    await distribution.withdraw(commitWindow, { from: buyer });
    let newBalance = await token.balanceOf(buyer);
    currentBalance.should.be.bignumber.equal(newBalance);
  });

  it('should return 0 if trying to withdraw() without making a commitment', async function () {
    const commitWindow = 3;
    const withdrawWindow = 4;

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));

    let reward = await distribution.withdraw.call(commitWindow, { from: buyer });

    reward.should.be.bignumber.equal(0);
  });

  it('should return correct reward when calling withdraw()', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);
    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));

    let reward = await distribution.withdraw.call(commitWindow, { from: buyer });

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows);
    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should withdraw() succesfully', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');

    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);
    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));
    await distribution.withdraw(commitWindow, { from: buyer });

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows);

    let reward = await token.balanceOf(buyer);
    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should zero the commitment after succesfull withdraw()', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);
    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));
    await distribution.withdraw(commitWindow, { from: buyer });

    let reward = await distribution.withdraw.call(commitWindow, { from: buyer });
    reward.should.be.bignumber.equal(0);
  });

  it('should withdraw() succesfully with two buyers', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');

    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);

    const txObj2 = {
      from: buyer2,
      value: ethValue,
    };
    await distribution.commit(txObj2);

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));

    await distribution.withdraw(commitWindow, { from: buyer });
    await distribution.withdraw(commitWindow, { from: buyer2 });

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows).dividedToIntegerBy(2);

    let reward = await token.balanceOf(buyer);
    reward.should.be.bignumber.equal(expectedReward);

    reward = await token.balanceOf(buyer2);
    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should withdraw() succesfully with two buyers and different commitments', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const txObj = {
      from: buyer,
      value: web3.toWei(new BigNumber(0.1), 'ether'),
    };
    const txObj2 = {
      from: buyer2,
      value: web3.toWei(new BigNumber(0.2), 'ether'),
    };

    await distribution.commit(txObj);
    await distribution.commit(txObj2);

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));

    await distribution.withdraw(commitWindow, { from: buyer });
    await distribution.withdraw(commitWindow, { from: buyer2 });

    let expectedReward1 = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows).mul(1).dividedToIntegerBy(3);
    let expectedReward2 = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows).mul(2).dividedToIntegerBy(3);

    let reward = await token.balanceOf(buyer);
    reward.should.be.bignumber.equal(expectedReward1);

    reward = await token.balanceOf(buyer2);
    reward.should.be.bignumber.equal(expectedReward2);
  });

  it('should emit event for succesfull withdraw()', async function () {
    const commitWindow = 2;
    const withdrawWindow = 3;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows);

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };
    await distribution.commit(txObj);
    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));
    const tx = await distribution.withdraw(commitWindow, { from: buyer });

    const event = tx.logs.find(e => e.event === 'Withdraw');
    assert.exists(event);

    const { from, value, window } = event.args;

    assert.equal(from, buyer);
    value.should.be.bignumber.equal(expectedReward);
    window.should.be.bignumber.equal(commitWindow);
  });

  it('should succesfully withdrawAll()', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;
    const withdrawWindow = 7;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows);
    let expectedReward2 = web3.toWei(new BigNumber(secondPeriodSupply), 'ether').dividedToIntegerBy(secondPeriodWindows);

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));
    await distribution.withdrawAll({ from: buyer });

    let reward = await token.balanceOf(buyer);

    reward.should.be.bignumber.equal(expectedReward.plus(expectedReward2));
  });

  it('should succesfully return an array for getAllRewards()', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;
    const withdrawWindow = 7;
    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    let expectedReward = web3.toWei(new BigNumber(firstPeriodSupply), 'ether').dividedToIntegerBy(firstPeriodWindows);
    let expectedReward2 = web3.toWei(new BigNumber(secondPeriodSupply), 'ether').dividedToIntegerBy(secondPeriodWindows);

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, withdrawWindow));
    const rewards = await distribution.getAllRewards({ from: buyer });

    rewards[commitWindow].should.be.bignumber.equal(expectedReward);
    rewards[commitWindow2].should.be.bignumber.equal(expectedReward2);
  });

  it('should moveFunds() successfully ', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    const ethBalanceBefore = web3.eth.getBalance(initialAccount);
    await distribution.moveFunds({ from: contractCreator });
    const ethBalanceAfter = web3.eth.getBalance(initialAccount);

    const movedFunds = ethBalanceAfter.minus(ethBalanceBefore);
    movedFunds.should.be.bignumber.equal(web3.toWei(new BigNumber(0.2), 'ether'));
  });

  it('should call moveFunds() successfully', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    const funds = await distribution.moveFunds.call({ from: contractCreator });

    funds.should.be.bignumber.equal(web3.toWei(new BigNumber(0.2), 'ether'));
  });

  it('should prevent moveFunds() from non owner ', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    await assertRevert(distribution.moveFunds({ from: buyer2 }));
  });

  it('should emit event on moveFunds()', async function () {
    const commitWindow = 2;
    const commitWindow2 = 6;

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow));

    const ethValue = web3.toWei(new BigNumber(0.1), 'ether');
    const txObj = {
      from: buyer,
      value: ethValue,
    };

    await distribution.commit(txObj);

    await increaseTimeTo(windowTimeStamp(startTime, commitWindow2));
    await distribution.commit(txObj);

    const tx = await distribution.moveFunds({ from: contractCreator });

    const event = tx.logs.find(e => e.event === 'MoveFunds');
    assert.exists(event);

    const { value } = event.args;

    value.should.be.bignumber.equal(web3.toWei(new BigNumber(0.2), 'ether'));
  });
});
