require("dotenv").config();
const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile");

const provider = new HDWalletProvider(
  process.env.ACCOUNT_MNEMONIC,
  process.env.INFURA_ENDPOINT_URL
);

const web3 = new Web3(provider);

(async function () {
    const accounts = await web3.eth.getAccounts();
  
    console.log("attempting to deploy from account", accounts[0]);
  
    const result = await new web3.eth.Contract(JSON.parse(interface))
      .deploy({
        data: bytecode,
      })
      .send({ gas: "100000", gasPrice: "5000000000", from: accounts[0] });
  
    console.log("Contract deployed to", result.options.address);
  })();
  