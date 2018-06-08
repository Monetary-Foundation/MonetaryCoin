require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/`
);

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

const mainnetProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('mainnet');

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8454,
      network_id: '*', // eslint-disable-line camelcase
    },
    ropsten: {
      provider: ropstenProvider,
      network_id: 3, // eslint-disable-line camelcase
      gas: 4700000,
      gasPrice: 102 * 1000000000,
    },
    mainnet: {
      provider: mainnetProvider,
      network_id: 1, // eslint-disable-line camelcase
      gas: 4700000,
      gasPrice: 10 * 1000000000,
    },
    coverage: {
      host: '127.0.0.1',
      network_id: '*', // eslint-disable-line camelcase
      port: 7545,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    testrpc: {
      host: '127.0.0.1',
      port: 8545,
      gas: 6700000,
      network_id: '*', // eslint-disable-line camelcase
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
};
