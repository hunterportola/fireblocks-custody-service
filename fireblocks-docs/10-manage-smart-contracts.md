# 10 Manage Smart Contracts

This document contains 4 sections related to 10 manage smart contracts.

## Table of Contents

1. [Interact With Smart Contracts](#interact-with-smart-contracts)
2. [Web3 Wallet Link](#web3-wallet-link)
3. [Ethereum Smart Contract Development](#ethereum-smart-contract-development)
4. [Ethereum Development](#ethereum-development)

---

## Interact With Smart Contracts {#interact-with-smart-contracts}

*Source: https://developers.fireblocks.com/docs/interact-with-smart-contracts*

Interact With Smart Contracts
Interaction with Smart Contracts
Interacting with a smart contract involves calling read or write methods on a specific contract. These functions can range from simple standard ERC-20 methods to complex smart contract logic invocations. Fireblocks offers several ways to interact with smart contracts:
Interact with a Deployed Smart Contract via the Fireblocks Console
- Learn more
here
.
Use the Fireblocks EVM Web3 Provider or Local JSON RPC Tools
.
Use the Fireblocks REST API
.
Using the Web3 Provider and Local JSON RPC Tools
These tools allow you to seamlessly integrate Fireblocks into your codebase.
EVM Web3 Provider
The EVM Web3 Provider is an EIP1193 compatible provider that can be integrated into your EVM client library (such as ethers, web3, viem) with a simple configuration.
📘
Learn more about the Web3 Provider in the
following developer guide
.
Local JSON RPC
Local JSON RPC provides the same functionality as the Web3 provider but is designed for customers who do not use JavaScript-based tools for their smart contract development and integration.
📘
Learn more about the Local JSON RPC in the
following developer guide
.
Using the Fireblocks REST API
Direct interaction with smart contracts via the Fireblocks API can be achieved by calling the Create Transaction API endpoint. To perform a contract call, set the
operation
parameter to
CONTRACT_CALL
and include the
contractCallData
parameter in the
extraParams
object of the POST request body.
The
contractCallData
value should be the hex-encoded data you want to pass to the contract. This can be structured using well-known libraries such as web3.js, ethers.js, or similar.
📘
Check out the
Create Transactions Developer Guide
.
Approve Amount Cap
In the ERC20 standard, the
approve
operation is a crucial function that allows a token owner to authorize another address (usually a smart contract) to spend a specified amount of tokens on their behalf. This function is commonly used in DeFi applications, token swaps, and other scenarios where tokens need to be managed by smart contracts.
How It Works
When you call the
approve
function, you specify two parameters:
spender
: The address that will be allowed to spend the tokens.
amount
: The maximum number of tokens that the
spender
is allowed to spend.
The
approve
function updates the allowance, which is the amount of tokens that the
spender
can use. This is recorded in the token contract’s internal mapping.
Example Use Case
Suppose you want to use a DeFi platform to lend your tokens. You would first call the
approve
function to allow the platform’s smart contract to transfer tokens from your address. Once approved, the platform can transfer the specified amount of tokens from your address to the lending pool.
The
Amount Cap
limits the amount smart contracts and third-party dApps may withdraw on your behalf. This reduces the risk associated with granting an unlimited approval amount. Transaction amounts are then automatically changed from the maximum amount to the user-specified limit for all Approve transactions created with dApps.
Learn more about limiting the
Amount Cap for Approve transactions
via the Fireblocks Console.
Updated
20 days ago
Tokenize Assets
Fetching Transaction Receipt
Table of Contents
Interaction with Smart Contracts
Using the Web3 Provider and Local JSON RPC Tools
Using the Fireblocks REST API
Approve Amount Cap

---

## Web3 Wallet Link {#web3-wallet-link}

*Source: https://developers.fireblocks.com/docs/web3-wallet-link*

Wallet Link
About the Fireblocks Wallet Link
As the demand for Web3 accessibility and usage grows, more users want to use dApps directly to manage their NFTs, get rewards, and more. The Fireblocks Wallet Link allows your users to connect their Fireblocks wallet addresses directly to Web3 applications (dApps), without your users needing to use their own wallet or any other application. This enables you to offer your users one-stop shopping for anything related to crypto and Web3.
Creating a Wallet Link connection
The Wallet Link currently supports
WalletConnect
connections. WalletConnect is a well-established standard for connecting wallets and Web3 applications and is supported by all of the leading dApps today.
When a user wants to connect to a dApp, they scan a QR code provided by WalletConnect inside the dApp. This QR code contains a URI that represents the connection session to be established between the dApp and the wallet. Passing this URI onto Fireblocks using the API allows the connection to be successful.
To initiate a new connection, pass the URI as follows.
JavaScript
const examplePayload = {  
	feeLevel: "MEDIUM", 
	vaultAccountId: 0,   
	uri: "wc:f61647f4-7f98-4cb7-95d2-1db8e58fb0bb@1?bridge=https%3A%2F%2Fv.bridge.walletconnect.org&key=d145d64bda22f2be8fb23c251116b0cd8e3613f6971d193ff89b24e6735aaa6c" // The WalletConnect QR code  
}

const connectionResponse: CreateWeb3ConnectionResponse = await fireblocks.createWeb3Connection("WalletConnect", payload);
📘
For Web3 connections from a Non Custodial Wallet, please use the payload below:
JavaScript
const examplePayload = {  
    feeLevel: "MEDIUM", 
    ncwId: "b8337f1d-bd61-4d6c-afc1-4c9d60aa2132",
    ncwAccountId: 0, // or any other account in the NCW
    uri: "wc:f61647f4-7f98-4cb7-95d2-1db8e58fb0bb@1?bridge=https%3A%2F%2Fv.bridge.walletconnect.org&key=d145d64bda22f2be8fb23c251116b0cd8e3613f6971d193ff89b24e6735aaa6c" // The WalletConnect QR code  
  }
The response from Fireblocks includes the relevant data about the connection, such as connection ID, dApp URL, and so on.
JavaScript
connectionResponse === {  
    id: "f3ca1e41-378e-4718-b8d3-51dddb3777d3",  
    sessionMetadata: { // Provided by the dApp  
        "appUrl": "https://www.someDapp.com",  
        "appName": "SomeDapp",  
        "appDescription": "SomeDapp is the best example dapp",  
        "appIcon": "https://static.fireblocks.io/prod/wcs/dappIcon/abc123"  
    }  
}
Approving a Web3 connection request
You can approve or reject the Web3 connection request based on the data in the connection response.
JavaScript
const approve = true;  
const result = await fireblocks.submitWeb3Connection("WalletConnect", connectionResponse.id, approve);
📘
Note
If you want to limit your users to only some dApps, simply reject connection requests from any unapproved dApp.
Listing connections
To list all your existing Web3 connections, run the following command:
JavaScript
const examplePayload = {  
    pageCursor: "SomePageCursor" // undefined for first page,  
    pageSize: 10,  
    filter: {  
        vaultAccountId: 0,  
        connectionMethod: "API"  
    },  
    sort: "createdAt",  
    order: "DESC"  
}

const response = await fireblocks.getWeb3Connections(examplePayload);

response.paging === { next:  "NextPageCursor" }  
const exampleSession: Session = response.data[0];

exampleSession === {  
    id: "f3ca1e41-378e-4718-b8d3-51dddb3777d3",  
    userId: "abc-123-456-def",  
    vaultAccountId: 0,  
    chainIds: ["ETH"],  
    feeLevel: "MEDIUM",  
    creationDate: "2023-03-08T11:20:13.823Z",  
    connectionType: "WalletConnect",  
    connectionMethod:"API",  
    sessionMetadata: {  
        "appUrl": "https://www.someDapp.com",  
        "appName": "SomeDapp",  
        "appDescription": "SomeDapp is the best example dapp",  
        "appIcon": "https://static.fireblocks.io/prod/wcs/dappIcon/abc123"  
    }  
}
Removing a connection
To remove a connection, run the following command:
JavaScript
const result = await fireblocks.removeWeb3Connection("WalletConnect", exampleSession.id);
Signing a dApp-originated transaction
Once connected to a dApp, the user can perform an action that will result in a signing operation by Fireblocks. This operation is created by the API user that created the Web3 connection and is subject to the
Policies
like any other operation.
In most cases, a transaction created by a dApp translates into a Contract Call transaction in Fireblocks. Some other operations that require signing on an
off-chain message
will result in a Typed message in Fireblocks, such as signing a registration message when logging into OpenSea.
Make sure to adjust your Policy rules accordingly. You can use the Policy as another layer of limitation by whitelisting the relevant contract addresses of any dApp you want to allow while preventing contract calls to any other contract to go through.
When working with an
API Co-Signer machine
, you can use the Callback Handler to let the user approve the transaction on their device before it is signed and broadcasted.
Updated
20 days ago
Network Link Integration Guide for Provider Connectivity
Off Exchange
Table of Contents
About the Fireblocks Wallet Link
Creating a Wallet Link connection
Approving a Web3 connection request
Listing connections
Removing a connection
Signing a dApp-originated transaction

---

## Ethereum Smart Contract Development {#ethereum-smart-contract-development}

*Source: https://developers.fireblocks.com/docs/ethereum-smart-contract-development*

Ethereum Smart Contract Development
Overview
Smart contract development frameworks make it easy to develop, test, and deploy smart contracts on EVM-based blockchains.
The following guide contains:
Deploy your contract by
using Hardhat
Deploy your contract by
using Truffle
Deploy your contract by
using Brownie
Deploy your contract by
using Foundry
Using Hardhat
Installing Hardhat
You can skip this section if you already have Hardhat installed or follow that
Hardhat Installation guide
on the Hardhat website for all details.
We provide you with a very basic process here for convenience:
Install the Hardhat package.
Shell
npm install --save-dev hardhat
Initialize a new Hardhat project using the following Hardhat command.
This creates a basic project for you to set up directories and configuration files.
Shell
npx hardhat
After executing the Hardhat command, this menu appears:
Shell
888    888                      888 888               888
888    888                      888 888               888
888    888                      888 888               888
8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888
888    888     "88b 888P"  d88" 888 888 "88b     "88b 888
888    888 .d888888 888    888  888 888  888 .d888888 888
888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.
888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888

👷 Welcome to Hardhat v2.10.1 👷‍

? What do you want to do? … 
❯ Create a JavaScript project
  Create a TypeScript project
  Create an empty hardhat.config.js
In this menu, select
Create a JavaScript project
and select
Enter
.
Select the current directory as your project base.
Type
Y
when asked to add a
.gitignore
file.
Type
Y
when asked to install this sample project’s dependencies with
npm
.
After you complete these steps, you'll have a new Hardhat project.
Hardhat integration
The
Fireblocks Hardhat Plugin
helps seamlessly integrate Fireblocks into your
Hardhat
development stack.
You can use it to deploy contracts, sign messages, and send transactions.
Installation
Shell
npm install @fireblocks/hardhat-fireblocks
Import the plugin into your
hardhat.config.js
or
hardhat.config.ts
file:
JavaScript
TypeScript
require("@fireblocks/hardhat-fireblocks");
const { ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider");
import "@fireblocks/hardhat-fireblocks";
import { ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";
Configuration
This plugin extends the
HttpNetworkUserConfig
object with an optional
fireblocks
field.
This is an example of how to set this up in your Hardhat configuration file:
JavaScript
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: "https://rpc.ankr.com/eth_goerli",
      fireblocks: {
        apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
        privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
        apiKey: process.env.FIREBLOCKS_API_KEY,
        vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
      }
    },
  },
};
If you are not using a Sandbox environment, but rather a regular one, just comment the apiBaseUrl line.
Delete the
Lock.sol
file that came with your Hardhat boilerplate template:
Shell
rm contracts/Lock.sol
Deploy Contract
Now that you have a Hardhat project set up, create your smart contract
contracts/hello.sol
in the project folder and then deploy it to the Goerli Ethereum Testnet.
Step 1: Create and compile the Solidity file
Solidity
pragma solidity ^0.8.17;

contract HelloWorld {
    string public greet = "Hello World!";
}
Run the following command to compile it:
Shell
npx hardhat compile
Step 2: Update the deployment script
Replace the contents of the
deploy.js
script with the following basic contract deployment flow:
JavaScript
const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("HelloWorld");
  const contract = await factory.deploy();

  await contract.deployed();

  console.log("contract deployed to:", contract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
Step 3: Deploy smart contract
Deploy your contract to the Ethereum Goerli Testnet:
Shell
npx hardhat run --network goerli scripts/deploy.js
Or:
Shell
HARDHAT_NETWORK=goerli node scripts/deploy.js
This should take a couple of minutes to run if everything was configured correctly.
Once the deploy script has finished running, you will see this message if the contract was deployed successfully:
Shell
contract deployed to: <contract_address>
Using Truffle
Use the
Fireblocks Web3 Provider
to seamlessly work with Truffle on top of Fireblocks.
Installation
Shell
npm install -g truffle
npm install @fireblocks/fireblocks-web3-provider
Configuration
Step 1:
Set the
environment variables
Step 2:
Initialize an example Truffle NFT project:
Shell
truffle unbox nft-box
Step 3:
Edit the
truffle-config.js
file:
JavaScript
require('dotenv').config();
const { FireblocksWeb3Provider, ChainId } = require("@fireblocks/fireblocks-web3-provider");

module.exports = {
  networks: {
    goerli: {
      provider: () => new FireblocksWeb3Provider({
        privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
        apiKey: process.env.FIREBLOCKS_API_KEY,
        vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
        chainId: ChainId.GOERLI,
      }),
      network_id: ChainId.GOERLI,
    },
  },
  compilers: {
    solc: {
      version: "0.8.13"
    }
  },
};
Usage:
Shell
truffle migrate --network goerli
Using Brownie
Use the
Fireblocks JSON-RPC
to seamlessly work with Brownie on top of Fireblocks.
Installation
Step 1 - Brownie installation:
Please follow the Brownie official
documentation
for installation
Step 2 - Install Fireblocks JSON RPC server:
Shell
npm install -g @fireblocks/fireblocks-json-rpc
Setup
Step 1 - Create a new example Brownie project:
Shell
brownie bake token
cd token
Step 2 - set environment variables:
Set the
environment variables
Step 3 - Add Fireblocks Goerli network to Brownie:
Shell
brownie networks add Fireblocks fireblocks-goerli name="Goerli (Fireblocks)" chainid=5 host='http://127.0.0.1:8545/${FIREBLOCKS_API_KEY}' timeout=600
Step 4 - Configure  brownie-config.yaml file:
Add
dotenv: .env
parameter to the config yaml file.
Example:
Text
# exclude SafeMath when calculating test coverage
# https://eth-brownie.readthedocs.io/en/v1.10.3/config.html#exclude_paths
reports:
  exclude_contracts:
    - SafeMath
dotenv: .env
Usage:
Shell
fireblocks-json-rpc -- brownie run --network fireblocks-goerli scripts/token.py
Using Foundry
Installing Foundry
You can skip this section if you already have Foundry installed or follow that
Foundry Installation guide
,
Foundry New Project guide
on the Foundry website for all details.
We provide you with a very basic process here for convenience:
Shell
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge init hello_foundry
cd hello_foundry
forge build
forge test
After you complete these steps, you'll have a new Foundry project.
Foundry integration
The
Fireblocks Local JSON-RPC
helps seamlessly integrate Fireblocks into your
Foundry
development stack.
You can use it to deploy contracts, sign messages, and send transactions.
Installation
Shell
npm install -g @fireblocks/fireblocks-json-rpc
Configuration
Configuration can be set via command line flags or environment variables.
Command line flags:
Ignore apiBaseUrl if you are not using a sandbox environment
Shell
fireblocks-json-rpc --apiKey <key> --privateKey <path_or_contents> --chainId <chainId> --apiBaseUrl https://sandbox-api.fireblocks.io
Environment variables:
Ignore FIREBLOCKS_API_BASE_URL if you are not using a sandbox environment
Shell
FIREBLOCKS_API_KEY=<key> \
FIREBLOCKS_API_PRIVATE_KEY_PATH=<path_or_contents> \
FIREBLOCKS_CHAIN_ID=<chainId> \
FIREBLOCKS_API_BASE_URL=https://sandbox-api.fireblocks.io
fireblocks-json-rpc
Delete the files that came with your Foundry boilerplate template:
Shell
rm test/Counter.t.sol script/Counter.s.sol src/Counter.sol
Deploy Contract - Using 'forge script'
Now that you have a Foundry project set up, create your smart contract
src/Hello.sol
in the project folder and then deploy it to the Goerli Ethereum Testnet.
Step 1: Create and compile the Solidity file
sol
pragma solidity ^0.8.17;

contract HelloWorld {
    string public greet = "Hello World!";
}
Run the following command to compile it:
Shell
forge build
Step 2: Create the deployment script
Create a deployment script
script/Hello.s.sol
:
sol
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "../src/Hello.sol";

contract MyScript is Script {
    function run() external {
        vm.startBroadcast();

        HelloWorld hello = new HelloWorld();

        vm.stopBroadcast();
    }
}
Step 3: Deploy smart contract
Deploy your contract to the Ethereum Goerli Testnet (It is recommended to use the
--slow
parameter in your forge script command, specifically when the script is processing few transactions sequentially):
Shell
FIREBLOCKS_API_KEY=12345678-1234-1234-1234-123456789abc \ 
FIREBLOCKS_API_PRIVATE_KEY_PATH=/path/to/secret.key \ 
FIREBLOCKS_CHAIN_ID=5 \
fireblocks-json-rpc --http -- \ 
forge script script/Hello.s.sol:MyScript \
--sender <sender_address> --slow --broadcast --unlocked --rpc-url {}
sender_address
can be found in your Fireblocks workspace, through Fireblocks API, or using the JSON RPC directly.
Get address of vault account 0:
Shell
FIREBLOCKS_API_KEY=12345678-1234-1234-1234-123456789abc \ 
FIREBLOCKS_API_PRIVATE_KEY_PATH=/path/to/secret.key \ 
FIREBLOCKS_CHAIN_ID=5 \
fireblocks-json-rpc --http --vaultAccountIds 0 -- curl {} \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_accounts","id":1,"jsonrpc":"2.0"}'
This should take a couple of minutes to run if everything was configured correctly.
Updated
20 days ago
Introduction
Table of Contents
Overview
Using Hardhat
Installing Hardhat
Hardhat integration
Deploy Contract
Using Truffle
Configuration
Using Brownie
Installation
Setup
Usage:
Using Foundry
Installing Foundry
Foundry integration
Deploy Contract - Using 'forge script'

---

## Ethereum Development {#ethereum-development}

*Source: https://developers.fireblocks.com/docs/ethereum-development*

Ethereum Development
Overview
Popular blockchain choices for building Web3 capabilities are based typically on the Ethereum Virtual Machine (EVM), and therefore share the development tech stack.
Some examples of EVM blockchains:
Ethereum
BNB Chain (BSC)
Polygon
Avalanche
Arbitrum
Convenience libraries
Most commonly, developers interact with EVM-based blockchains using "convenience libraries" such as
web3.js
and
ethers.js
.
To streamline your JavaScript development experience, we created the
Fireblocks Web3 Provider
, to easily connect
ethers.js
and
web3.js
to your Fireblocks workspace.
web3.js integration
The
Fireblocks Web3 Provider
helps seamlessly integrate Fireblocks into your
web3.js
development stack. Use it to deploy contracts, sign messages, and send transactions.
Installation
JavaScript
npm install @fireblocks/fireblocks-web3-provider web3
Setup
JavaScript
import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";

const eip1193Provider = new FireblocksWeb3Provider({
    apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
})
If you are not using a Sandbox environment, but rather a regular one, just comment the apiBaseUrl line.
Usage
JavaScript
import Web3 from "web3";

const web3 = new Web3(eip1193Provider);
Now you can use the
web3
object exactly as you normally would!
Example
In this example we are executing the 'approve' method of
USDC
(ERC20) token on Goerli by using web3.js and Fireblocks web3 provider.
JavaScript
const { FireblocksWeb3Provider, ChainId, ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider")
const Web3 = require("web3");

// Import the Goerli USDC ABI
const ABI = require("./USDC_GOERLI_ABI.json");

// Goerli USDC Contract Address
const CONTRACT_ADDRESS = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"

const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
 // apiBaseUrl: ApiBaseUrl.Sandbox // If using a sandbox workspace
});


(async() => {
  
  	const web3 = new Web3(eip1193Provider);
  	const myAddr = await web3.eth.getAccounts()
  	const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
  	const spenderAddr = "<spender_address>"

    // 1 USDC to approve 
    const amount = 1e6

    // Invoke approve method
    console.log(
        await contract.methods.approve(spenderAddr, amount).send({
            from: myAddr[0]
        })
    )

})().catch(error => {
    console.log(error)
});
ethers.js integration
The
Fireblocks Web3 Provider
helps seamlessly integrate Fireblocks into your
ethers.js
development stack.
You can use it to deploy contracts, sign messages, and send transactions.
Installation
JavaScript
npm install @fireblocks/fireblocks-web3-provider ethers@5
Setup
JavaScript
import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";

const eip1193Provider = new FireblocksWeb3Provider({
    apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
})
If you are not using a Sandbox environment, but rather a regular one, just comment the apiBaseUrl line.
Usage
JavaScript
import * as ethers from "ethers"

const provider = new ethers.providers.Web3Provider(eip1193Provider);
Now you can use the
provider
object exactly as you normally would!
Example
In this example we are executing the 'approve' method of
USDC
(ERC20) token on Goerli by using ethers.js and Fireblocks web3 provider.
JavaScript
const { FireblocksWeb3Provider, ChainId, ApiBaseUrl } = require("@fireblocks/fireblocks-web3-provider")
const ethers = require("ethers")

// Import the Goerli USDC ABI
const ABI = require("./USDC_GOERLI_ABI.json");

// Goerli USDC Contract Address
const CONTRACT_ADDRESS = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"

const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
 // apiBaseUrl: ApiBaseUrl.Sandbox // If using a sandbox workspace
});


(async() => {

    const provider = new ethers.providers.Web3Provider(eip1193Provider);
    const myContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider.getSigner());
    const spenderAddr = "<spender_address>"

    // 1 USDC to approve 
    const amount = 1e6

    // Invoke approve method
    const tx = await myContract.approve(
        spenderAddr,
        amount
    )
   
    console.log(JSON.stringify(tx, null, 2))

})().catch(error => {
    console.log(error)
});
Viem integration
The
Fireblocks Web3 Provider
helps seamlessly integrate Fireblocks into your
viem
development stack.
You can use it to deploy contracts, sign messages, and send transactions.
Installation
JavaScript
npm install @fireblocks/fireblocks-web3-provider viem
Setup
JavaScript
import { FireblocksWeb3Provider, ChainId, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";

const eip1193Provider = new FireblocksWeb3Provider({
    apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI,
})
If you are not using a Sandbox environment, but rather a regular one, just comment the apiBaseUrl line.
Usage
JavaScript
const { createWalletClient, custom } = require("viem")
const { goerli } = require("viem/chains")

const walletClient = createWalletClient({
    chain: goerli,
    transport: custom(eip1193Provider),
});
Now you can use the
walletClient
object exactly as you normally would!
Example
In this example we are executing the 'approve' method of
USDC
(ERC20) token on Goerli by using viem and Fireblocks web3 provider.
JavaScript
const { goerli } = require("viem/chains")
const {
  ChainId,
  FireblocksWeb3Provider,
  ApiBaseUrl
} = require("@fireblocks/fireblocks-web3-provider")

const { 
  createWalletClient, 
  custom, 
  createPublicClient, 
  http 
} = require("viem")


// Import the Goerli USDC ABI
const ABI = require("./USDC_GOERLI_ABI.json");

// Goerli USDC Contract Address
const CONTRACT_ADDRESS = '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'

(async () => {

  const spenderAddr = "<spender_addr>";
  
  // 1 USDC to approve
  const amount = 1e6;
  
  const eip1193Provider = new FireblocksWeb3Provider({
   // apiBaseUrl: ApiBaseUrl.Sandbox, // If using a sandbox workspace
    privateKey: process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH,
    apiKey: process.env.FIREBLOCKS_API_KEY,
    vaultAccountIds: process.env.FIREBLOCKS_VAULT_ACCOUNT_IDS,
    chainId: ChainId.GOERLI
  });
  
  // Create wallet client instance
  const walletClient = createWalletClient({
    chain: goerli,
    transport: custom(eip1193Provider),
  });
  
  // Create public client instance
  const publicClient = createPublicClient({
    chain: goerli,
    transport: http()
  })
  
  // Get my account's address
  const [ account ] = await walletClient.getAddresses();
  
  // Simulate the 'approve' call
  const { request } = await publicClient.simulateContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'approve',
    args: [spenderAddr, amount],
    account
  })

  // Execute approve call via Fireblocks
  await walletClient.writeContract(request)
})();
web3.py integration
Fireblocks JSON-RPC
helps seamlessly integrate Fireblocks into your web3.py development stack.
You can use it to deploy contracts, sign messages, and send transactions.
Installation
npm install -g @fireblocks/fireblocks-json-rpc
pip install web3
Setup
Set the
environment variables
.
Create
example.py
:
example.py
import json
import os
from datetime import datetime
from web3 import Web3

