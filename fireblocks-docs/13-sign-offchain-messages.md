# 13 Sign Offchain Messages

This document contains 4 sections related to 13 sign offchain messages.

## Table of Contents

1. [Raw Signing](#raw-signing)
2. [Typed Message Signing 1](#typed-message-signing-1)
3. [Typed Message Signing](#typed-message-signing)
4. [Raw Message Signing](#raw-message-signing)

---

## Raw Signing {#raw-signing}

*Source: https://developers.fireblocks.com/docs/raw-signing*

Sign RAW Messages
❗️
Warning
Raw Signing is an insecure signing method and is not generally recommended. Bad actors can trick someone into signing a valid transaction message and use it to steal funds.
For this reason, Raw Signing is a premium feature that requires an additional purchase and is not available in workspaces by default.
If you're interested in this feature and want to see if your use case is eligible for it, please contact your Customer Success Manager.
Fireblocks Sandbox workspaces have Raw Signing enabled by default to allow for testing purposes.
Overview
Raw Signing is a powerful feature within Fireblocks. As the Web3 world continues to evolve rapidly, Fireblocks provides the option to support additional chains and actions by signing an arbitrary message using the Fireblocks infrastructure.
Our WalletConnect integration and the Fireblocks Chrome Extension sometimes use Raw Signing to sign transactions initiated by dApps. You will need to add Policy rules for these dApp-initiated raw transactions to go through.
📘
Check out the Raw Signing Developer Guide
here
What are the use cases for Raw Message Signing?
Typically, Raw Message Signing is used in the following scenarios:
When you want to sign a transaction on a blockchain that Fireblocks doesn’t currently support
When you want to perform an operation that we don’t currently support on a blockchain that we do support (e.g., staking on a lesser-known blockchain)
When you want to use cryptography to prove and validate messages that are not supported by
Typed Message Signing
(e.g., Proof of Assets, Proof of Addresses)
When someone sends funds to your address over a blockchain that we don’t currently support, and you want to recover the funds
Enabling Raw Signing
By default, Raw signing is not available in production workspaces. Contact your Customer Success Manager to enable Raw Signing.
If Raw Signing is disabled in your workspace and you attempt to create a raw transaction, it will fail and show the
BLOCKED_BY_POLICY
substatus.
Policy rules for Raw Signing
Policies
reject all raw transactions by default. After enabling the Raw Signing feature in your production workspace, you must add Policy rules that allow users to initiate, approve, and sign raw transactions from specific vault accounts.
You can also use your Policy rules to limit the range of derivation paths, vault accounts, and assets available for raw transactions. Unless explicitly defined otherwise in the rule, the rule matches all derivation paths. When creating the rule, select Groups and accounts as your source and enter Any vault. Then you can enter a derivation path.
The derivation path used in signing can be passed along with the signing request in one of two ways:
Explicitly:
By passing the signing algorithm and the full derivation path
Implicitly:
By passing the vault account ID, the asset ID, and (optionally) the change and the address index
These properties together comprise a full BIP44-like derivation path. Typically, this approach is used to create custom transactions on supported protocols.
Updated
20 days ago
Perform DRS process
Sign Typed Messages
Table of Contents
Overview
What are the use cases for Raw Message Signing?
Enabling Raw Signing
Policy rules for Raw Signing

---

## Typed Message Signing 1 {#typed-message-signing-1}

*Source: https://developers.fireblocks.com/docs/typed-message-signing-1*

Sign Typed Messages
What is Typed Message Signing?
Typed message signing is a crucial function in the blockchain ecosystem, designed to ensure security, transparency, and user trust when interacting with various blockchain applications.
Typed message signing refers to the process of creating and signing structured data that both machines and humans can understand and verify.
Unlike traditional message signing that deals with arbitrary data, typed message signing structures the data according to predefined formats, making it readable and understandable before it is signed. This process ensures that the signer fully comprehends what they are agreeing to, thereby enhancing the security and clarity of blockchain transactions.
Enabling Typed Message Signing
To sign a Typed Message,
create a Typed Message Policy rule
.
What are the use cases for Typed Message Signing?
Proof of Ownership:
Users can sign messages to demonstrate ownership of a particular blockchain address or asset without making any on-chain transaction, crucial for identity verification processes.
Proof of Reserves:
Financial institutions can use typed message signing to prove possession of sufficient funds or assets in a transparent manner, enhancing trust among users or regulators.
Compliance with Regulations:
In scenarios like the Travel Rule and
TRUST Platform
in the cryptocurrency space, businesses must share certain transaction details with each other and regulatory bodies. Typed message signing ensures that this information is exchanged securely and verifiably.
Smart Contracts and Legal Agreements
: In complex agreements or smart contracts, typed message signing can be used to confirm terms, conditions, and any other contractual obligations clearly and securely.
Meta-Transactions:
Typed message signing enables meta-transactions, where users sign transactions that someone else submits to the network. This is particularly useful in dApps that aim to reduce the gas cost burden on users.
Authentication:
Users can sign a typed message to prove ownership of a blockchain address without making a transaction. This method can be used for logging into decentralized applications (dApps) securely.
How Typed Message Signing Works?
Data Structuring:
Initially, the data to be signed is structured into a predefined format. This structure includes defining types, fields, and the order in which the fields appear. This data format is often defined in a smart contract or a protocol specification.
User Confirmation:
Before signing, the structured data is presented to the user in a human-readable form. This step is vital as it allows the user to verify the details of the data they are about to sign, ensuring transparency and informed consent.
Signing:
The user signs the data with their private key. This signature process involves cryptographic algorithms that securely associate the signer's identity with the data they approved.
Verification:
The signature can then be verified by anyone who has access to the signer’s public key, confirming that the specific data was signed by the owner of the private key and that it has not been tampered with since signing.
Typed Message Signing in Fireblocks
Supported Assets and Methods
Typed message signing in Fireblocks is supported for several assets and can be implemented through various methods:
Supported Assets:
EVM-based blockchains (EIP191 & EIP712)
Bitcoin
Tron (TIP191)
Creation Methods for Typed Message Signing Requests:
By decentralized applications (dApps) using the
Fireblocks Browser Extension
or
Wallet Connect integration
Through the Fireblocks API, using the
Create Transaction
API call
Browser Extension or Wallet Connect:
Typed Message Signing requests are created by Decentralized Applications (dApps) when connected via Fireblocks Browser Extension or Wallet Connect integration, for various purposes such as (but not limited to):
Session Authentication:
Similar to traditional web applications, dApps can use message signing to manage sessions. Once a user signs a message to prove ownership of an address, the dApp can create a session for the user without requiring them to sign in through traditional methods like username and password
Proving Ownership:
dApps often need to verify that a user controls a specific blockchain address. Typed message signing enables users to prove ownership without having to conduct a transaction, which can save on transaction fees
Meta-transactions:
Users can sign transactions that are paid for and submitted by another party (like a dApp). This can be used to improve user experience by allowing users to interact with the blockchain without needing to spend Ether for gas
EIP712, EIP191 and dApp authentication signing request examples
Fireblocks API:
Typed Message Signing requests can also be initiated through the API by using the Create Transaction API. These requests are typically generated for scenarios such as (but not limited to):
Proof of Ownership:
Users can sign messages to demonstrate ownership of a particular blockchain address or asset without making any on-chain transaction, crucial for identity verification processes
Compliance with Regulations:
In scenarios like the Travel Rule and
TRUST Platform
in the cryptocurrency space, businesses must share certain transaction details with each other and regulatory bodies. Typed message signing ensures that this information is exchanged securely and verifiably
Proof of Reserves:
Financial institutions can use typed message signing to prove possession of sufficient funds or assets in a transparent manner, enhancing trust among users or regulators
📘
Learn more on Typed Message Signing via API in the following
guide
Updated
20 days ago
Sign RAW Messages
Network Link Integration Guide for Provider Connectivity
Table of Contents
What is Typed Message Signing?
Enabling Typed Message Signing
What are the use cases for Typed Message Signing?
How Typed Message Signing Works?
Typed Message Signing in Fireblocks
Supported Assets and Methods
Browser Extension or Wallet Connect:
Fireblocks API:

---

## Typed Message Signing {#typed-message-signing}

*Source: https://developers.fireblocks.com/docs/typed-message-signing*

Typed Message Signing
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Typed message signing
Overview
Typed Message is a popular activity within the Ethereum ecosystem. This basically lets you sign any arbitrary message you would like.
You can read more about ERC-712 (Typed Structure Data Hashing & Signing)
here
.
You can read more about ERC-191 (Signed Data Standard)
here
📘
Typed Message Signing is available for the following assets:
Any supported EVM-based network (except for FLR and SGB)
Bitcoin personal message
Transaction Authorization Policy (TAP) Requirements
In order to execute Typed Message transactions from Fireblocks, the issuer must be authorized to do so via a "Typed Message" TAP rule, that explicitly allows for typed messages, as shown here:
Typed message signing: EIP-712 example
See below the use of typed message in the EIP-712 standard:
ts-sdk
fireblocks-sdk-js
const getTxStatus = async (txId: string): Promise<TransactionResponse> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

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
    while (tx.status !== TransactionStateEnum.Completed);
    return tx;
  } catch (error) {
    throw error;
  }
};


const chainId = 1 // Update the chainId for the relevant EVM network

const eip712message = {
  "types": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"},
      {"name": "verifyingContract", "type": "address"}
    ],
    "Permit": [
      {"name": "holder", "type": "address"},
      {"name": "spender", "type": "address"},
      {"name": "nonce", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "allowed", "type": "bool"}
    ]
  },
  "primaryType": "Permit",
  "domain": {
    "name": "Dai Stablecoin",
    "version": "1",
    chainId,
    "verifyingContract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  "message": {
    "holder": "0x289826f7248b698B2Aef6596681ab0291BFB2599",
    "spender": "0x043f38E9e8359ca32cD57503df25B8DEF2845356",
    "nonce": 123,
    "expiry": 1655467980,
    "allowed": true
  }
}


