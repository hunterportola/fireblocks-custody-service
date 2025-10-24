# 11 Process Payments

This document contains 9 sections related to 11 process payments.

## Table of Contents

1. [Create Payouts](#create-payouts)
2. [Boost Transactions 1](#boost-transactions-1)
3. [Fetching Transaction Receipt](#fetching-transaction-receipt)
4. [Exchange Transfers](#exchange-transfers)
5. [Execute Smart Transfers](#execute-smart-transfers)
6. [Payment Flows Copy](#payment-flows-copy)
7. [Creating A Transaction](#creating-a-transaction)
8. [Monitor Tx Status](#monitor-tx-status)
9. [Building A Transaction](#building-a-transaction)

---

## Create Payouts {#create-payouts}

*Source: https://developers.fireblocks.com/docs/create-payouts*

Create Payouts
Overview
The Payout Service API allows you to create and execute payout instruction sets.
A payout instruction set describes how to distribute payments from a payment account to multiple payee accounts.
Payment account
: Any valid Fireblocks-supported vault account, exchange account, or fiat account.
Payee account
: A valid address in Fireblocks for receiving funds. This can be a vault account, exchange account, whitelisted address, fiat account, or merchant account.
The payout process can only be executed if the payment account has a sufficient balance for the entire payout instruction set. If the payout account doesn't have a sufficient balance, the payout remains in an Insufficient Balance state until the payment account has a sufficient balance to perform the payout instructions. Payouts in an Insufficient Balance state expire at midnight UTC and are moved to Failed status.
A payout instruction set can only be executed once. Re-executing a payout instruction set results in an error.
Payouts Flow
When a user wants to send a payment to one or more of their merchants, they can use the Payout Service API to send the payout from their exchange account.
The flow consists of 3 main steps:
Creating a payout instruction set
Executing a payout instruction set
Monitoring Payouts
Updated
20 days ago
Fetching Transaction Receipt
Define Payment Flows
Table of Contents
Overview
Payouts Flow

---

## Boost Transactions 1 {#boost-transactions-1}

*Source: https://developers.fireblocks.com/docs/boost-transactions-1*

Boost Transactions
Overview
ETH transactions can get stuck due to insufficient gas fees or sudden spikes in network congestion. When the gas fee provided is too low compared to the current network demand, validators may prioritize other transactions with higher fees, causing your transaction to remain unprocessed in the mempool.
This can lead to delays and a backlog of subsequent transactions, especially if they depend on the completion of the stuck transaction. Managing gas fees and monitoring network conditions are crucial to prevent transactions from getting stuck.
Replace By Fee (RBF) and Child Pays For Parent (CPFP) are mechanisms used to expedite stuck transactions on blockchain networks.
RBF
- commonly used in Ethereum and other EVM-based networks, allows a sender to replace a pending transaction with a new one that has a higher gas fee, increasing the likelihood of it being processed promptly.
Drop EVM transaction
- uses RBF to replace the original transaction with a new transaction of 0 value, and a destination identical to the source, effectively canceling the transfer.
CPFP
- primarily used in Bitcoin, involves creating a new transaction (the child) that pays a higher fee, incentivizing miners to also confirm the original stuck transaction (the parent) due to the combined higher fee.
Both RBF and CPFP methods aim to prioritize the processing of transactions that might otherwise remain stuck due to low fees or network congestion.
RBF and CPFP in Fireblocks
Fireblocks customers can boost or drop their stuck transactions using the following methods:
Clicking the "Boost" icon on the Transaction card in the Fireblocks Web Console. For more information on the process and the availability of the boosting operation, refer to this
guide
.
Using the Fireblocks API for the following scenarios:
Perform RBF for a stuck EVM transaction
Drop a stuck EVM transaction
Perform CPFP for a stuck BTC transaction
Updated
20 days ago
Manage Withdrawals at Scale
Define AML Policies
Table of Contents
Overview
RBF and CPFP in Fireblocks

---

## Fetching Transaction Receipt {#fetching-transaction-receipt}

*Source: https://developers.fireblocks.com/docs/fetching-transaction-receipt*

Fetching Transaction Receipt
This guide outlines the procedure for retrieving a transaction receipt via the
getTransactionReceipt
endpoint, utilizing the
getTransactionReceipt
function in the Fireblocks SDK.
By employing the
getTransactionReceipt
function of the Fireblocks SDK, you can obtain the receipt of any transaction that has been confirmed by the blockchain. This function takes in the
baseAssetId
(indicating the blockchain) and the
txHash
(indicating the transaction hash). It manages the process of querying the blockchain and returning the transaction receipt.
📘
Note:
This functionality is exclusively available for EVM (Ethereum Virtual Machine) compatible chains.
Prerequisites
Before fetching a transaction receipt, ensure you have the following information:
Base Asset ID
: The
baseAssetId
of the blockchain where the transaction was executed (e.g., ETH for Ethereum). This is the Fireblocks ID of the blockchain's gas token. (To obtain the asset ID, refer to this
assetId list
).
Transaction Hash
: The
txHash
of the transaction for which you wish to fetch the receipt. This is the unique identifier of the transaction on the blockchain and is a hex string (i.e. prefixed with 0x). You can obtain the transaction hash from the transaction details or the blockchain explorer.
Example: Fetching a Transaction Receipt
Below is an example of how to fetch a transaction receipt using the Fireblocks SDK:
1. Initialize the Fireblocks SDK
First, import the Fireblocks SDK and initialize it with your Fireblocks API key and private key:
TypeScript
import { Fireblocks, BasePath } from '@fireblocks/ts-sdk';

const privateKey = '...'; // Your Fireblocks API private key
const apiKey = '...'; // Your Fireblocks API key

const fireblocksSdk = new Fireblocks({
	apiKey,
	basePath: BasePath.US, // Use BasePath.EU for the EU region
	secretKey: privateKey,
});
2. Fetch the Transaction Receipt
To fetch the transaction receipt, utilize the
getTransactionReceipt
function of the Contract Interactions Controller:
TypeScript
const baseAssetId = 'ETH'; // The base asset ID for Ethereum
const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'; // The transaction hash

const receipt = await fireblocks.getTransactionReceipt(baseAssetId, txHash);

console.log(receipt);
The response will be a transaction receipt object containing details about the transaction, such as the status, gas used, logs, and more.
📘
Note:
For further information about the transaction receipt object, refer to the
Endpoint Model
section.
Endpoint Model
Transaction Receipt
The transaction receipt response object includes the following fields:
status
: The status of the transaction (e.g., success or failure).
gasUsed
: The amount of gas consumed by the transaction.
logs
: The logs generated by the transaction (if any).
transactionHash
: The hash of the transaction.
blockHash
: The hash of the block containing the transaction.
blockNumber
: The number of the block containing the transaction.
contractAddress
: The address of the contract created (if any).
cumulativeGasUsed
: The cumulative gas used by the transaction.
from
: The address of the sender.
to
: The address of the receiver.
effectiveGasPrice
: The actual price per unit of gas paid.
type
: The type of the transaction.
logs
: The logs generated by the transaction (if any).
logsBloom
: The bloom filter for the logs of the transaction.
transactionIndex
: The index of the transaction in the block.
📘
Note:
The
logs
field contains an array of log objects, each representing a log generated by the transaction. Each
log object includes the following fields:
address
: The address of the contract that generated the log.
topics
: An array of topics associated with the log.
data
: The data contained in the log.
blockNumber
: The number of the block containing the log.
transactionHash
: The hash of the transaction that generated the log.
transactionIndex
: The index of the transaction in the block.
blockHash
: The hash of the block containing the log.
logIndex
: The index of the log in the block.
removed
: Indicates whether the log was removed.
📘
Note:
Some fields may be empty in the response if the transaction has not been executed or if the blockchain does
not support them.
Updated
20 days ago
Interact With Smart Contracts
Create Payouts
Table of Contents
Prerequisites
Example: Fetching a Transaction Receipt
1. Initialize the Fireblocks SDK
2. Fetch the Transaction Receipt
Endpoint Model
Transaction Receipt

---

## Exchange Transfers {#exchange-transfers}

*Source: https://developers.fireblocks.com/docs/exchange-transfers*

Exchange Transfers
Prerequisites
Introduction
Quickstart guide
API/SDK Overview
Overview
Our exchange integrations allow you to connect main, trading, and sub exchange accounts on Fireblocks. From our platform, you can fund, deposit, withdraw, rebalance and transfer funds to and from a
Vault account
,
Exchange account
, whitelisted/one-time address (
OTA
) or
Fireblocks Network
connection.
Except for internal exchange transfers, all transfers are completed using the
Create a new transaction
endpoint call, which is used for all transactions in Fireblocks.
Learn more about building a transaction
.
📘
Additional exchange account configuration
Withdrawals from exchanges to some destinations may require additional exchange account configuration.
🚧
Fireblocks console configuration needed
Before you begin transacting with an Exchange, please set up your exchange account in the Fireblocks Console. See:
Fireblocks Exchange Connectivity
Transfer to Exchange example
This example transfers 0.001 ETH to an exchange account from vault account ID
0
.
ts-node
fireblocks-sdk-js
fireblocks-sdk-py
const createTransferToExchangeAccount = async(
  assetId: string, 
  amount: number, 
  sourceVaultAccountId: string, 
  destinationId: string
): Promise<CreateTransactionResponse | undefined> => {
  
  try {

    let transactionPayload: TransactionsApiCreateTransactionRequest = {
      transactionRequest: {
        assetId,
        amount,
        source: {
          type: TransferPeerPathType.VaultAccount,
          id: sourceVaultAccountId
        },
        destination: {
          type: TransferPeerPathType.ExchangeAccount,
          id: destinationId
        }
      }
    }


    const transactionResponse = await fireblocks.transactions.createTransaction(transactionPayload)
    console.log(`Submitted a new transaction:\n ${JSON.stringify(transactionResponse.data?.id, null, 2)}`)
    
    return transactionResponse.data as CreateTransactionResponse
  
  } catch(error) {
    console.error(error)
  }
}


createTransferToExchangeAccount("ETH_TEST5", 0.1, "1", "0b5376e8-e46e-5bb7-e2c0-8428e41a75c9")
async function createTransaction(assetId, amount, srcId, destId){ 
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(srcId)
        },
        destination: {
            type: PeerType.EXCHANGE_ACCOUNT,
            id: String(destId)
        },
        note: "Your first Exchange transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "0b5376e8-e46e-5bb7-e2c0-8428e41a75c9");
def create_transaction(asset_id, amount, src_id, dest_id):
   tx_result = fireblocks.create_transaction(
       asset_id=asset_id,
       amount=amount,
       source=TransferPeerPath(VAULT_ACCOUNT, src_id),
       destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
       note="Your first transaction!"
   )
   print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
Transfer from Exchange example
This example transfers 0.001 ETH from an exchange account to vault account ID
1
.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const createTransferFromExchange = async(
  assetId: string, 
  amount: number, 
  sourceExchangeAccountId: string, 
  destVaultAccountId: string
): Promise<CreateTransactionResponse | undefined> => {
  
  try {

    let transactionPayload: TransactionsApiCreateTransactionRequest = {
      transactionRequest: {
        assetId,
        amount,
        source: {
          type: TransferPeerPathType.ExchangeAccount,
          id: sourceExchangeAccountId
        },
        destination: {
          type: TransferPeerPathType.VaultAccount,
          id: destVaultAccountId
        }
      }
    }


    const transactionResponse = await fireblocks.transactions.createTransaction(transactionPayload)
    console.log(`Submitted a new transaction:\n ${JSON.stringify(transactionResponse.data?.id, null, 2)}`)
    
    return transactionResponse.data as CreateTransactionResponse
  
  } catch(error) {
    console.error(error)
  }
}

createTransferFromExchange("ETH_TEST5", 0.1, "0b5376e8-e46e-5bb7-e2c0-8428e41a75c9", "1" )
async function createTransaction(assetId, amount, srcId, destId){ 
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.EXCHANGE_ACCOUNT,
            id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(destId)
        },
        note: "Your first Exchange transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0b5376e8-e46e-5bb7-e2c0-8428e41a75c9","1");
def create_transaction(asset_id, amount, src_id, dest_id):
   tx_result = fireblocks.create_transaction(
       asset_id=asset_id,
       amount=amount,
       source=TransferPeerPath(VAULT_ACCOUNT, src_id),
       destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
       note="Your first transaction!"
   )
   print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
Internal Exchange transfers
Make a request to the
Internal transfer for exchange accounts
endpoint to transfer funds between trading accounts under the same exchange account.
Exchange account types
Main accounts
Your main account is the default account on the exchange. It is the exchange gateway for Fireblocks and other exchanges and is the only account that can make deposits and withdrawals.
Sub accounts
You can add exchange sub-accounts and link them to your main account on the Fireblocks platform. Sub-accounts can be used to segregate different teams or accounts or to mitigate risk.
To fund sub-accounts, transfer funds into the exchange main account, then to the sub-account. To withdraw from a sub-account, transfer funds to the main account and then to your preferred destination.
Trading accounts
Fireblocks provides visibility into exchange trading accounts and enables rebalancing between them on supported exchanges. Transfers can only be sent between exchange trading accounts and their associated main accounts.
To fund trading accounts, transfer funds to your main account or sub-account, and then transfer between trading accounts.
🚧
Exchange account transfer limitations
You can only transfer funds between main accounts and sub-accounts; or between main accounts and their associated exchange trading accounts
Transfers between main accounts and sub-accounts; or between trading accounts take place off-chain and do not require a network fee.
Transferring funds between sub-accounts is not supported.
📘
Additional background
Trading Accounts
Feature list for Integrated Exchanges
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Transfer to Exchange example
Transfer from Exchange example
Internal Exchange transfers
Exchange account types

---

## Execute Smart Transfers {#execute-smart-transfers}

*Source: https://developers.fireblocks.com/docs/execute-smart-transfers*

Execute Smart Transfers
Overview
As you can open a regular Smart Transfer ticket
via these API endpoints
, an intermediary can open a Smart Transfer ticket for two third-parties only via our API as well, and follow its life cycle. In order for you, as an intermediary, to open such a ticket for your third-parties, all three of you need to be connected to each other with the same network profiles on the Fireblocks Network.
Smart Transfer flow
To create Smart Transfer tickets an established network connection must exist. In the intermediary case, all sides (intermediary and counterparties settling the tickets) should be connected via the same Network Profile.
The flow of executing a Smart Transfer ticket consists of the following steps:
Create a Smart Transfer ticket
Fund Smart Transfer ticket
Cancel Smart Transfer ticket
📘
Check out the
Smart Transfers Developer Guide
for more information
Updated
20 days ago
Connect to the Fireblocks Network
Connect to Exchanges and Fiat Providers
Table of Contents
Overview
Smart Transfer flow

---

## Payment Flows Copy {#payment-flows-copy}

*Source: https://developers.fireblocks.com/docs/payment-flows-copy*

Define Payment Flows
What are Payment Flows?
Fireblocks empowers you to leverage blockchains and digital rails for efficient, dependable, and predictable payments. The Payments feature in Fireblocks enables the creation of secure, dynamic payment flows that consist of various actions within a single solution.
Payment flows allow you to streamline and automate your payment transactions. By configuring and executing payments directly from the Payments page in the Fireblocks Console or via the
Fireblocks API
, you can manage various types of financial operations with ease and precision.
📘
Check out the Payment Flows Developer Guide
here
How does it work?
The Payments API involves two resources.
Workflow Configuration (WC):
This resource acts as a template for your payment flow. It contains the types of operations and each operation’s schema of parameters. Each operation under a WC is referred to as a workflow configuration operation (WCO).
Workflow Execution (WE):
This resource allows you to validate, preview, and launch your payment flow based on a specific WC. Each operation within a WE is referred to as a workflow execution operation (WEO).
Generally, the payment workflow consists of the following three steps:
Create a WC
.
The WC completes the validation process and moves to
READY_FOR_EXECUTION
state.
Create a WE based on the WC
.
The WE completes the validation process and the preview process and moves to
READY_FOR_LAUNCH
state.
Launch the WE
.
The validation and preview processes are not instantaneous. Before continuing to the next step, the WC or WE should be in a ready state.
The validation process is required again when creating the WE because:
Changes may have occurred during the time between creating a WC and creating a WE. For example, the account could have been removed from the workspace.
New parameters may have been added when creating the WE and should be verified.
Updated
20 days ago
Create Payouts
Perform DRS process
Table of Contents
What are Payment Flows?
How does it work?

---

## Creating A Transaction {#creating-a-transaction}

*Source: https://developers.fireblocks.com/docs/creating-a-transaction*

Creating a Transaction
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Creating vaults and wallets
Overview
Every transaction on the Fireblocks platform is initiated using the
Create a new transaction
API call. Its default operation type is
TRANSFER
, however, other important operations are available as valid values for the
operation
body parameter.
See all
operation
valid values.
The main available transaction operations are:
TRANSFER: transfer an asset from one source to one destination
CONTRACT_CALL: Directly invoke a smart contract
RAW: Sign arbitrary data using the Raw Signing API
MINT: Perform a mint operation (increase supply) on a supported token
BURN: Perform a burn operation (reduce supply) on a supported token
TYPED_MESSAGE: allows users to sign messages, but only using specific standard formats that prefix the message with a magic string, such as
Ethereum personal messages
, and (EIP712 typed structured data) type structured data
The API call serves all possible source and destination combinations including a one-time address destination (
OTA
),
vault account
, pre-whitelisted
internal wallet
,
external wallet
&
contract wallet
,
Fireblocks Network connections
and any connected
exchange account
and
fiat account
.
📘
Note:
Although there are required parameters for the
Create a new transaction
API call, you can pass other optional body parameters depending on the asset or the required operation.
The endpoint also accepts the addition of the
extraParameters
object, used to describe additional details required for raw message signing, contract calls, and specific UTXO selections.
Learn how the
extraParameters
object works in transaction responses.
Your first transaction
Vault account to vault account transaction
To start, initiate a transaction from one Fireblocks vault account to another. Account-based assets allow single-destination transfer and UTXO assets allow multi-destination transfer.
Single destination transfer (ETH)
The example transfers 0.001 amount of ETH from vault account ID
0
to vault account ID
1
.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};

createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId){ 
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(destId)
        },
        note: "Your first transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1");
def create_transaction(asset_id, amount, src_id, dest_id):
   tx_result = fireblocks.create_transaction(
       asset_id=asset_id,
       amount=amount,
       source=TransferPeerPath(VAULT_ACCOUNT, src_id),
       destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
       note="Your first transaction!"
   )
   print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
Multiple destinations transfer
Transfer 0.001 BTC from the first vault account (
"1"
), by sending 0.0005 BTC to the second vault account (using
id: "2"
) and 0.0005 BTC to the third vault account (
id: "3"
) as destinations.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "BTC",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  destinations: [
    {
      amount: "0.0005",
      destination: {
        type: TransferPeerPathType.VaultAccount,
        id: "2",
      },
    },
    {
      amount: "0.0005",
      destination: {
        type: TransferPeerPathType.VaultAccount,
        id: "3",
      },
    },
  ],
  note: "Your first multiple destination transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId){
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT, 
            id: String(srcId)
        },
        destinations: [
            {amount: "0.0005", destination: {type: PeerType.VAULT_ACCOUNT, id: "2"}},
            {amount: "0.0005", destination: {type: PeerType.VAULT_ACCOUNT, id: "3"}}
        ],
        note: "Your first multiple destination transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "1");
def create_transaction(asset_id, amount, src_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destinations=[
            TransactionDestination("0.0005", DestinationTransferPeerPath(VAULT_ACCOUNT, "2")),
            TransactionDestination("0.0005", DestinationTransferPeerPath(VAULT_ACCOUNT, "3"))

        ],
        note="Your first multiple destination transaction!"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "1")
Vault account to one-time address transaction
Transfer 0.01 ETH between the vault account (
"1"
) to a specific one-time blockchain address.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  destination: {
    type: TransferPeerPathType.OneTimeAddress,
    oneTimeAddress: {
      address: "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446",
    },
  },
  note: "Your first OTA transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, address){
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT, 
            id: String(srcId)
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: String(address)
            }
        },
        note: "Your first OTA transaction!"
    };
   const result = await fireblocks.createTransaction(payload);
   console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "1", "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446");
