# 03 Manage Wallets

This document contains 7 sections related to 03 manage wallets.

## Table of Contents

1. [Whitelisting External Wallets](#whitelisting-external-wallets)
2. [Whitelist Addresses](#whitelist-addresses)
3. [Create Embedded Wallets](#create-embedded-wallets)
4. [Wallet As A Service](#wallet-as-a-service)
5. [Create Direct Custody Wallets](#create-direct-custody-wallets)
6. [Creating Vaults And Wallets](#creating-vaults-and-wallets)
7. [Creating An Omnibus Vault Structure](#creating-an-omnibus-vault-structure)

---

## Whitelisting External Wallets {#whitelisting-external-wallets}

*Source: https://developers.fireblocks.com/docs/whitelisting-external-wallets*

Whitelisting External Wallets
Prerequisites
Introduction
Fireblocks Object Model
Quickstart guide
or
Developer Sandbox Quickstart
API / SDK Overview
Overview
Whitelisted addresses are deposit addresses that exist outside of your Fireblocks Vault. Your Fireblocks workspace utilizes a hierarchy of containers such as Vault accounts and Internal or External wallets as well as Contract wallets, as part of its
Object Model
.
You can perform transactions from your workspace by whitelisting addresses for any supported blockchain or fiat account.
Vault account
addresses are in your control using the Fireblocks Console and don't require whitelisting.
Internal wallet
addresses are those in your control but outside of Fireblocks.
External wallet
addresses can hold multiple assets and are managed by clients and counterparties.
Contract wallet
addresses are smart contracts that you want to interact with. Contract wallet addresses only apply to smart contracts on EVM-compatible blockchains.
This wallet hierarchy lets you segregate funds belonging to different business units or deposited by different users.
📘
Transfering assets to an External wallet
To transfer to an external wallet, you must provide your destination target's wallet ID (
walletId
) and asset ID (
assetId
).
Creating an External wallet
Creating an External wallet requires you to provide its name (as a string) that is used to identify the wallet and its addresses throughout your workspace.
Unlike Vault accounts, External wallets can hold only one asset wallet address for either Account-based or UTXO wallets.
🚧
Wallet naming is permanent
Wallet names can't be changed after they're created.
An optional
customerRefId
string can also be passed as the ID that AML providers may use to associate the owner of funds with transactions.
createExternalWallet
function
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createExternalWallet = async (
	name: string
):Promise<UnmanagedWallet | undefined> => {
  try {
    const transactionResponse = await fireblocks.externalWallets.createExternalWallet(
      {
				createWalletRequest:
				{
					name
        }
      }
		);
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  }
	catch(error) {
  	console.error(error);
  }
};
createExternalWallet("Counter-Party Wallet #1")
async function createExternalWallet(name){
    const externalWallet = await fireblocks.createExternalWallet(name);
    console.log(JSON.stringify(externalWallet, null, 2));
}
createExternalWallet("Counter-Party Wallet #1");
def create_external_wallet(name: str, customer_ref_id="") -> str:
    external_wallet = fireblocks.create_external_wallet(name, customer_ref_id)
    pprint(external_wallet)

create_external_wallet("Counter-Party Wallet #1")
Adding assets to an External wallet
To add the address of an asset to your External wallet, provide the External wallet's ID, the asset ID, and the specific destination address you wish to whitelist.
The External wallet's ID is shown in the Console after running the
createExternalWallet function
above or by calling the
List external wallets
endpoint.
The asset ID is used by Fireblocks to represent the specific supported asset (such as ETH, BTC, USDC etc.) by its ID . You can get all supported asset IDs by calling the
Supported assets
endpoint. The
id
value will display them as a short string.
The address you provide should be a string with the valid address existing on the network for that specific asset.
The
tag
string parameter sent with this function represents the tags, memos, or notes that are coupled with the addresses of XRP, EOS, HBAR, XDB, XLM, and ALGO networks.
For XRP wallets, use the address's destination tag;
For ATOM, EOS, HBAR, LUNA, LUNC, XDB, XEM, use the address's memo.
For XLM, use the address's memo_text
For ALGO, use the address's note
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createExternalWalletAsset = async (
  walletId: string,
  assetId: string,
  address: string,
  tag: string,
): Promise<FireblocksResponse<ExternalWalletAsset> | undefined> => {
  try {
    const transactionResponse =
      await fireblocks.externalWallets.addAssetToExternalWallet({
        walletId: walletId,
        assetId: assetId,
        addAssetToExternalWalletRequest: {
          address,
          tag,
        },
      });
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse;
  } catch (error) {
    console.error(error);
  }
};

createExternalWalletAsset(
  "5023b722-0cd5-402d-b1f9-94723b28237a",
  "ETH_TEST5",
  "0xEA6A3E367e96521fD9E8296425a44EFa6aee82da",
  "test",
);
async function createExternalWalletAsset(walletContainerId, assetId, address, tag){
    const externalWalletAsset = await fireblocks.createExternalWalletAsset(walletContainerId, assetId, address, tag);
    console.log(JSON.stringify(externalWalletAsset, null, 2));
}

createExternalWalletAsset("d01b9b9f-4c3b-425c-8f8b-78b3f5734549", "ETH", "0xEA6A3E367e96521fD9E8296425a44EFa6aee82da", "test");
def add_internal_wallet(walletId: str, assetId: str, address: str, tag="") -> str:
    internalWalletAsset = fireblocks.create_internal_wallet_asset(walletId, assetId, address, tag)
    pprint(internalWalletAsset)
    
add_internal_wallet("02ec0271-95c9-36e0-fa55-b3a9a6562531","ETH_TEST","EA6A3E367e96521fD9E8296425a44EFa6aee82da")
📘
Admin Quorum approval required to whitelist.
The
Admin Quorum
must approve the new whitelisted address before transfers may be sent to it from your workspace.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Creating an External wallet
Adding assets to an External wallet

---

## Whitelist Addresses {#whitelist-addresses}

*Source: https://developers.fireblocks.com/docs/whitelist-addresses*

Manage Destination Addresses
Overview
To improve the security of transactions from your workspace, we recommend whitelisting destination addresses.
Whitelisting addresses is a general security best practice that helps prevent potential loss of funds. It protects against issues such as malicious address manipulation or human error, like copying and pasting the wrong address and inadvertently sending funds to an unintended recipient.
Each whitelisting request needs approval from the Admin Quorum before funds can be transferred to that address. If any admin rejects the request, the address will not be whitelisted. However, you can submit a new request to whitelist the same address, which can be approved by the Admin Quorum at any time.
In Fireblocks, there are three types of whitelisted address entities, each capable of holding different asset addresses:
External Wallets
Internal Wallets
Contracts
👍
Best Practice
If you interact with a specific address multiple times, it should be added to the whitelisted addresses in your workspace.
🚧
Default Behavior
By default, to send funds to an address outside of Fireblocks, the address must first be whitelisted. If you want to permit transactions to non-whitelisted addresses, you should enable the
One Time Address (OTA) feature
in your workspace.
Whitelisted Addresses Types
External Wallets
External Wallets are entities that hold addresses external to your Fireblocks workspace and are not under your ownership. These addresses belong to your clients or counterparties. If you intend to whitelist an address that is not under your control, it should be added to the External Wallet entity. Note that External Wallet addresses do not display the on-chain balance of the whitelisted address.
Internal Wallets
Internal Wallets are entities that hold addresses external to your Fireblocks workspace but are under your ownership. These addresses belong to your other wallets outside of Fireblocks. If you intend to whitelist a wallet address under your control that is outside of Fireblocks, it should be added to the Internal Wallet entity.
Contracts
Contract Wallets are entities that hold whitelisted contract addresses. If you interact with smart contracts and want to restrict the approved list of contracts, you should whitelist the contract addresses under the Contract Wallet entity.
Whitelisting at Scale
For businesses with a high volume of outgoing transactions in their fully automated workflows, whitelisting every external address can be cumbersome and disrupt the automation. To address this while maintaining high security standards, you can use one of the following approaches:
API Key with Admin Permissions:
Create an API Key with admin permissions and set the required
approval group
for the whitelisting operation to
1
.
Pair the API Key with an API Cosigner and create a Cosigner Callback Handler server on your end, connecting it to your Cosigner.
In this setup, you can call the whitelisting address APIs before each transaction while the approval will be fully automated by the API Key acting as part of the admin quorum.
Additionally, each request will be sent to your callback handler, allowing you to programmatically decide whether the address should be whitelisted.
Fireblocks One Time Address Feature:
Utilize the Fireblocks One Time Address (OTA) feature to send funds to a non-whitelisted address. This can be done by combining the appropriate Policy rules and potentially implementing internal validations on your callback handler.
Work with One Time Addresses
The One Time Address (OTA) feature lets you transfer assets to non-whitelisted addresses in your Fireblocks workspace.
Unlike whitelisted addresses, one-time addresses do not require approval by the Admin Quorum to transfer funds to them. However, enabling the OTA feature requires approval by the workspace Owner and the Admin Quorum.
You can enable the OTA feature
via the Fireblocks Console
or the
Fireblocks API
.
🚧
This feature poses security risks!
We recommend
setting up a strict Policy
before enabling it. You can set a variety of such Policy protective limitations, such as:
Restricting one-time address transfers only to certain preselected users or groups
Requiring approval for one-time address transfers above a certain threshold
Updated
20 days ago
Associate End Clients
Estimate Transaction Fees
Table of Contents
Overview
Whitelisted Addresses Types
External Wallets
Internal Wallets
Contracts
Whitelisting at Scale
Work with One Time Addresses

---

## Create Embedded Wallets {#create-embedded-wallets}

*Source: https://developers.fireblocks.com/docs/create-embedded-wallets*

Create Embedded Wallets
The Fireblocks Embedded Wallets (EW) solution allows you to manage digital assets securely and effectively by granting end users full control over their funds or tokens without reliance on a third-party custodian.
The Fireblocks EW comes with native web and mobile Software Development Kits (SDKs), which businesses can seamlessly integrate into their existing applications. This integration provides a safeguarded and smooth method for storing and overseeing digital assets.
Employing multi-party computation (MPC) technology, the Fireblocks EW prioritizes the security and privacy of users' funds. Through MPC, end users maintain control over their private keys and benefit from an uncomplicated backup and recovery process.
The Fireblocks EW can be customized to meet your business needs, preferences, and requirements. The solution equips developers with foundational building blocks for completing key tasks, such as generating keys, signing transactions, and managing wallet balances. These building blocks give developers the flexibility to create custom product flows that integrate with their application's existing design and user interface. This adaptability empowers businesses to distinguish their product offerings, provide unique experiences for their users, and uphold competitiveness within the market.
📘
Learn more about Fireblocks Embedded Wallets
here
Updated
20 days ago
Create Direct Custody Wallets
Deposit Control & Confirmation Policy

---

## Wallet As A Service {#wallet-as-a-service}

*Source: https://developers.fireblocks.com/docs/wallet-as-a-service*

Wallet-as-a-Service
Easily build and integrate custom, secure wallets into your application with Fireblocks' Wallet-as-a-Service API
What is Wallet-as-a-Service?
Fireblocks Wallet-as-a-Service (WaaS) is an API-based solution that includes the most secure MPC wallets by design. Our APIs generate ECDSA and EdDSA signatures to sign any transaction. It enables anyone to create, manage, and secure wallets for any number of users without performing the security work themselves.
Start developing on Fireblocks today
.
Manage your digital assets with Fireblocks WaaS
You can easily plug and play Fireblocks Wallet-as-a-Service into your app — allowing your users to own and store digital assets — or facilitate your users to buy, sell, and trade cryptocurrencies, all with our self-custody solutions:
Scale without sacrificing security:
With our secure MPC wallets, you can create, manage, and secure deposits for any number of end-users in a compliant and reliable manner.
Supports businesses of all sizes:
Our WaaS product is compatible with various industries, including retail service, web3 companies, financial services and banking, exchanges, and financial market infrastructures.
Native support for 40+ blockchains:
Store your assets on the blockchain of your choice. And even if we don't support your blockchain, we offer raw signing so you can securely manage assets.
Monitor statuses of your transactions:
Using our tools like transaction status API, webhooks, and transaction history, you can stay up-to-date on the progress of your transactions and take action as needed.
Policy Engine:
Protect your custody from internal collusion, human error, and external attacks.
With the Fireblocks API, you can manage your workspace, automate your transaction flow, or use webhooks to receive push notifications on what's happening in your workspace. And in addition to the APIs, our Console can help monitor transactions and audits securely and reliably.
Learn more about
Fireblocks Wallet-as-a-Service
.
Guides
Deploying an NFT collection
Create an NFT collection using the ERC-721 standard and
deploy it with Fireblocks Hardhat Plugin
.
Creating Vaults and Wallets
Generate Fireblocks vault accounts and asset wallets
at scale for both account-based and UTXO asset wallet types using the Fireblocks API and SDKs.
Minting an NFT
Mint and verify Non-Fungible Tokens (NFT)
for your NFT collection using the Fireblocks Hardhat Plugin or Web3 Provider.
Raw Message Signing
Support more chains and actions. Generate ECDSA and EdDSA signatures to
sign any transaction type or message
.
Typed Message Signing
Allows you to
sign messages using specific standard formats
that prefix the message with a magic string. For ETH_MESSAGE and EIP712 messages.
Creating a Transaction
Use transaction API calls to
initiate any Fireblocks transaction operation type
, such as transfer, mint, burn, contract call, RAW, and more.
Developer Community
Want to learn more from Fireblocks knowledge experts and other developers?
Join our developer community today
!
Updated
20 days ago
Explore Use Cases
Self-Custody Infrastructure
Table of Contents
What is Wallet-as-a-Service?
Manage your digital assets with Fireblocks WaaS
Guides
Deploying an NFT collection
Creating Vaults and Wallets
Minting an NFT
Raw Message Signing
Typed Message Signing
Creating a Transaction
Developer Community

---

## Create Direct Custody Wallets {#create-direct-custody-wallets}

*Source: https://developers.fireblocks.com/docs/create-direct-custody-wallets*

Create Direct Custody Wallets
Overview
In general, the Fireblocks platform consists of workspaces, vault accounts, vault wallets, and deposit addresses.
This diagram shows the overall account structure in Fireblocks and the underlying wallet structure.
At the top level, your various Fireblocks workspaces are contained within the logical group called the Customer Domain. These workspaces may be hot workspaces, which contain hot wallets, or cold workspaces, which contain cold wallets.
In your Fireblocks workspace, you can create and manage multiple vault accounts, which contain your vault wallets.
📘
Currently, each vault account can only contain a single vault wallet for each asset type.
For each vault wallet, there are one or more deposit addresses. For UTXO-based assets, such as Bitcoin, a single vault wallet may generate one or more deposit addresses. For account-based assets, there are two options:
Account-based assets without tag/memo support, such as ETH, can only generate one deposit address.
Account-based assets with tag/memo support, such as XRP, can generate one or more deposit addresses. Each deposit address has the same on-chain address. However, they differ by their tag/memo.
Types of Vault Structures
Fireblocks recommends structuring your vault accounts using one of two methods: omnibus or segregated. The diagram below describes the advantages and disadvantages of each structure.
Omnibus structure
The omnibus structure consists of a central vault account, deposits vault account for UTXO and Tag/Memo based assets and vault accounts for each end-client for account based assets.
Funds are deposited into the individual vault accounts or to the deposits vault account, depending on the asset type, and then swept to the central vault account, where the funds can be invested.
Address creation flows
For extended documentation, see
Best Practices for Structuring Your Fireblocks Vault
.
Some notes on information presented in the above Help Center article:
Omnibus and segregated account structures are independent of whether you have a hot or cold workspace. Both account structures can be implemented in either workspace type.
Workspaces can contain both an omnibus and segregated account models. There is no limitation for a workspace to contain one specific account model.
Below are some diagrams representing different flows for both Omnibus and Segregated account structures:
Omnibus address creation (UTXO)
The end user, Alice, asks to deposit a UTXO asset, such as Bitcoin (BTC).
The customer’s front-end application creates a new deposit address in the Omnibus vault account.
This deposit address is assigned to Alice and mapped accordingly within the customer’s private ledger.
Alice receives a notification from the front-end system with her assigned deposit address, where she can start depositing funds.
Omnibus address creation (account-based with tag/memo support)
The end user, Alice, asks to deposit an account-based asset that supports tag/memo fields, such as Ripple (XRP).
The customer’s front-end application creates a new deposit address in the Omnibus vault account.
This deposit address is assigned to Alice and mapped accordingly within the customer’s private ledger.
Alice receives a notification from the front-end system with her assigned deposit address, where she can start depositing funds.
Omnibus Address Creation (account-based)
The end user, Alice, asks to deposit an account-based asset, such as Ethereum (ETH).
The customer’s front-end application creates a new intermediate vault account and an vault wallet with a deposit address within it.
This deposit address is assigned to Alice and mapped accordingly within the customer’s private ledger.
Once mapped and credited, Alice receives a notification from the front-end system with her assigned deposit address, where she can start depositing funds.
Deposit Flows
The diagrams below show the deposit flow for both asset types within the Omnibus account structure.
Segregated structure
The segregated structure consists of individual vault accounts for each end client. Funds are stored in and invested from these individual accounts.
Address creation flows
There’s no difference between UTXO and account-based assets when dealing with the segregated account structure. For both, the process is as follows:
The end user, Alice, asks to deposit some assets.
The customer’s front-end application creates a new vault account if it does not exist or reuses an existing vault account dedicated to Alice. Then the vault wallet is created with a deposit address within the vault account.
Alice receives a notification from the front-end system with her assigned deposit address, where she can start depositing funds.
📘
Learn more in the Fireblocks Create Vault Accounts
Developer Guide
Hiding Vault Accounts
When creating intermediate vault accounts for your end users, customers may accumulate a significant number of vault accounts in their workspace. These numbers can range from several tens of thousands to millions. Although there is no technical limitation on the number of vault accounts that can be created, having all of these accounts visible in the Fireblocks Web Console can lead to a poor user experience. This includes being overwhelmed by too many vault accounts in the console, which can also result in slow loading times. Additionally, any transaction created from or to one of these vault accounts will appear in the Active Transaction panel. This can create a lengthy and unwieldy list of transaction notifications in scenarios with numerous deposits to these vaults.
Both of these issues impact console performance and user experience. To mitigate this, and because all intermediate vault accounts are managed via API only, these accounts should be hidden from the console. There are two options to hide vault accounts from the console, both available through the Fireblocks API:
Hide the vault account from the console upon creation by passing the optional
hiddenOnUI
parameter when using the
Create Vault Account API endpoint
.
Hide an existing vault account that was not set with the
hiddenOnUi
parameter by using the
Hide a Vault Account in the Console API endpoint
.
Please note that all transactions, both incoming and outgoing, as well as the balances of the hidden vault accounts, are still accessible via the API.
Updated
20 days ago
Compare Workspace Types
Create Embedded Wallets
Table of Contents
Overview
Types of Vault Structures
Omnibus structure
Segregated structure
Hiding Vault Accounts

---

## Creating Vaults And Wallets {#creating-vaults-and-wallets}

*Source: https://developers.fireblocks.com/docs/creating-vaults-and-wallets*

Creating Vaults and Wallets
Prerequisites
Introduction
Fireblocks object model
Quickstart guide
API / SDK overview
Overview
Your Fireblocks workspace utilizes a hierarchy of vault accounts as part of its
Object Model
. This hierarchy allows you to segregate funds belonging to different business units or deposited by different users.
A
Vault account
can hold multiple assets. To transfer to or from vault accounts, your source or destination targets must be provided with both their vault ID and asset ID. Fireblocks handles address generation differently when dealing with account-based assets or with UTXO-based assets.
For each asset wallet, there are one or more deposit addresses. For UTXO-based assets, such as Bitcoin, a single asset wallet may generate one or more deposit addresses. For account-based assets, there are two address-generation options.
📘
Bulk operation
This guide describes an example of vault account batch creation. Batch creation is recommended when demand for a large number of vault accounts and wallets is anticipated. Creating the vault accounts and generating new deposit addresses for associated asset wallets is a time consuming action. Create vault accounts and asset wallets in advance instead of in real time to avoid delays when your end users request wallets and deposit addresses.
Address generation
Account-based wallets
For account-based assets, there are two address-generation options:
Account-based assets
without
tag/memo/note support, such as ETH, can only generate one deposit address, making each vault account unique per asset wallet. This allows you to manage one deposit address per asset, per vault account. This requires you to create additional vault accounts when more than one deposit address of the same asset is required.
Account-based assets
with
tag/memo/note support, such as XRP, can generate one or more deposit addresses. Each deposit address has the same on-chain address. However, they are differentiated by their tag/memo.
UTXO wallets
UTXO-based assets, such as Bitcoin, can hold multiple wallet addresses.
This allows you to manage deposits in a single vault account. The asset wallet can generate one or more deposit addresses.
How to create your vault account hierarchy
Use the
Create a new vault account
API call to create a new vault account that will hold your UTXO or account-based wallets.
Use the
Create a new wallet
API call to create a wallet in a specific vault account by passing a
vaultAccountId
and the
assetId
.
For UTXO-based assets or account-based assets that support tag/memo, use the
Create new asset deposit address
API call to create a new deposit address in a specific vault passing its
vaultAccountId
and the
assetId
.
Example
Using the code below, create a batch of vault accounts and add asset wallets under each.
The
createVaultAccounts
function takes the number of vault accounts that you'd like to create, in this example, we're creating 3.
We're also specifying the asset ID, in this case, ETH, and the vault account name prefix, in this case,
END-USER#
.
With these parameters, the
createVaultAccounts
function will run three times and:
Create a vault account named using the
vaultAccountNamePrefix
parameter;
END-USER#1
,
END-USER#2
,
END-USER#3
Create the ETH asset wallet in the vault account
To test, add this function to the code language of your choice from the
Developing with Fireblocks
section.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createVaultAccounts = async (
  amountOfVaultAccounts: number,
  assetId: string,
  vaultAccountNamePrefix: string
): Promise<Array<{}> | undefined> => {
  const result: Array<{}> = [];
  try {
    for (let i = 1; i <= amountOfVaultAccounts; i++) {
      const vaultAccountResponse = await fireblocks.vaults.createVaultAccount(
        {
          createVaultAccountRequest:
          {
            name: vaultAccountNamePrefix.toString() + i.toString()
          }
        }
      );
      let vaultWalletAddress = await fireblocks.vaults.createVaultAccountAsset(
        {
          vaultAccountId: vaultAccountResponse.data.id as string,
          assetId
        }
      );
      result.push({
        "Vault Account Name": vaultAccountResponse.data.name,
        "Vault Account ID": vaultAccountResponse.data.id,
        "Asset ID": assetId,
        "Address": vaultWalletAddress.data.address
      })
      console.log("Vault Account Details: ", result);
    }

    return result;
  }
  catch (error) {
    console.error(error);
  }
}

createVaultAccounts(2, "ETH_TEST6", "END-USER#22223");
async function createVaultAccounts(amountOfVaultAccounts, assetId, vaultAccountNamePrefix){
    let vaultRes;
    let vault;
    let vaultWallet;

    for (let i = 1; i <= amountOfVaultAccounts; i++){
        vaultRes = await fireblocks.createVaultAccount(vaultAccountNamePrefix.toString()+i.toString());
        vault = { 
            vaultName: vaultRes.name,
            vaultID: vaultRes.id 
        };
        vaultWallet = await fireblocks.createVaultAsset(vault.vaultID, assetId);
        
        console.log("Vault Account Details:", vault);
        console.log("Wallet Asset Details for ", vault.vaultName,":", vaultWallet);
    }
 }
 createVaultAccounts(3, "ETH","END-USER#");
def create_vault_accounts(amount_of_vault_accounts: int, asset: str, vault_account_name_prefix: str):
    for i in range(amount_of_vault_accounts):
        vault = fireblocks.create_vault_account(vault_account_name_prefix + str(i))
        vault_dict = {"vaultName": vault["name"], "vaultId": vault["id"]}
        vault_asset = fireblocks.create_vault_asset(vault["id"], asset)
        print("Vault Account Details:", vault_dict)
        print("Wallet Asset Details for", vault_dict["vaultName"] + ":", vault_asset)
        
create_vault_accounts(3, "ETH", "END-USER#")
Optional parameters
When creating wallets, some blockchains have different technicalities, handled using optional parameters.
See all optional parameters available for each Fireblocks API call.
See additional optional parameters for the
createVaultAccounts
function.
description
When generating new addresses for UTXO wallets,  this body parameter helps you later identify the address so you'll be able to associate it with any of your backend processes.
It can be updated later using the
Update address description
API call.
hiddenOnUI
Set to
true
by default, hides this vault account from appearing in the Fireblocks Console.
This is the best practice when creating intermediate deposit vault accounts for your users as it helps reduce visual clutter and improves UI loading time.
The best practice is configuring this setting so that only your
omnibus account
and another operational
vault account
(or multiple) are visible in the Fireblocks Console.
autoFuel
If the
Gas Station
service is enabled on your workspace, this flag needs to be set to
true
if you wish to monitor and fuel this account's Ethereum address upon detected balance refresh events, such as when deposits of ERC20 tokens occur.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Address generation
Account-based wallets
UTXO wallets
How to create your vault account hierarchy
Example
Optional parameters

---

## Creating An Omnibus Vault Structure {#creating-an-omnibus-vault-structure}

*Source: https://developers.fireblocks.com/docs/creating-an-omnibus-vault-structure*

Creating an Omnibus Vault Structure
Prerequisites
Introduction
Quickstart Guide
APIs & SDKs
Custodial Services
Overview
For customers who have taken the
omnibus account
structure, it is important to make sure the vaults are structured accordingly, and there is no bottleneck of transactions within the withdrawal mechanism, for example.
📘
Important:
Intermediate vault accounts
: This is the
vault account
assigned to an end client. Because you could have numerous end clients, you can use the Fireblocks API to automatically generate as many intermediate vault accounts as needed.
Omnibus deposits
: This is the central vault omnibus account where end-client funds are swept and stored.
Withdrawal pool
: This is the vault account containing funds allocated for end-client withdrawal requests. More than one withdrawal pool vault account is required due to blockchain limitations.
Make sure you are following the right structure for you by reading the
Custodial Services
article.
Understanding Asset Types
Handling your
omnibus account
correctly requires a clear understanding of the differences between different asset types - UTXO vs Account Based.
Due to the nature of UTXO-based blockchains, the transaction includes the source address for each end client, unlike account-based transactions which require an intermediary vault account.
We will explain the two methodologies separately in this article.
UTXO Based
Structure
In the Omnibus Deposits vault account, you can assign each end client a deposit address (which is derived from the permanent wallet address of the UTXO asset).
When adding an address for an end client in the Omnibus Deposits vault account, use the
Create a New Deposit Address of an Asset in a Vault Account API call
and use the
name
parameter to associate the end client's ID, as a prefix or suffix for the name of the vault account.
The
customerRefId
parameter is the ID for AML providers to associate the owner of funds with transactions and should now be used for other purposes. Both the name of the vault account and the AML customerRefID fields are propagated to every transaction to the end client in your system.
Deposit
Funds are deposited using the following process:
The retail platform shares the deposit address with the end client.
The end client makes a deposit.
The incoming deposit triggers a webhook notification.
Your client-facing software automatically notifies the end client that the deposit was successfully received.
The deposit appears on the Transaction History page.
Example
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createUTXOWithdrawalVaultAccounts = async (
  assetId: string,
  name: string,
): Promise<Array<{}> | undefined> => {
  const result: Array<{}> = [];

  try {
    const vaultAccount = await fireblocks.vaults.createVaultAccount({
      createVaultAccountRequest: {
        name,
      },
    });

    if (vaultAccount.data) {
      const vaultWallet = await fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId: vaultAccount.data.id as string,
        assetId,
      });

      result.push({
        "Vault Account Name": vaultAccount.data.name,
        "Vault Account ID": vaultAccount.data.id,
        "Asset ID": assetId,
        Address: vaultWallet.data.address,
      });

      console.log(JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    console.error(error);
  }
};

// Create an omnibus vault account for UTXO based assets
const createOmnibusUTXOAccount = async (
  numOfAddresses: number,
  assetId: string,
): Promise<{} | undefined> => {
  try {
    const myOmnibusVault = await fireblocks.vaults.createVaultAccount({
      createVaultAccountRequest: {
        name: "My Omnibus Vault",
      },
    });

    if (myOmnibusVault.data) {
      const vaultAccountId = myOmnibusVault.data.id as string;

      let result = {};

      await fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId,
        assetId,
      });

      for (let i = 0; i < numOfAddresses; i++) {
        // Generating additional addresses is possible for UTXO based assets only
        await fireblocks.vaults.createVaultAccountAssetAddress({
          assetId,
          vaultAccountId,
          createAddressRequest: {
            description: `UserAddress${i + 1}`,
          },
        });
      }

      const addresses =
        await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
          vaultAccountId,
          assetId,
        });

      result = {
        "Vault Account Name": myOmnibusVault.data.name,
        "VaultAccount ID": myOmnibusVault.data.id,
        "Asset ID": assetId,
        Addresses: addresses?.data.addresses,
      };

      console.log(JSON.stringify(result, null, 2));

      return result;
    }
  } catch (error) {
    console.error(error);
  }
};
createUTXOWithdrawalVaultAccounts("BTC_TEST", "MyWithdrawalVault");
createOmnibusUTXOAccount(3, "BTC_TEST");
// Obtain a list of user identifiers associated with the vault accounts and pass them as a strings inside internalCustRefIds
// each of the internalCustRefIds is concatenated to the vault's name 

const internalCustRefIds = ["a","b","c"];
const assetId = "BTC_TEST";

async function createUTXOWithdrawalVaultAccounts(assetId, name){
    vault = await fireblocks.createVaultAccount(name);
    vaultWallet = await fireblocks.createVaultAsset(Number(vault.id), assetId);
    const result = [{"Vault Name": vault.name, "Vault ID": vault.id, "Asset ID": assetId, "Wallet Address": vaultWallet.address}];
    console.log(JSON.stringify(result, null, 2));
    return(result);
}

async function createUTXOOmnibusAccount(amountOfVaultAccounts, assetId, internalCustRefIds){
    let vault;
    let vaultWallet;
    let address = [];

    vault = await fireblocks.createVaultAccount("Omnibus");
    vaultWallet = await fireblocks.createVaultAsset(Number(vault.id), assetId);
    for (let i = 0; i < amountOfVaultAccounts; i++){
        address[i] = await fireblocks.generateNewAddress(Number(vault.id), assetId, "CustomerID_"+internalCustRefIds[i]+"_vault");
    }
    console.log("Created vault account:"+JSON.stringify(vault, null, 2)+" with wallet addresses:"+JSON.stringify(address, null, 2));
    return("Omnibus:", vault, "Addresses:", address);
 }

createUTXOWithdrawalVaultAccounts(assetId, "Withdrawal");
createUTXOOmnibusAccount(2, assetId, internalCustRefIds);
# Obtain a list of user identifiers associated with the vault accounts and pass them as a strings inside internalCustRefIds
# each of the internalCustRefIds is concatenated to the vault's name 

ASSET = "BTC_TEST"
CUSTOMER_IDS = ["a", "b", "c"]


def create_utxo_withdrawal_vault(asset: str, name: str):
    vault_id = fireblocks.create_vault_account(name=name)["id"]
    address = fireblocks.create_vault_asset(vault_account_id=vault_id, asset_id=asset)["address"]

    return {name: vault_id}, address


def create_utxo_omnibus_vault(amount: int, asset: str, customer_ids: list, hidden_on_ui: bool = True):
    deposit_address = {}

    vault_id = fireblocks.create_vault_account(name="Omnibus")["id"]
    fireblocks.create_vault_asset(vault_account_id=vault_id, asset_id=asset)
    for i in range(amount):
        address = fireblocks.generate_new_address(vault_account_id=vault_id, asset_id=asset, description=customer_ids[i], hidden_on_ui=hidden_on_ui)["address"]
        deposit_address[customer_ids[i]] = address

    return {"Omnibus": vault_id, "Addresses": deposit_address}


print(create_utxo_withdrawal_vault(ASSET, "Withdrawal"))
print(create_utxo_omnibus_vault(3, ASSET, CUSTOMER_IDS))
The above code creates the Omnibus vault and a withdrawal vault, from which we can later on move funds back to end users who would like to settle.
Afterwards, we create a deposit address per end user, while using an available, unique customer ID. The function then returns a dictionary of the newly created vaults and generated deposit addresses.
Account Based
📘
Note
Do note this section refers to account based assets without a tag / memo capability. You can refer to tag / memo based assets in the next section.
Structure
The workspace should contain one or more intermediate vault accounts per end client in addition to a single Omnibus Deposits vault account.
When adding a vault account, we recommend using the
Create a New Vault Account API call
and use the
name
parameter to associate the end client's ID, as a prefix or suffix for the name of the vault account.
The
customerRefId
parameter is the ID for AML providers to associate the owner of funds with transactions and should now be used for other purposes. Both the name of the vault account and the AML customerRefID fields are propagated to every transaction to the end client in your system.
Due to the nature of account-based blockchains, transactions with account-based assets can only be transferred from one account-based address to another account-based address (unlike UTXO, where multiple addresses are included in a single transaction).
Deposit
Funds are deposited using the following process:
The end client receives a deposit address.
The end client makes a deposit.
The incoming deposit triggers a webhook notification.
Your client-facing software automatically notifies the end client that the deposit was successfully received.
The deposit is swept to the Omnibus Deposits vault account. You can see further on the sweeping logic in the
Sweeping within an Omnibus Vault structure
article.
Example
📘
Recommended: Set "Hidden Vaults" on
For the creation of end user vaults, we will usually choose to set
hiddenOnUi
as true, as part of the
createVaultAccount
endpoint.
By default, it is set to false, hence all of the vaults created in this article will be visible in the UI which is not recommended for a very large amount of vaults.
This also means transfers to these vaults won't be visible in the UI, but only programatically.
As the name suggests, the end-user vaults will be serving your end users. If you have followed the structure section, you might have noticed that account based assets require a one-to-one vault per end user.
The treasury vault is a single account where all of the swept assets will move to. You can see more in regarding to sweeping in the following
sweeping article
.
Lastly, we will also create a few withdrawal vaults in order to distribute our load in regards to settlements, making sure we don't have a bottleneck at the withdrawal part.
We will use the below code in order to perform the following:
Create 5 vaults for 5 end users.
Create 1 treasury vault.
Create 3 withdrawal vaults.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createAccountBasedVaultAccounts = async (
  vaultAccountNamePrefix: string,
  numOfVaultAccounts: number,
  assetId: string,
  hiddenOnUI: boolean,
  endUserReferences?: string[],
): Promise<Array<{}> | undefined> => {
  try {
    let vaultAccount: FireblocksResponse<VaultAccount>;
    let results: Array<{}> = [];

    for (let i = 0; i < numOfVaultAccounts; i++) {
      if (
        endUserReferences &&
        endUserReferences.length !== numOfVaultAccounts
      ) {
        throw new Error(
          "Number of Vault Accounts does not equal to the number of end user references",
        );
      }

      vaultAccount = await fireblocks.vaults.createVaultAccount({
        createVaultAccountRequest: {
          name: endUserReferences
            ? vaultAccountNamePrefix + "_" + endUserReferences[i]
            : vaultAccountNamePrefix + "_Vault" + String(i + 1),
          hiddenOnUI,
        },
      });

      const vaultAccountId = vaultAccount.data?.id as string;

      const vaultWallet = await fireblocks.vaults.createVaultAccountAsset({
        assetId,
        vaultAccountId,
      });

      const singleVaultResult = {
        "Vault Account": vaultAccount.data?.name,
        "Vault Account ID": vaultAccountId,
        "Asset ID": assetId,
        Address: vaultWallet.data?.address,
      };

      results.push(singleVaultResult);
      console.log(
        `Created Vault Account:\n ${JSON.stringify(singleVaultResult, null, 2)}`,
      );
    }

    return results;
  } catch (error) {
    console.error(error);
  }
};

createAccountBasedVaultAccounts("Deposits", 5, "ETH_TEST5", true, [
  "UserA",
  "UserB",
  "UserC",
  "UserD",
  "UserE",
]);
createAccountBasedVaultAccounts("Treasury", 1, "ETH_TEST5", false);
createAccountBasedVaultAccounts("Withdrawal_Pool", 3, "ETH_TEST5", false);
// Obtain a list of user identifiers associated with the vault accounts and pass them as a strings inside internalCustRefIds
// each of the internalCustRefIds is concatenated to the vault's name 

const internalCustRefIds = ["a","b","c","d","e"];
const assetId = "ETH_TEST3";

async function createAccountBasedVaultAccounts(vaultAccountNamePrefix, amountOfVaultAccounts, assetId, hiddenOnUI, internalCustRefIds){
    let createVaultRes;
    let vault;
    let vaultWallet;

    for (let i = 0; i < amountOfVaultAccounts; i++){
        if (internalCustRefIds){
            createVaultRes = await fireblocks.createVaultAccount(vaultAccountNamePrefix.toString()+"_"+internalCustRefIds[i]+"_vault", hiddenOnUI);
        }
        else {
            createVaultRes = await fireblocks.createVaultAccount(vaultAccountNamePrefix.toString()+"_"+i.toString()+"_vault", hiddenOnUI);
        }
        vault = {
            vaultName: createVaultRes.name,
            vaultID: createVaultRes.id
        }
        vaultWallet = await fireblocks.createVaultAsset(Number(vault.vaultID), assetId);
        console.log("Created vault account", vault.vaultName,":", "with wallet address:", vaultWallet.address);
    }
 }

createAccountBasedVaultAccounts("Deposits_End_User", 5, assetId, false, internalCustRefIds);
createAccountBasedVaultAccounts("Treasury", 1, assetId, false, undefined);
createAccountBasedVaultAccounts("Withdrawal_pool", 3, assetId, false, undefined);
# Obtain a list of user identifiers associated with the vault accounts and pass them as a strings inside internalCustRefIds
# each of the internalCustRefIds is concatenated to the vault's name

CUSTOMER_IDS = ["a", "b", "c", "d", "e"]
ASSET = "ETH_TEST3"

def create_account_vault_accounts(prefix: str, amount: int, asset_id: str, customer_ids: list, is_hidden: bool = False) -> dict:
  vault_dict = {}
  
  for index in range(amount):
    if customer_ids:
	    vault_name = f"{prefix}_{customer_ids[index]}_vault"
    else:
      vault_name = f"{prefix}_vault"
    vault_id = fireblocks.create_vault_account(name=vault_name, hidden_on_ui=is_hidden)["id"]
    fireblocks.create_vault_asset(vault_id, )
    vault_dict[vault_name] = vault_id
    
  return vault_dict
    

print(create_account_vault_accounts("End-User", 5, ASSET, CUSTOMER_IDS, True))
print(create_account_vault_accounts("Treasury", 1, ASSET))
print(create_account_vault_accounts("Withdrawal", 3, ASSET))
In the above code, we have created a function that takes a prefix for the vault name and a number of vaults that we would like to create and also uses the  and the internalCustRefIds and
hiddenOnUI
params, if relevant, depending on vault accounts creation purpose.
We then run it three times.
For the end user vaults.
For the treasury vault.
For the withdrawal vault.
Tag / Memo Based
📘
Note
Although these are basically also account based, they have a special differentiating attribute: the
tag
/
memo
. This helps us identify different customers / accounts within our single wallet, crediting customers in our internal ledger.
Structure
In the Omnibus Deposits vault account, you can assign each end client a tag or memo (name varies based on the blockchain).
When adding an address for an end client in the Omnibus Deposits vault account, use the
Create a New Deposit Address of an Asset in a Vault Account API call
and use the
name
parameter to associate the end client's ID, as a prefix or suffix for the name of the vault account.
The
customerRefId
parameter is the ID for AML providers to associate the owner of funds with transactions and should now be used for other purposes. Both the name of the vault account and the AML customerRefID fields are propagated to every transaction to the end client in your system.
Deposit
Funds are deposited using the following process:
The end client receives a deposit address and a
tag
or
memo
.
The end client makes a deposit, using the address and the tag.
The incoming deposit triggers a webhook notification.
Your client-facing software automatically notifies the end client that the deposit was successfully received, assuming he passed a
tag
or
memo
.
All of your funds will be located in the same account, while managing different customer balances in an internal ledger.
Example
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createTagWithdrawalVaultAccounts = async (
  assetId: string,
  name: string,
): Promise<Array<{}> | undefined> => {
  const result: Array<{}> = [];

  try {
    const vaultAccount = await fireblocks.vaults.createVaultAccount({
      createVaultAccountRequest: {
        name,
      },
    });

    if (vaultAccount.data) {
      const vaultWallet = await fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId: vaultAccount.data.id as string,
        assetId,
      });

      result.push({
        "Vault Account Name": vaultAccount.data.name,
        "Vault Account ID": vaultAccount.data.id,
        "Asset ID": assetId,
        Address: vaultWallet.data.address,
      });

      console.log(JSON.stringify(result, null, 2));
    }

    return result;
  } catch (error) {
    console.error(error);
  }
};

