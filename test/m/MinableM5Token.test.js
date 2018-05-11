import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableM5TokenMock = artifacts.require('MinableM5TokenMock');
var M5LogicMock2 = artifacts.require('M5LogicMock2');
var M5LogicMock4 = artifacts.require('M5LogicMock4');
var M5LogicMock5 = artifacts.require('M5LogicMock5');
var M5LogicMock6 = artifacts.require('M5LogicMock6');
var M5LogicMock7 = artifacts.require('M5LogicMock7');

contract('MinableM5Token', function (accounts) {
  let token;

  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  const GDPOracle = accounts[0];
  const upgradeManager = accounts[3];

  beforeEach(async function () {
    token = await MinableM5TokenMock.new(initialAccount, initialSupply, setBlockReward, GDPOracle, upgradeManager);
  });

  it('should be created with M5Token contract address = 0', async function () {
    let address = await token.M5Token();
    assert.equal(address, '0x0000000000000000000000000000000000000000');
  });

  it('should be created with M5Logic contract address = 0', async function () {
    let address = await token.M5Logic();
    assert.equal(address, '0x0000000000000000000000000000000000000000');
  });

  it('should return the correct upgrade manager', async function () {
    let address = await token.upgradeManager();
    assert.equal(address, upgradeManager);
  });

  it('should provide the ability to upgrade M5Token address', async function () {
    await token.upgradeM5Token(accounts[1], { from: upgradeManager });
    let address = await token.M5Token();
    assert.equal(address, accounts[1]);
  });

  it('should return the correct status for isUpgradeFinished()', async function () {
    const isFinished = await token.isUpgradeFinished();
    assert.equal(isFinished, false);
  });

  it('should return the correct status for isUpgradeFinished() after finishUpgrade()', async function () {
    await token.finishUpgrade({ from: upgradeManager });
    const isFinished = await token.isUpgradeFinished();
    assert.equal(isFinished, true);
  });

  it('should prevent the ability to finishUpgrade() from non manager', async function () {
    await assertRevert(token.finishUpgrade({ from: GDPOracle }));
  });

  it('should prevent upgrading the contract after finishUpgrade()', async function () {
    await token.finishUpgrade({ from: upgradeManager });
    await assertRevert(token.upgradeM5Token(accounts[1], { from: upgradeManager }));
  });

  it('should emit event when upgrading M5Token address', async function () {
    let txObj = await token.upgradeM5Token(accounts[1], { from: upgradeManager });

    assert.equal(txObj.logs[0].event, 'M5TokenUpgrade');
    const { oldM5Token, newM5Token } = txObj.logs[0].args;

    assert.equal(oldM5Token, '0x0000000000000000000000000000000000000000');
    assert.equal(newM5Token, accounts[1]);
  });

  it('should provide the ability to upgrade M5Logic address', async function () {
    await token.upgradeM5Logic(accounts[1], { from: upgradeManager });
    let address = await token.M5Logic();
    assert.equal(address, accounts[1]);
  });

  it('should emit event when upgrading M5Logic address', async function () {
    let txObj = await token.upgradeM5Logic(accounts[1], { from: upgradeManager });

    assert.equal(txObj.logs[0].event, 'M5LogicUpgrade');
    const { oldM5Logic, newM5Logic } = txObj.logs[0].args;

    assert.equal(oldM5Logic, '0x0000000000000000000000000000000000000000');
    assert.equal(newM5Logic, accounts[1]);
  });

  it('prevent from non manager account to upgrade M5Logic', async function () {
    await assertRevert(token.upgradeM5Logic(accounts[1], { from: accounts[1] }));
  });

  it('prevent from non manager account to upgrade to upgrade M5Token', async function () {
    await assertRevert(token.upgradeM5Token(accounts[1], { from: accounts[1] }));
  });

  it('should revert on getM5Reward if M5Logic is uninitiated (address = 0)', async function () {
    await token.commit(5);
    await assertRevert(token.getM5Reward(accounts[0]));
  });

  it('should return 0 for getM5Reward in no commitment were made (after logic init)', async function () {
    await token.upgradeM5Logic(accounts[1], { from: upgradeManager });
    const reward = await token.getM5Reward.call(accounts[0]);
    reward.should.be.bignumber.equal(0);
  });

  it('should revert if averageBlockReward is not negative (even if not restricted by M5 logic)', async function () {
    await token.commit(5);

    let M5LogicContract = await M5LogicMock2.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    await assertRevert(token.getM5Reward(accounts[0]));
  });

  // TODO: REVISE:
  // it('should revert if non exist function (after logic upgrade to address)', async function () {
  //   await token.upgradeM5Logic(accounts[2]);
  //   await token.commit(5);
  //   // await assertRevert(token.getM5Reward(accounts[0]));
  //   let ans = await token.getM5Reward(accounts[0]);
  //   console.log(ans.toString());
  // });

  it('should revert if calling non existant function in logic contract', async function () {
    await token.upgradeM5Logic(accounts[2], { from: upgradeManager });
    await token.commit(5);

    let M5LogicContract = await M5LogicMock4.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    await assertRevert(token.getM5Reward(accounts[0]));
  });

  it('should correctly call getM5Reward and get static value (uint256)', async function () {
    BigNumber.config({ ROUNDING_MODE: 2 });
    
    await token.setNegativeGrowth(-51);

    await token.commit(5);

    let M5LogicContract = await M5LogicMock2.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    let reward = await token.getM5Reward(accounts[0]);

    reward.toPrecision(11).should.be.bignumber.equal((2 ** 140).toPrecision(11));
  });

  it('should revert upgraded M5reward if block reward is positive', async function () {
    await token.commit(5);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    await assertRevert(token.getM5Reward(accounts[0]));
  });

  it('should correctly call upgraded getM5Reward() and get value from storage', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    let reward = await token.getM5Reward(accounts[0]);

    reward.should.be.bignumber.equal(commitValue + 1);
  });

  it('should not fail when sending transaction to upgraded withdrawM5', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    await token.withdrawM5();
  });

  it('should successfully change storage from upgraded withdrawM5', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    await token.withdrawM5();

    let newCommitment = await token.commitmentOf(accounts[0]);

    newCommitment.should.be.bignumber.equal(0);
  });

  it('should successfully change storage (referenced by M5LogicContract) from upgraded withdrawM5', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock7.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    await token.withdrawM5();

    let changedAddress = await token.M5Logic();
    
    assert.equal(changedAddress, '0x0000000000000000000000000000000000000000');
  });

  it('should successfully call withdrawM5 to get reward and commitment', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    let txObj = await token.withdrawM5.call();
    // console.log(txObj);
    
    let reward = txObj[0];

    let commitmentValue = txObj[1];

    reward.should.be.bignumber.equal(commitValue + 1);
    commitmentValue.should.be.bignumber.equal(commitValue);
  });

  it('should successfully call withdrawM5 from different address to get reward and commitment', async function () {
    await token.transfer(accounts[1], 10);
    const commitValue = 4;
    await token.commit(commitValue, { from: accounts[0] });
    await token.commit(8, { from: accounts[1] });

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    let txObj = await token.withdrawM5.call({ from: accounts[1] });

    let reward = txObj[0];

    let commitmentValue = txObj[1];

    reward.should.be.bignumber.equal(9);
    commitmentValue.should.be.bignumber.equal(8);
  });

  it('should revert when calling withdrawM5 from different address with commitment = 0', async function () {
    await token.transfer(accounts[1], 10);
    const commitValue = 4;
    await token.commit(commitValue, { from: accounts[0] });
    await token.commit(8, { from: accounts[1] });

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });

    // no commitment for accounts[3]
    await assertRevert(token.withdrawM5.call({ from: accounts[3] }));
  });

  it('should successfully emit event after withdrawM5 call', async function () {
    const commitValue = 5;

    await token.commit(commitValue);

    await token.setNegativeGrowth(-51);

    let M5LogicContract = await M5LogicMock5.new();

    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });

    let txObj = await token.withdrawM5();

    assert.equal(txObj.logs[0].event, 'WithdrawM5');
    const { from, commitment, M5Reward } = txObj.logs[0].args;

    assert.equal(from, accounts[0]);
    assert.equal(commitment, 5);
    assert.equal(M5Reward, 6);
    //   assert.equal(newM5Token, accounts[1]);
  });

  it('should fail on swap() on non upgraded contract', async function () {
    await assertRevert(token.swap(3));
  });

  it('should fail on swap() on non upgraded M5 token', async function () {
    let M5LogicContract = await M5LogicMock5.new();
    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await assertRevert(token.swap(3));
  });

  it('should fail on swap() when no such function in upgraded contract', async function () {
    let M5LogicContract = await M5LogicMock5.new();
    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });
    await assertRevert(token.swap(3));
  });

  it('should successfully changed storage on swap() after upgrade', async function () {
    let M5LogicContract = await M5LogicMock6.new();
    await token.upgradeM5Logic(M5LogicContract.address, { from: upgradeManager });
    await token.upgradeM5Token(M5LogicContract.address, { from: upgradeManager });
    await token.swap(3);
    let blockReward = await token.blockReward();

    blockReward.should.be.bignumber.equal(3);
  });
});