def create_transaction(asset_id, amount, src_id, address):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(ONE_TIME_ADDRESS, None, {"address": address}),
        note="Your first OTA transaction!"
    )
    print(tx_result)
	
create_transaction("ETH", "0.001", "1", "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446")
API idempotency best practice
Fireblocks supports
API idempotency
in the submission of requests. It is important to ensure a request will not be processed twice via the API Gateway, avoiding replay attacks, double-spending issues, or other transaction errors.
The best practice for creating transactions is to use the
externalTxId
parameter as seen in the
Optional parameters section.
📘
API idempotency for POST requests
Use the idempotency key for the additonal POST requests such as
Creating a new asset deposit address
or
Creating a new vault account
.
Learn more about API Idempotency.
Optional parameters
Some blockchains have different technicalities when building transactions, handled using optional parameters.
externalTxId
The
critical
practice to avoid multiple identical POST transaction requests being processed more than once is to use the
externalTxId
parameter in the
Create a new transaction
API call.
The
externalTxId
value is the internal identifier of the transaction you will have on your end.
This value is securely stored in the Fireblocks system and additional transaction requests with the same
externalTxId
value will not be processed on our system.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  externalTxId: "UniqueIdentifier", // the unique identifier of the transaction outside of Fireblocks
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, externalTxId){
    let payload = {
        assetId,
        amount,
        externalTxId, // the unique identifier of the transaction outside of Fireblocks
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first transaction identified by an external ID"
    };
		const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1", "uniqueTXid");
def create_transaction(asset_id, amount, src_id, dest_id, external_tx_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        external_tx_id=external_tx_id, # the unique identifier of the transaction outside of Fireblocks
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first transaction identified by an external ID"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "uniqueTXid")
treatAsGrossAmount
The value is
false
by default. If it is set to
true
, the network fee will be deducted from the requested amount.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
	assetId: "ETH",
	amount: "0.001",
	treatAsGrossAmount: true, // true or false (by default - false)
	source: {
		type: TransferPeerPathType.VaultAccount,
		id: "0",
	},
	destination: {
		type: TransferPeerPathType.VaultAccount,
		id: "1",
	},
	note: "Your first treat as gross transaction!"
}

const createTransaction = async (
	transactionPayload:TransactionRequest
):Promise<CreateTransactionResponse | undefined > => {
	try {
		const transactionResponse = await fireblocks.transactions.createTransaction(
			{
				transactionRequest:transactionPayload
			}
		);
		console.log(JSON.stringify(transactionResponse.data, null, 2));
		return transactionResponse.data;
	}
	catch(error){
		console.error(error);
	}
}
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId){
    let payload = {
       assetId,
       amount,
       treatAsGrossAmount: true, // true / false (by default)
       source: {
           type: PeerType.VAULT_ACCOUNT,
           id: String(srcId)
       },
       destination: {
           type: PeerType.VAULT_ACCOUNT, 
           id: String(destId)
       },
       note: "Your first treat as gross transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1");
def create_transaction(asset_id, amount, src_id, dest_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        treat_as_gross_amount=True, # true / false (by default)
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
     note: "Your first treat as gross transaction!"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
fee
For UTXO-based assets,
fee
refers to the fee per byte in the asset's smallest unit (Satoshi, Latoshi, etc).
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
	assetId: "BTC",
	amount: "0.001",
	fee: "15", // Satoshi per Byte
	source: {
		type: TransferPeerPathType.VaultAccount,
		id: "0",
	},
	destination: {
		type: TransferPeerPathType.VaultAccount,
		id: "1",
	},
	note: "Your first high fee transaction!"
}

const createTransaction = async (
	transactionPayload:TransactionRequest
):Promise<CreateTransactionResponse | undefined > => {
	try {
		const transactionResponse = await fireblocks.transactions.createTransaction(
			{
				transactionRequest:transactionPayload
			}
		);
		console.log(JSON.stringify(transactionResponse.data, null, 2));
		return transactionResponse.data;
	}
	catch(error){
		console.error(error);
	}
}
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, fee){
    let payload = {
        assetId,
        amount,
        fee, //Satoshi per Byte
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first high fee transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", "15");
def create_transaction(asset_id, amount, src_id, dest_id, fee):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fee=fee, #Satoshi per Byte
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first high fee transaction!"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "15")
feeLevel
Defines the blockchain fee level which will be paid for the transaction (only for Ethereum and UTXO-based blockchains). Set to
MEDIUM
by default. Valid values are
LOW
MEDIUM
&
HIGH
.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  feeLevel: TransactionRequestFeeLevelEnum.High, // Low / Medium / High
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first high fee level transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, feeLevel){
    let payload = {
        assetId,
        amount,
        feeLevel, // LOW / MEDIUM / HIGH  
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first high fee level transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", "HIGH");
def create_transaction(asset_id, amount, src_id, dest_id, fee_level):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fee_level=fee_level, # LOW / MEDIUM / HIGH
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first high fee level transaction!"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "0", "1", "HIGH")
failOnLowFee
Set to
false
by default. If set to
true
, and the
feeLevel
(value:
MEDIUM
) is higher than the acceptable amount specified in the transaction, the transaction will fail, to avoid getting stuck with 0 confirmations.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  failOnLowFee: true, // true / false (default - false)
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first failOnLowFee transaction",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, failOnLowFee){
    let payload = {
        assetId,
        amount,
        failOnLowFee, // true / false (default)
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first failOnLowFee transaction"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", true);
def create_transaction(asset_id, amount, src_id, dest_id, fail_on_low_fee):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fail_on_low_fee=fail_on_low_fee, # True / False (by default)
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first failOnLowFee transaction"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "0", "1", True)
replaceTxByHash
For Ethereum blockchain transactions, the
replaceTxByHash
parameter is the hash of the stuck transaction that needs to be replaced.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
	replaceTxByHash, // the hash of the transaction you wish to be replaced
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first failOnLowFee transaction",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, replaceTxByHash){
    let payload = {
        assetId,
        amount,
        replaceTxByHash, // the hash of the transaction you wish to be replaced
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first fee replacement transaction"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1", "0x5e0ce0b1242d1c85c17fc5127daa88e9eb842650e3e6a9a6de7c1bd9c3977cc2");
def create_transaction(asset_id, amount, src_id, dest_id, replace_tx_by_hash):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        replace_tx_by_hash=replace_tx_by_hash, # the hash of the transaction you wish to be replaced
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first fee replacement transaction"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "0x5e0ce0b1242d1c85c17fc5127daa88e9eb842650e3e6a9a6de7c1bd9c3977cc2")
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Your first transaction
Vault account to vault account transaction
Vault account to one-time address transaction
API idempotency best practice
Optional parameters
externalTxId
treatAsGrossAmount
fee
feeLevel
failOnLowFee
replaceTxByHash

---

## Monitor Tx Status {#monitor-tx-status}

*Source: https://developers.fireblocks.com/docs/monitor-tx-status*

Monitoring Transaction Status
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Webhooks & Notifications Guide
About transaction statuses
Overview
Fireblocks posts several transaction statuses and sub-status messages while a transaction is progressing and based on the asset type. For example:
UTXO-based assets: A notification of an incoming transaction is created when the transaction is present in the mempool.
Account-based assets: A notification of an incoming transaction is created when the transaction is mined.
The best practice is to use webhooks to receive these status updates and populate your front-end or back-end as the transaction progresses.
Webhook examples - best practice
If you've installed a webhook server inside your environment and configured it in your workspace, following the
Webhooks & Notifications guide
, you'll now receive push notifications for transactions created or other workspace notifications.
On your webhook server, you can trigger additional behaviors with the code you place for the response to the webhook event post message your server got, basing it on the Transaction ID.
Your webhook server notification includes the primary status of the transaction and its sub-status.
See a full list of the transaction statuses and sub-statuses.
Basic example
The example below shows how the
app.post
function, which is a part of our basic example for a Webhooks server, responds to the Console with the transaction ID, status, and sub-status details received inside the Webhook.
JavaScript
Python
app.post( '/', ( req, res ) => {
    console.log( '********************* received webhook ******************');
    console.log( 'Transaction ID:', req.body.data.id);
    console.log( 'Transaction Sub Status:', req.body.data.subStatus);
    console.log( 'Transaction Status:', req.body.data.status );
    res.sendStatus( 200 )
} );
class SimpleRequest:
  def on_post(self, req, resp):
    request = json.loads(req.body.decode("utf-8"))
    print("********************* received webhook ******************")
    print("Transaction ID:", request["id"])
    print("Transaction Sub Status:", request["subStatus"])
    print("Transaction Status:", request["status"])
    resp.status = falcon.HTTP_200
    
app.add_route('/', SimpleRequest())
Act on transaction success example
The example below shows how the
app.post
function responds with a call to an example backend function to report the failure and provide the details around it.
JavaScript
Python
app.post( '/', ( req, res ) => {
    console.log( '********************* received webhook ******************');
		 if (req.body.data.status === TransactionStatus.BLOCKED || tx.status === TransactionStatus.CANCELLED || tx.status === TransactionStatus.FAILED) {
            failedTx(req.body.data.id);
     }
    res.sendStatus( 200 )
} );
class SuccessfulRequest:
  def on_post(self, req, resp):
    request = json.loads(req.body.decode("utf-8"))
    if request["status"] in (TRANSACTION_STATUS_BLOCKED, TRANSACTION_STATUS_FAILED, TRANSACTION_STATUS_CANCELLED):
      failed_tx([request["id"])
    resp.status = falcon.HTTP_200
    
app.add_route('/', SuccessfulRequest())
Act on transaction failure example
See examples of transaction failures and how to handle them.
Reconciliation and crediting
Depending on the asset type, this status update occurs at different times.
Only consider incoming transactions for reconciliation after you receive a notification that the incoming transaction’s status has been updated to
COMPLETED
.
After verifying the transaction’s status, check the wallet’s balance to verify the deposit is included.
The following sequence diagram can be used as a reference for a best practice reconciliation flow:
Non-production monitoring example
If you have not yet configured a webhook and would like to monitor transaction status on your non-production environment, you can use the example below which regularly calls the Fireblocks
Find a specific transaction
endpoint to get the status.
The example below calls the
getTransactionById
function with the transaction ID as its parameter (
txId
) and continuously polls for status change in a fixed interval, returning an error if it is not finalized with the completed status.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const getTxStatus = async (
  txId: string,
): Promise<TransactionStateEnum | string> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

    if (!tx) {
      return "Transaction does not exist";
    }

    console.log(messageToConsole);
    while (tx.status !== TransactionStateEnum.Completed) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      response = await fireblocks.transactions.getTransaction({ txId });
      tx = response.data;

      switch (tx.status) {
        case TransactionStateEnum.Blocked:
        case TransactionStateEnum.Cancelled:
        case TransactionStateEnum.Failed:
        case TransactionStateEnum.Rejected:
          throw new Error(
            `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`,
          );
        default:
          console.log(messageToConsole);
          break;
      }
    }

    return tx.status;
  } catch (error) {
    throw error;
  }
};

getTxStatus("<SOME_TX_ID>");
async function getTxStatus(txId){
    let tx = await fireblocks.getTransactionById(txId);
    console.log('TX ' + tx.id + ' is currently at status - '+ tx.status);
    while (tx.status !== TransactionStatus.COMPLETED) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        tx = await fireblocks.getTransactionById(txId);
        if (tx.status === TransactionStatus.BLOCKED || tx.status === TransactionStatus.CANCELLED || tx.status === TransactionStatus.FAILED) {
            throw new Error("Signing request failed.");
        }
        console.log('TX ' + tx.id + ' is currently at status - '+ tx.status);
    }
}
def get_tx_status(tx_id) -> dict:
   timeout = 0
   current_status = fireblocks.get_transaction_by_id(tx_id)[STATUS_KEY]
   while current_status not (TRANSACTION_STATUS_COMPLETED):
       print(f"TX [{tx_id}] is currently at status - {current_status} {'.' * (timeout % 3)}                ",
             end="\r")
       time.sleep(3)
       current_status = fireblocks.get_transaction_by_id(tx_id)[STATUS_KEY]
       timeout += 1
