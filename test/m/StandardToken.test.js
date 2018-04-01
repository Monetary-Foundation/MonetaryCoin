import { duration } from '../helpers/increaseTime';
import latestTime from '../helpers/latestTime';
import assertRevert from '../helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var StandardTokenMock = artifacts.require('MinableTokenMockERC20');

const MCoinDistributionMock = artifacts.require('MCoinDistributionMock');
const MCoinMock = artifacts.require('MCoinMock');

const windowLength = duration.minutes(5);

// for tests run: ganache-cli -u0 -u1 -u2 -u3
contract('StandardToken', function ([_, owner, recipient, anotherAccount]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  let token;
  let distribution;

  const initialAccount = owner;
  const GDPOracle = owner;
  const contractCreator = owner;
  const upgradeManager = owner;

  const initialBlockReward = 5;

  let startTime = latestTime() + 60;

  const firstPeriodWindows = 3;
  const secondPeriodWindows = 7;
  const firstPeriodSupply = 100;
  const secondPeriodSupply = 150;
  const initialBalance = 100;

  const initialBalanceWei = web3.toWei(new BigNumber(initialBalance));

  beforeEach(async function () {
    // New startTime for each test:
    startTime = latestTime() + 60;

    token = await MCoinMock.new(initialBlockReward, GDPOracle, upgradeManager, { from: contractCreator });

    distribution = await MCoinDistributionMock.new(
      firstPeriodWindows,
      firstPeriodSupply,
      secondPeriodWindows,
      secondPeriodSupply,
      initialAccount,
      initialBalance,
      startTime,
      windowLength,
      { from: contractCreator }
    );

    await token.transferOwnership(distribution.address, { from: contractCreator });

    await distribution.init(token.address, { from: contractCreator });
  });

  // beforeEach(async function () {
  //   token = await StandardTokenMock.new(owner, 100);
  // });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      const totalSupply = await token.totalSupply();

      totalSupply.should.be.bignumber.equal(web3.toWei(new BigNumber(initialBalance + firstPeriodSupply + secondPeriodSupply), 'ether'));
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        const balance = await token.balanceOf(anotherAccount);

        assert.equal(balance, 0);
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        const balance = await token.balanceOf(owner);

        initialBalanceWei.should.be.bignumber.equal(balance);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = initialBalanceWei + 1;

        it('reverts', async function () {
          await assertRevert(token.transfer(to, amount, { from: owner }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('transfers the requested amount', async function () {
          await token.transfer(to, amount, { from: owner });

          const senderBalance = await token.balanceOf(owner);
          senderBalance.should.be.bignumber.equal(initialBalanceWei.minus(amount));

          const recipientBalance = await token.balanceOf(to);
          assert.equal(recipientBalance, amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await token.transfer(to, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Transfer');
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert(logs[0].args.value.eq(amount));
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await assertRevert(token.transfer(to, 100, { from: owner }));
      });
    });
  });

  describe('approve', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('emits an approval event', async function () {
          const { logs } = await token.approve(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await token.approve(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await token.approve(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await token.approve(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await token.approve(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await token.approve(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await token.approve(spender, amount, { from: owner });

        const allowance = await token.allowance(owner, spender);
        assert.equal(allowance, amount);
      });

      it('emits an approval event', async function () {
        const { logs } = await token.approve(spender, amount, { from: owner });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(amount));
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await token.approve(spender, 100, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('transfers the requested amount', async function () {
            await token.transferFrom(owner, to, amount, { from: spender });

            const senderBalance = await token.balanceOf(owner);
            senderBalance.should.be.bignumber.equal(initialBalanceWei.minus(amount));

            const recipientBalance = await token.balanceOf(to);
            assert.equal(recipientBalance, amount);
          });

          it('decreases the spender allowance', async function () {
            await token.transferFrom(owner, to, amount, { from: spender });

            const allowance = await token.allowance(owner, spender);
            assert(allowance.eq(0));
          });

          it('emits a transfer event', async function () {
            const { logs } = await token.transferFrom(owner, to, amount, { from: spender });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, 'Transfer');
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            assert(logs[0].args.value.eq(amount));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await token.approve(spender, 99, { from: owner });
        });

        describe('when the owner has enough balance', function () {
          const amount = 100;

          it('reverts', async function () {
            await assertRevert(token.transferFrom(owner, to, amount, { from: spender }));
          });
        });

        describe('when the owner does not have enough balance', function () {
          const amount = 101;

          it('reverts', async function () {
            await assertRevert(token.transferFrom(owner, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = 100;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await token.approve(spender, amount, { from: owner });
      });

      it('reverts', async function () {
        await assertRevert(token.transferFrom(owner, to, amount, { from: spender }));
      });
    });
  });

  describe('decrease approval', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        const amount = 100;

        it('emits an approval event', async function () {
          const { logs } = await token.decreaseApproval(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(0));
        });

        describe('when there was no approved amount before', function () {
          it('keeps the allowance to zero', async function () {
            await token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, amount + 1, { from: owner });
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, 1);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await token.decreaseApproval(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(0));
        });

        describe('when there was no approved amount before', function () {
          it('keeps the allowance to zero', async function () {
            await token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, amount + 1, { from: owner });
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await token.decreaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, 1);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('decreases the requested amount', async function () {
        await token.decreaseApproval(spender, amount, { from: owner });

        const allowance = await token.allowance(owner, spender);
        assert.equal(allowance, 0);
      });

      it('emits an approval event', async function () {
        const { logs } = await token.decreaseApproval(spender, amount, { from: owner });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(0));
      });
    });
  });

  describe('increase approval', function () {
    const amount = 100;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          const { logs } = await token.increaseApproval(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await token.increaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await token.increaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount + 1);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = 101;

        it('emits an approval event', async function () {
          const { logs } = await token.increaseApproval(spender, amount, { from: owner });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, 'Approval');
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert(logs[0].args.value.eq(amount));
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await token.increaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await token.increaseApproval(spender, amount, { from: owner });

            const allowance = await token.allowance(owner, spender);
            assert.equal(allowance, amount + 1);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('approves the requested amount', async function () {
        await token.increaseApproval(spender, amount, { from: owner });

        const allowance = await token.allowance(owner, spender);
        assert.equal(allowance, amount);
      });

      it('emits an approval event', async function () {
        const { logs } = await token.increaseApproval(spender, amount, { from: owner });

        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args.owner, owner);
        assert.equal(logs[0].args.spender, spender);
        assert(logs[0].args.value.eq(amount));
      });
    });
  });
});