const transactionPayload = {
  operation: TransactionOperation.TypedMessage,
  assetId: "ETH",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0", // The vault account ID represnting the address used to sign
  },
  note: "Test EIP-712 Message",
  extraParameters: {
    rawMessageData: {
      messages: [
        {
          content: eip712message,
          type: "EIP712"
        }

      ],
    },
  },
};

let txInfo: any;

const signArbitraryMessage = async (): Promise<
  TransactionResponse | undefined
> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    const txId = transactionResponse.data.id;
    if (!txId) {
      throw new Error("Transaction ID is undefined.");
    }
    txInfo = await getTxStatus(txId);
    console.log(txInfo)
    
    return transactionResponse.data;
    
  } catch (error) {
    console.error(error);
  }
};

signArbitraryMessage();
const chainId = 1; // Update the chainId for the relevant EVM network

const eip712message = {
  "types": {
    "EIP712Domain": [
      {"name": "name", "type": "string"},
      {"name": "version", "type": "string"},
      {"name": "chainId", "type": "uint256"},
      {"name": "verifyingContract", "type": "address"}
    ],
    "Permit": [
      {"name": "holder", "type": "address"},
      {"name": "spender", "type": "address"},
      {"name": "nonce", "type": "uint256"},
      {"name": "expiry", "type": "uint256"},
      {"name": "allowed", "type": "bool"}
    ]
  },
  "primaryType": "Permit",
  "domain": {
    "name": "Dai Stablecoin",
    "version": "1",
    chainId, 
    "verifyingContract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  "message": {
    "holder": "0x289826f7248b698B2Aef6596681ab0291BFB2599",
    "spender": "0x043f38E9e8359ca32cD57503df25B8DEF2845356",
    "nonce": 123,
    "expiry": 1655467980,
    "allowed": true
  }
}


