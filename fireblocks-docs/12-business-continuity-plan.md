# 12 Business Continuity Plan

This document contains 3 sections related to 12 business continuity plan.

## Table of Contents

1. [Perform Drs Process](#perform-drs-process)
2. [Self Custody Infrastructure](#self-custody-infrastructure)
3. [Custodial Services](#custodial-services)

---

## Perform Drs Process {#perform-drs-process}

*Source: https://developers.fireblocks.com/docs/perform-drs-process*

Perform DRS process
Overview
Fireblocks provides a comprehensive backup and recovery solution to ensure that you always have access to your assets, even if you lose access to your signing devices or in the unlikely event that Fireblocks suspends operations.
Your Fireblocks Vault is a secure multi-party computation (MPC) based wallet that prevents your private key from being a single point of failure when you sign transactions. With Fireblocks MPC, one key share is stored on your company’s hardware, either in each user with signing privileges’ Fireblocks mobile app or on a server that hosts your API Co-Signer. You have two corresponding key shares, which Fireblocks stores at top-tier cloud providers. Your three key shares are never together in one place to expose your full private key.
Recovery Tools
Fireblocks recommends using our
native self-serve recovery tool
(requires a Fireblocks Help Center login), but for developers who may prefer a programmatic approach, we offer the Python-based
Fireblocks Key Backup and Recovery Tool in our GitHub repository
.
Instructions for the Fireblocks Key Backup and Recovery Tool are included in the repo's README.md file.
📘
Learn more about Backup & Recovery in the following
guide
Updated
20 days ago
Define Payment Flows
Sign RAW Messages
Table of Contents
Overview
Recovery Tools

---

## Self Custody Infrastructure {#self-custody-infrastructure}

*Source: https://developers.fireblocks.com/docs/self-custody-infrastructure*

Self-Custody Infrastructure
Be the owner of your funds without compromising speed and security using Fireblocks' self-custody infrastructure
What is Self-Custody Infrastructure?
Fireblocks Self-Custody Infrastructure is a secure and reliable way to store your digital assets. With our robust APIs and multi-layer security, MPC, and Intel SGX, you can be sure that your funds are safe and accessible instead of handling the security work yourself.
Start developing on Fireblocks today
.
Set up and store your funds through Fireblocks Self-Custody Infrastructure
Using our self-custody technology, you can harness your funds to hold them securely and safely:
API Co-Signer:
Automate the approval and signing of transactions and maintain custody with our API Co-Signer.
MPC technology:
With MPC, the corresponding private key shares are created and encrypted in isolated environments among multiple parties. To sign transactions, the key shares are used to perform multiple rounds of computation without ever being brought into the same environment. Because of this, MPC eliminates the single point of compromise of private key creation and signing.
Secure Hardware Enclaves:
Self-custody your private keys in secure hardware enclaves to keep your keys safe from malicious software or unauthorized users.
Key backups:
Get a backup copy of all your signing keys and have full control over your funds.
Learn more about
our Custody Infrastructure
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
Custodial Services
Flexible MPC-based wallet infrastructure enables both
segregated vault structures and omnibus vault structures
based on your business needs.
UTXO Consolidation
Leverage automation to
consolidate your unspent UTXO balances across UTXO wallets
through special transactions that merge them into a single output.
UTXO Manual Selection
Use dedicated API calls to
manually select specific UTXO asset wallet balances
to consolidate into a single transaction to send to your omnibus account.
Creating an Omnibus Vault Structure
Use API keys to
generate intermediate vault accounts, identify incoming transactions, and sweep funds
to the Omnibus Deposits vault accounts.
Sweep to Omnibus
How to
automate moving funds from intermediate vault accounts, assigned to your end-users
for their deposits to your omnibus account.
Validating Travel Rule transactions with Fireblocks and Notabene
Using the Fireblocks SDK to
submit transactions to Notabene for validation that they comply with the Travel Rule
while keeping PII data encrypted.
Developer Community
Want to learn more from Fireblocks knowledge experts and other developers?
Join our developer community today
!
Updated
20 days ago
Wallet-as-a-Service
Tokenization
Table of Contents
What is Self-Custody Infrastructure?
Set up and store your funds through Fireblocks Self-Custody Infrastructure
Guides
Raw Message Signing
Typed Message Signing
Custodial Services
UTXO Consolidation
UTXO Manual Selection
Creating an Omnibus Vault Structure
Sweep to Omnibus
Validating Travel Rule transactions with Fireblocks and Notabene
Developer Community

---

## Custodial Services {#custodial-services}

*Source: https://developers.fireblocks.com/docs/custodial-services*

Custodial Services
Prerequisites
Introduction
Overview
In this article, we discuss how to choose the Vault structure that suits your business needs and requirements.
Think of the Fireblocks Vault as a safe room in a bank. The safe room contains many drawers, each with a different lock and key. As a Fireblocks customer, you control the Vault (safe room) and can organize the vault accounts (drawers) to your preference. Inside each vault account, you can create a wallet for each crypto asset. These wallets contain unique keys and addresses on the blockchain.
Vault Structures
When handling retail accounts there are two common approached for managing the vault structure and we will describe both of them in this article. While there are fundamental differences between them, both structures use the blockchain as a single source of truth ledger.
Segregated Vault Structure
The segregated Vault structure consists of individual vault accounts for each end client. Funds are stored in and invested from these individual accounts.
In a segregated Vault structure:
Reconciliation is not needed since funds are kept directly in the individual vault accounts and never transferred to other vault accounts within your Vault.
Tracking and auditing are simplified. Compliance is made easier since each transaction can be associated with the person who made it.
On-chain transaction fees are usually considered the cost of doing business.
Since funds can be invested directly from the end client's vault accounts, funds are available immediately in order to respond to changes in the market.
Omnibus Vault Structure
The sweep-to-omnibus Vault structure consists of a central vault account in addition to vault accounts for each end client.
Funds are deposited into the individual vault accounts and then swept to the central vault account, where the funds can be kept or invested.
A common vaults structure for this architecture would be:
Intermediate vault accounts
: These are the vault accounts assigned to each end client. Because you could have numerous end clients, you can use the Fireblocks API to automatically generate as many intermediate vault accounts as needed.
Omnibus Deposits
: This is the central vault account where end-client funds are swept and stored.
Withdrawal Pool
: This is the vault account containing funds allocated for end-client withdrawal requests. More than one Withdrawal Pool vault account may be required due to blockchain limitations.
In an Omnibus Vault Structure:
Reconciliation is completed during the on-chain sweeping transaction.
Account management is simplified by using a single vault account for treasury management and investing.
Treasury management capabilities are unlocked as funds are co-mingled and this allows for TradFi like trading (OTC Desks etc) and investments for multiple clients in a single transaction for operational costs saving.
End-client deposit addresses remain private and unexposed to third parties since outbound transactions are sent from the Omnibus Deposits vault account.
Since fund must be transferred twice (deposited then swept), you pay transfer fees on two occasions before you can invest the funds. To optimize the cost of transfer fees, you can sweep funds on a periodic schedule when fees are low. By doing so, you can deduct the expected fees from the originally deposited amount when crediting your end clients.
Funds are not immediately available to respond to market changes since they should be swept only when transfer fees can be optimized.
The following diagram explains the Omnibus Vault Structure in a visual manner:
Use Cases
You can structure vault accounts based on your specific business use case. The following example structures are taken from common business use cases on Fireblocks. However, you can customize your Vault structure as needed to match your best practices.
Crypto-trading Business Segment
For the crypto-trading business segment, it's common to use a
Segregated Vault Structure
. In this structure, your company creates a vault account for each of your end clients or business use cases.
Example vault account structure:
Proprietary assets
Treasury
Market making
OTC trading
Customer assets
Collateral (for lending)
Withdrawals
Deposits
DeFi
Vault accounts for each corporate client, family office, etc.
A
Segregated Vault Structure
allows you to easily track each transaction for auditing, compliance, and Know Your Customer (KYC) purposes. This structure also allows you to keep your company's assets separate from its end-clients' assets and oversee different branches, strategies, and operations in the same workspace.
Retail Business Segment
For the retail business segment, It's common to use an
Omnibus Vault Structure
since retail customers mostly use API to automate scaling their business.
On Fireblocks, you can use API keys to generate intermediate vault accounts, identify incoming transactions, and sweep funds to the Omnibus Deposits vault account. We will later cover the creation of an
Omnibus Vault Structure
in the following article:
Creating an Omnibus Vault Structure
.
We will also cover the sweeping process in the following article:
Sweeping within an Omnibus Vault structure
.
When using the
Omnibus Vault Structure
, we do however need to consider the different asset types:
UTXO
Account Based
Tag / Memo / Note Based
You can further read on the following topics in order to have a holistic understanding of the
Omnibus Vault Structure
:
Creating an Omnibus Vault Structure
- to get a clearer picture on how to create and manage the deposit addresses & process.
Sweeping within an Omnibus Vault structure
- to get an example of a sweeping process.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Vault Structures
Segregated Vault Structure
Omnibus Vault Structure
Use Cases
Crypto-trading Business Segment
Retail Business Segment

---

