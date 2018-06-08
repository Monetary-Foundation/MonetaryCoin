#!/bin/bash
truffle --network testrpc compile --all 
truffle --network testrpc test ../test/m/MCoinDistribution.test.js
truffle --network testrpc test ../test/m/TestAverage.sol



