const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const { interface, bytecode } = require("../compile");

const web3 = new Web3(ganache.provider());

let accounts;
let lottery;

beforeEach(async () => {
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();

  // Use one those accounts to deploy
  // the contract
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({
      data: bytecode,
    })
    .send({
      from: accounts[0],
      gas: "1000000",
    });
});

describe("Lottery Contract", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("allows one account to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("1", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple account to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("1", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[3],
      value: web3.utils.toWei("1", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[4],
      value: web3.utils.toWei("1", "ether"),
    });

    await lottery.methods.enter().send({
      from: accounts[5],
      value: web3.utils.toWei("1", "ether"),
    });

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });

    assert.equal(accounts[2], players[0]);
    assert.equal(accounts[3], players[1]);
    assert.equal(accounts[4], players[2]);
    assert.equal(accounts[5], players[3]);
    assert.equal(4, players.length);
  });

  it("can enter the lottery", async () => {
    await lottery.methods.enter().send({
      from: accounts[1],
      gas: 1000000,
      value: web3.utils.toWei("1", "ether"),
    });

    const players = await lottery.methods.getPlayers().call();

    assert(players.indexOf(accounts[1]) !== -1);
  });

  it("can get players", async () => {
    const players = await lottery.methods.getPlayers().call();
    assert.ok(players);
  });

  it("requires a minimum amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 10,
      });

      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("only manager can call pick winner", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });

      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("sends money to the winner and resets the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    const initBalance = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });

    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initBalance;
    assert(difference > web3.utils.toWei("1.8", "ether"));
  });
});
