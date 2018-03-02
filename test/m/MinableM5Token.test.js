
import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableM5TokenMock = artifacts.require('MinableM5TokenMock');
var M5LogicMock1 = artifacts.require('M5LogicMock2');

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

  it('should revert on getM5Reward if M5Logic is uninitiated (address = 0)', async function () {
    await token.commit(5);
    await assertRevert(token.getM5Reward(accounts[0]));
  });

  it('should correctly call getM5Reward and get static value (uint256)', async function () {
    BigNumber.config({ ROUNDING_MODE: 2 });
    await token.commit(5);

    let M5LogicContract = await M5LogicMock1.new();

    await token.upgradeM5Logic(M5LogicContract.address);

    // let logicAddress = await token.M5Logic();
    // assert.equal(logicAddress, M5LogicContract.address);

    let reward = await token.getM5Reward(accounts[0]);
    
    reward.toPrecision(11).should.be.bignumber.equal((2 ** 140).toPrecision(11));
  });

  // it('should correctly call getM5Reward and get value from storage', async function () {
  //   await token.commit(5);
  // });

  // it('should correctly send transaction to upgraded withdrawM5', async function () {
  //   await token.commit(5);
  // });

  // it('should successfully use upgraded getM5reward from upgraded withdrawM5', async function () {
  //   await token.commit(5);
  // });

  // it('should successfully change storage from upgraded withdrawM5', async function () {
  //   await token.commit(5);
  // });

  // // ---- aux1,aux2,aux3,aux4
  // it('should return correct value for pure upgradable aux1', async function () {
  //   await token.commit(5);
  // });

  // it('throw if trying to call non existant finction after upgrade', async function () {
  //   await token.commit(5);
  // });

  // it('should return correct value for pure upgradable aux2', async function () {
  //   await token.commit(5);
  // });

  // it('should change storage for upgradable aux3', async function () {
  //   await token.commit(5);
  // });

  // it('should change storage for upgradable aux4', async function () {
  //   await token.commit(5);
  // });
});
