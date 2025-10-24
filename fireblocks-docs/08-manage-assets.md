# 08 Manage Assets

This document contains 6 sections related to 08 manage assets.

## Table of Contents

1. [Add Your Tokens 1](#add-your-tokens-1)
2. [Issue New Tokens](#issue-new-tokens)
3. [Tokenization](#tokenization)
4. [Minting An Nft](#minting-an-nft)
5. [List Supported Assets 1](#list-supported-assets-1)
6. [Deploying An Nft Collection](#deploying-an-nft-collection)

---

## Add Your Tokens 1 {#add-your-tokens-1}

*Source: https://developers.fireblocks.com/docs/add-your-tokens-1*

Add Tokens
EVM Assets
Fireblocks supports Ethereum Virtual Machine (EVM) assets across all Fireblocks workspaces.
What standards are supported?
Originally defined for the Ethereum blockchain, the
ERC-20
token standard provides a standard interface to implement transferable tokens within smart contracts. ERC-20 is used on EVM blockchains such as Arbitrum C-Chain (ARC-20), Binance Smart Chain (BEP-20), Polygon (MRC-20), and all other EVM blockchain networks supported by Fireblocks.
Fireblocks also supports token formats that adhere to the ERC-20 standard, including ERC-1400 and ERC-1404. You can view a list of all the supported EVM blockchains when you add a new ERC-20 asset to a workspace.
How to add EVM tokens to a workspace?
There are three ways to add EVM tokens to your workspace:
Via the Fireblocks Console - visit the
following guide
to learn about adding EVM tokens via the console
Via the Fireblocks API - check out the
following developers guide
for adding EVM tokens to your workspace
Via Contract Calls - an opt-in feature that requires Fireblocks Support. Once enabled, ERC-20 assets transferred in a contract call you initiated are automatically added to the workspace that initiated the contract call. A notification in the Fireblocks Console lets you know when a new ERC-20 asset has been automatically added to your workspace. Learn more
here
.
Non EVM Assets
Fireblocks supports certain non-EVM assets across all Fireblocks workspaces.
What standards are supported?
You can list additional assets on these non-EVM blockchains:
Algorand (ASA)
Digital Bits (XDB)
Hedera (ERC-20)
NEAR (NEP141)
Ripple
Solana (SPL)
Stellar
Tezos (FA1.2, FA2)
TRON (TRC-20)
How to add non-EVM assets to a workspace?
Depending on the asset, you can add non-EVM assets to your workspace using one of these methods:
Via the Fireblocks Console - learn more
here
Via the Fireblocks API - check out the
following developers guide
for adding Non EVM tokens to your workpace
Via Fireblocks Support - Contact Fireblocks Support to add an unlisted asset on one of these blockchains to your workspace. You must provide a link to the token's page from the relevant block explorer:
DigitalBits
Hedera
Ripple
Tezos
Depending on the token requested, Fireblocks may make the token available to all Fireblocks customers or only to your workspaces.
Updated
20 days ago
Get Supported Assets
Use API Co-signers for Signing and Approval Automation
Table of Contents
EVM Assets
Non EVM Assets

---

## Issue New Tokens {#issue-new-tokens}

*Source: https://developers.fireblocks.com/docs/issue-new-tokens*

Tokenize Assets
Overview
Tokenization is the representation of an asset, which could be a real-world physical asset or a digitally native one, on a distributed ledger. Tokens represent ownership, control, claim, or a right to the underlying asset or service. With Fireblocks, you can issue and manage tokens for your specific use case, such as stablecoins, carbon credits, in-game assets, concert tickets, real estate, memorabilia, artwork, NFTs, or any other asset you want to tokenize.
Tokenization in Fireblocks
📘
Tokenization is a premium feature that requires an additional purchase. If you don’t have access to this feature, contact your Customer Success Manager to discuss having it enabled in your Fireblocks workspace.
The Tokenization feature allows you to deploy and manage tokenized assets and their lifecycle via the Fireblocks Console or the Fireblocks API.
Supported assets and blockchains
Fireblocks supports token issuance and management for the following networks and assets:
All EVM-compatible blockchains supported by Fireblocks
Stellar
Ripple
Token lifecycle management
Generally, a token's lifecycle involves:
Issuing new tokens or linking previously issued tokens.
Viewing token information on the Tokenization page.
Executing operations (minting, distributing, burning, etc.).
You can manage the tokens in your workspace using:
The Fireblocks Console
📘
Learn more about Tokenization in the Fireblocks Console
here
EVM blockchains: You can call any smart contract function, such as minting and burning, for your EVM-based tokens on the Tokenization page.
Stellar and Ripple: You can issue, mint, burn, and transfer tokens on the Tokenization page. You can also create wallets with automatically established trustlines (an explicit opt-in to hold the token).
All supported assets: You can link tokens on the Tokenization page, where you can view detailed information about each of them.
The Fireblocks API
EVM blockchains: You can mint, burn, and transfer tokens using specific API operations. For all other operations, you can use contract calls.
Stellar and Ripple: You can issue, mint, burn, and transfer tokens. You can also create wallets with automatically established trustlines.
📘
Explore the
Tokenization APIs
in the Fireblocks API Reference
Updated
20 days ago
Configuring Multiple API Co-signers in High Availability
Interact With Smart Contracts
Table of Contents
Overview
Tokenization in Fireblocks
Supported assets and blockchains
Token lifecycle management

---

## Tokenization {#tokenization}

*Source: https://developers.fireblocks.com/docs/tokenization*

Tokenization
Deploy, manage, mint, and burn custom tokenized on-chain assets securely using the Fireblocks API
What is Tokenization?
The Fireblocks asset tokenization platform is a secure and compliant way to digitalize assets and build blockchain-based applications. Our REST API provides powerful capabilities for automating tasks like creating, redeeming, managing, and issuing tokens, such as stablecoins or security tokens.
Start developing on Fireblocks today
.
Launch your tokenization project with Fireblocks API
You can use our Fireblocks API for tokenization in different ways:
Tokenize any asset, including fiat currencies, securities, and other illiquid assets
Mint new tokens
Manage smart contracts and whitelisting approval
Execute any smart contract function
Secure custody of your tokens
Trade your tokens on exchanges or through peer-to-peer (P2P) transactions
Burn tokens that are no longer needed to manage the token supply
Integrate with other DeFi applications
With the Fireblocks asset tokenization platform, you can use our API to automate minting and token issuance 24/7. You can also manage your daily token operations using our easy-to-use dashboard.
Learn about
our turnkey solution
.
Guides
Raw Message Signing
Support more chains and actions. Generate ECDSA and EdDSA signatures to
sign any transaction type or message
.
Typed Message Signing
Allows you to
sign messages using specific standard formats
that prefix the message with a magic string. For ETH_MESSAGE and EIP712 messages.
Creating Vaults and Wallets
Generate Fireblocks vault accounts and asset wallets
at scale for both account-based and UTXO asset wallet types using the Fireblocks API and SDKs.
Whitelisting External Wallets
Use API calls and endpoints that
whitelist external wallet addresses
so that you can send transactions from wallets that exist outside your Fireblocks Vault.
Minting an NFT
Mint and verify Non-Fungible Tokens (NFT)
for your NFT collection using the Fireblocks Hardhat Plugin or Web3 Provider.
Ethereum Smart Contract Development
Smart contract development frameworks to
develop, test, and deploy smart contracts on EVM-based blockchains
easily. Four different ways to deploy your contracts.
Developer Community
Want to learn more from Fireblocks knowledge experts and other developers?
Join our developer community today
!
Updated
20 days ago
Self-Custody Infrastructure
Treasury Management
Table of Contents
What is Tokenization?
Launch your tokenization project with Fireblocks API
Guides
Raw Message Signing
Typed Message Signing
Creating Vaults and Wallets
Whitelisting External Wallets
Minting an NFT
Ethereum Smart Contract Development
Developer Community

---

## Minting An Nft {#minting-an-nft}

*Source: https://developers.fireblocks.com/docs/minting-an-nft*

Minting an NFT
Prerequisites
Introduction
Quickstart guide
or
Developer Sandbox Quickstart
Deploying an NFT Collection
Overview
You can mint your NFT using one of the following:
The Fireblocks DeFi JavaScript SDK
The Fireblocks DeFi Python SDK
The Fireblocks Hardhat plugin integration
Minting your NFT
First, upload an image of your newly almost minted NFT. The minting function will receive it as one of its parameters.
📘
Image hosting options
You can upload your selected image using any image-hosting site.
While not covered in this guide, another option would be to use a system like
IPFS protocol
to store your image on-chain as a decentralized solution.
Then we call upon the function while passing these values with it.
Parameter
Description
sender
The transaction signer address (your address)
tokenId
The ID value of the newly minted NFT
uri
The NFT's name, description, properties, and image location
Now we will choose to either use Hardhat or the Fireblocks DeFi SDK for the actual deployment. First, we need to make sure they are well set up as described in the
Ethereum Smart Contract Development
guide and then we follow the steps of the chosen framework.
Using Hardhat
🚧
Hardhat Runtime Environment required
We specifically require the Hardhat Runtime Environment.
This is optional but useful for running the script in a standalone fashion through
node <script>
.
You can also run a script with
npx hardhat run <script>
. If you run that script, Hardhat will compile your contracts, add the Hardhat Runtime Environment's members to the global scope, and execute the script.
In the scripts directory, create a new minting script titled:
scripts/mint.js
JavaScript
const hre = require("hardhat");
const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

async function main() {
  const collectionAddress = "<CONTRACT_ADDRESS>";
  const signer = await hre.ethers.getSigner()
  const signerAdderss = await signer.getAddress()
  const nftContract = await hre.ethers.getContractAt("<COLLECTION_NAME>", collectionAddress, signer);
  const tokenData = {
    "name": "<NFT_NAME>",
    "image": "<IMAGE_URL>",
  }

  const tokenURI = parser.format('.json', JSON.stringify(tokenData)).content
  
  const tx = await nftContract.safeMint(signerAdderss, tokenURI);
  await tx.wait()

  console.log("A new NFT has been minted to:", signerAdderss);
  // console.log("tokenURI:", await nftContract.tokenURI(0))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
Using the Fireblocks DeFi SDK
🚧
Deprecation notice
The Fireblocks DeFi SDK has been deprecated. We recommend using the new
Fireblocks Web3 Provider
.
Fireblocks DeFi SDK instructions
You should already have the contract object and the bridge object from the deployment phase of the contract. Now, create another transaction that represents the minting you want to perform.
JavaScript
Python
const sender = "<your_address>"
const tokenId = 0
const uri = {
    "name": "<NFT_NAME>,
    "image": "<IMAGE_URL>",
}
Const myTx = myContract.populateTransaction.mint(sender, tokenId, uri)

bridge.sendTransaction(myTx).then(res => {
   console.log(res)
})
my_tx = my_contract.functions.mint(sender,
                                  1,
                                  “”"{“name”: “<NFT_NAME>", “image”: “<IMAGE_URL>“,}“”").buildTransaction(
   {“from”: sender,
    “to”: my_bridge.web_provider.toChecksumAddress(my_bridge.external_wallet_address)})

print(my_bridge.send_transaction(my_tx, "Fireblocks Python DeFi SDK Mint"))
Verify your NFT
Now that you have your very own NFT collection, verify it on your Fireblocks workspace and the NFT marketplace
Rarible
.
In your Fireblocks workspace
Log in to your Fireblocks Console to see whether the last transaction was completed successfully. It will be a
Contract Call
type.
On Rarible
Visit Rarible using the following URL:
https://testnet.rarible.com/user/your_wallet_address/owned
Look for your NFT collection in your Rarible account.
📘
Note
The
your_wallet_address
value is the address you used to receive the NFT (the vault that deployed the contract).
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Minting your NFT
Using Hardhat
Using the Fireblocks DeFi SDK
Verify your NFT
In your Fireblocks workspace
On Rarible

---

## List Supported Assets 1 {#list-supported-assets-1}

*Source: https://developers.fireblocks.com/docs/list-supported-assets-1*

Get Supported Assets
Fireblocks supports thousands of assets across dozens of supported blockchain networks, observes trends in the blockchain world, and frequently adds global support for new assets. All supported assets have the same name and asset ID across all customer workspaces where they are available.
Globally supported assets are available by default when creating new asset wallets in any Fireblocks workspace. They are displayed in the public list of all
Fireblocks supported assets
. The public list is refreshed monthly.
Locally supported assets only appear in Fireblocks workspaces that have manually added or requested them. They are available to transfer to any destination that supports them. Confirm support with a counterparty before transferring local assets to a Fireblocks Network destination. Learn more about adding ERC-20 tokens or adding non-EVM tokens to your workspace.
The most accurate way to see all supported assets in your workspace is by using the Fireblocks API as described in the
following developer guide
.
📘
Learn more about globally supported assets in Fireblocks
here
Updated
20 days ago
Stake Assets
Add Tokens

---

## Deploying An Nft Collection {#deploying-an-nft-collection}

*Source: https://developers.fireblocks.com/docs/deploying-an-nft-collection*

Deploying an NFT Collection
Prerequisites
Introduction
Quickstart guide
Ethereum Smart Contract Development
Overview
You can deploy smart contracts using
The Fireblocks Hardhat plugin integration
Create your ERC-721 collection
You can create your own NFT collection using the common ERC-721 standard.
For this example, we’ll name our collection “Space Bunnies”.
There are some great tools to help you do this pretty easily. This example was pre-generated using the
Contracts Wizard by OpenZeppelin
.
Solidity
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SpaceBunnies is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Space Bunnies", "SPCB") {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
📘
OpenZeppelin required
To run the generated code, you also need to install the OpenZeppelin contracts package from NPM.
In your project directory, run:
npm install @openzeppelin/contracts
.
You are ready to go!
Check out the
Ethereum Smart Contract Development guide
. Make sure you go through it and deploy the above contract as explained there, using your choice of available options.
💫
Hardhat Deployment
Hardhat is the go-to market solution for easily deploying contracts. We highly recommend that you choose this option if you feel comfortable with going through the configuration process.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Create your ERC-721 collection

---

