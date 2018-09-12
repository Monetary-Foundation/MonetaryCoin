REM truffle.cmd --network testrpc test ..\test\token\StandardToken.test.js
truffle.cmd --network testrpc compile --all && truffle.cmd --network testrpc test ..\test\m\ComplianceStore.test.js && truffle.cmd --network testrpc test ..\test\m\StandardToken.test.js && truffle.cmd --network testrpc test ..\test\m\MintableToken.test.js && truffle.cmd --network testrpc test ..\test\m\MineableToken.test.js && truffle.cmd --network testrpc test ..\test\m\GDPOraclizedToken.test.js && truffle.cmd --network testrpc test ..\test\m\MineableM5Token.test.js && truffle.cmd --network testrpc test ..\test\m\MineableM5TokenIntegration.test.js && truffle.cmd --network testrpc test ..\test\m\MCoinDistribution.test.js && truffle.cmd --network testrpc test ..\test\m\TestAverage.sol



