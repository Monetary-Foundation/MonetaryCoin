# MonetaryCoin smart contracts

## Description

MonetaryCoin is an ERC20 token defined by the Monetary Protocol (see white paper for details).

Besides standard ERC20 fanctionality, the token contract have these major features:

* Proof of stake forging - the initial amount will be distributed using this mechanisem.

* After initial distribution, changes in supply rate will be controled using extenal GDP oracle maintained by the Monetary foundation. Can be seen in `GDPOraclizedToken.sol`.

* In periods of positive growth (GDP is positive), the new supply will be fairly distributed using POS mechanisem. See `MineableToken.sol` for details.

* In case of negative growth (GDP is negative), M5 mining mechanisem will be triggered. See `M5LogicMock3.sol` and `M5tokenMock.sol` for referance implementation.

* After M5 mining is fully defined, the contract will we upgraded to support negative mining as well. See `MineableM5Token.sol` for details. The upgrade will be done prior to initial distribution finish.

* Users can prove ownership of an address to comply with AML-KYC regulations using the `ComplianceStore.sol` contract - a saperate contract, defined by the Monetary Protocol.

* Pre-distribution of the tokens is done via the `MCoinDistribution.sol` contract. 

ERC20 standard token based on openzeppelin-solidity repository, rest of functionalaty are custom made and audited in this document.

## Installation

* Clone repository.

* Change `deploy` variable in 2_migration.js to 'true'.

* In 2_migration.js, change `initialAccount, GDPOracle, upgradeManager` variables to the desired addresses.

* Run `truffle --network testrpc compile -all` followed by `truffle --network testrpc migrate` to deploy to testrpc.

Available networks can be seen / changed in truffle.js.

## License
Code released under the MIT LICENCE
