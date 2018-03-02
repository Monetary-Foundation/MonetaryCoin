
// import assertRevert from '../helpers/assertRevert';
// import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

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
    M5Token = await M5TokenMock.new(initialAccount, initialSupply, setBlockReward);
    M5Logic = await M5LogicMock3.new();

    // upgrade token to new logic
    await token.upgradeM5Logic(M5Logic.address);
    await token.upgradeM5Token(M5Token.address);

    // transfer ownership of M5token to token:
    await M5Token.transferOwnership(token.address);
  });

  // ---------------------------------- full upgrade example with m5 token and swap -----------------
  // it('should return the correct reward if nothing was commited', async function () {
  //   let zeroReward = await token.getCurrentReward(accounts[0]);
  //   assert.equal(zeroReward, 0);
  // });

  it('should return correct M5 reward when growth is negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward);
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    // after one block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #blocks * BlockReward) / avgStake [integer division] ) - commitValue
    // [(4 * 1 * abs(-10)) / 2] = 20;
    let expectedReward = new BigNumber(commitValue * 1 * Math.abs(negativeBlockReward))
      .dividedToIntegerBy(2);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  it('should mint M5 token when GDP is negative and changes to negative', async function () {
    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward);
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    const negativeBlockReward2 = -20;
    await token.setNegativeGrowth(negativeBlockReward2);
    // after two block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] ) - commitValue
    // [(4 * 2 * abs(-15)) / 2] = 60;
    let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-15))
      .dividedToIntegerBy(2);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  it('should mint M5 token when GDP is negative and changes to positive', async function () {
    let sa = await token.signedAverage(-10, 6);
    console.log(sa.toString());

    const negativeBlockReward = -10;
    await token.setNegativeGrowth(negativeBlockReward);
    const commitValue = 4;
    // onBlockNumber = commitBlockNumber
    // value = 4
    // atStake = 0
    await token.commit(commitValue);
    await token.setPossitiveGrowth(6);
    // after two block
    let M5Reward = await token.getM5Reward(accounts[0]);

    // ((commitValue * #2 * BlockReward) / avgStake [integer division] ) - commitValue
    // [(4 * 2 * abs(-2)) / 2] - 4 = 4;
    let expectedReward = new BigNumber(commitValue * 2 * Math.abs(-2))
      .dividedToIntegerBy(2);

    M5Reward.should.be.bignumber.equal(expectedReward);
  });

  // it('should fail to return the correct M5 reward on positive GDP', async function () {
  //   await token.commit(5);
  // });

  // it('should fail to withdrawM5() if effective reward is possitive', async function () {
  //   await token.commit(5);
  // });

  // it('should get commitment back after withdrawM5() on negative GDP', async function () {
  //   await token.commit(5);
  // });

  // it('should successfully mint correct amount of M5 token when GDP is negative', async function () {
  //   await token.setNegativeGrowth(-10);
  //   await token.commit(5);

  //   let M5Reward = await token.getM5Reward(accounts[0]);
  //   console.log(M5Reward);
  //   // mint
  //   await token.withdrawM5();
  // });

  // it('should mint M5 token when GDP is negative and changes', async function () {
  //   await token.commit(5);
  // });

  // it('should swap M5 token for regular token when GDP is back to possitive at constant exchange rate', async function () {
  //   await token.commit(5);
  // });

  // it('should burn the returned M5 token after successfull swap', async function () {
  //   await token.commit(5);
  // });

  // it('should increase supply after swap', async function () {

  // });

  // it('should revert swap in M5 token balance is too low for user', async function () {

  // });

  // it('should burn M5 tokens from user balance on swap', async function () {

  // });

  // it('should decrease M5 token supply after swap', async function () {

  // });

  // it('should revert if not permited user trying to swap directly from M5 token contract', async function () {

  // });

  // it('should fail to swap if GDP is still negative', async function () {

  // });

  // it('should emmit event on swap for M5 token contract', async function () {

  // });

  // it('should', async function () {

  // });
});
