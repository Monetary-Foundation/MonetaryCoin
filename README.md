# MonetaryCoin smart contracts

https://monetarycoin.org

## Description

MonetaryCoin is an ERC20 token defined by the Monetary Protocol (see white paper for details).

Aside from standard ERC20 functionality, the token contract has these major features:

* Proof of stake (PoS) forging - the initial amount will be distributed using this mechanism.

* After distribution of the initial amount, changes in supply of coins available for forging will be controlled using external GDP oracle maintained by the Monetary foundation. See `GDPOraclizedToken.sol` for additional detail.

* In periods of positive GDP growth, the new supply will be distributed using the PoS mechanism. See `MineableToken.sol` for additional details.

* In case of negative GDP growth (i.e. GDP declines), the M5 mining mechanism will be triggered. See the `M5LogicMock3.sol` and `M5tokenMock.sol` for additional detial.

* After M5 mining is fully defined, the contract will be upgraded to support negative mining. See `MineableM5Token.sol` for details. The upgrade will be done prior to the conclusion of the initial distribution. Initial distribution will last a year and a half following the 7+173=180 day period, a total of two years. 

* Users can prove ownership of an address to comply with AML-KYC regulations using the `ComplianceStore.sol` contract - a separate contract, defined by the Monetary Protocol.

* Pre-distribution of the tokens will take place via the `MCoinDistribution` contract.

The ERC20 standard token is based on the openzeppelin-solidity repository, the rest of the token’s functionality is custom developed and has been [audited](https://github.com/SagroVesk/MonetaryCoin-Audit/releases).

Go to [API Documentation](https://monetary-foundation.github.io/MonetaryCoin/)

## Installation

* Clone repository.

* Change `deploy` variable in 2_migration.js to 'true'.

* In 2_migration.js, change `initialAccount, GDPOracle, upgradeManager` variables to the desired addresses.

* Run `truffle --network testrpc compile -all` followed by `truffle --network testrpc migrate` to deploy to testrpc.

Available networks can be seen / changed in truffle.js.

## License
Code released under the MIT LICENCE
