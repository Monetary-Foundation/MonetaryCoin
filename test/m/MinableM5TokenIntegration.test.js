
import assertRevert from '../helpers/assertRevert';
// import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;
const assert = require('chai').assert;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableM5GDPOraclizedTokenMock = artifacts.require('MinableM5TokenIntegrationMock');
var M5TokenMock = artifacts.require('M5TokenMock');
var M5LogicMock3 = artifacts.require('M5LogicMock3');

contract('MinableM5TokenIntegrationMock', function (accounts) {
  let token;
  let M5Token;
  let M5Logic;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await MinableM5GDPOraclizedTokenMock.new(initialAccount, initialSupply, setBlockReward, accounts[0]);
    M5Token = await M5TokenMock.new();
    M5Logic = await M5LogicMock3.new();

    // upgrade token to new logic
    await token.upgradeM5Logic(M5Logic.address);
    await token.upgradeM5Token(M5Token.address);

    // transfer ownership of M5token to token:
    await M5Token.transferOwnership(token.address);
  });

  // ---------------------------------- full upgrade example with M5 token and swap -----------------
  // it('should return the correct reward if nothing was commited', async function () {
  //   let zeroReward = await token.getM5Reward(accounts[0]);
  //   assert.equal(zeroReward, 0);
  // });

  // it('should return correct M5 reward when growth is negative', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;

  //   await token.commit(commitValue);
  //   // after one block
  //   let M5Reward = await token.getM5Reward(accounts[0]);

  //   // ((commitValue * #blocks * BlockReward) / avgStake [integer division] )
  //   // [(4 * 1 * abs(-10)) / 4] = 10;
  //   let expectedReward = new BigNumber(commitValue * 1 * Math.abs(negativeBlockReward))
  //     .dividedToIntegerBy(commitValue);

  //   M5Reward.should.be.bignumber.equal(expectedReward);
  // });

  // it('should mint M5 token when GDP is negative and changes to negative', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;

  //   await token.commit(commitValue);
  //   const negativeBlockReward2 = -20;
  //   await token.setNegativeGrowth(negativeBlockReward2);
  //   // after two block
  //   let M5Reward = await token.getM5Reward(accounts[0]);

  //   // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
  //   // [(4 * 2 * abs(-15)) / 4] = 30;
  //   let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-15))
  //     .dividedToIntegerBy(commitValue);

  //   M5Reward.should.be.bignumber.equal(expectedReward);
  // });

  // it('should mint M5 token when GDP is negative and changes to positive (effective block reward is negative)', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;

  //   await token.commit(commitValue);
  //   await token.setPossitiveGrowth(6);
  //   // after two block
  //   let M5Reward = await token.getM5Reward(accounts[0]);

  //   // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
  //   // [(4 * 2 * abs(-2)) / 4] = 4;
  //   let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-2))
  //     .dividedToIntegerBy(commitValue);

  //   M5Reward.should.be.bignumber.equal(expectedReward);
  // });

  // it('should fail on getM5reward on positive effective block reward', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;
  //   await token.commit(commitValue);
  //   await token.setPossitiveGrowth(1000);

  //   await assertRevert(token.getM5Reward(accounts[0]));
  // });

  // it('should fail to withdrawM5() if effective reward is possitive', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;
  //   await token.commit(commitValue);
  //   await token.setPossitiveGrowth(1000);

  //   await assertRevert(token.withdrawM5());
  // });

  // it('should get commitment back after withdrawM5() on negative GDP', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 5;
  //   await token.commit(commitValue);
    
  //   let postCommitBalance = await token.balanceOf(accounts[0]);
  //   await token.withdrawM5();
  //   let postWithdrawM5Balance = await token.balanceOf(accounts[0]);

  //   postWithdrawM5Balance.should.be.bignumber.equal(postCommitBalance.plus(commitValue));
  // });

  // it('should successfully mint correct amount of M5 token when GDP is negative', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;
  //   await token.commit(commitValue);
  //   await token.withdrawM5();
    
  //   // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
  //   // [(4 * 1 * abs(-10)) / 4] = 10;
  //   let expectedReward = new BigNumber(commitValue * 1 * Math.abs(-10))
  //     .dividedToIntegerBy(commitValue);

  //   let M5Balance = await M5Token.balanceOf(accounts[0]);

  //   M5Balance.should.be.bignumber.equal(expectedReward);
  // });

  // it('should mint M5 token when GDP is negative and changes', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;
  //   await token.commit(commitValue);
  //   const negativeBlockReward2 = -20;
  //   await token.setNegativeGrowth(negativeBlockReward2);
    
  //   await token.withdrawM5();
    
  //   // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
  //   // [(4 * 2 * abs(-15)) / 4] = 30;
  //   let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-15))
  //     .dividedToIntegerBy(commitValue);

  //   let M5Balance = await M5Token.balanceOf(accounts[0]);

  //   M5Balance.should.be.bignumber.equal(expectedReward);
  // });

  // it('should successfully increase supply of M5 token when GDP is negative', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 4;
  //   await token.commit(commitValue);
  //   await token.withdrawM5();
    
  //   // ((commitValue * #2 * BlockReward) / avgStake [integer division] )
  //   // [(4 * 1 * abs(-10)) / 4] = 10;
  //   let expectedReward = new BigNumber(commitValue * 1 * Math.abs(-10))
  //     .dividedToIntegerBy(commitValue);

  //   let totalSupply = await M5Token.totalSupply();

  //   totalSupply.should.be.bignumber.equal(expectedReward);
  // });

  // it('should emit event on withdrawM5()', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 5;
  //   await token.commit(commitValue);
    
  //   let txObj = await token.withdrawM5();
    
  //   // assert.equal(txObj.logs[0].event, 'WithdrawM5');

  //   const event = txObj.logs.find(e => e.event === 'WithdrawM5');
  //   assert.exists(event);
    
  //   const { from, commitment, M5Reward } = event.args;
    
  //   assert.equal(from, accounts[0]);
  //   assert.equal(commitment, commitValue);
  //   assert.equal(M5Reward, 10);
  // });

  // it('should fail to swap if GDP is still negative', async function () {
  //   const negativeBlockReward = -10;
  //   await token.setNegativeGrowth(negativeBlockReward);
  //   const commitValue = 5;
  //   await token.commit(commitValue);
    
  //   await token.withdrawM5();
  //   // We have M5 tokens now

  //   // GDP still negative:
  //   await assertRevert(token.swap(4));
  // });

  // it('should revert swap if M5 token balance is too low', async function () {
  //   await token.setNegativeGrowth(-10);
  //   const commitValue = 5;
  //   await token.commit(commitValue);
    
  //   await token.withdrawM5();
  //   // We have M5 tokens now

  //   // GDP back to possitive:
  //   await token.setPossitiveGrowth(10);

  //   // trying to swap more then we have
  //   await assertRevert(token.swap(100));
  // });

  it('should successfully swap M5 token for regular token when GDP is back to possitive', async function () {
    await token.setNegativeGrowth(-100);
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);
    
    await token.withdrawM5();
    // We have M5 tokens now
    // let M5Balance = await M5Token.balanceOf(accounts[0]);
    let balance = await token.balanceOf(accounts[0]);
    
    // GDP back to possitive:
    await token.setPossitiveGrowth(10);
    
    await token.swap(swapValue);
    let newBalance = await token.balanceOf(accounts[0]);
    newBalance.should.be.bignumber.equal(balance.plus(swapValue / 10));
  });

  it('should remove M5 tokens from user balance on swap', async function () {
    await token.setNegativeGrowth(-100);
    const commitValue = 5;
    const swapValue = 80;
    await token.commit(commitValue);
    
    await token.withdrawM5();
    // We have M5 tokens now
    let M5Balance = await M5Token.balanceOf(accounts[0]);
    // let balance = await token.balanceOf(accounts[0]);
    
    // GDP back to possitive:
    await token.setPossitiveGrowth(10);
    
    await token.swap(swapValue);

    let newM5Balance = await M5Token.balanceOf(accounts[0]);
    newM5Balance.should.be.bignumber.equal(M5Balance.minus(swapValue));
  });

  // it('should burn the returned M5 tokens after successfull swap', async function () {
  //   await token.commit(5);
  // });

  // it('should increase supply after swap', async function () {

  // });

  // it('should decrease M5 token supply after swap', async function () {

  // });

  // it('should revert if user trying to swap directly from M5 token contract', async function () {

  // });

  // it('should emit event on swap for M5 token contract', async function () {
  //   await token.setNegativeGrowth(-100);
  //   const commitValue = 5;
  //   await token.commit(commitValue);
    
  //   await token.withdrawM5();
  //   // We have M5 tokens now
    
  //   // GDP back to possitive:
  //   await token.setPossitiveGrowth(10);
  //   let txObj = await token.swap(80);

  //   const event = txObj.logs.find(e => e.event === 'Swap');
  //   assert.exists(event);
    
  //   const { from, M5Value, value } = event.args;
  //   assert.equal(from, accounts[0]);
  //   assert.equal(M5Value, 80);
  //   assert.equal(value, 8);
  // });

  // it('should', async function () {

  // });
});
