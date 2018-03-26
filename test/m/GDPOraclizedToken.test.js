
import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var GDPOraclizedToken = artifacts.require('GDPOraclizedTokenMock');

contract('GDPOraclizedToken', function (accounts) {
  let token;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await GDPOraclizedToken.new(initialAccount, initialSupply, setBlockReward, initialAccount);
  });

  it('should return the correct oracle address after init', async function () {
    let oracleAddress = await token.GDPOracle();

    // console.log(oracleAddress);
    assert.equal(oracleAddress, accounts[0]);
  });
  it('should transfer the oracle correctly', async function () {
    await token.transferGDPOracle(accounts[1]);
    let oracleAddress = await token.GDPOracle();

    assert.equal(oracleAddress, accounts[1]);
  });
  it('should emit event while transferring the oracle', async function () {
    const txObj = await token.transferGDPOracle(accounts[1]);

    const { previousOracle, newOracle } = txObj.logs[0].args;

    assert.equal(txObj.logs[0].event, 'GDPOracleTransferred');
    assert.equal(previousOracle, accounts[0]);
    assert.equal(newOracle, accounts[1]);
  });

  it('should fail to transfer the oracle from unothorized address', async function () {
    token = await GDPOraclizedToken.new(initialAccount, initialSupply, setBlockReward, accounts[1]);
    await expectThrow(token.transferGDPOracle(accounts[2]));
  });

  it('should fail to transfer the oracle to 0x0 address', async function () {
    await expectThrow(token.transferGDPOracle(0));
  });

  it('should prevent old oracle to do actions after transffer', async function () {
    // token = await GDPOraclizedToken.new(initialAccount, initialSupply, setBlockReward, accounts[1]);
    await token.transferGDPOracle(accounts[2]);
    await expectThrow(token.transferGDPOracle(accounts[3]));
    await expectThrow(token.setPossitiveGrowth(5));
  });

  it('should correctly setPossitiveGrowth', async function () {
    await token.setPossitiveGrowth(50);
    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(50);
  });

  it('should emit event for setPossitiveGrowth', async function () {
    // BlockRewardChanged(int oldBlockReward, int newBlockReward, uint indexed blockNumber);
    const txObj = await token.setPossitiveGrowth(50);

    assert.equal(txObj.logs[0].event, 'BlockRewardChanged');
    const { oldBlockReward, newBlockReward, blockNumber } = txObj.logs[0].args;
    assert.equal(oldBlockReward, 5);
    assert.equal(newBlockReward, 50);
    assert.equal(blockNumber, web3.eth.blockNumber);
  });

  it('should prevent from non oracle to setPossitiveGrowth', async function () {
    await assertRevert(token.setPossitiveGrowth(50, { from: accounts[1] }));
  });

  it('should prevent setting negative value for setPossitiveGrowth', async function () {
    await assertRevert(token.setPossitiveGrowth(-50));
  });

  it('should correctly setPossitiveGrowth after transfering oracle address', async function () {
    await token.transferGDPOracle(accounts[1]);
    await token.setPossitiveGrowth(51, { from: accounts[1] });

    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(51);
  });

  it('should prevent original oracle to do actions after transffer', async function () {
    await token.transferGDPOracle(accounts[1]);
    await token.setPossitiveGrowth(50, { from: accounts[1] });
    await expectThrow(token.setPossitiveGrowth(50, { from: accounts[0] }));
  });

  it('should correctly setNegativeGrowth', async function () {
    await token.setNegativeGrowth(-60);
    let newReward = await token.blockReward();

    newReward.should.be.bignumber.equal(-60);
  });

  it('should emit event for setNegativeGrowth', async function () {
    // BlockRewardChanged(int oldBlockReward, int newBlockReward, uint indexed blockNumber);
    const txObj = await token.setNegativeGrowth(-60);

    assert.equal(txObj.logs[0].event, 'BlockRewardChanged');
    const { oldBlockReward, newBlockReward, blockNumber } = txObj.logs[0].args;
    assert.equal(oldBlockReward, 5);
    assert.equal(newBlockReward, -60);
    assert.equal(blockNumber, web3.eth.blockNumber);
  });

  it('should prevent from non oracle to setNegativeGrowth', async function () {
    await expectThrow(token.setNegativeGrowth(50, { from: accounts[1] }));
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
    await token.commit(5);
    await expectThrow(token.withdraw());
  });

  it('should getReward() correctly after changing block reward', async function () {
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // next block:
    await token.setPossitiveGrowth(11);

    let reward = await token.getReward(accounts[0]);
    // effectiveBlockReward (5+11) / 2 = 8
    // (commitValue * #blocks * effectiveBlockReward) / effectiveStake [integer division]
    // (4 * 2 * 8) / 4 = 32;
    let expectedReward = new BigNumber(commitValue * 2 * 8).dividedToIntegerBy(commitValue);
    reward.should.be.bignumber.equal(expectedReward);
  });

  it('should withdraw() correctly after changing block reward', async function () {
    const commitValue = 4;

    await token.commit(commitValue);
    // next block:
    await token.setPossitiveGrowth(11);

    // effectiveBlockReward = (5+11) / 2 = 8
    // (commitValue * #blocks * effectiveBlockReward) / effectiveStake [integer division]
    // (4 * 2 * 8) / 4 = 16;
    await token.withdraw();
    let newBalance = await token.balanceOf(accounts[0]);

    let expectedReward = new BigNumber(commitValue * 2 * 8).dividedToIntegerBy(commitValue);
    let expectedBalance = expectedReward.plus(initialSupply);

    newBalance.should.be.bignumber.equal(expectedBalance);
  });

  it('should fail to return negative reward', async function () {
    const commitValue = 4;
    await token.commit(commitValue);
    await token.setNegativeGrowth(-20);
    await assertRevert(token.getReward(accounts[0]));
  });

  it('should fail to withdraw negative reward', async function () {
    const commitValue = 4;
    await token.commit(commitValue);
    await token.setNegativeGrowth(-20);
    await assertRevert(token.withdraw());
  });

  // it('should return correct reward after changing block reward and stake', async function () {
  
  // });
});
