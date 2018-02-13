
// import assertRevert from '../helpers/assertRevert';
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

  it('should the correct oracle address after init', async function () {
    let oracleAddress = await token.GDPOracle();
    
    console.log(oracleAddress);
    assert.equal(oracleAddress, accounts[0]);
  });
});