async function signEIP712Message(vaultAccountId: string, messageToSign: any) {
  const { status, id } = await fireblocks.createTransaction({
    operation: TransactionOperation.TYPED_MESSAGE,
    assetId: "ETH",
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: vaultAccountId
    },
    amount: "0",
    note: "Test EIP-712 Message",
    extraParameters: {
      rawMessageData: {
        messages: [
          {
            content: messageToSign,
            type: "EIP712"
          }
        ]
      },
    },
  });
  let currentStatus = status;
  let txInfo;

  while (currentStatus != TransactionStatus.COMPLETED && currentStatus != TransactionStatus.FAILED) {
    console.log("keep polling for tx " + id + "; status: " + currentStatus);
    txInfo = await fireblocks.getTransactionById(id);
    currentStatus = txInfo.status;
    await new Promise(r => setTimeout(r, 1000));
  };
}

signEIP712Message("0", eip712message);
Typed message signing: EIP-191 example
See below the use of typed message signing API for Ethereum message signing.
ts-sdk
fireblocks-sdk-js
let txInfo:any;

const transactionPayload = {
  operation: TransactionOperation.TypedMessage,
  assetId: "ETH",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0", // The vault account ID represnting the address used to sign
  },
  note: `Test Message`,
  extraParameters: {
    rawMessageData: {
      messages: [
        {
          content: Buffer.from("INSERT TEXT HERE!!").toString("hex"),
          type: "ETH_MESSAGE",
        },
      ],
    },
  },
};