// Create an omnibus vault account for Tag/Memo based assets
const createTagOmnibusAccount = async (
  numOfAddresses: number,
  assetId: string,
): Promise<{} | undefined> => {
  try {
    const myOmnibusVault = await fireblocks.vaults.createVaultAccount({
      createVaultAccountRequest: {
        name: "My Omnibus Vault",
      },
    });

    if (myOmnibusVault.data) {
      const vaultAccountId = myOmnibusVault.data.id as string;

      let result = {};

      await fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId,
        assetId,
      });

      for (let i = 0; i < numOfAddresses; i++) {
        // For Tag/Memo based assets, the address of the wallet is always the same but a new Memo/Tag is generated upon each user
        await fireblocks.vaults.createVaultAccountAssetAddress({
          assetId,
          vaultAccountId,
          createAddressRequest: {
            description: `UserAddress${i + 1}`,
          },
        });
      }

      const addresses =
        await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
          vaultAccountId,
          assetId,
        });

      result = {
        "Vault Account Name": myOmnibusVault.data.name,
        "VaultAccount ID": myOmnibusVault.data.id,
        "Asset ID": assetId,
        Addresses: addresses?.data.addresses,
      };

      console.log(JSON.stringify(result, null, 2));

      return result;
    }
  } catch (error) {
    console.error(error);
  }
};

