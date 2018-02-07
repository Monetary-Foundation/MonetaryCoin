
// import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableTokenMock = artifacts.require('MinableTokenMock');

contract('MinableToken', function (accounts) {
  let token;

  beforeEach(async function () {
    // address initialAccount,
    // uint256 initialBalance,
    // uint256 totalSupply,
    // uint256 blockReward
    const initialAccount = accounts[0];
    const initialBalance = 50;
    const totalSupply = 1000;
    const setBlockReward = 5;
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

  /* it('should throw if nothing to withdraw', async function () {
    await expectThrow(token.withdraw());
  }); */
});