🚧
Rate limits with monitoring:
Rate limits can affect monitoring. Use webhooks whenever possible to minimize the number of API calls made against your rate limits.  More information at
Working with Rate Limits
.
This method also allows you to scale monitoring for more transactions as you build your business, without affecting your ability to actually process more transactions.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Webhook examples - best practice
Basic example
Reconciliation and crediting
Non-production monitoring example

---

## Building A Transaction {#building-a-transaction}

*Source: https://developers.fireblocks.com/docs/building-a-transaction*

Creating a Transaction
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Creating vaults and wallets
Overview
Every transaction on the Fireblocks platform is initiated using the
Create a new transaction
API call. Its default operation type is
TRANSFER
, however, other important operations are available as valid values for the
operation
body parameter.
See all
operation
valid values.
The main available transaction operations are:
TRANSFER: transfer an asset from one source to one destination
CONTRACT_CALL: Directly invoke a smart contract
RAW: Sign arbitrary data using the Raw Signing API
MINT: Perform a mint operation (increase supply) on a supported token
BURN: Perform a burn operation (reduce supply) on a supported token
TYPED_MESSAGE: allows users to sign messages, but only using specific standard formats that prefix the message with a magic string, such as
Ethereum personal messages
, and (EIP712 typed structured data) type structured data
The API call serves all possible source and destination combinations including a one-time address destination (
OTA
),
vault account
, pre-whitelisted
internal wallet
,
external wallet
&
contract wallet
,
Fireblocks Network connections
and any connected
exchange account
and
fiat account
.
📘
Note:
Although there are required parameters for the
Create a new transaction
API call, you can pass other optional body parameters depending on the asset or the required operation.
The endpoint also accepts the addition of the
extraParameters
object, used to describe additional details required for raw message signing, contract calls, and specific UTXO selections.
Learn how the
extraParameters
object works in transaction responses.
Your first transaction
Vault account to vault account transaction
To start, initiate a transaction from one Fireblocks vault account to another. Account-based assets allow single-destination transfer and UTXO assets allow multi-destination transfer.
Single destination transfer (ETH)
The example transfers 0.001 amount of ETH from vault account ID
0
to vault account ID
1
.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};

createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId){ 
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT,
            id: String(destId)
        },
        note: "Your first transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1");
def create_transaction(asset_id, amount, src_id, dest_id):
   tx_result = fireblocks.create_transaction(
       asset_id=asset_id,
       amount=amount,
       source=TransferPeerPath(VAULT_ACCOUNT, src_id),
       destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
       note="Your first transaction!"
   )
   print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
Multiple destinations transfer
Transfer 0.001 BTC from the first vault account (
"1"
), by sending 0.0005 BTC to the second vault account (using
id: "2"
) and 0.0005 BTC to the third vault account (
id: "3"
) as destinations.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "BTC",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  destinations: [
    {
      amount: "0.0005",
      destination: {
        type: TransferPeerPathType.VaultAccount,
        id: "2",
      },
    },
    {
      amount: "0.0005",
      destination: {
        type: TransferPeerPathType.VaultAccount,
        id: "3",
      },
    },
  ],
  note: "Your first multiple destination transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId){
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT, 
            id: String(srcId)
        },
        destinations: [
            {amount: "0.0005", destination: {type: PeerType.VAULT_ACCOUNT, id: "2"}},
            {amount: "0.0005", destination: {type: PeerType.VAULT_ACCOUNT, id: "3"}}
        ],
        note: "Your first multiple destination transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "1");
