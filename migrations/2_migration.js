function latestTime () {
  return web3.eth.getBlock('latest').timestamp;
}

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

module.exports = async function (deployer, network, accounts) {
  // deployment steps

  var token;
  var distribution;

  const initialAccount = accounts[0];
  const GDPOracle = accounts[1];
  // const contractCreator = accounts[2];
  const upgradeManager = accounts[3];

  const initialBlockReward = 5;

  const firstPeriodWindows = 3;
  const secondPeriodWindows = 7;
  const firstPeriodSupply = 100;
  const secondPeriodSupply = 150;
  const initialBalance = 50;

  // New startTime for each test:
  const startTime = latestTime() + 60;
  const windowLength = duration.minutes(5);
  /* eslint-disable */

  await deployer.deploy(
    MCoinMock,
    initialBlockReward,
    GDPOracle,
    upgradeManager
  );

  await deployer.deploy(
    MCoinDistributionMock,
    firstPeriodWindows,
    firstPeriodSupply,
    secondPeriodWindows,
    secondPeriodSupply,
    initialAccount,
    initialBalance,
    startTime,
    windowLength
  );

  token = await MCoinMock.deployed();
  distribution = await MCoinDistributionMock.deployed();

  await token.transferOwnership(distribution.address);
  await distribution.init(token.address);

  console.log('Distribution address: ' + distribution.address);
  console.log('Token address: ' + token.address);
  
};
  /* eslint-enable */
