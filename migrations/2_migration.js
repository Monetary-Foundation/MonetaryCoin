const MCoinDistribution = artifacts.require('MCoinDistributionWrap');
const MCoin = artifacts.require('MCoin');

// change to false while runing test to prevent race condition
// see https://github.com/trufflesuite/truffle/issues/557
const deploy = false;

// set MNEMONIC="HDkey"
module.exports = async function (deployer, network, accounts) {
  if (deploy) {
    const contractCreator = '0x357098ff39e5ce7139a5aee2b2b9987e56a106f4';

    // Foundation multi sig wallet
    const initialAccount = '0x17c2cff681cd63b3fd0dc72b19e81d0c59fb7659';
    const upgradeManager = initialAccount;
    const GDPOracle = initialAccount;

    verifyContractCreator(accounts[0], contractCreator);
    logRoles(contractCreator, initialAccount, GDPOracle, upgradeManager);

    const firstPeriodWindows = 70;
    const secondPeriodWindows = 1730;
    const startTime = '1528156801';
    // const startTime = await latestTime() + 240;
    // const windowLength = duration.hours(23);
    const windowLength = duration.seconds(10032);

    // MUSA Params:
    let MCoinName =   'MonetaryCoinERO';    // eslint-disable-line
    let MCoinSymbol = 'MERO';
    let initialBlockReward =       '25718'; // eslint-disable-line
    let firstPeriodSupply  =   '844536898'; // eslint-disable-line
    let secondPeriodSupply = '10436063102';

    await deployMCoin(
      MCoinName,
      MCoinSymbol,
      MCoin,
      initialBlockReward,
      GDPOracle,
      upgradeManager,
      MCoinDistribution,
      firstPeriodWindows,
      firstPeriodSupply,
      secondPeriodWindows,
      secondPeriodSupply,
      initialAccount,
      startTime,
      windowLength,
      deployer,
    );

    // MERO Params:
    MCoinName =   'MonetaryCoinCHI';  // eslint-disable-line
    MCoinSymbol = 'MCHI';
    initialBlockReward =        '52242'; // eslint-disable-line
    firstPeriodSupply  =  '13025686096'; // eslint-disable-line
    secondPeriodSupply = '160960263904';

    await deployMCoin(
      MCoinName,
      MCoinSymbol,
      MCoin,
      initialBlockReward,
      GDPOracle,
      upgradeManager,
      MCoinDistribution,
      firstPeriodWindows,
      firstPeriodSupply,
      secondPeriodWindows,
      secondPeriodSupply,
      initialAccount,
      startTime,
      windowLength,
      deployer,
    );
  };
};

async function deployMCoin (
  // Token:
  MCoinName,
  MCoinSymbol,
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
  startTime,
  windowLength,
  // Tools:
  deployer,
) {
  /* eslint-disable */
  await deployer.deploy(
    MCoinArtifact,
    MCoinName,
    MCoinSymbol,
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

async function latestTime () { // eslint-disable-line
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
  if (deploy) {
    console.log('\nContractCreator (accounts[0]):');
    console.log(contractCreator);
    console.log('InitialAccount:');
    console.log(initialAccount);
    console.log('GDPOracle:');
    console.log(GDPOracle);
    console.log('UpgradeManager:');
    console.log(upgradeManager);
    console.log();
  }
};