def create_transaction(asset_id, amount, src_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destinations=[
            TransactionDestination("0.0005", DestinationTransferPeerPath(VAULT_ACCOUNT, "2")),
            TransactionDestination("0.0005", DestinationTransferPeerPath(VAULT_ACCOUNT, "3"))

        ],
        note="Your first multiple destination transaction!"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "1")
Vault account to one-time address transaction
Transfer 0.01 ETH between the vault account (
"1"
) to a specific one-time blockchain address.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  destination: {
    type: TransferPeerPathType.OneTimeAddress,
    oneTimeAddress: {
      address: "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446",
    },
  },
  note: "Your first OTA transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, address){
    let payload = {
        assetId,
        amount,
        source: {
            type: PeerType.VAULT_ACCOUNT, 
            id: String(srcId)
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: String(address)
            }
        },
        note: "Your first OTA transaction!"
    };
   const result = await fireblocks.createTransaction(payload);
   console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "1", "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446");
def create_transaction(asset_id, amount, src_id, address):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(ONE_TIME_ADDRESS, None, {"address": address}),
        note="Your first OTA transaction!"
    )
    print(tx_result)
	
create_transaction("ETH", "0.001", "1", "0x13277a70e3F48EEAD9C8a8bab12EbEDbC3DB6446")
API idempotency best practice
Fireblocks supports
API idempotency
in the submission of requests. It is important to ensure a request will not be processed twice via the API Gateway, avoiding replay attacks, double-spending issues, or other transaction errors.
The best practice for creating transactions is to use the
externalTxId
parameter as seen in the
Optional parameters section.
📘
API idempotency for POST requests
Use the idempotency key for the additonal POST requests such as
Creating a new asset deposit address
or
Creating a new vault account
.
Learn more about API Idempotency.
Optional parameters
Some blockchains have different technicalities when building transactions, handled using optional parameters.
externalTxId
The
critical
practice to avoid multiple identical POST transaction requests being processed more than once is to use the
externalTxId
parameter in the
Create a new transaction
API call.
The
externalTxId
value is the internal identifier of the transaction you will have on your end.
This value is securely stored in the Fireblocks system and additional transaction requests with the same
externalTxId
value will not be processed on our system.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  externalTxId: "UniqueIdentifier", // the unique identifier of the transaction outside of Fireblocks
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, externalTxId){
    let payload = {
        assetId,
        amount,
        externalTxId, // the unique identifier of the transaction outside of Fireblocks
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first transaction identified by an external ID"
    };
		const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1", "uniqueTXid");
def create_transaction(asset_id, amount, src_id, dest_id, external_tx_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        external_tx_id=external_tx_id, # the unique identifier of the transaction outside of Fireblocks
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first transaction identified by an external ID"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "uniqueTXid")
treatAsGrossAmount
The value is
false
by default. If it is set to
true
, the network fee will be deducted from the requested amount.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
	assetId: "ETH",
	amount: "0.001",
	treatAsGrossAmount: true, // true or false (by default - false)
	source: {
		type: TransferPeerPathType.VaultAccount,
		id: "0",
	},
	destination: {
		type: TransferPeerPathType.VaultAccount,
		id: "1",
	},
	note: "Your first treat as gross transaction!"
}

const createTransaction = async (
	transactionPayload:TransactionRequest
):Promise<CreateTransactionResponse | undefined > => {
	try {
		const transactionResponse = await fireblocks.transactions.createTransaction(
			{
				transactionRequest:transactionPayload
			}
		);
		console.log(JSON.stringify(transactionResponse.data, null, 2));
		return transactionResponse.data;
	}
	catch(error){
		console.error(error);
	}
}
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId){
    let payload = {
       assetId,
       amount,
       treatAsGrossAmount: true, // true / false (by default)
       source: {
           type: PeerType.VAULT_ACCOUNT,
           id: String(srcId)
       },
       destination: {
           type: PeerType.VAULT_ACCOUNT, 
           id: String(destId)
       },
       note: "Your first treat as gross transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1");
def create_transaction(asset_id, amount, src_id, dest_id):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        treat_as_gross_amount=True, # true / false (by default)
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
     note: "Your first treat as gross transaction!"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1")
fee
For UTXO-based assets,
fee
refers to the fee per byte in the asset's smallest unit (Satoshi, Latoshi, etc).
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
	assetId: "BTC",
	amount: "0.001",
	fee: "15", // Satoshi per Byte
	source: {
		type: TransferPeerPathType.VaultAccount,
		id: "0",
	},
	destination: {
		type: TransferPeerPathType.VaultAccount,
		id: "1",
	},
	note: "Your first high fee transaction!"
}