const getTxStatus = async (txId: string): Promise<TransactionResponse> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

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
    while (tx.status !== TransactionStateEnum.Completed);

    return tx;
  } catch (error) {
    throw error;
  }
};

const signArbitraryMessage = async (): Promise<
  TransactionResponse | undefined
> => {
  try {
    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    const txId = transactionResponse.data.id;
    if (!txId) {
      throw new Error("Transaction ID is undefined.");
    }
    txInfo = await getTxStatus(txId);

    console.log(txInfo)
    return transactionResponse.data;

  } catch (error) {
    console.error(error);
  }
};

signArbitraryMessage();
async function signArbitraryMessage(fireblocks: FireblocksSDK, vaultAccountId: string, message: string, addressIndex = 0) {

  const { status, id } = await fireblocks.createTransaction({
    operation: TransactionOperation.TYPED_MESSAGE,
    assetId: "ETH",
    source: {
      type: PeerType.VAULT_ACCOUNT,
      id: vaultAccountId
    },
    note: `Test Message`,
    extraParameters: {
      rawMessageData: {
        messages: [{
          content: Buffer.from(message).toString("hex"),
          type: "ETH_MESSAGE"
        }]
      }
    }
  });
  let currentStatus = status;
  let txInfo: any;

  while (currentStatus != TransactionStatus.COMPLETED && currentStatus != TransactionStatus.FAILED) {
    console.log("keep polling for tx " + id + "; status: " + currentStatus);
    txInfo = await fireblocks.getTransactionById(id);
    currentStatus = txInfo.status;
    await new Promise(r => setTimeout(r, 1000));
  };
}

