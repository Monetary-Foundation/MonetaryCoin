
import expectThrow from '../helpers/expectThrow';

// var MintableToken = artifacts.require('MinableToken');

// const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

// for tests run: ganache-cli -u0 -u1 -u2 -u3
contract('MinableToken', function (accounts) {
  let token;

  const GDPOracle = accounts[1];
  const contractCreator = accounts[2];
  const upgradeManager = accounts[3];

  const initialBlockReward = 5;

  beforeEach(async function () {
    token = await MCoinMock.new(initialBlockReward, GDPOracle, upgradeManager, { from: contractCreator });

    // In practice, the minting is done by the distribution contract:
    // await token.transferOwnership(distribution.address, { from: contractCreator });

    // await distribution.init(token.address, { from: contractCreator });
  });

  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0);
  });

  it('should return mintingFinished false after construction', async function () {
    let mintingFinished = await token.mintingFinished();

    assert.equal(mintingFinished, false);
  });

  it('should mint a given amount of tokens to a given address', async function () {
    const result = await token.mint(accounts[0], 100, { from: contractCreator });
    assert.equal(result.logs[0].event, 'Mint');
    assert.equal(result.logs[0].args.to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args.amount.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args.from.valueOf(), 0x0);

    let balance0 = await token.balanceOf(accounts[0]);
    assert(balance0, 100);

    let totalSupply = await token.totalSupply();
    assert(totalSupply, 100);
  });

  it('should fail to mint after call to finishMinting', async function () {
    await token.finishMinting({ from: contractCreator });
    assert.equal(await token.mintingFinished(), true);
    await expectThrow(token.mint(accounts[0], 100));
  });
});
