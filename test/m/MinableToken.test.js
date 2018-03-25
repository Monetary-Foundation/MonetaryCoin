
// import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;
const assert = require('chai').assert;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableTokenMock = artifacts.require('MinableTokenMock');

const intAvg = (a, b) => new BigNumber(a + b).dividedToIntegerBy(2);

const adress0 = '0x0000000000000000000000000000000000000000';

contract('MinableToken', function (accounts) {
  let token;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 500;
  const blockReward = 5;
  beforeEach(async function () {
    token = await MinableTokenMock.new(initialAccount, initialSupply, blockReward);
  });

  it('should return 0 for totalStake after construction', async function () {
    let totalStake = await token.totalStake();

    assert.equal(totalStake, 0);
  });

  it('should return correct block reward after construction', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 5;
    const blockReward = 5;
    token = await MinableTokenMock.new(initialAccount, initialSupply, blockReward);
    let tokenBlockReward = await token.blockReward();

    assert.equal(tokenBlockReward, blockReward);
  });

  it('should throw if initialSupply = 0', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 0;
    const blockReward = 5;
    await expectThrow(MinableTokenMock.new(initialAccount, initialSupply, blockReward));
  });

  it('should throw if blockReward = 0', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 30;
    const blockReward = 0;
    await expectThrow(MinableTokenMock.new(initialAccount, initialSupply, blockReward));
  });

  it('should increase stake after successfull commit', async function () {
    await token.commit(4);
    let totalStake = await token.totalStake();

    assert.equal(totalStake, 4);
  });

  it('should throw if trying to commit more then balance', async function () {
    await expectThrow(token.commit(initialSupply + 5));
  });

  it('should return correct balance after commit', async function () {
    const commitValue = 3;
    await token.commit(commitValue);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, initialSupply - commitValue);
  });

  it('should return correct commitment for given address', async function () {
    await token.commit(4);
    let amount = await token.commitmentOf(accounts[0]);
    assert.equal(amount, 4);
  });

  it('should return correct commitment for new address', async function () {
    let amount = await token.commitmentOf(accounts[0]);
    assert.equal(amount, 0);
  });

  it('should emit the Commit event', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    const tx = await token.commit(commitValue);
    
    const event = tx.logs.find(e => e.event === 'Commit');
    assert.exists(event);

    const { from, value, onBlockNumber, atStake, onBlockReward } = event.args;
    
    assert.equal(from, accounts[0]);
    value.should.be.bignumber.equal(commitValue);
    assert.equal(onBlockNumber.toNumber(), web3.eth.blockNumber);
    atStake.should.be.bignumber.equal(commitValue);
    onBlockReward.should.be.bignumber.equal(blockReward);
  });

  it('should throw if trying to commit twice without withdraw', async function () {
    await token.commit(4);
    await expectThrow(token.commit(4));
  });

  it('should return the correct average', async function () {
    let avg = await token.average(2, 4);
    assert.equal(avg, 3);
  });
  it('should return the correct average (round down)', async function () {
    let avg = await token.average(2, 1);
    assert.equal(avg, 1);
  });

  it('should return the correct signed average', async function () {
    let avg = await token.signedAverage(2, 4);
    assert.equal(avg, 3);
  });

  it('should return the correct signed average (round down)', async function () {
    let avg = await token.signedAverage(2, 1);
    assert.equal(avg, 1);
  });

  it('should return the correct signed average', async function () {
    let avg = await token.signedAverage(-2, 4);
    assert.equal(avg, 1);
  });

  it('should return the correct signed average', async function () {
    let avg = await token.signedAverage(-2, 5);
    assert.equal(avg, 1);
  });

  it('should return the correct signed average', async function () {
    let avg = await token.signedAverage(-2, -4);
    assert.equal(avg, -3);
  });

  it('should return the correct signed average (round toward zero)', async function () {
    let avg = await token.signedAverage(-3, -4);
    assert.equal(avg, -3);
  });

  // // OVERVIEW:
  // it('should throw on possitive overflow ', async function () {
  //   const big = new BigNumber(2).pow(256).minus(1);
  //   // let ans = await token.signedAverage(big, big);
  //   // console.log(ans.toString());
  //   await expectThrow(token.signedAverage(big, big));
  // });

  it('should return the correct reward if nothing was commited', async function () {
    let zeroReward = await token.getReward(accounts[0]);
    assert.equal(zeroReward, 0);
  });

  it('should emit transfer event on commit', async function () {
    const commitValue = 4;

    const tx = await token.commit(commitValue);

    const event = tx.logs.find(e => e.event === 'Transfer');
    assert.exists(event);

    const { from, to, value } = event.args;
    
    assert.equal(from, accounts[0]);
    assert.equal(to, adress0);
    value.should.be.bignumber.equal(commitValue);
  });

  it('should calculate the reward correctly after one block', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // after one block
    let reward = await token.getReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 1 * 5) / 4 = 5; (if only one miner - he gets the entire block reward)
    let expectedReward = new BigNumber(commitValue * 1 * blockReward).dividedToIntegerBy(commitValue);

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly after 3 blocks', async function () {
    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await advanceToBlock(web3.eth.blockNumber + 3);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 3 * 5 / 4) = 15
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * blockReward).dividedToIntegerBy(commitValue);

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly and return zero', async function () {
    // unlock accounts[0] and accounts[1]: ganache-cli -u0 -u1 -u2
    await token.transfer(accounts[1], 200);

    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue, { from: accounts[0] });

    await token.commit(200, { from: accounts[1] });

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 2 * 5) / avg(4,200) = 40 / 98
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * blockReward).dividedToIntegerBy(intAvg(commitValue, 200));

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly after stake increase', async function () {
    // unlock accounts[0] and accounts[1]: ganache-cli -u0 -u1 -u2
    await token.transfer(accounts[1], 4);

    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue, { from: accounts[0] });

    await token.commit(commitValue, { from: accounts[1] });

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 2 * 5) / avg(4,8) = 40 / 6
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * blockReward).dividedToIntegerBy(intAvg(commitValue, 2 * commitValue));

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly after two stake increases (odd finalStake)', async function () {
    // unlock accounts[0], accounts[1], accounts[2]
    await token.transfer(accounts[1], 4);
    await token.transfer(accounts[2], 4);
    let finalStake = 0;

    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue, { from: accounts[0] });
    finalStake += commitValue;
    await token.commit(commitValue, { from: accounts[1] });
    finalStake += commitValue;
    await token.commit(3, { from: accounts[2] });
    finalStake += 3;

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * blockReward).dividedToIntegerBy(intAvg(commitValue, finalStake));

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly after stake increase (even stake)', async function () {
    // unlock accounts[0], accounts[1], accounts[2]
    let finalStake = 0;

    const commitValueAcc0 = 4;
    const commitValueAcc1 = 3;
    const commitValueAcc2 = 5;

    await token.transfer(accounts[1], commitValueAcc1);
    await token.transfer(accounts[2], commitValueAcc2);

    const commitBlockNumber = web3.eth.blockNumber;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValueAcc0, { from: accounts[0] });
    finalStake += commitValueAcc0;
    await token.commit(commitValueAcc1, { from: accounts[1] });
    finalStake += commitValueAcc1;
    await token.commit(commitValueAcc2, { from: accounts[2] });
    finalStake += commitValueAcc2;

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;

    let rewardAcc0 = await token.getReward(accounts[0]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 3 * 4) / avg(4,12) = 60/8 = 7
    let expectedRewardAcc0 =
      new BigNumber(commitValueAcc0 * numOfBlocks * blockReward).dividedToIntegerBy(intAvg(commitValueAcc0, finalStake));
    rewardAcc0.should.be.bignumber.equal(expectedRewardAcc0);

    let rewardAcc1 = await token.getReward(accounts[1]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 2 * 3) / avg(7,12) = 30/9 = 3
    let expectedRewardAcc1 =
      new BigNumber(commitValueAcc1 * (numOfBlocks - 1) * blockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0 + commitValueAcc1, finalStake));
    rewardAcc1.should.be.bignumber.equal(expectedRewardAcc1);

    let rewardAcc2 = await token.getReward(accounts[2]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 1 * 5) / avg(12,12) = 25/12 = 2
    let expectedRewardAcc2 =
      new BigNumber(commitValueAcc2 * (numOfBlocks - 2) * blockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0 + commitValueAcc1 + commitValueAcc2, finalStake));
    rewardAcc2.should.be.bignumber.equal(expectedRewardAcc2);
  });

  it('should calculate the reward correctly after two stake increases and 4 more blocks (stake even)', async function () {
    // unlock accounts[0], accounts[1], accounts[2]
    let finalStake = 0;

    const commitValueAcc0 = 4;
    const commitValueAcc1 = 3;
    const commitValueAcc2 = 5;

    await token.transfer(accounts[1], commitValueAcc1);
    await token.transfer(accounts[2], commitValueAcc2);

    const commitBlockNumber = web3.eth.blockNumber;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValueAcc0, { from: accounts[0] });
    finalStake += commitValueAcc0;
    await token.commit(commitValueAcc1, { from: accounts[1] });
    finalStake += commitValueAcc1;
    await token.commit(commitValueAcc2, { from: accounts[2] });
    finalStake += commitValueAcc2;

    await advanceToBlock(web3.eth.blockNumber + 4);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;

    let rewardAcc0 = await token.getReward(accounts[0]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 7 * 4) / avg(4,12) = 60/8 = 17
    let expectedRewardAcc0 =
      new BigNumber(commitValueAcc0 * numOfBlocks * blockReward).dividedToIntegerBy(intAvg(commitValueAcc0, finalStake));
    rewardAcc0.should.be.bignumber.equal(expectedRewardAcc0);

    let rewardAcc1 = await token.getReward(accounts[1]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 6 * 3) / avg(7,12) = 90/9 = 10
    let expectedRewardAcc1 =
      new BigNumber(commitValueAcc1 * (numOfBlocks - 1) * blockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0 + commitValueAcc1, finalStake));
    rewardAcc1.should.be.bignumber.equal(expectedRewardAcc1);

    let rewardAcc2 = await token.getReward(accounts[2]);
    // (BlockReward * #blocks * commitValue) / avgStake [integer division]
    // (5 * 5 * 5) / avg(12,12) = 125/12 = 10
    let expectedRewardAcc2 =
      new BigNumber(commitValueAcc2 * (numOfBlocks - 2) * blockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0 + commitValueAcc1 + commitValueAcc2, finalStake));
    rewardAcc2.should.be.bignumber.equal(expectedRewardAcc2);
  });

  it('should emit transfer event on withdraw', async function () {
    const commitValue = 4;
    
    await token.commit(commitValue);
    // after one block
    const tx = await token.withdraw();

    const event = tx.logs.find(e => e.event === 'Transfer');
    assert.exists(event);

    const { from, to, value } = event.args;
   
    let expectedReward = new BigNumber(commitValue * 1 * blockReward).dividedToIntegerBy(commitValue);

    assert.equal(from, adress0);
    assert.equal(to, accounts[0]);
    value.should.be.bignumber.equal(expectedReward.plus(commitValue));
  });

  it('should emit withdraw event', async function () {
    const commitValue = 4;
    
    await token.commit(commitValue);
    // after one block
    const tx = await token.withdraw();
    // console.log(txObj.logs[0]);
    const event = tx.logs.find(e => e.event === 'Withdraw');
    assert.exists(event);
    const { from, reward, commitment, onBlockNumber } = event.args;

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 1 * 5) / 4 = 5;
    let expectedReward = new BigNumber(commitValue * 1 * blockReward).dividedToIntegerBy(commitValue);

    assert.equal(from, accounts[0]);
    assert.equal(commitment, commitValue);
    reward.should.be.bignumber.equal(expectedReward);
    assert.equal(onBlockNumber.toNumber(), web3.eth.blockNumber);
  });

  it('should throw if nothing to withdraw', async function () {
    await expectThrow(token.withdraw());
  });

  it('should throw if trying to withdraw twice after commit', async function () {
    const commitValue = 4;
    await token.commit(commitValue);

    await token.withdraw();
    await expectThrow(token.withdraw());
  });

  it('should withdraw the correct amount', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // after one block
    // let reward = await token.withdraw.call();
    await token.withdraw();
    let newBalance = await token.balanceOf(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 1 * 5) / 4 = 5;
    let expectedReward = new BigNumber(commitValue * 1 * blockReward).dividedToIntegerBy(commitValue);
    let expectedBalance = expectedReward.plus(commitValue).plus(initialSupply - commitValue);

    newBalance.should.be.bignumber.equal(expectedBalance);
  });

  it('should withdraw the correct amount (transfer after commit)', async function () {
    const commitValue = 4;
    const transferValue = 7;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    await token.transfer(accounts[1], transferValue);
    // after two blocks
    await token.withdraw();
    let newBalance = await token.balanceOf(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 2 * 5) / 4 = 20;
    let expectedReward = new BigNumber(commitValue * 2 * blockReward).dividedToIntegerBy(commitValue);
    let expectedBalance = expectedReward.plus(commitValue).plus(initialSupply - commitValue).minus(transferValue);

    newBalance.should.be.bignumber.equal(expectedBalance);
  });

  it('should return reward and commitment when calling withdraw()', async function () {
    const commitValue = 4;
    const transferValue = 7;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    await token.transfer(accounts[1], transferValue);
    // after two blocks
    let ansList = await token.withdraw.call();
    let reward = ansList[0];
    let commitment = ansList[1];

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 2 * 5) / 4 = 20;
    let expectedReward = new BigNumber(commitValue * 2 * blockReward).dividedToIntegerBy(commitValue);

    reward.should.be.bignumber.equal(expectedReward);
    commitment.should.be.bignumber.equal(commitValue);
  });

  it('should decrease stake after withdraw', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    let totalStake = await token.totalStake();
    assert.equal(totalStake, 0);
    totalStake.should.be.bignumber.equal(0);

    await token.commit(commitValue);
    totalStake = await token.totalStake();
    assert.equal(totalStake, 4);
    totalStake.should.be.bignumber.equal(4);

    await token.withdraw();
    totalStake = await token.totalStake();
    assert.equal(totalStake, 0);
  });

  it('should decrease stake after withdraw (with other commiters)', async function () {
    const commitValue = 4;
    await token.transfer(accounts[1], 4);
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    let totalStake = await token.totalStake();
    assert.equal(totalStake, 0);
    totalStake.should.be.bignumber.equal(0);

    await token.commit(commitValue);
    totalStake = await token.totalStake();
    assert.equal(totalStake, 4);
    totalStake.should.be.bignumber.equal(4);

    await token.commit(commitValue, { from: accounts[1] });

    await token.withdraw();
    totalStake = await token.totalStake();
    assert.equal(totalStake, 4);
  });

  it('should increase supply after withdraw', async function () {
    const commitValue = 4;
    await token.transfer(accounts[1], 4);
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await token.commit(commitValue, { from: accounts[1] });

    let reward = await token.getReward(accounts[0]);

    let supply = await token.totalSupply();

    let expectedSupplyIncrease = reward;

    await token.withdraw();

    let newSupply = await token.totalSupply();

    newSupply.should.be.bignumber.equal(supply.plus(expectedSupplyIncrease));
  });

  it('should increase supply after two withdraws', async function () {
    const commitValue = 4;
    await token.transfer(accounts[1], 4);
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await token.commit(commitValue, { from: accounts[1] });

    await token.withdraw({ from: accounts[0] });

    let reward0 = await token.getReward(accounts[0]);
    reward0.should.be.bignumber.equal(0);

    let reward = await token.getReward(accounts[1]);

    let supply = await token.totalSupply();

    let expectedSupplyIncrease = reward;

    await token.withdraw({ from: accounts[1] });

    let newSupply = await token.totalSupply();

    newSupply.should.be.bignumber.equal(supply.plus(expectedSupplyIncrease));
  });

  it('should return 0 for reward after withdraw', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await token.withdraw();

    let reward = await token.getReward(accounts[0]);
    reward.should.be.bignumber.equal(0);
  });

  it('should return 0 for commitment after withdraw() (set commitment value to zero)', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await token.withdraw();

    let commitment = await token.commitmentOf(accounts[0]);
    commitment.should.be.bignumber.equal(0);
  });
});