signArbitraryMessage(fireblocks, "0", "INSERT TEXT HERE");
📘
Working with EVM Based Networks:
Since all assets on EVM-based networks share the same address as the ETH wallet within the same vault, you should always specify
assetId = ETH
when initiating Typed Message Signing.
Structuring The Signature:
Once the Typed Message Signing request is successfully signed, you can retrieve the transaction using the
Get Transaction By TxId Endpoint
. The signed transaction will appear in the following format:
EIP-712
EIP-191
{
  "id": "<your_transaction_id>",
  "assetId": "ETH",
  "source": {
    "id": "<vault_account_id>",
    "type": "VAULT_ACCOUNT",
    "name": "<vault_account_name>",
    "subType": ""
  },
  "destination": {
    "id": null,
    "type": "UNKNOWN",
    "name": "N/A",
    "subType": ""
  },
  "requestedAmount": null,
  "amount": null,
  "netAmount": -1,
  "amountUSD": null,
  "fee": -1,
  "networkFee": -1,
  "createdAt": 1712520602396,
  "lastUpdated": 1712520622523,
  "status": "COMPLETED",
  "txHash": "",
  "subStatus": "",
  "sourceAddress": "",
  "destinationAddress": "",
  "destinationAddressDescription": "",
  "destinationTag": "",
  "signedBy": [],
  "createdBy": "<API_KEY>",
  "rejectedBy": "",
  "addressType": "",
  "note": "Test EIP-712 Message",
  "exchangeTxId": "",
  "feeCurrency": "ETH",
  "operation": "TYPED_MESSAGE",
  "amountInfo": {},
  "feeInfo": {},
  "signedMessages": [
    {
      "derivationPath": [
        44,
        60,
        0,
        0,
        0
      ],
      "algorithm": "MPC_ECDSA_SECP256K1",
      "publicKey": "03af66c4551559d54bfbfd14c84870a337b06bf2738ed6427480ec56ee551c7458",
      "signature": {
        "r": "2e31d257c1bcd232c50d628e9e97407373c4a1c5cc79672039a1f7946984a702",
        "s": "370b8e16123e30968ba7018a6726f97dfc82f5547f99fe78b432a40a1d1f8564",
        "v": 0,
        "fullSig": "2e31d257c1bcd232c50d628e9e97407373c4a1c5cc79672039a1f7946984a702370b8e16123e30968ba7018a6726f97dfc82f5547f99fe78b432a40a1d1f8564"
      },
      "content": "36c0b1b40bcd032c871ca176243f5ff7e603a9ce91ff8dae62d79ab8dee6817a"
    }
  ],
  "extraParameters": {
    "rawMessageData": {
      "messages": [
        {
          "type": "EIP712",
          "index": 0,
          "content": {
            "types": {
              "Permit": [
                {
                  "name": "holder",
                  "type": "address"
                },
                {
                  "name": "spender",
                  "type": "address"
                },
                {
                  "name": "nonce",
                  "type": "uint256"
                },
                {
                  "name": "expiry",
                  "type": "uint256"
                },
                {
                  "name": "allowed",
                  "type": "bool"
                }
              ],
              "EIP712Domain": [
                {
                  "name": "name",
                  "type": "string"
                },
                {
                  "name": "version",
                  "type": "string"
                },
                {
                  "name": "chainId",
                  "type": "uint256"
                },
                {
                  "name": "verifyingContract",
                  "type": "address"
                }
              ]
            },
            "domain": {
              "name": "Dai Stablecoin",
              "chainId": 1,
              "version": "1",
              "verifyingContract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
            },
            "message": {
              "nonce": 123,
              "expiry": 1655467980,
              "holder": "0x289826f7248b698B2Aef6596681ab0291BFB2599",
              "allowed": true,
              "spender": "0x043f38E9e8359ca32cD57503df25B8DEF2845356"
            },
            "primaryType": "Permit"
          }
        }
      ]
    }
  },
  "destinations": [],
  "blockInfo": {},
  "assetType": "BASE_ASSET"
}
{
  "id": "<your_transaction_id>",
  "assetId": "ETH",
  "source": {
    "id": "<vault_account_id>",
    "type": "VAULT_ACCOUNT",
    "name": "<vault_account_name>",
    "subType": ""
  },
  "destination": {
    "id": null,
    "type": "UNKNOWN",
    "name": "N/A",
    "subType": ""
  },
  "requestedAmount": null,
  "amount": null,
  "netAmount": -1,
  "amountUSD": null,
  "fee": -1,
  "networkFee": -1,
  "createdAt": 1712522541024,
  "lastUpdated": 1712522564793,
  "status": "COMPLETED",
  "txHash": "",
  "subStatus": "",
  "sourceAddress": "",
  "destinationAddress": "",
  "destinationAddressDescription": "",
  "destinationTag": "",
  "signedBy": [],
  "createdBy": "<API_KEY>",
  "rejectedBy": "",
  "addressType": "",
  "note": "Test EIP191 Message",
  "exchangeTxId": "",
  "feeCurrency": "ETH",
  "operation": "TYPED_MESSAGE",
  "amountInfo": {},
  "feeInfo": {},
  "signedMessages": [
    {
      "derivationPath": [
        44,
        60,
        0,
        0,
        0
      ],
      "algorithm": "MPC_ECDSA_SECP256K1",
      "publicKey": "03af66c4551559d54bfbfd14c84870a337b06bf2738ed6427480ec56ee551c7458",
      "signature": {
        "r": "c8ab06c7c3447ac8f594a643d5942ceb2451b9434bb29c4b1a40da5cf3240300",
        "s": "2bfba73d825b240f2e2949df139c2f3e26e6cdd36579eb1a0cbd4abc4e6e348a",
        "v": 0,
        "fullSig": "c8ab06c7c3447ac8f594a643d5942ceb2451b9434bb29c4b1a40da5cf32403002bfba73d825b240f2e2949df139c2f3e26e6cdd36579eb1a0cbd4abc4e6e348a"
      },
      "content": "90089ed244695164981f5f54e78bea15387a2bdda0dca6a81e1fe79cd30075db"
    }
  ],
  "extraParameters": {
    "rawMessageData": {
      "messages": [
        {
          "type": "ETH_MESSAGE",
          "index": 0,
          "content": "494e53455254205445585420484552452121"
        }
      ]
    }
  },
  "destinations": [],
  "blockInfo": {},
  "assetType": "BASE_ASSET"
}
To access the signature, navigate to the object at the first index (0) of the
signedMessages
array. Within this object, the
signature
object contains three components:
r
,
s
, and
v
:
r
: This is the first 32 bytes of the signature, representing the X coordinate of the point on the elliptic curve
s
: This is the second 32 bytes of the signature, representing the scalar component of the elliptic curve point
v
: This parameter is crucial for correctly reconstructing the public key used in signing. It helps distinguish between the possible public keys that could correspond to the signature
There are principally two methods to assemble a complete, correctly structured signature on EVM-based blockchains, differing primarily in how the
v
value is calculated, a modification introduced by
EIP-155
.
EIP-155 prevents certain types of replay attacks by incorporating the
chainId
into the
v
value:
Before EIP-155
After EIP-155
const signature = txInfo.signedMessages[0].signature;
const v = 27 + signature.v;

