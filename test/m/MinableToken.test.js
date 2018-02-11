
// import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableTokenMock = artifacts.require('MinableTokenMock');

const intAvg = (a, b) => new BigNumber(a + b).dividedToIntegerBy(2);

contract('MinableToken', function (accounts) {
  let token;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await MinableTokenMock.new(initialAccount, initialSupply, setBlockReward);
  });

  it('should return 0 for totalStake after construction', async function () {
    let totalStake = await token.totalStake();

    assert.equal(totalStake, 0);
  });
  
  it('should return correct block reward after construction', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 5;
    const setBlockReward = 5;
    token = await MinableTokenMock.new(initialAccount, initialSupply, setBlockReward);
    let blockReward = await token.blockReward();

    assert.equal(blockReward, setBlockReward);
  });

  it('should throw if initialSupply = 0', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 0;
    const setBlockReward = 5;
    await expectThrow(MinableTokenMock.new(initialAccount, initialSupply, setBlockReward));
  });

  it('should throw if blockReward = 0', async function () {
    const initialAccount = accounts[0];
    const initialSupply = 30;
    const setBlockReward = 0;
    await expectThrow(MinableTokenMock.new(initialAccount, initialSupply, setBlockReward));
  });

  it('should increase stake after successfull commit', async function () {
    await token.commit(4);
    let totalStake = await token.totalStake();

    assert.equal(totalStake, 4);
  });

  it('should throw if trying to commit more then balance', async function () {
    await expectThrow(token.commit(60));
  });

  it('should return correct balance after commit', async function () {
    await token.commit(4);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 46);
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

  it('should return the correct reward if nothing was commited', async function () {
    let zeroReward = await token.getCurrentReward(accounts[0]);
    assert.equal(zeroReward, 0);
  });

  it('should calculate the reward correctly after one block', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // after one block
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 1 * 5) / 2 = 10;
    let expectedReward = new BigNumber(commitValue * 1 * setBlockReward).dividedToIntegerBy(2);

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
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * setBlockReward).dividedToIntegerBy(2);

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly when avg stake increaes', async function () {
    // unlock accounts[0] and accounts[1]: ganache-cli -u0 -u1 -u2
    await token.transfer(accounts[1], 4);

    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue, { from: accounts[0] });

    await token.commit(commitValue, { from: accounts[1] });
    // await advanceToBlock(commitBlockNumber + 6);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * setBlockReward).dividedToIntegerBy((0 + 8) / 2);

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly when 2 stake increaes (finalStake odd)', async function () {
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
    // await advanceToBlock(web3.eth.blockNumber + 6);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * setBlockReward).dividedToIntegerBy(intAvg(0, finalStake));

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly when 2 stake increaes and 4 more blocks (stake even)', async function () {
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

    let rewardAcc0 = await token.getCurrentReward(accounts[0]);
    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    let expectedRewardAcc0 =
      new BigNumber(commitValueAcc0 * numOfBlocks * setBlockReward).dividedToIntegerBy(intAvg(0, finalStake));
    rewardAcc0.should.be.bignumber.equal(expectedRewardAcc0);

    let rewardAcc1 = await token.getCurrentReward(accounts[1]);
    let expectedRewardAcc1 =
      new BigNumber(commitValueAcc1 * (numOfBlocks - 1) * setBlockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0, finalStake));
    rewardAcc1.should.be.bignumber.equal(expectedRewardAcc1);

    let rewardAcc2 = await token.getCurrentReward(accounts[2]);
    let expectedRewardAcc2 =
      new BigNumber(commitValueAcc2 * (numOfBlocks - 2) * setBlockReward)
        .dividedToIntegerBy(intAvg(commitValueAcc0 + commitValueAcc1, finalStake));
    rewardAcc2.should.be.bignumber.equal(expectedRewardAcc2);
  });
  

  it('should emit the correct event during withdraw', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // after one block
    const txObj = await token.withdraw();
    // console.log(txObj.logs[0]);
    const { from, reward, onBlockNumber } = txObj.logs[0].args;

    assert.equal(txObj.logs[0].event, 'Withdraw');

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 1 * 5) / 2 = 10;
    let expectedReward = new BigNumber(commitValue * 1 * setBlockReward).dividedToIntegerBy(2);

    assert.equal(from, accounts[0]);
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
    // (4 * 1 * 5) / 2 = 10;
    let expectedReward = new BigNumber(commitValue * 1 * setBlockReward).dividedToIntegerBy(2);
    let expectedBalance = expectedReward.plus(initialSupply - commitValue);

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
    // (4 * 2 * 5) / 2 = 20;
    let expectedReward = new BigNumber(commitValue * 2 * setBlockReward).dividedToIntegerBy(2);
    let expectedBalance = expectedReward.plus(initialSupply - commitValue).minus(transferValue);

    newBalance.should.be.bignumber.equal(expectedBalance);
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

    let reward = await token.getCurrentReward(accounts[0]);

    let supply = await token.totalSupply();

    let expectedSupplyIncrease = reward.minus(commitValue);

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

    let reward0 = await token.getCurrentReward(accounts[0]);
    reward0.should.be.bignumber.equal(0);

    let reward = await token.getCurrentReward(accounts[1]);

    let supply = await token.totalSupply();

    let expectedSupplyIncrease = reward.minus(commitValue);

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

    let reward = await token.getCurrentReward(accounts[0]);
    reward.should.be.bignumber.equal(0);
  });

  it('should return 0 for commitment after withdraw (set commitment value to zero)', async function () {
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
