require('dotenv').config();
require('babel-register');
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

const ropstenProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider('ropsten');

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
      network_id: '*', // eslint-disable-line camelcase
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*', // eslint-disable-line camelcase
    },
  },
};