createTagWithdrawalVaultAccounts("XLM_TEST", "Withdrawal");
createTagOmnibusAccount(2, "XLM_TEST");
// Obtain a list of user identifiers associated with the vault accounts and pass them as a strings inside internalCustRefIds
// each of the internalCustRefIds is concatenated to the vault's name 

const internalCustRefIds = ["a","b","c"];
const assetId = "XLM_TEST";

async function createTagWithdrawalVaultAccounts(assetId, name){
    vault = await fireblocks.createVaultAccount(name);
    vaultWallet = await fireblocks.createVaultAsset(Number(vault.id), assetId);
    const result = [{"Vault Name": vault.name, "Vault ID": vault.id, "Asset ID": assetId, "Wallet Address": vaultWallet.address}];
    console.log(JSON.stringify(result, null, 2));
    return(result);
}


async function createTagOmnibusAccount(amountOfVaultAccounts, assetId, internalCustRefIds){
    let vault;
    let vaultWallet;
    let tag = [];

    vault = await fireblocks.createVaultAccount("Omnibus");
    vaultWallet = await fireblocks.createVaultAsset(Number(vault.id), assetId);
    for (let i = 0; i < amountOfVaultAccounts; i++){
        tag[i] = await fireblocks.generateNewAddress(Number(vault.id), assetId, "CustomerID_"+internalCustRefIds[i]+"_vault");
    }
    console.log("Created vault account:"+JSON.stringify(vault, null, 2)+" with wallet tag:"+JSON.stringify(tag, null, 2));
    return("Omnibus:", vault, "Tags:", tag);
 }

