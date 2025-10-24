# 15 Additional Features

This document contains 14 sections related to 15 additional features.

## Table of Contents

1. [Use Cases](#use-cases)
2. [Configure Gas Station Values](#configure-gas-station-values)
3. [Enabling The Gas Station 1](#enabling-the-gas-station-1)
4. [Define Approval Quorums](#define-approval-quorums)
5. [Work With Gas Station](#work-with-gas-station)
6. [Interact With Trust](#interact-with-trust)
7. [Associating End Clients With Transactions](#associating-end-clients-with-transactions)
8. [Gas Station Setup](#gas-station-setup)
9. [Define Confirmation Policy](#define-confirmation-policy)
10. [Set Auto Fueling Property](#set-auto-fueling-property)
11. [Capabilities](#capabilities)
12. [Set Transaction Authorization Policy](#set-transaction-authorization-policy)
13. [Utxo Manual Selection](#utxo-manual-selection)
14. [Rate Limits](#rate-limits)

---

## Use Cases {#use-cases}

*Source: https://developers.fireblocks.com/docs/use-cases*

Explore Use Cases
What can you build with Fireblocks?
Virtually anything! Fireblocks supports a range of use cases, from centralizing treasury management to building a fintech application. Here are some of the use cases we support:
NFT Marketplaces and Platforms
Treasury Management
Digital Asset Custody
CeFi and DeFi Trading
Cross Border Payments
Web3 Gaming
Tokenization
Staking
Smart Contract Security and Management
Wallets for Retail Applications
What types of businesses are built on Fireblocks?
Fireblocks enables your business to access the digital asset ecosystem quickly and securely. From Web3 to financial services, almost every type of business is building on Fireblocks.
Industry
Type
Financial Institutions
Banks, Hedge Funds, Asset Managers, Lending Desks, OTC Desks, Prime Brokers, Market Makers, Family Offices
Web3 Companies
NFT Marketplaces, DAOs, DeFi Protocols, GameFi, Web3 Infrastructure Providers, Protocol Foundations, and B2B Web3 Services
Retail Services
Exchanges, Corporates, Fintechs, Neobanks, Challenger Banks, Investment Platforms
B2B Services
Payment Service Providers, Banking-as-a-Service Providers
Fireblocks Feature Landscape
Wallet-as-a-Service
Self-Custody Infrastructure
Tokenization
Treasury Management
Updated
20 days ago
What Is Fireblocks?
Wallet-as-a-Service
Table of Contents
What can you build with Fireblocks?
What types of businesses are built on Fireblocks?
Fireblocks Feature Landscape

---

## Configure Gas Station Values {#configure-gas-station-values}

*Source: https://developers.fireblocks.com/docs/configure-gas-station-values*

Configure Gas Station Values
You can configure the Fireblocks Gas Station with a gas threshold, a gas cap, and a maximum gas price for each blockchain network according to its base asset by using the Fireblocks API.
Gas threshold (gasThreshold):
The gas threshold represents the minimum balance allowed in the Gas Station account. If the balance is below the minimum gas threshold, the Gas Station fuels the vault account automatically with the set maximum gas cap.
Gas cap (gasCap):
The gas cap represents the maximum balance allowed in the Gas Station account.
Maximum gas price (maxGasPrice):
The maximum gas price allows you to limit the maximum transaction fee for Gas Station transactions. The funding transaction will be sent in gwei with this maximum value gas price or less. A null value for the maximum gas price means the fee will be paid at any cost, without limitations. If you changed the maximum gas price settings and want to revert to the default settings of null, you can enter an empty string as
""
.
When an incoming token deposit or an outgoing token withdrawal is detected, the Gas Station checks the gas balance of the vault account. If the balance is below the minimum gas threshold, it automatically fuels the vault account with the set maximum gas cap.
📘
Learn more about Gas Station configuration in the Fireblocks Gas Station
developer guide
Updated
20 days ago
Set Auto Fueling Property
Validate Balances

---

## Enabling The Gas Station 1 {#enabling-the-gas-station-1}

*Source: https://developers.fireblocks.com/docs/enabling-the-gas-station-1*

Enable the Gas Station
📘
Gas Station is only available to Pro and Enterprise customers
Contact your Customer Success Manager for more information.
Gas Station 1.0
Contact Fireblocks Support to enable the Gas Station in your workspace
. After they enable it, verify the following in your workspace:
On the Network page, you should have a new Network Connection named
Fireblocks Gas Station
.
On the Whitelisted Addresses page, you should have a new internal wallet called
Gas Station Wallet
. This internal wallet holds asset addresses reflecting EVM-based assets supported by the Gas Station that exist on each of the vaults on which you enable the Gas Station.
Gas Station 2.0
The Fireblocks Gas Station 2.0 now offers a self-service auto-fueling solution. You can designate a single vault account in your workspace as the auto-fuel Gas Station, and activate the auto-fueling option on other vault accounts. This allows for a self-managed, self-custody Gas Station service and helps eliminate friction.
Learn more about the Fireblocks Gas Station 2.0 enablement
here
.
Updated
20 days ago
Work with Fireblocks Gas Station
Set Auto Fueling Property
Table of Contents
Gas Station 1.0
Gas Station 2.0

---

## Define Approval Quorums {#define-approval-quorums}

*Source: https://developers.fireblocks.com/docs/define-approval-quorums*

Define Approval Quorums
Admin Quorum
The Admin Quorum lists all users with Admin privileges (users assigned to either an Owner, Admin, or Non-Signing Admin role).
The Admin Quorum threshold defines the number of Admins required to approve new workspace connections and changes. Any Admin can deny a request to reject it before the threshold is met. Requests have different expiration times depending on the action.
Activities that require Admin Quorum approval include:
Whitelisting addresses
New Fireblocks Network connections
New exchange accounts
Other external destination addresses
Adding new workspace users
Changes to Policies
Configuring approval groups
Other workspace configuration changes
📘
Learn more about setting Admin Quorum in the
following guide
Admin Quorum API
Check the Admin Quorum API reference
here
Approval Groups
Approval groups consist of users from a designated user group. They are designed to facilitate the approval of various workspace configuration changes within different workspace domains, such as security and compliance, user management, the Fireblocks Network, and external accounts.
These groups operate similarly to the Admin Quorum and can be used in its place for approving specific actions of your choice.
📘
Learn more about defining Approval Groups in the
following guide
This feature allows you to designate a specific group of people to approve tasks, regardless of their roles or permissions. Approval groups provide the flexibility to segregate and delegate responsibilities, which is crucial for scaling and accelerating your business operations while maintaining security.
Here are a few tips for setting up your approval groups:
Approval groups are distinct from regular user groups and are not related to Policies
While you can remove owner approval from certain actions, key changes in your workspace will still require owner involvement
A threshold for the chosen group is required
Updated
20 days ago
Whitelist IPs for API Keys
Set Policies
Table of Contents
Admin Quorum
Admin Quorum API
Approval Groups

---

## Work With Gas Station {#work-with-gas-station}

*Source: https://developers.fireblocks.com/docs/work-with-gas-station*

Work with Fireblocks Gas Station
Overview
Most Ethereum Virtual Machine (EVM)-based blockchains require a fee, called
gas
, to be paid in their base asset to execute transactions of both the base asset and other tokens. Gas is deducted from the account that initiated the transaction.
The Fireblocks
Gas Station
auto-fuels a
vault account
with the required base asset when it is enabled for them. Using the Gas Station helps cases of Fireblocks customers who choose to use the
omnibus account
vault structure
or similar.
All transfers on Fireblocks, including those between vault accounts, occur on the blockchain. Therefore, you must pay gas fees when transferring funds from the deposit accounts to your omnibus vault account.
The auto-fuel transaction is triggered whenever a withdrawal or deposit is detected to or from that vault account. Fireblocks checks the balance of the vault and transfers gas according to the
Gas Station parameters
.
The Gas Station removes the need to monitor your base asset levels and manually transfer funds to your vault accounts to cover future transaction fees when funds are swept to your central vault (omnibus) account, where they can be invested.
Supported networks
Ethereum and all EVM-based networks available in your Fireblocks workspace are supported.
See a complete list of Fireblocks Gas Station's supported networks with additional information
.
Common use cases for Gas Station
Many retail businesses use the omnibus structure, making the Gas Station a helpful feature when many vault accounts are required to receive individual direct deposits from end clients.
In this case, you'd
monitor the Transaction status using webhooks
.
Then, upon receiving the
COMPLETED
transaction status,
trigger a sweep from the end-client vault account to your omnibus deposits vault account
.
Other business types using the Gas Station include exchanges, lending desks, neobanks, and commercial and investment banks.
Updated
20 days ago
Sweep Funds
Enable the Gas Station
Table of Contents
Overview
Supported networks
Common use cases for Gas Station

---

## Interact With Trust {#interact-with-trust}

*Source: https://developers.fireblocks.com/docs/interact-with-trust*

Interact with TRUST
The
Travel Rule Universal Solution Technology (TRUST)
platform can be used to securely send information required by the Travel Rule.
To interact with TRUST from your Fireblocks workspace, you must use an appropriate format of Typed Message Signing when publishing a proof of address on the TRUST internal bulletin. This signing method is safer than (and preferred over) Raw Signing because it helps mitigate the risk of users signing a valid but malicious transaction.
📘
Learn more about
Typed Message Signing
Updated
20 days ago
Define Travel Rule Policies
Integrating third-party AML providers

---

## Associating End Clients With Transactions {#associating-end-clients-with-transactions}

*Source: https://developers.fireblocks.com/docs/associating-end-clients-with-transactions*

Associate End Clients
Overview
You may want to or be required to add end-client identification information to vault accounts and wallets. Depending on the purpose, you can use different endpoints and parameters to do this.
Internal or auditing identification purposes
Vault accounts
When an end client owns (or will own) all the wallets and addresses inside a vault account, call one of the following endpoints:
Create a new vault account
(for new vault accounts)
Rename a vault account
(for existing vault accounts)
Then, use the
name
parameter to enter their identification information (e.g., "Customer_12345_Vault"). This propagates the information to every transaction that uses that vault account.
🚧
Please make sure to not pass any PII data!
Wallets
When an end client owns (or will own) only one or only a few wallets inside a vault account containing many other wallets, call one of the following endpoints:
Create an internal wallet
(for new internal wallets)
Create an external wallet
(for new external wallets)
Then, use the
name
parameter to enter their identification information (e.g., "Customer_12345_Wallet"). This propagates the information to every transaction that uses that wallet.
📘
Note
Wallets cannot be renamed, so you must create new wallets for existing end client wallets.
Deposit Addresses
When an end client owns (or will own) only one or only a few deposit addresses inside a wallet containing many other addresses, call one of the following endpoints:
Create a new asset deposit address
(for new deposit addresses)
Update address description
(for existing deposit addresses)
Then, use the
description
parameter to enter their identification information (e.g., "Customer_12345_Address"). This propagates the information to every transaction that uses that deposit address.
AML/CFT identification purposes
❗️
Warning
The
customerRefId
parameter should be used
only
for this purpose, as AML providers use it to associate the owner of funds with transactions.
Vault accounts
When an end client owns (or will own) all the wallets and addresses inside a vault account, call one of the following endpoints:
Create a new vault account
(for new vault accounts)
Set an AML/KYT customer reference ID for a vault account
(for existing vault accounts)
Then, use the
customerRefId
parameter to enter their identification information (e.g., "Customer_12345_Vault"). This propagates the vault account's name, the wallet address, the asset name, and the end client’s information to every transaction that uses that vault account.
Wallets
When an end client owns (or will own) only one or only a few wallets inside a vault account containing many other wallets, call one of the following endpoints:
Create an internal wallet
(for new internal wallets)
Create an external wallet
(for new external wallets)
Set an AML/KYT customer reference ID for an internal wallet
(for existing internal wallets)
Set an AML/KYT customer reference ID for an external wallet
(for existing external wallets)
Then, use the
customerRefId
parameter to enter their identification information (e.g., "Customer_12345_Wallet"). This propagates the name of the vault account containing the wallet, the wallet address, the asset name, and the end client’s information to every transaction that uses that wallet.
Deposit Addresses
When an end client owns (or will own) only one or only a few deposit addresses inside a wallet containing many other addresses, call one of the following endpoints:
Create a new asset deposit address
(for new deposit addresses)
Assign AML customer reference ID
(for existing deposit addresses)
Then, use the
customerRefId
parameter to enter their identification information (e.g., "Customer_12345_Address"). This propagates the name of the vault account containing the wallet, the wallet address, the description of the deposit address, the asset name, and the end client's information to every transaction that uses that deposit address.
Updated
20 days ago
Validate Balances
Manage Destination Addresses
Table of Contents
Overview
Internal or auditing identification purposes
Vault accounts
Wallets
Deposit Addresses
AML/CFT identification purposes
Vault accounts
Wallets
Deposit Addresses

---

## Gas Station Setup {#gas-station-setup}

*Source: https://developers.fireblocks.com/docs/gas-station-setup*

Gas Station Setup & Usage
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Overview
Most Ethereum Virtual Machine (EVM)-based blockchains require a fee, called
gas
, to be paid in their base asset to execute transactions of both the base asset and other tokens. Gas is deducted from the account that initiated the transaction.
The Fireblocks
Gas Station
auto-fuels a
vault account
with the required base asset when it is enabled for them. Using the Gas Station helps cases of Fireblocks customers who choose to use the
omnibus account
vault structure
or similar.
All transfers on Fireblocks, including those between vault accounts, occur on the blockchain. Therefore, you must pay gas fees when transferring funds from the deposit accounts to your omnibus vault account.
The auto-fuel transaction is triggered whenever a withdrawal or deposit is detected to or from that vault account. Fireblocks checks the balance of the vault and transfers gas according to the
Gas Station parameters
.
The Gas Station removes the need to monitor your base asset levels and manually transfer funds to your vault accounts to cover future transaction fees when funds are swept to your central vault (omnibus) account, where they can be invested.
Supported networks
Ethereum and all EVM-based networks available in your Fireblocks workspace are supported.
See a complete list of Fireblocks Gas Station's supported networks with additional information
.
Common use cases for Gas Station
Many retail businesses use the omnibus structure, making the Gas Station a helpful feature when many vault accounts are required to receive individual direct deposits from end clients.
In this case, you'd
monitor the Transaction status using webhooks
.
Then, upon receiving the
COMPLETED
transaction status,
trigger a sweep from the end-client vault account to your omnibus deposits vault account
.
Other business types using the Gas Station include exchanges, lending desks, neobanks, and commercial and investment banks.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Supported networks
Common use cases for Gas Station

---

## Define Confirmation Policy {#define-confirmation-policy}

*Source: https://developers.fireblocks.com/docs/define-confirmation-policy*

Deposit Control & Confirmation Policy
Blockchain confirmations are crucial for maintaining the security and integrity of the blockchain. This process ensures that transactions are securely verified, thereby preventing fraud and double-spending. However, the number of confirmations also directly impacts the time it takes for a transaction to complete and for the funds to become available in your wallet. The higher the number of required confirmations, the longer it takes for the transferred amount to be accessible.
Whether you aim to speed up transaction flow by reducing the number of confirmations or enhance security by increasing them, follow the recommendations below for an effective setup.
When to reduce the number of confirmations
A low number of blockchain confirmations should only be set for transactions coming from well-known and trusted sources. This is advisable when the origin of the transaction is your connected exchange account, a trusted counterparty, or even a transaction between two vault accounts within your workspace.
When to increase the number of confirmations
A low number of blockchain confirmations should
not
be set for transactions arriving from unknown external addresses, or from addresses that you do not control or do not have a well-established, trusted business relationship with.
Fireblocks Deposit Control & Confirmation Policy
The Deposit Control and Confirmation Policy allows you to specify the number of blockchain network confirmations required for incoming and outgoing transactions to clear, ensuring that their funds are credited to a wallet.
After the transaction clears, its deposit amount is accounted for in the wallet’s currently available balance. Additionally, for UTXO-based blockchain networks, the transaction's outputs become immediately spendable.
Default Confirmation Policy
Each workspace in Fireblocks has a default configuration policy that specifies the number of confirmations required for each blockchain to complete transactions and make the funds available in the wallet.
To learn about the default values for each supported blockchain, refer to this
Help Center article
Custom Confirmation Policy
You can define your own confirmation policy based on your organization’s business needs. Learn more about the Custom Confirmation Policy in this
Help Center article
.
Dynamically overriding the required number of confirmations
Fireblocks allows you to manually/dynamically confirm transactions and override your workspace's confirmation policy for specific transactions. This immediately updates the transaction status to Completed in your Fireblocks workspace.
To do so manually via the Console, refer to this
Help Center article
.
To do so via the API, refer to this
guide
.
Updated
20 days ago
Create Embedded Wallets
Manage Deposits at Scale
Table of Contents
When to reduce the number of confirmations
When to increase the number of confirmations
Fireblocks Deposit Control & Confirmation Policy
Default Confirmation Policy
Custom Confirmation Policy
Dynamically overriding the required number of confirmations

---

## Set Auto Fueling Property {#set-auto-fueling-property}

*Source: https://developers.fireblocks.com/docs/set-auto-fueling-property*

Set Auto Fueling Property
Overview
Vault account auto-fueling is always available for API users with the Gas Station enabled, and any vault account with the Gas Station badge in the Console participates in the Gas Station service.
When an incoming token transaction to an auto-fueling vault account completes, Fireblocks automatically transfers the appropriate base asset from the Gas Station to the vault account. This is because the auto-fueled vault account must have a token with a non-zero balance on the relevant network where you are expecting an auto-fueling transaction.
When an outgoing transaction from an auto-fueling vault account completes, Fireblocks checks the token and gas balance. The vault account is refueled if the token balance is above 0.00001 and the base asset is below the set threshold. Token transfers from this vault account to any destination will then have sufficient gas to cover transaction fees.
Enabling auto-fueling in the Console
For new vault accounts, select
Auto-fuel with gas after an incoming transaction completes
when you create the account.
For existing vault accounts, go to
My Funds
>
Accounts
, find the appropriate vault account, and then select
More Actions
(
...
) >
Enable Auto-Fueling
>
Enable
. The Gas Station badge appears next to the name of the vault account when you're done.
Disabling auto-fueling in the Console
In the Fireblocks Console, go to
My Funds
>
Accounts
, find the appropriate vault account, and then select
More Actions
(
...
) >
Disable Auto-Fueling
>
Disable
. The Gas Station badge is removed when you're done.
Enabling auto-fueling via the API
For new vault accounts, call the
Create a new vault account endpoint
and set the
autoFuel
field to
true
.
For existing vault accounts:
Call the
List vault accounts (paginated) endpoint
to find the vault account's ID.
Call the
Turn auto-fueling on or off endpoint
, enter the vault account's ID in the
vaultAccountId
field, and then set the
autoFuel
field to
true
.
Disabling auto-fueling via the API
Call the
List vault accounts (paginated) endpoint
to find the ID of the vault account.
Call the
Turn auto-fueling on or off endpoint
, enter the vault account's ID in the
vaultAccountId
field, and then set the
autoFuel
field to
false
.
📘
Check the Gas Station
developer guide
for API code examples
Updated
20 days ago
Enable the Gas Station
Configure Gas Station Values
Table of Contents
Overview
Enabling auto-fueling in the Console
Disabling auto-fueling in the Console
Enabling auto-fueling via the API
Disabling auto-fueling via the API

---

## Capabilities {#capabilities}

*Source: https://developers.fireblocks.com/docs/capabilities*

Fireblocks Key Features & Capabilities
Hot, warm, and cold MPC-CMP wallets
Fireblocks wallets can be hot, warm, or cold. What separates these types of wallets is where the third MPC key share is held, and how transaction approvals are conducted.
With a
hot wallet
, the third MPC key share is held by an API user on an
API co-signer
, and transaction approvals can be automated.
With a
warm wallet
, the third MPC key share is held on your internet-connected mobile device, and approvals occur on the Fireblocks mobile app.
With a
cold wallet
, the third MPC key share is held on your air-gapped (offline) mobile device. Approvals for transactions require bi-directional QR code scanning.
📘
Workspace compatibility
A Fireblocks workspace can be hot & warm, or cold wallet-only, but not both.
Workspaces
The
Fireblocks workspace
is a unique feature of the Fireblocks platform with a broad range of capabilities that allows you to manage your various accounts, digital assets, transactions, and more.
Each workspace is a unique
BIP32-HD
wallet structure with unique security and transaction policies.
Learn more about different types of Fireblocks workspace environments.
Role-based access control
Fireblocks has extensive role-based access control capabilities for various user roles. These access roles grant them permissions related to:
Parts of the platform they can access
Types of actions they can perform
MPC key shares that they hold and can use to sign transactions
These roles can range from admin-level users like 'Owner' of the workspace, to a read-only 'Viewer’. An API user can be assigned any user role (except 'Owner').
Learn more about each role's access and capabilities.
Admin Quorum
The
Admin Quorum
is the minimum number of workspace admins required to approve sensitive workspace changes, such as adding or removing users, adding whitelisted addresses, or approving network connections. This is set via an
Admin Quorum threshold
.
If an admin attempts to perform malicious actions, such as attempting to steal funds via a personal wallet, the multiple approvals required by the admin quorum prevent and mitigate damage. This would work the same for an admin that has their account compromised.
Learn more about adjusting your workspace's Admin Quorum threshold.
Accounts
Accounts
compile all types of accounts that Fireblocks supports, including; vault accounts, exchange accounts, and fiat accounts.
A
Vault account
is a unique on-chain wallet, with your private key secured by our MPC-CMP architecture, that enables you to securely store and transfer your digital assets.
A
Exchange account
allows you to leverage your exchange's API credentials to securely transfer assets between exchanges and other Fireblocks accounts.
A
Fiat account
enables you to transfer fiat to any other account within your Fireblocks workspace or network connections that support that specific fiat provider.
Vaults
The Fireblocks Vault is your secure MPC-CMP solution for wallet and address management. The Vault allows you to create and manage multiple vault accounts, which contain your asset wallets.
Depending on the asset type, you may or may not be able to have multiple deposit addresses or accounts within a single vault account.
Learn how to create vaults and wallets using the Fireblocks API.
Assets
Asset wallets are used to manage internal deposit addresses for different asset types. Each asset wallet contains at least one deposit address for its asset type. Fireblocks supports over 1,200 assets and our asset support is continuously growing.
Learn how to return a list of supported assets using the Fireblocks API.
Policies
Policies
are a set of rules that set the limits and boundaries of the transactions in your Fireblocks workspace.
With Policies, you control who can move funds, how much can be transferred in a single transaction or a certain time period, and how transactions are authorized.
Policy rules can be applied to virtually any parameter within a transaction, including smart contract-specific transactions such as deploying, upgrading, and performing ongoing operations.
Learn how to set up rules for your Policies.
Transactions API
All transactions are routed through the
Create a new transaction
API call. Users can only issue transactions based on their access roles and the workspace’s Policy settings. This includes both console and API users.
When issuing a transaction through this endpoint, the
OPERATION
parameter specifies what type of transaction this may be. It could be a generic transfer, a token mint or burn, a contract call, a typed message, or a raw message.
Learn how to build a transaction using the Fireblocks API.
Whitelisted addresses
Whitelisted addresses
are deposit addresses that exist outside of your Fireblocks Vault. You can perform transactions from your workspace by whitelisting an address for any supported blockchain.
Whitelisted addresses (also called "wallets") can be categorized as:
Internal wallet
- a deposit address existing inside your organization.
External wallet
- a deposit address existing outside your organization.
Contract wallet
- a deposit address of an on-chain smart contract.
Learn to whitelist new addresses for transactions and deposits.
Fireblocks Network
The
Fireblocks Network
is a settlement workflow allowing you to quickly transfer with your network counterparties without the need to manually whitelist their addresses.
Streamline settlement using the Fireblocks Network by automatically authenticating addresses with your network counterparties while automatically rotating secure addresses for supported assets. It also maps transactions to counterparties for accurate reporting.
Learn how to create and manage network connections using the Fireblocks API.
Tokenization
Deploy, manage, mint, and burn custom tokenized assets on-chain. Enforce governance and rules for who is able to perform sensitive operations such as minting new tokens.
Learn how to deploy, manage, mint, and burn tokenized assets using the Fireblocks API.
Web3 / DeFi access
Fireblocks lets you securely connect to and operate seamlessly within the Web3 and DeFi ecosystem.
Connect easily to Web3 dApps using our WalletConnect integration or browser extension.
Interact directly and programmatically with smart contracts using our smart contract API.
Learn how to connect to Web3 dApps using our WalletConnect integration.
Securely develop and operate smart contracts
Securely develop, deploy, and operate your on-chain smart contracts using Fireblocks' industry-leading security layers.
Provide granular role-based access control for managing which developer is allowed to deploy smart contracts, perform upgrades, or call sensitive smart contracts operations, such as pausing or updating contract data.
Learn how to deploy and operate smart contracts using the Fireblocks API.
Fireblocks Gas Station
The
Fireblocks
Gas Station
service automates gas replenishment for token transaction fees on EVM-based networks such as Ethereum, BNB Chain, and others. This eliminates monitoring and manually transferring funds to these vault accounts to cover future transaction fees.
Learn how to set up your Gas Station using the Fireblocks API.
Transaction screening (AML/KYT)
Transaction screening
allows you to automate real-time monitoring of your crypto transactions in order to ensure compliance with Anti-Money Laundering/Counter Financing of Terrorism (
AML
/CFT) regulations, prevent interactions with sanctioned entities and identify customer behavior.
Learn more about our AML screening engine and the KYT capabilities of our Chainalysis and Elliptic integrations.
Updated
20 days ago
Treasury Management
Fireblocks Object Model
Table of Contents
Hot, warm, and cold MPC-CMP wallets
Workspaces
Role-based access control
Admin Quorum
Accounts
Vaults
Assets
Policies
Transactions API
Whitelisted addresses
Fireblocks Network
Tokenization
Web3 / DeFi access
Securely develop and operate smart contracts
Fireblocks Gas Station
Transaction screening (AML/KYT)

---

## Set Transaction Authorization Policy {#set-transaction-authorization-policy}

*Source: https://developers.fireblocks.com/docs/set-transaction-authorization-policy*

Set Policies
Overview
With the Fireblocks platform, your funds are, by design, protected with several security layers. The Authorization Policy is a crucial layer that defines what actions are allowed or blocked by which users from which sources, to which destinations and additional limitations.
Visit the Fireblocks Help Center for additional details
, to see examples, walkthroughs and details about proper logic settings for your use case.
On top of the Policy Editor tool in the Fireblocks Console, API users can retrieve details about the active Policy using the
Get the active policy and its validation endpoint
or to directly push a new Policy using the
Send publish request for a set of policy rules endpoint
.
Alternatively, if a certain use case in your organization requires you to check your Policy prior to publishing it, you may choose to work with Policy Drafts and retrieve the active Policy draft using the
Get the active draft endpoint
or update or post a new draft using the
Update the draft with a new set of rules
or
Send publish request for a certain draft id endpoints
.
📘
Learn more about Policies
here
📘
Check out the Policy Developer Guide
here
Updated
20 days ago
Define Approval Quorums
Segregate Duties
Table of Contents
Overview

---

## Utxo Manual Selection {#utxo-manual-selection}

*Source: https://developers.fireblocks.com/docs/utxo-manual-selection*

UTXO Manual Selection
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Overview
If you regularly run operations on the Bitcoin blockchain, you will likely notice that the list of UTXOs in your wallets grows very quickly. This is especially common in situations where you have multiple addresses used to consolidate into an
omnibus account
or just as part of an ongoing operation. This can be a major problem for retail-facing operations.
There will be specific occurrences, where you would like to manually select the list of inputs used in the transaction.
Example
The logic to decide which unspent UTXOs to use can be as simple or complex as you wish, but in this example, we will use any small unspent UTXO that has received enough confirmations.
We have 3 steps in the process of consolidating UTXOs:
Retrieve the list of UTXOs for the wallet.
Choose up to 250 UTXOs based on a specific logic.
Create a transaction from the chosen UTXOs back to our wallet.
ts-sdk
fireblocks-sdk-js
fireblocks-sdk-py
const greaterThanUTXOfilters = { // UTXO filtering criteria
	amountTofilter: 0.0001,
	confirmationsToFilter: 3,
};

const transactionPayload = { 
	assetId: "BTC_TEST",
	amount: Number(""),
	source: {
			type: TransferPeerPathType.VaultAccount,
			id: "2" // Id of the source vault account you are selecting inputs from
	},
	destination: {
			type: TransferPeerPathType.VaultAccount,
			id: "0" // Id of the destination vault account you are sending the funds to
	},
	extraParameters:{  
		inputsSelection:{
				inputsToSpend: [],
		}
	},
};

let amountToSpend = 0;

const manualInputSelection = async(
	greaterThanUTXOfilters: { amountTofilter: number; confirmationsToFilter: number; }
	):Promise<CreateTransactionResponse | undefined > => {
	const filteredInpustList = await filterInputs(
		transactionPayload.source.id,
		transactionPayload.assetId,
		greaterThanUTXOfilters.amountTofilter,
		greaterThanUTXOfilters.confirmationsToFilter
	);
	transactionPayload.amount = amountToSpend;
	transactionPayload.extraParameters.inputsSelection.inputsToSpend = filteredInpustList;
	console.log("Selecting the following " +filteredInpustList.length+ " UTXOs to be spent: \n", transactionPayload.extraParameters.inputsSelection.inputsToSpend);

	try{
		const result = await fireblocks.transactions.createTransaction(
			{
				transactionRequest:transactionPayload
			}
		);
		return result.data;
  }
	catch(error){
    console.error(error);
  }
}

const filterInputs = async(
	inputsVaultId:any, 
	inputsAssetId: string, 
	amountTofilter: string | number, 
	confirmationsToFilter: string | number
	) => {
	try {
		const unspentInputs = await fireblocks.vaults.getUnspentInputs(
			{
			"vaultAccountId": inputsVaultId,
			"assetId": inputsAssetId
			}
		);
		console.log("The selected vault account has these "+ unspentInputs.data.length + " UTXOs available for spending:\n");
		console.log(unspentInputs.data);
		let filteredUnspentInputsList: any = [];
		for (let i = 0; i < unspentInputs.data.length ; i++){
      if( // UTXO Filtering criteria
				(unspentInputs.data[i]?.amount ?? "0") >= amountTofilter 
				&& 
				(unspentInputs.data[i]?.confirmations ?? "0") > confirmationsToFilter
				)
			{
			filteredUnspentInputsList.push(unspentInputs.data[i].input);
			amountToSpend = amountToSpend + Number(unspentInputs.data[i].amount);
			}
  	}
		return filteredUnspentInputsList;
	}
	catch(error){
		console.error(error);
	}
}

manualInputSelection(greaterThanUTXOfilters);
async function prepareToConsolidate(vaultAccountId, assetId, filterAmount, filterConfirmations){
    const unspentInputs = await fireblocks.getUnspentInputs(vaultAccountId, assetId);
    let filteredUnspent =[];
    for (let i = 0; i<unspentInputs.length ; i++){
        if (unspentInputs[i].amount >= 0.01 && unspentInputs[i].confirmations > 3){
            filteredUnspent[i] = unspentInputs[i];
        }
    }
 }
  
 prepareToConsolidate("0","BTC_TEST", "0.01", "3");
 
 async function consolidate(vaultAccountId, assetId, filterAmount, filterConfirmations, treasuryVault){
    const filteredList = await prepareToConsolidate(vaultAccountId, assetId, filterAmount, filterConfirmations);
        const payload = {
            assetId,
            amount: "",
            source: {
                type: PeerType.VAULT_ACCOUNT,
                id: vaultAccountId
            },
            destination: {
                type: PeerType.VAULT_ACCOUNT,
                id: treasuryVault
            },
            extraParameters:{  
                inputsSelection:{
                    inputsToSpend :[]
                }
            },
        };
        let amount = 0;
        for(let i = 0; i<filteredList.length ; i++){
            payload.extraParameters.inputsSelection.inputsToSpend.push(
                {
                txHash: filteredList[i].input.txHash,
                index: filteredList[i].input.index
                }
            )
            amount = amount + Number(filteredList[i].amount);
        }
    payload.amount = amount;
    const result = await fireblocks.createTransaction(payload);
    console.log(JSON.stringify(result, null, 2));
 }
  
 consolidate("0","BTC_TEST", "0.01", "3", "1");
from  fireblocks_sdk import TransferPeerPath, DestinationTransferPeerPath

VAULT_ID = "<vault_id>"
ASSET = "<asset>" # (e.g. "BTC" / "BTC_TEST")
DEST_ID = "<dest_vault_id>"

utxo_list = fireblocks.get_unspent_inputs(VAULT_ID, ASSET)

filtered_utxo_list = [utxo for utxo in utxo_list if (float(utxo['amount']) <= 0.01 and int(utxo['confirmations']) > 3)][:250]

inputs_list = [utxo['input'] for utxo in filtered_utxo_list]
amount = str(sum([float(utxo['amount']) for utxo in filtered_utxo_list]))

fireblocks.create_transaction(
   asset_id=ASSET,
   amount=amount,
   source=TransferPeerPath(VAULT_ACCOUNT, VAULT_ID),
   destination=DestinationTransferPeerPath(VAULT_ACCOUNT, DEST_ID),
   extra_parameters={
		"inputsSelection": {
       "inputsToSpend": inputs_list
    }
   }
)
Retrieving the list of UTXOs can be performed easily with the
getUnspentInputs
method.
The above code example gets all of the unspent UTXOs for
<vault_id>
.
The call will return the details of the txHash index, address, amount, number of confirmations, and status of the UTXO within its response body.
The code examples then filter the list of all
txHash
of BTC_TEST under vault account
0
and select all UTXOs that have more than 3 confirmations on the blockchain and amounts smaller than 0.01 BTC.
📘
UTXO input limit
You can only select up to 250 inputs to be included in the sent transaction.
After we have reduced the list to the assets we want, we can create the transaction.
To include the
inputs_list
that is mentioned in the code example above, you add it under the
extra_parameters
, within the
inputsToSpend
.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Example

---

## Rate Limits {#rate-limits}

*Source: https://developers.fireblocks.com/docs/rate-limits*

Working with Rate Limits
Overview
Fireblocks strives to offer a stable and secure platform at all times. Accordingly, API call traffic is continuously monitored by all parties to identify patterns that might affect the network. API rate limits assure that a single client can't overload the system for other clients.
Error responses with HTTP status code
429
indicate that rate limits have been temporarily exceeded.
If normal test or production operations repeatedly result in rate limiting, you can contact your
Customer Success Manager
or
Fireblocks Support.
.
API rate limits are set at the API user level. If you regularly receive HTTP 429 responses, do your best to limit the rate of requests, spread them out across minute intervals, or spread them out across multiple API users.
Some
common mistakes
that can result in receiving many API rate limit errors are:
Not monitoring 429 errors on the client
Retry API calls whenever they fail without noticing the error type - causing an escalation in rate limits
Using too many parallel processes for batch operations
Monitoring many transactions via polling instead of using webhooks
Excessively checking gas prices or token prices
Best Practices
Monitor rate limit errors
- if you receive 429 errors more than a handful of times a day - something is probably not done properly. Consider what change in the solution architecture can reduce the number of API calls you are making.
Retry API calls reasonably
- If you are calling an API periodically - consider not retrying and relying on the next time it will be checked. Additional, an exponential backoff retry strategy is recommended when it is required to try again.
Use Webhooks to monitor applications
- using push notifications and webhooks will dramatically reduce the number of API calls you need to make for standard operations. It will reduce the load on both your internal system and the Fireblocks backed.
Use Cache
- Some elements do not need to be checked on every transaction or every second - consider using cache for data points that you only need to update periodically.
📘
Note
Developer Sandbox
workspaces have a very low rate limit configuration and so you might see many rate limit errors if you try to test for scale.
The Developer Sandbox workspace was not meant for that level of testing, so you should use a
Testnet
workspace. Testnet environment rate limits are more flexible and handle large amounts of requests for testing.
Updated
20 days ago
Introduction
Table of Contents
Overview
Best Practices

---

