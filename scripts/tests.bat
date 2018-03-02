REM truffle.cmd --network testrpc test ..\test\token\StandardToken.test.js
truffle.cmd --network testrpc compile --all && truffle.cmd --network testrpc test ..\test\m\ComplienceStore.test.js && truffle.cmd --network testrpc test ..\test\m\StandardToken.test.js && truffle.cmd --network testrpc test ..\test\m\MintableToken.test.js && truffle.cmd --network testrpc test ..\test\m\MinableToken.test.js && truffle.cmd --network testrpc test ..\test\m\GDPOraclizedToken.test.js && truffle.cmd --network testrpc test ..\test\m\MinableM5Token.test.js && truffle.cmd --network testrpc test ..\test\m\MinableM5GDPOraclizedToken.test.js  



