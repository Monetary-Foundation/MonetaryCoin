REM truffle.cmd --network testrpc test ..\test\token\StandardToken.test.js
truffle.cmd --network testrpc compile --all && truffle.cmd --network testrpc test ..\test\m\MCoinDistribution.test.js && truffle.cmd --network testrpc test ..\test\m\TestAverage.sol