web3 = Web3(Web3.IPCProvider(os.environ['FIREBLOCKS_JSON_RPC_ADDRESS'], 60000*180))
web3.eth.defaultAccount = web3.eth.accounts[0]
CONTRACT_ADDRESS = Web3.toChecksumAddress("0x8A470A36a1BDE8B18949599a061892f6B2c4fFAb")
GREETER_ABI = json.loads('[{"inputs":[{"internalType":"string","name":"_greeting","type":"string"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"greet","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_greeting","type":"string"}],"name":"setGreeting","outputs":[],"stateMutability":"nonpayable","type":"function"}]')
GREETING = "Hello web3! By " + web3.eth.defaultAccount + " at " + str(datetime.now())

if __name__ == '__main__':
    print('last block number: ', web3.eth.blockNumber)
    for account in web3.eth.accounts:
        print('account: ', account)
        print('account balance: ', web3.fromWei(web3.eth.getBalance(account), "ether"), ' ETH\n')

    print('Greeter contract: https://goerli.etherscan.io/address/' + CONTRACT_ADDRESS)
   
  	contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=GREETER_ABI)

    print('Current greeting:', contract.functions.greet().call())
    
    print('Setting greeting to:', GREETING)
    tx_hash = contract.functions.setGreeting(GREETING).transact({'from':web3.eth.defaultAccount})
    print('Transaction signed and broadcasted: https://goerli.etherscan.io/tx/' + tx_hash.hex())
    print('Waiting for transaction to be mined...')
    web3.eth.wait_for_transaction_receipt(tx_hash)

    print('Current greeting:', contract.functions.greet().call())
Usage
fireblocks-json-rpc -- python example.py
You can now use the
web3
object exactly as you normally would!
ethers-rs integration
A community developed project implemented an ethers-fireblocks integration for the popular
etheres-rs
convenience library. More details and an example of usage is in the
Rust Guide
.
Updated
20 days ago
Introduction
Table of Contents
Overview
Convenience libraries
web3.js integration
ethers.js integration
Viem integration
web3.py integration
ethers-rs integration

---