createTagWithdrawalVaultAccounts(assetId, "Withdrawal");
 createTagOmnibusAccount(2, assetId, internalCustRefIds);
ASSET = "XLM_TEST"
CUSTOMER_IDS = ["a", "b", "c"]


def create_tag_withdrawal_vault(asset: str, name: str):
    vault_id = fireblocks.create_vault_account(name=name)["id"]
    address = fireblocks.create_vault_asset(vault_account_id=vault_id, asset_id=asset)["address"]

    return {name: vault_id}, address


def create_tag_omnibus_vault(amount: int, asset: str, customer_ids: list, hidden_on_ui: bool = True):
    deposit_tags = {}

    vault_id = fireblocks.create_vault_account(name="Omnibus")
    address = fireblocks.create_vault_asset(vault_account_id=vault_id, asset_id=asset)["address"]
    for i in range(amount):
        tag = fireblocks.generate_new_address(vault_account_id=vault_id, asset_id=asset, description=customer_ids[i], hidden_on_ui=hidden_on_ui)["tag"]
        deposit_tags[customer_ids[i]] = address

    return {"Omnibus": vault_id, "Address": address, "Tags": deposit_tags}


print(create_tag_withdrawal_vault(ASSET, "Withdrawal"))
print(create_tag_omnibus_vault(3, ASSET, CUSTOMER_IDS))
The above code creates the Omnibus vault and a withdrawal vault, from which we can later on move funds back to end users who would like to settle.
Afterwards, we create a deposit tag per end user, while using an available, unique customer ID. The function then returns a dictionary of the newly created vaults and generated deposit tags.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Understanding Asset Types
UTXO Based
Account Based
Tag / Memo Based

---

