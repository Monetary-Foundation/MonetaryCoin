
// import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableTokenMock = artifacts.require('MinableTokenMock');

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

  it('should throw if tying to commit twice without withdraw', async function () {
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

  it('should calculate the reward correctly after two blocks', async function () {
    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await advanceToBlock(commitBlockNumber + 1);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 2 * 5) / 2 = 20;
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * setBlockReward).dividedToIntegerBy(2);

    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should calculate the reward correctly after 6 blocks', async function () {
    const commitBlockNumber = web3.eth.blockNumber;
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);

    await advanceToBlock(commitBlockNumber + 6);

    const numOfBlocks = web3.eth.blockNumber - commitBlockNumber;
    let reward = await token.getCurrentReward(accounts[0]);

    // (commitValue * #blocks * BlockReward) / avgStake [integer division]
    // (4 * 11 * 5) / 2
    let expectedReward =
      new BigNumber(commitValue * numOfBlocks * setBlockReward).dividedToIntegerBy(2);

    reward.should.be.bignumber.equal(expectedReward);
  });

});
