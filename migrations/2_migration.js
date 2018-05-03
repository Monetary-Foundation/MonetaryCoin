// const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
// const MCoinMock = artifacts.require('MCoinMock');

const MCoinDistribution = artifacts.require('MCoinDistributionWrap');
const MUSA = artifacts.require('MUSA');
const MERO = artifacts.require('MERO');

// set MNEMONIC="HDkey"
module.exports = async function (deployer, network, accounts) {
  const contractCreator = '0xb87A0317A4460973D683dEEe79A05A3F73a6277C';

  const initialAccount = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';
  const GDPOracle = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';
  const upgradeManager = '0x004fee9c1fdd187076f05b9e82b15553863f16c1';

  verifyContractCreator(accounts[0], contractCreator);
  logRoles(contractCreator, initialAccount, GDPOracle, upgradeManager);

  const firstPeriodWindows = 7;
  const secondPeriodWindows = 173;
  const startTime = await latestTime() + 240;
  const windowLength = duration.minutes(10);

  // MUSA Params:
  let initialBlockReward = '26536';
  let firstPeriodSupply = 6.9737 * (10 ** 9);
  let secondPeriodSupply = firstPeriodSupply;
  let initialBalance = 2 * firstPeriodSupply;
  
  await deployMCoin(
    'MUSA',
    MUSA,
    initialBlockReward,
    GDPOracle,
    upgradeManager,

    MCoinDistribution,
    firstPeriodWindows,
    firstPeriodSupply,
    secondPeriodWindows,
    secondPeriodSupply,
    initialAccount,
    initialBalance,
    startTime,
    windowLength,
    deployer,
  );

  // MERO Params:
  initialBlockReward = '21462';
  firstPeriodSupply = 5.640 * (10 ** 9);
  secondPeriodSupply = firstPeriodSupply;
  initialBalance = 2 * firstPeriodSupply;

  await deployMCoin(
    'MERO',
    MERO,
    initialBlockReward,
    GDPOracle,
    upgradeManager,

    MCoinDistribution,
    firstPeriodWindows,
    firstPeriodSupply,
    secondPeriodWindows,
    secondPeriodSupply,
    initialAccount,
    initialBalance,
    startTime,
    windowLength,
    deployer,
  );
};

async function deployMCoin (
  // Token:
  MCoinName,
  MCoinArtifact,
  initialBlockReward,
  GDPOracle,
  upgradeManager,
  // Distribution:
  MCoinDistributionArtifact,
  firstPeriodWindows,
  firstPeriodSupply,
  secondPeriodWindows,
  secondPeriodSupply,
  initialAccount,
  initialBalance,
  startTime,
  windowLength,
  // Tools:
  deployer,
) {
  /* eslint-disable */
  await deployer.deploy(
    MCoinArtifact,
    initialBlockReward,
    GDPOracle,
    upgradeManager
  );
  await deployer.deploy(
    MCoinDistributionArtifact,
    firstPeriodWindows,
    firstPeriodSupply,
    secondPeriodWindows,
    secondPeriodSupply,
    initialAccount,
    initialBalance,
    startTime,
    windowLength
  );
  /* eslint-enable */
  const token = await MCoinArtifact.deployed();
  const distribution = await MCoinDistributionArtifact.deployed();

  await token.transferOwnership(distribution.address);
  await distribution.init(token.address);

  console.log('\nSuccesfully deployed ' + MCoinName);
  console.log('Distribution address: ' + distribution.address);
  console.log('Token address: ' + token.address);
  console.log();
};

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

const verifyContractCreator = (account, expected) => {
  const accountNorm = account.toLowerCase();
  const expectedNorm = expected.toLowerCase();
  if (accountNorm !== expectedNorm) {
    console.log(`accounts[0] isn't equal to expected value`); //eslint-disable-line
    console.log(`accounts[0]: ${accountNorm}`);
    console.log(`contractCreator: ${expectedNorm}`);
    process.exit(1);
  }
};

const logRoles = (contractCreator, initialAccount, GDPOracle, upgradeManager) => {
  console.log('\nContractCreator (accounts[0]):');
  console.log(contractCreator);
  console.log('InitialAccount:');
  console.log(initialAccount);
  console.log('GDPOracle:');
  console.log(GDPOracle);
  console.log('UpgradeManager:');
  console.log(upgradeManager);
  console.log();
};