const finalSignature =  "0x" + signature.r + signature.s + v.toString(16);
const signature = txInfo.signedMessages[0].signature;
const v = chainId * 2 + 35 + signature.v;

const finalSignature = "0x" + signature.r + signature.s + v.toString(16);
It is important to consider the
chainId
value when working with any EVM-based blockchain as it directly affects the calculation of the
v
parameter.
Properly calculating
v
ensures that the signature correctly corresponds to the network on which the transaction is intended, thus preventing cross-chain replay attacks.
A full list of EVM Networks
chainId
values can be found
here
.
Bitcoin personal message example
ts-sdk
fireblocks-sdk-js
const transactionPayload = {
  operation: TransactionOperation.TypedMessage,
  assetId: "BTC",
  source: {
    type: TransferPeerPathType.VaultAccount,
    id: "0", // The vault account ID represnting the address used to sign
  },
  note: "Bitcoin Message",
  extraParameters: {
    rawMessageData: {
      messages: [
        {
          content: "", // Content remains blank and is replaced by the message built when signing the TX
          type: "BTC_MESSAGE",
        },
      ],
    },
  },
};
const getWalletAddress = async (): Promise<VaultWalletAddress | any> => {
  try {
    const addressResponse =
      await fireblocks.vaults.getVaultAccountAssetAddressesPaginated({
        vaultAccountId: transactionPayload.source.id,
        assetId: transactionPayload.assetId,
      });
    if (addressResponse.data.addresses.length === 0) {
      throw new Error("No wallet addresses found");
    }
    return addressResponse.data;
  } catch (error) {
    console.error(error);
  }
};

const getTxStatus = async (txId: string): Promise<TransactionResponse> => {
  try {
    let response: FireblocksResponse<TransactionResponse> =
      await fireblocks.transactions.getTransaction({ txId });
    let tx: TransactionResponse = response.data;
    let messageToConsole: string = `Transaction ${tx.id} is currently at status - ${tx.status}`;

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
    while (tx.status !== TransactionStateEnum.Completed);
    return tx;
  } catch (error) {
    throw error;
  }
};