const createTransaction = async (
	transactionPayload:TransactionRequest
):Promise<CreateTransactionResponse | undefined > => {
	try {
		const transactionResponse = await fireblocks.transactions.createTransaction(
			{
				transactionRequest:transactionPayload
			}
		);
		console.log(JSON.stringify(transactionResponse.data, null, 2));
		return transactionResponse.data;
	}
	catch(error){
		console.error(error);
	}
}
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, fee){
    let payload = {
        assetId,
        amount,
        fee, //Satoshi per Byte
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first high fee transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", "15");
def create_transaction(asset_id, amount, src_id, dest_id, fee):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fee=fee, #Satoshi per Byte
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first high fee transaction!"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "15")
feeLevel
Defines the blockchain fee level which will be paid for the transaction (only for Ethereum and UTXO-based blockchains). Set to
MEDIUM
by default. Valid values are
LOW
MEDIUM
&
HIGH
.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  feeLevel: TransactionRequestFeeLevelEnum.High, // Low / Medium / High
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first high fee level transaction!",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, feeLevel){
    let payload = {
        assetId,
        amount,
        feeLevel, // LOW / MEDIUM / HIGH  
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first high fee level transaction!"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", "HIGH");
def create_transaction(asset_id, amount, src_id, dest_id, fee_level):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fee_level=fee_level, # LOW / MEDIUM / HIGH
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first high fee level transaction!"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "0", "1", "HIGH")
failOnLowFee
Set to
false
by default. If set to
true
, and the
feeLevel
(value:
MEDIUM
) is higher than the acceptable amount specified in the transaction, the transaction will fail, to avoid getting stuck with 0 confirmations.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
  failOnLowFee: true, // true / false (default - false)
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first failOnLowFee transaction",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, failOnLowFee){
    let payload = {
        assetId,
        amount,
        failOnLowFee, // true / false (default)
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first failOnLowFee transaction"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("BTC", "0.001", "0", "1", true);
def create_transaction(asset_id, amount, src_id, dest_id, fail_on_low_fee):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        fail_on_low_fee=fail_on_low_fee, # True / False (by default)
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first failOnLowFee transaction"
    )
    print(tx_result)

create_transaction("BTC", "0.001", "0", "1", True)
replaceTxByHash
For Ethereum blockchain transactions, the
replaceTxByHash
parameter is the hash of the stuck transaction that needs to be replaced.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const transactionPayload = {
  assetId: "ETH",
  amount: "0.001",
	replaceTxByHash, // the hash of the transaction you wish to be replaced
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0",
  },
  destination: {
    type: TransferPeerPathType.VaultAccount,
    id: "1",
  },
  note: "Your first failOnLowFee transaction",
};

const createTransaction = async (
  transactionPayload: TransactionRequest,
): Promise<CreateTransactionResponse | undefined> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    console.log(JSON.stringify(transactionResponse.data, null, 2));
    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};
