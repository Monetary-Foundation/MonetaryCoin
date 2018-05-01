const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

const getBlock = () => // eslint-disable-line no-inner-declarations
  new Promise((resolve, reject) => {
    web3.eth.getBlock('latest', (err, data) => {
      if (err !== null) return reject(err);
      return resolve(data);
    });
  });

async function latestTime () {
  const latestBlock = await getBlock();
  return latestBlock.timestamp;
}

const duration = {
  seconds: function (val) { return val; },
  minutes: function (val) { return val * this.seconds(60); },
  hours: function (val) { return val * this.minutes(60); },
  days: function (val) { return val * this.hours(24); },
  weeks: function (val) { return val * this.days(7); },
  years: function (val) { return val * this.days(365); },
};

// set MNEMONIC="HDkey"
module.exports = async function (deployer, network, accounts) {
  // deployment steps
  var token;
  var distribution;

  const contractCreator = '0xb87A0317A4460973D683dEEe79A05A3F73a6277C';

  if (accounts[0].toLowerCase() !== contractCreator.toLowerCase()) {
    console.log(`accounts[0] isn't equal to expected value`); //eslint-disable-line
    console.log(`accounts[0]: ${accounts[0].toLowerCase()}`);
    console.log(`contractCreator: ${contractCreator.toLowerCase()}`);
    process.exit(1);
  }

  const initialAccount = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';
  const GDPOracle = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';
  const upgradeManager = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';
  // const initialAccount = accounts[0];
  // const GDPOracle = accounts[0];
  // const upgradeManager = accounts[0];

  console.log('\nContractCreator (accounts[0]):');
  console.log(accounts[0]);
  console.log('InitialAccount:');
  console.log(initialAccount);
  console.log('GDPOracle:');
  console.log(GDPOracle);
  console.log('UpgradeManager:');
  console.log(upgradeManager);
  console.log();

  const initialBlockReward = 1 * (10 ** 18);

  const firstPeriodWindows = 50;
  const secondPeriodWindows = 170;
  const firstPeriodSupply = 10000;
  const secondPeriodSupply = 15000;
  const initialBalance = 50;

  const startTime = await latestTime() + 60;
  const windowLength = duration.minutes(10);
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
