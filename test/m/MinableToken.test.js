
// import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();
   
var MinableTokenMock = artifacts.require('MinableTokenMock');

contract('MinableToken', function (accounts) {
  let token;

  beforeEach(async function () {
    token = await MinableTokenMock.new(100, 5);
  });
  
  it('should return 0 for totalStake after construction', async function () {
    let totalStake = await token.totalStake();
    
    assert.equal(totalStake, 0);
  });

  it('should return correct block reward after construction', async function () {
    const setBlockReward = 5;
    token = await MinableTokenMock.new(100, setBlockReward);
    let blockReward = await token.blockReward();
    
    assert.equal(blockReward, setBlockReward);
  });
});