const signArbitraryMessage = async (): Promise<
  TransactionResponse | undefined
> => {
  const address = await getWalletAddress();
  try {
    // replacing payload message with the format required before creating the transaction
    // message format is {vasp_prefix}{address}{UUID}
    const message =
      "tripleaio" + address + "975f0090-a88f-4be0-a123-d38484e8394d";
    transactionPayload.extraParameters.rawMessageData.messages[0].content =
      message;

    const transactionResponse = await fireblocks.transactions.createTransaction(
      {
        transactionRequest: transactionPayload,
      },
    );
    const txId = transactionResponse.data.id;
    if (!txId) {
      throw new Error("Transaction ID is undefined.");
    }
    txInfo = await getTxStatus(txId);
    const signature = txInfo.signedMessages[0].signature;

    const encodedSig =
      Buffer.from([Number.parseInt(signature.v, 16) + 31]).toString("hex") +
      signature.fullSig;
    console.log(
      "Encoded Signature:",
      Buffer.from(encodedSig, "hex").toString("base64"),
    );

    return transactionResponse.data;
  } catch (error) {
    console.error(error);
  }
};

signArbitraryMessage();
const fbClient = require('./fb_client');
const {TransactionOperation, PeerType, TransactionStatus} = require("fireblocks-sdk");
const util = require("util");

/*
* Create a transaction with a typed message
* The message format is {vasp_prefix}{address}{UUID}
* vasp_prefix: an arbitrary string when the receiving VASP claimed custody of an
* address (stored in BB)
* address: the address of the wallet
* UUID: the address registration UUID when the receiving VASP claimed custody of an address
*
* docs: https://developers.fireblocks.com/docs/typed-message-signing
*/
async function signArbitraryMessage(vaultAccountId, message, asset, addressIndex = 0) {

    const { status, id } = await fbClient.createTransaction({
        operation: TransactionOperation.TYPED_MESSAGE,
        assetId: asset,
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: vaultAccountId
        },
        note: `Test Message`,
        extraParameters: {
            rawMessageData: {
                messages: [{
                    content: message,
                    bip44AddressIndex: addressIndex,
                    type: "BTC_MESSAGE"
                }]
            }
        }
    });
    let currentStatus = status;
    let txInfo;

    if(currentStatus === TransactionStatus.COMPLETED) {
        console.log("Transaction Status: ", currentStatus);
        txInfo = await fbClient.getTransactionById(id);
    }

    while (currentStatus !== TransactionStatus.COMPLETED && currentStatus !== TransactionStatus.FAILED) {
        console.log("keep polling for tx " + id + "; status: " + currentStatus);
        txInfo = await fbClient.getTransactionById(id);
        currentStatus = txInfo.status;
        await new Promise(r => setTimeout(r, 1000));
    };

    const signature = txInfo.signedMessages[0].signature;

    console.log(JSON.stringify(signature));

    const encodedSig = Buffer.from([Number.parseInt(signature.v,16) + 31]).toString("hex") + signature.fullSig;
    console.log("Encoded Signature:", Buffer.from(encodedSig,"hex").toString("base64"));
}

(async () => {
    const vaultAccountId = 0;
    const asset = "BTC_TEST";
    const walletAddresses = await fbClient.getDepositAddresses(vaultAccountId, asset);

    console.log("PUB_____KEY_______: ", walletAddresses);

    if (walletAddresses.length === 0) {
        throw new Error("No wallet addresses found");
    }
    // message format is {vasp_prefix}{address}{UUID}
    const message = "tripleaio" + walletAddresses[0].address + "975f0090-a88f-4be0-a123-d38484e8394d";
    await signArbitraryMessage("0", message, asset);
})();
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Transaction Authorization Policy (TAP) Requirements
Typed message signing: EIP-712 example
Typed message signing: EIP-191 example
Structuring The Signature:
Bitcoin personal message example

---

## Raw Message Signing {#raw-message-signing}

*Source: https://developers.fireblocks.com/docs/raw-message-signing*

Raw Message Signing
Updated
20 days ago
Introduction

---

