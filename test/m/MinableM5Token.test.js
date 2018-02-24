
import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableM5TokenMock = artifacts.require('MinableM5TokenMock');
var M5LogicMock1 = artifacts.require('M5LogicMock1');

// const intAvg = (a, b) => new BigNumber(a + b).dividedToIntegerBy(2);

contract('MinableM5Token', function (accounts) {
  let token;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await MinableM5TokenMock.new(initialAccount, initialSupply, setBlockReward);
  });
  /*
    // it('should be created with M5Token contract address = 0', async function () {
      
    // });

    // it('should be created with M5Logic contract address = 0', async function () {
      
    // });

    // it('should give the ability to upgrade M5Token address', async function () {
      
    // });

    // it('should emit event when upgrading M5Token address', async function () {
      
    // });

    // it('should give the ability to upgrade M5Logic address', async function () {
      
    // });

    // it('should emit event when upgrading M5Logic address', async function () {
      
    // });

    // it('prevent non owner to upgrade M5Logic', async function () {
      
    // });

    // it('prevent non owner to upgrade M5Token', async function () {
      
    // });
  */
  // it('should return 0 for getM5Reward in no commitment were made', async function () {
  //   const reward = await token.getM5Reward.call(accounts[0]);
  //   reward.should.be.bignumber.equal(0);
  // });

  // it('should revert on getM5Reward if M5Logic is uninitiated (address = 0)', async function () {
  //   await token.commit(5);
  //   await assertRevert(token.getM5Reward(accounts[0]));
  // });

  it('should return the correct value from getM5Reward', async function () {
    await token.commit(5);

    let M5LogicContract = await M5LogicMock1.new();

    await token.upgradeM5Logic(M5LogicContract.address);

    // let logicAddress = await token.M5Logic();
    // assert.equal(logicAddress, M5LogicContract.address);
    
    let reward = await token.withdrawM5();

    console.log(reward);

    let M5WithdrawResponse = await token.M5WithdrawResponse();

    console.log(M5WithdrawResponse);

  });

  // it('', async function () {

  // });

  // it('', async function () {

  // });
});
