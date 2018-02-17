
// import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();
   
var ComplienceStoreMock = artifacts.require('ComplienceStoreMock');

contract('ComplienceStore', function (accounts) {
  let ComplienceStore;

  beforeEach(async function () {
    ComplienceStore = await ComplienceStoreMock.new();
  });
  
  it('should return the correct totalSupply after construction', async function () {
    let ans = await ComplienceStore.getHash(accounts[0]);
    console.log(ans);
    
    // assert.equal(totalSupply, 100);
  });
});