createTransaction(transactionPayload);
async function createTransaction(assetId, amount, srcId, destId, replaceTxByHash){
    let payload = {
        assetId,
        amount,
        replaceTxByHash, // the hash of the transaction you wish to be replaced
        source: {
            type: PeerType.VAULT_ACCOUNT, 
         		id: String(srcId)
        },
        destination: {
            type: PeerType.VAULT_ACCOUNT, 
        		id: String(destId)
        },
        note: "Your first fee replacement transaction"
    };
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
}
createTransaction("ETH", "0.001", "0", "1", "0x5e0ce0b1242d1c85c17fc5127daa88e9eb842650e3e6a9a6de7c1bd9c3977cc2");
def create_transaction(asset_id, amount, src_id, dest_id, replace_tx_by_hash):
    tx_result = fireblocks.create_transaction(
        asset_id=asset_id,
        amount=amount,
        replace_tx_by_hash=replace_tx_by_hash, # the hash of the transaction you wish to be replaced
        source=TransferPeerPath(VAULT_ACCOUNT, src_id),
        destination=DestinationTransferPeerPath(VAULT_ACCOUNT, dest_id),
        note="Your first fee replacement transaction"
    )
    print(tx_result)

create_transaction("ETH", "0.001", "0", "1", "0x5e0ce0b1242d1c85c17fc5127daa88e9eb842650e3e6a9a6de7c1bd9c3977cc2")
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Your first transaction
Vault account to vault account transaction
Vault account to one-time address transaction
API idempotency best practice
Optional parameters
externalTxId
treatAsGrossAmount
fee
feeLevel
failOnLowFee
replaceTxByHash

---

