# 07 Manage Treasury

This document contains 5 sections related to 07 manage treasury.

## Table of Contents

1. [Stake Assets](#stake-assets)
2. [Validate Balances](#validate-balances)
3. [Treasury Management](#treasury-management)
4. [Verify Fee Effeciency](#verify-fee-effeciency)
5. [Utxo Consolidation](#utxo-consolidation)

---

## Stake Assets {#stake-assets}

*Source: https://developers.fireblocks.com/docs/stake-assets*

Stake Assets
Overview
You can stake to various networks from your Vault using the Fireblocks API. When staking, you select a third-party staking provider to operate the validators associated with your staked funds. Typically, the staked amount is locked for a certain period of time.
Staked assets become eligible to receive rewards after the network's activation period. Staking rewards are calculated over a period of time usually known as an epoch. This is the period of time in which validators and their staked amount are accounted for. Depending on the network, an epoch may be anywhere from a few minutes to several days. Typically, staking rewards are calculated and distributed after each epoch ends.
When you unstake your assets, you no longer generate staking rewards, but you're able to use those assets for other transactions.
Staking via Fireblocks API
To stake, you must fund a vault account with the asset you want to stake and create
Policy
rules for staking. Then create staking transactions using the dedicated
staking API endpoints
.
Staking with the Fireblocks API allows you to:
Easily and securely stake assets through native API calls.
Create dedicated Policy rules for staking using the
Stake
operation type.
Track the status and rewards for your staked funds.
Initiate staking transactions without the need for SDKs, scripts, or Raw Signing.
Select validators to oversee your staked funds.
Supported assets
Ethereum
Solana
MATIC
📘
Check out the Staking developer guide
here
Updated
20 days ago
Add an Exchange Account
Get Supported Assets
Table of Contents
Overview
Staking via Fireblocks API
Supported assets

---

## Validate Balances {#validate-balances}

*Source: https://developers.fireblocks.com/docs/validate-balances*

Validate Balances
Fireblocks customers can create automated mechanisms to notify their organization about incoming transactions using the following methods:
Webhook notifications
Pulling the transaction history log using the Fireblocks API
When monitoring notifications through these methods, only consider incoming transactions for reconciliation after receiving a notification that the transaction’s status has been updated to
COMPLETED
and the
VAULT_BALANCE_UPDATE
webhook has been received.
Fireblocks provides additional information to help clients validate and reconcile their balances according to the blockchain state. This information includes:
The
TRANSACTION_STATUS_UPDATED
webhook event contains the
blockInfo
object, which includes:
blockHeight
: The block height where the transaction was included
blockHash
: The block hash where the transaction was included
The
VAULT_BALANCE_UPDATE
webhook event contains the
blockHeight
and
blockHash
properties
The
GET /vault/accounts/{vaultAccountId}/{assetId}
endpoint returns the balance of an asset in a vault account and includes the
blockHeight
and
blockHash
properties
The
GET /transactions/{txId}
endpoint returns the transaction by its Fireblocks ID and includes the
blockInfo
object with the
blockHeight
and
blockHash
properties
Before crediting the end-user, customers need to run a reconciliation process to ensure that the incoming balance is accurately reflected and up to date according to the same
blockHeight
provided in the transaction notification object. If the balance is not up to date with the network state and the same height value, customers should not credit their clients until the issue is inspected and resolved.
Fireblocks strongly recommends checking the wallet’s balance using the Fireblocks API to verify that the deposit is included and the balance is up to date. This is crucial to prevent potential loss of funds from crediting end-clients before the balance is truly updated. While Fireblocks takes extensive measures to ensure the accuracy and reliability of its services, it is important for customers to implement all necessary validations and follow best practices to avoid any potential issues.
Below is a sequence diagram for additional reference:
Updated
20 days ago
Configure Gas Station Values
Associate End Clients

---

## Treasury Management {#treasury-management}

*Source: https://developers.fireblocks.com/docs/treasury-management*

Treasury Management
Store your funds securely in hot and cold wallets, manage your fund operations, and connect to exchanges, DeFi, and trading counterparties with Fireblocks Treasury Management
What is Treasury Management?
Fireblocks Treasury Management helps maintain a holistic view of your firms’ assets across wallets, connected venues, and fiat providers with a view to managing operational risk and liquidity.
Start developing on Fireblocks today
.
Set up, maintain, and scale your fund operations through Fireblocks Treasury Management
Using Fireblocks Treasury Management, you can streamline the functionality of your operations, enabling you to grow and scale securely:
Protect fund operations:
Safely store tokens and NFTs and securely access exchanges or fiat accounts with our multi-layer security.
Set up governance rules:
Use transaction authorization policy rules to create automated preferences catered around specific business requirements. Configure different roles and approval levels for stakeholders, and automate approval workflows to save time and maintain efficiency.
Operationalize treasury management:
Use our services to view all treasury assets across hot or cold wallets and track and report the movement of internal funds.
Easily move assets around:
Use Treasury Funds in DeFi, Staking, or Tokenized Funds. Use our Gas Station for seamless gas management as you move assets.
Make secure transfers:
Connect with counterparties across the Fireblocks Network and transact in a secure channel taking advantage of address resolution while preventing human errors or man-in-the-middle attacks.
Trading:
Automate, rebalance, and transfer between exchange accounts while minimizing counterparty risk to exchanges using our treasury management offering.
Learn more about
our Treasury Management
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
at scale for account-based and UTXO asset wallet types using the Fireblocks API and SDKs.
Whitelisting External Wallets
Use API calls and endpoints that
whitelist external wallet addresses
so that you can send transactions from wallet types using the Fireblocks API and SDKs.
Gas Station Setup and Usage
Auto-fuel a vault account to fund transaction fees
with the base asset for EVM-based blockchains to automate and simplify your omnibus vault operations.
Creating a Transaction
Use transaction API calls to
initiate any Fireblocks transaction operation
, such as transfer, mint, burn, contract call, raw, and more.
Monitoring Transaction Statuses
Set up automated webhook notifications to
monitor the progression of your transactions
via transaction statuses and sub-status messages.
Exchange Transfers
Use the
Create a new transaction
endpoint call to
manage external transfers to and from your linked exchange accounts
.
Developer Community
Want to learn more from Fireblocks knowledge experts and other developers?
Join our developer community today
!
Updated
20 days ago
Tokenization
Fireblocks Key Features & Capabilities
Table of Contents
What is Treasury Management?
Set up, maintain, and scale your fund operations through Fireblocks Treasury Management
Guides
Raw Message Signing
Typed Message Signing
Creating Vaults and Wallets
Whitelisting External Wallets
Gas Station Setup and Usage
Creating a Transaction
Monitoring Transaction Statuses
Exchange Transfers
Developer Community

---

## Verify Fee Effeciency {#verify-fee-effeciency}

*Source: https://developers.fireblocks.com/docs/verify-fee-effeciency*

Estimate Transaction Fees
Fireblocks provides clients with two API endpoints to estimate transaction fees:
Estimate Transaction Fee
-
Documentation
Estimate Network Fee
-
Documentation
Estimate Transaction Fee
The
Estimate Transaction Fee
endpoint
is designed to simulate a real transaction and calculate its potential fee. This process considers factors such as the source and destination amounts, the number of inputs and outputs, and other relevant transaction details. Essentially, it mimics the actual transaction to determine what the fee would be if executed.
When using this endpoint, clients should be aware that it follows the same rules as creating a transaction. This includes requiring the relevant vault wallet in the vault account, ensuring the estimated transaction's balance is in the wallet, and providing a valid destination.
While many clients implement logic to estimate the transaction fee before each execution, it is crucial not to call this endpoint for every minor transaction change. For example, in EVM-based transactions, the gas limit for transferring the base asset or a specific token usually remains the same (barring sudden surges in network fees). The main variable is the current network fee, which can be obtained using the second endpoint.
Estimate Network Fee
The
Estimate Network Fee
endpoint
returns the current network fee for a specified network. This allows clients to calculate transaction fees or display the current network fee to their users. For instance, it provides the current gas price for ETH, which is part of the entire transaction fee formula, alongside the gas limit and other parameters.
The network fee response is cached for 30 seconds on the Fireblocks side. Clients should consider this interval when using this endpoint, as querying it more frequently than every 30 seconds does not provide additional value and the fee level value would remain the same.
Fee Levels
Both endpoints return estimated fees or network fees in three levels: LOW, MEDIUM, and HIGH. Here’s how these are determined for different transaction types:
EVM-Based Transactions
To simplify the gas calculation for each transaction, Fireblocks offers preset fees for both the Console (slow, medium, and fast) and the API (low, medium, and high). These fee calculations are based on recent blocks and a certain percentile of the data collected.
Fireblocks retrieves the latest block data every minute, inspecting the gas prices of recent blocks to determine the fee rate and automatically set the gas limit. In addition to verifying the latest data, Fireblocks also simulates the desired transactions to estimate the fee. The transaction parameters are sent to an API endpoint on the node, which returns an estimated transaction fee.
UTXO-Based Transactions
High
: Fees are based on the previous block’s fee.
Medium
: Fees are based on the average of the previous two blocks.
Low
: Fees are based on the average of the last four blocks.
Fireblocks' API endpoints for estimating transaction fees provide clients with robust tools to ensure they can accurately predict and manage transaction costs. By using these endpoints, clients can maintain efficient and cost-effective operations while offering transparency and predictability in transaction fees to their users. Whether you are dealing with EVM-based, UTXO-based transactions or any other type of blockchain, understanding and utilizing these endpoints can significantly enhance your transaction management strategy.
📘
Learn more about Fees in Fireblocks:
EVM Networks
UTXO Based Assets
Unique Calculations
📘
Check out the
Fee Management Developer Guide
Updated
20 days ago
Manage Destination Addresses
Manage Withdrawals at Scale
Table of Contents
Estimate Transaction Fee
Estimate Network Fee
Fee Levels
EVM-Based Transactions
UTXO-Based Transactions

---

## Utxo Consolidation {#utxo-consolidation}

*Source: https://developers.fireblocks.com/docs/utxo-consolidation*

UTXO Consolidation
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Overview
If you regularly run operations on the Bitcoin blockchain, you will likely notice that the list of UTXOs in your wallets grows very quickly. This is especially common in situations where you have multiple addresses used to consolidate into an
omnibus account
or just as part of an ongoing operation. This can be a major problem for retail-facing operations.
A process utilized by most companies is "consolidating UTXOs", or creating a transaction that will take many small unspent UTXOs and turn them into a single bigger UTXO.
This is done by creating an "internal" transaction within your own vault account that takes the maximum amount of inputs (250) and turns them into a single output.
Example
The logic to decide which unspent UTXOs to use can be as simple or complex as you wish, but in this example, we will use any small unspent UTXO that has received enough confirmations.
We have 3 steps in the process of consolidating UTXOs:
Retrieve the max spendable amount for a specific wallet.
This will result in an amount that considers up to 250 UTXOs within the wallet (by default, from smallest to biggest).
Create a transaction with the amount provided.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const getMaxSpendableAmount = async (
  assetId: string,
  vaultAccountId: string,
): Promise<GetMaxSpendableAmountResponse | undefined> => {
  try {
    const maxSpendableAmount = await fireblocks.vaults.getMaxSpendableAmount({
      vaultAccountId,
      assetId,
    });
    console.log(
      JSON.stringify(maxSpendableAmount.data.maxSpendableAmount, null, 2),
    );
    return maxSpendableAmount.data;
  } catch (error) {
    console.error(error);
  }
};

let transactionPayload = {};

const consolidateWallet = async (
  assetId: string,
  vaultAccountId: string,
  treasuryVault: string,
): Promise<CreateTransactionResponse | undefined> => {
  const amount = await getMaxSpendableAmount(assetId, vaultAccountId);
  transactionPayload = {
    assetId,
    amount: amount?.maxSpendableAmount,
    source: {
      type: TransferPeerPathType.VaultAccount,
      id: vaultAccountId,
    },
    destination: {
      type: TransferPeerPathType.VaultAccount,
      id: treasuryVault,
    },
  };
  console.log(JSON.stringify(transactionPayload, null, 2));
  try {
    const result = await fireblocks.transactions.createTransaction({
      transactionRequest: transactionPayload,
    });
    console.log(JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    console.error(error);
  }
};
getMaxSpendableAmount("BTC", "2");
consolidateWallet("BTC", "2", "0");
async function consolidate(vaultAccountId, assetId, treasuryVault){
    let amountToConsolidate = await fireblocks.getMaxSpendableAmount(vaultAccountId, assetId).maxSpendableAmount
    const payload = {
        assetId,
        amount: amountToConsolidate.maxSpendableAmount,
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: vaultAccountId
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT,
            id: treasuryVault
        },
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
 }
 consolidate("0", "BTC", "1");
from  fireblocks_sdk import TransferPeerPath, DestinationTransferPeerPath

def consolidate(vault_id: str, asset: str, treasury_id: str):
  amountToConsolidate = fireblocks.get_max_spendable_amount(vault_id, asset)["maxSpendableAmount"]

  fireblocks.create_transaction(
     asset_id=asset,
     amount=amountToConsolidate,
     source=TransferPeerPath(VAULT_ACCOUNT, vault_id),
     destination=DestinationTransferPeerPath(VAULT_ACCOUNT, treasury_id)
  )
  
 consolidate("0", "BTC", "1");
Retrieving the maximum spendable amount for consolidation is used through the getMaxSpendableAmount endpoint.
Do note you need the
vaultId
and
assetId
.
Once we create a transaction with the specified amount, Fireblocks automatically selects all of the inputs (smallest to biggest) to consolidate. You can
contact Fireblocks Support
in order to change the default consolidation selection method and reverse it to a selection going from largest to smallest.
📘
UTXO consolidation to source
You can send a transaction to yourself, thus just consolidating the UTXOs without sending them outwards.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Example

---

