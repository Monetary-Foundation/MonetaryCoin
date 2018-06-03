pragma solidity ^0.4.24;
import "truffle/Assert.sol";
import "../../contracts/mocks/MineableTokenMockNoParams.sol";


contract TestAverage {
  MineableTokenMockNoParams coin;
  
  function TestAverage() public {
    coin = new MineableTokenMockNoParams();
  }

  function testAssumptions() public {
    int256 INT256_MIN = int256((uint256(1) << 255));
    int256 INT256_MAX = int256(~((uint256(1) << 255)));
    
    int256 ans = INT256_MAX + INT256_MAX;
    int expected = -2;
    Assert.equal(ans, expected, "Should return the corect result");
    
    ans = INT256_MIN+INT256_MIN;
    expected = 0;
    Assert.equal(ans, expected, "Should return the corect result");

    ans = INT256_MIN+INT256_MAX;
    expected = -1;
    Assert.equal(ans, expected, "Should return the corect result");
  }
 
  function testAverage() public {
    uint expected2 = 3;
    Assert.equal(coin.average(2,4), expected2, "Should return the corect average");
  }

  function testAverageZero() public {
    uint expected2 = 0;
    Assert.equal(coin.average(0,0), expected2, "Should return the corect average");
  }

  function testAverageShouldNotRevert() public {
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("average(uint256,uint256)")), 1, 2);

    Assert.equal(result, true, "Should not throw");
  }

  function testAverageShouldRevert() public {
    
    uint256 a = ~ uint256(0); //max uint256
    uint256 b = ~ uint256(0);
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("average(uint256,uint256)")), a, b);

    Assert.equal(result, false, "Should throw on overflow");
  }

  function testSignedAverage() public {
    int expected2 = 3;
    Assert.equal(coin.signedAverage(2,4), expected2, "Should return the corect signed average");
  }

  function testSignedAverageZero() public {
    int expected2 = 0;
    Assert.equal(coin.signedAverage(0,0), expected2, "Should return the corect signed average");
  }

  function testSignedAverageZero2() public {
    int256 INT256_MAX = int256(~((uint256(1) << 255)));
    int256 INT256_MIN = int256((uint256(1) << 255));
    int expected2 = 0;
    Assert.equal(coin.signedAverage(INT256_MAX,INT256_MIN), expected2, "Should return the corect signed average");
  }

  function testSignedAverageNegative() public {
    int expected2 = -3;
    Assert.equal(coin.signedAverage(-2,-4), expected2, "Should return the corect signed average");
  }

  function testSignedAverageShouldNotRevert() public {
    int256 a = 5;
    int256 b = -5;
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("signedAverage(int256,int256)")), a, b);

    Assert.equal(result, true, "Should throw on overflow");
  }

  function testSignedAverageShouldRevert() public {
    int256 INT256_MAX = int256(~((uint256(1) << 255)));
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("signedAverage(int256,int256)")), INT256_MAX, INT256_MAX);

    Assert.equal(result, false, "Should throw on overflow");
  }
  
  function testSignedAverageShouldRevert2() public {
    int256 INT256_MIN = int256((uint256(1) << 255));
    int256 INT256 = int256((uint256(1) << 255)) + 2;
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("signedAverage(int256,int256)")), INT256_MIN, INT256);

    Assert.equal(result, false, "Should throw on overflow");
  }

  function testSignedAverageShouldRevert3() public {
    int256 INT256_MIN = int256((uint256(1) << 255));
    // will return false on revert / throw
    bool result = address(coin).call(bytes4(keccak256("signedAverage(int256,int256)")), INT256_MIN, INT256_MIN);

    Assert.equal(result, false, "Should throw on overflow");
  }
}