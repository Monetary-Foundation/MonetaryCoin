
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
  // uint256 totalSupply,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialBalance = 50;
  const totalSupply = 1000;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await MinableTokenMock.new(initialAccount, initialBalance, totalSupply, setBlockReward);
  });

  it('should return 0 for totalStake after construction', async function () {
    let totalStake = await token.totalStake();

    assert.equal(totalStake, 0);
  });

  it('should return correct block reward after construction', async function () {
    const initialAccount = accounts[0];
    const initialBalance = 5;
    const totalSupply = 1000;
    const setBlockReward = 5;
    token = await MinableTokenMock.new(initialAccount, initialBalance, totalSupply, setBlockReward);
    let blockReward = await token.blockReward();

    assert.equal(blockReward, setBlockReward);
  });

  it('should throw if initialBalance > totalSupply', async function () {
    const initialAccount = accounts[0];
    const initialBalance = 5000;
    const totalSupply = 1000;
    const setBlockReward = 5;
    await expectThrow(MinableTokenMock.new(initialAccount, initialBalance, totalSupply, setBlockReward));
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

  it('should throw if nothing to withdraw', async function () {
    await expectThrow(token.withdraw());
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
});
