
import assertRevert from '../helpers/assertRevert';
import expectThrow from '../helpers/expectThrow';
// import advanceToBlock from '../helpers/advanceToBlock';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var MinableM5GDPOraclizedTokenMock = artifacts.require('MinableM5GDPOraclizedTokenMock');
var M5TokenMock = artifacts.require('M5TokenMock');
var M5LogicMock3 = artifacts.require('M5LogicMock3');

// const intAvg = (a, b) => new BigNumber(a + b).dividedToIntegerBy(2);

contract('MinableM5GDPOraclizedToken', function (accounts) {
  let token;

  // address initialAccount,
  // uint256 initialBalance,
  // uint256 blockReward
  const initialAccount = accounts[0];
  const initialSupply = 50;
  const setBlockReward = 5;
  beforeEach(async function () {
    token = await MinableM5GDPOraclizedTokenMock.new(initialAccount, initialSupply, setBlockReward, accounts[0]);
  });

  // ---------------------------------- full upgrade example with m5 token and swap -----------------
  it('should successfully mint M5 token when GDP is negative', async function () {
    await token.setNegativeGrowth(-10);
    await token.commit(5);
    
    let M5Token = await M5TokenMock.new(initialAccount, initialSupply, setBlockReward);
    let M5Logic = await M5LogicMock3.new();
    
    // upgrade token to new logic
    await token.upgradeM5Logic(M5Logic.address);
    await token.upgradeM5Token(M5Token.address);

    // transfer ownership of M5token to token:
    await M5Token.transferOwnership(token.address);

    let M5Reward = await token.getM5Reward(accounts[0]);
    console.log(M5Reward);
    // mint
    await token.withdrawM5();
  });

  // it('should mint M5 token when GDP is negative and changes', async function () {
  //   await token.commit(5);
  // });

  // it('should swap M5 token for regular token when GDP is back to possitive at constant exchange rate', async function () {
  //   await token.commit(5);
  // });

  // it('should burn the returned M5 token after successfull swap', async function () {
  //   await token.commit(5);
  // });

  // it('should return historical maximum amount of M5 after swap', async function () {
  //   await token.commit(5);
  // });

  // it('', async function () {

  // });

  // it('', async function () {

  // });
});
