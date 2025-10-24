# 02 Secure Workspace

This document contains 7 sections related to 02 secure workspace.

## Table of Contents

1. [Segregate Duties](#segregate-duties)
2. [Whitelist Ips For Api Keys](#whitelist-ips-for-api-keys)
3. [Workspace Environments](#workspace-environments)
4. [Data Privacy And Protection](#data-privacy-and-protection)
5. [Secure Api Configuration](#secure-api-configuration)
6. [Manage Users](#manage-users)
7. [Get To Know Fireblocks Workspaces](#get-to-know-fireblocks-workspaces)

---

## Segregate Duties {#segregate-duties}

*Source: https://developers.fireblocks.com/docs/segregate-duties*

Segregate Duties
To ensure the security of your workspace operations, it is crucial to segregate duties and delegate responsibilities appropriately. The first and most important step is to distinguish between users handling critical managerial tasks and those managing regular operations.
For the former, it is important to understand the permission level of an administrator and the influence they will have with any changes made to the workspace. Please review this
article
for more information.
For day-to-day operations, consider three key roles in the transaction process when assigning responsibilities:
Who will initiate transactions?
Who will approve transactions?
Who will sign off on transactions?
Once you have defined these responsibilities, review the following use cases to help you segregate duties properly:
Manual Process:
Typically used for operations involving a large amount of assets. This involves 100% human intervention. A transaction will be initiated via the Fireblocks console UI, approved manually by certain people (user or group) on their mobile devices, and signed by either the same people or someone else. Note that approvers are not required to have an MPC key to approve transactions.
Semi-Automated Process:
Used for operations that are not large in value but still significant enough to require human verification. Transactions can be initiated by a person via the UI or an API user and signed by either one of them.
Fully Automated Process:
Commonly used for internal transactions (between Fireblocks VA) or withdrawals of small amounts. API users initiating transactions must have the relevant permissions. If the same user is linked with the API-cosigner machine, ensure they are assigned a signer permission role.
Updated
20 days ago
Set Policies
Overview

---

## Whitelist Ips For Api Keys {#whitelist-ips-for-api-keys}

*Source: https://developers.fireblocks.com/docs/whitelist-ips-for-api-keys*

Whitelist IPs for API Keys
The IP allowlist (whitelist) enables you to restrict API calls to only accept specific IP addresses for each API key. Only allowing access to a select number of IP addresses can lower the chances of a security threat or malicious attack.
If you have workspace owner permissions, you can follow
these instructions
on the Help Center to add IP addresses to the allowlist.
Alternatively, you can also submit a ticket to Fireblocks Support with the IP addresses of the machines running your API client(s) and their matching API key(s).
Updated
20 days ago
Create a CSR for an API user
Define Approval Quorums

---

## Workspace Environments {#workspace-environments}

*Source: https://developers.fireblocks.com/docs/workspace-environments*

Workspace Comparison
Overview
Fireblocks has three types of workspaces. The workspace type you use will determine your capabilities, so knowing which type you're working in is important.
Developer Sandbox
environments and
Testnet
workspaces are used for development and testing.
Mainnet
workspaces are used to deploy into production (with real funds).
Even though each workspace type has different capabilities, they all utilize similar APIs and SDKs, allowing you to develop and test your code against "lower" environments before deploying to your live production environment.
Workspace Types
Developer Sandbox
Testnet
Mainnet
Purpose
The
Fireblocks Developer Sandbox
is a unique workspace built for developers to quickly start using Fireblocks APIs and SDKs.
Recommended for API testing. Before you go live, we recommend performing a test transaction on the Mainnet using both the Console UI and the API.
This is a full-production workspace.
Workflow testing
Quick experimentation
Pre-production development & testing
Staging & production
Console URL
sandbox.fireblocks.io
console.fireblocks.io
console.fireblocks.io
API URL
sandbox-api.fireblocks.io
api.fireblocks.io/v1
api.fireblocks.io/v1
Derivation paths
Sandbox workspace exceptions
Testnet workspace exceptions
Fireblocks vault HD derivation paths
Assets
Testnet assets that are independent of Mainnet assets and operate on their own Testnet blockchains.
Testnet assets that are independent of Mainnet assets and operate on their own Testnet blockchains.
Mainnet / Real assets.
API
Full API access with the most limited rate limits. Used for testing the API.
Full API access with limited rate limits. Used for testing the API.
Full API access with increased rate limits. Used for implementing the tested API configuration. Requires a separate API key from a Testnet workspace; this can be done with the same CSR file.
Policies
Non-editable
Fully editable
Fully editable
API Co-Signer
Only
Fireblocks-provided API Co-Signer
.
Fireblocks-provided or self-hosted API Co-Signer.
Self-hosted API Co-Signer.
API user limit
Up to 5 users
Limited to the client setting
Limited to the client setting
Webhooks
Available for testing
Available for testing
Available
Mobile access
N/A
Fireblocks mobile app (iOS and Android) to sign and authorize transactions, approve external connections, and workspace changes.
Fireblocks mobile app (iOS and Android) to sign and authorize transactions, approve external connections, and workspace changes.
Fireblocks Network
N/A
N/A
All Fireblocks Network connections are available.
Exchanges
Limited exchange integration support (only testnets).
Limited exchange integration support (only testnets). We recommend setting Policy rules that apply to transactions on exchanges to accommodate test transactions that are processed approximately once per day.
All Fireblocks exchange connectivity is available.
Fiat
Testnet only
Testnet only
All Fireblocks fiat integrations
DeFi/Web3
Testnet protocols with WalletConnect Desktop integration.
Testnet protocols with WalletConnect Mobile and Desktop integrations.
Full support. Requires a specific policy implementation to enable.
AML
N/A
N/A
Most assets are supported via Chainalysis or Elliptic.
Raw Signing enabled
Yes
Requires a signed commercial agreement + Support enablement
Requires a signed commercial agreement + Support enablement
Support & Help Center
Developer Community support
with Help Center access
Full Support with Help Center access
Full Support with Help Center access
Mainnet
Mainnet is a production-level blockchain network with cryptocurrency transactions being broadcast, verified, and recorded. Mainnets have a base asset that can be used as funds in transactions or to pay network fees. All assets on Mainnets have real-world monetary value.
A Mainnet workspace is a fully developed and deployed environment that allows you and your organization to conduct your real-world financial operations on the Fireblocks platform.
In Mainnet workspaces, you can securely:
Transfer digital assets
Add users
Create a
Vault account
or multiple
Whitelist new addresses
Connect to supported exchanges
Connect to other
Fireblocks Network members
Configure
MPC-CMP
devices
Establish network connections
🚧
Moving to Mainnet workspaces
When you’re ready to use your Mainnet workspace, there are a few things to keep in mind before you get started.
When testing new functions in Mainnet (production) environments, use small amounts first to confirm intended functionality before upscaling to larger amounts.
Other than the users you add to both, your Mainnet and testnet workspaces are completely different workspaces. Your Mainnet workspace will require its own vault accounts and asset wallets, exchange and fiat account connections, policies, users, and more.
You must define the Mainnet workspace’s Policy rules to work in accordance with the Mainnet workspace’s various users, user groups, sources, destinations, and assets. These parameters will likely be different from what you used in your testnet workspace.
You must configure your Mainnet workspace to work with any API integrations and third-party accounts you want to carry over from your testnet workspace. This includes creating a new API key for and provisioning your API Co-Signer. Note that you can add Fireblocks Console users, adjust the Admin Quorum, and connect to exchange accounts, fiat accounts, and Fireblocks Network members before or after you configure your API integrations.
Testnet
Testnet is a blockchain test network used by developers to run tests with the blockchain. Testnets operate on blockchains separate from their associated Mainnet. Testnet assets have no monetary value, and many of them reset periodically.
A Testnet workspace is a testing-level environment that only allows you to use Testnet assets for integration and testing purposes. You can also perform many of the same actions you can in a Mainnet workspace without incurring real-world fees.
In the Fireblocks Console, the "
Testnet Environment
" badge appears at the top of the page to help you identify your Testnet workspace.
Limitations of Testnet workspaces
The Testnet workspace will have certain conditions to protect you from losing real assets and compromising security while you test, such as:
Only Testnet assets and Testnet blockchains are supported (e.g., Ethereum Sepolia Testnet)
Simplified signing process that removes many security features in favor of simple setup and testing, such as no mobile signing application support and no client co-signer support
Limited exchange integrations since not all exchanges support Testnet blockchains and may not work as they would on Mainnet
Fiat integrations will only work on fiat test networks
DeFi and Web3 have limited blockchain and Web3 dApp test network support
The
Fireblocks Network
is not available
Transaction screening
AML
/KYT integrations are not available
Reduced API rate limits (production-level load testing is not available)
Developer Sandbox
Sandbox workspaces are freely available to sign up for. These workspaces are geared towards quick development and experimentation. Here are some of the highlights of Sandbox environments:
When creating API users, the CSR certificate required to generate the private key is automatically created in the browser.
Access to the Developer Area API Monitoring feature that displays the workspace's API calls and errors over 24-hour and 7-day periods.
No mobile signing devices are needed since all transactions are auto-approved, reducing the complexity of trying out the Fireblocks API.
Differences in Sandbox User Roles
When creating new Console or API users in Developer Sandbox workspaces, there are only three workspace roles available:
Non-Signing Admin
Editor
Viewer
In Sandbox workspaces, the Owner role is taken up by a backend service that manages auto-approvals to make experimentation and development easier. Therefore, the Non-Signing Admin replaces this role type and has the highest level of permissions, which are not present in Mainnet/Testnet workspaces, such as:
Creating and deleting users
Resetting 2FA for workspace users
Signing transactions (despite the "non-signing" in the role's name)
For more information about workspace roles and permissions in production Mainnet and Testnet workspaces,
visit our Help Center
.
Supported Mainnets, Testnets, and Assets
Visit the
Supported blockchain networks
page in our Help Center to learn more about supported Mainnets, Testnets, and assets.
Updated
20 days ago
Fireblocks Object Model
Data Privacy and Protection
Table of Contents
Overview
Workspace Types
Mainnet
Testnet
Limitations of Testnet workspaces
Developer Sandbox
Differences in Sandbox User Roles
Supported Mainnets, Testnets, and Assets

---

## Data Privacy And Protection {#data-privacy-and-protection}

*Source: https://developers.fireblocks.com/docs/data-privacy-and-protection*

Data Privacy and Protection
Fireblocks does not store or process any client Personal Identifiable Information (PII). To achieve this, the customer is required to strictly use anonymized tokens, such as
Universally Unique Identifiers
(UUID) to reflect client data. These anonymous tokens are mapped internally by the customer to actual client identifiers stored on the customer's end.
Since the customer processes and manages its wallet infrastructure using the Fireblocks Console or Fireblocks API, these anonymous tokens should be used when using the Fireblocks REST API endpoints. The following table lists the relevant fields that allow persistent information to be stored in Fireblocks–for which the anonymous tokens should be used.
API Endpoint
Method
Parameter
Vault
Create a new vault account
name
Vault
Create a new asset deposit address
description
Vault
Rename a vault account
description
Internal Wallet
Create an internal wallet
name
Internal Wallet
Set an AML/KYT customer reference ID for an internal wallet
customerRefId
External Wallet
Create an external wallet
name
External Wallet
Set an AML customer reference ID for an external wallet
customerRefId
Contracts
Create a contract
name
Transactions
Create a new transaction
note
Transactions
Estimate a transaction fee
note
Updated
20 days ago
Workspace Comparison
Developer Center

---

## Secure Api Configuration {#secure-api-configuration}

*Source: https://developers.fireblocks.com/docs/secure-api-configuration*

Secure API Configuration
Overview
Your API credentials and accounts are a prime target for hackers. It is important to understand and implement our best practices for working securely with the Fireblocks APIs.
Role-based access control
When adding API users, ensure that the API user's role is provisioned in accordance with the
least privilege principle
. Fireblocks supports many different roles for role-based access control, and an API user can be any one of these.
Create as many API users as needed to separate duties and create security boundaries.
👍
Best Practice
It is best to have 2 separate API users for different functions, such as:
A 'Viewer' role that performs read-only operations.
A 'Signer' role with transaction signing capabilities.
Create Transaction Authorization Policy rules for API users
API Users with transaction initiation and signing capabilities are able to execute transactions like any other Fireblocks Console user.
It is imperative that you create strong
Transaction Authorization Policy
(TAP) rules to govern what types of transactions these API users can conduct.
👍
Best Practice
It is best to create TAP rules that limit API users to transact from a specific account and only up to a certain amount. This requires additional approvals or blocks the transaction, preventing users from trying to exceed the pre-defined amount or from transacting from an unauthorized vault account.
Whitelisting IP addresses for API requests
Each API user type on your workspace can whitelist specific IP addresses to only allow API calls from the provided address(es). If there aren't any whitelisted IP addresses for a user, API requests are possible from any IP address.
🚧
Address format requirements
Only /32 IP addresses are accepted. Do not enter addresses as a range of values.
👍
Best Practice
It is best practice to explicitly whitelist the only IPs that you expect to be calling the Fireblocks API.
The Owner of your workspace can suspend the whitelisting of new withdrawal addresses.
Submit a request to Fireblocks Support to enable / disable this feature.
Generating & storing RSA 4096 private keys
Each API user requires a corresponding public/private key pair used to sign requests. It is
imperative
that you keep your
Fireblocks Secret Key
(
fireblocks_secret.key
) safe and secure.
Ways to keep your public/private key pair secure:
Generate a unique
CSR
file and corresponding public/private key pair for each unique API user, such that if one API user's keys are compromised, other ones will not be.
Generate the CSR file and corresponding public/private key pair in an offline (air-gapped) environment for added security.
Ensure that your
fireblocks_secret.key
is stored securely in a hardened environment with advanced security controls such as multi-factor authentication and endpoint protection agents.
Do not embed API keys directly in code or your API code source tree
API keys embedded in code can be accidentally exposed to the public.
👍
Best Practice
Instead of embedding your API keys within your applications,
store them in environment variables or in files outside of your API code's source tree
.
This is particularly important if you use a public source code management system such as GitHub.
Updated
20 days ago
Introduction
Table of Contents
Overview

---

## Manage Users {#manage-users}

*Source: https://developers.fireblocks.com/docs/manage-users*

Manage Users
Fireblocks users can be added either via the web console or via the API:
For adding users via the console please refer to
this guide
For adding users via the API please refer to the following
API endpoints
Generally, there are different user roles that can be assigned to a specific user, please see the user role table below:
There are different API Key types. Each type contains other capabilities in addition to transaction permissions.
API Key Type
Role
Transaction Permissions
Environment
Admin
Signing
Can sign transactions.
Production
Non-Signing Admin
Non-Signing
Can't sign transactions.
Production + Sandbox
Signer
Signing
Can sign transactions.
Production
Approver
Non-Signing
Can't sign transactions.
Production
Editor
Non-Signing
Can't sign transactions.
Production + Sandbox
Viewer
View-Only
Can only view transaction history.
Production + Sandbox
NCW_ADMIN
Non-Signing
Can only manage Non Custodial Wallets.
Production + Sandbox
NCW_SIGNER
Signing
Can only sign transaction from Non Custodial Wallets.
Production + Sandbox
Defining users in your workspace may seem straightforward, but it requires careful alignment with the supported roles.
Whether your goal is maximum security or optimal work efficiency, the right approach depends on your specific business use cases.
Before getting started, familiarize yourself with
user groups
and
approval groups
. These two features are crucial for defining user roles and actions in your Fireblocks workspace and can significantly enhance your operational efficiency and security.
Segregate users into two categories: those responsible for managerial decisions and changes, and those handling day-to-day operations. Differentiating between users who can make changes in the workspace and those who can only initiate or sign transactions will enhance security. For more details, refer to
this guide
.
Always consider the admin quorum approval. The more approvals required for a workspace change, the longer and more complex the implementation process will be.
Start by defining groups and their tasks. Based on these tasks, identify the roles that match and add individual users accordingly. Managing your operations with the correct setup of groups will enhance the performance of regular operations and facilitate general workspace changes.
Follow the general best practices when choosing users and roles as outlined
here
.
API Users Use Cases
API users can be used either to access Fireblocks API or to be paired with a cosigner (one can be both at the same time, but this is not the best practice).
In the case of an API user used to access the API, it has API key and API Secret that are required for authentication.
In the case of an API user paired with a cosigner, it has MPC key shares if it's a Signer or Admin, a One-time pairing token, and Device in case it's an API user that is paired with a device.
In the case of an API user used for KeyLink, it does not have MPC keys, but it has the pairing token, the access token, and the device.
Updated
20 days ago
Developer Center
Manage API Access
Table of Contents
API Users Use Cases

---

## Get To Know Fireblocks Workspaces {#get-to-know-fireblocks-workspaces}

*Source: https://developers.fireblocks.com/docs/get-to-know-fireblocks-workspaces*

Compare Workspace Types
Fireblocks has three types of workspaces. The workspace type you use will determine your capabilities, so it's important to know which type you're working in.
Developer Sandbox
environments and
Testnet
workspaces are used for development and testing.
Mainnet
workspaces are used to deploy into production (with real funds).
Even though each workspace type has different capabilities, they all utilize similar APIs and SDKs, allowing you to develop and test your code against "lower" environments before deploying to your live production environment.
Workspace Types
Developer Sandbox
Testnet
Mainnet
Console URL
sandbox.fireblocks.io
console.fireblocks.io
console.fireblocks.io
API URL
sandbox-api.fireblocks.io/v1
api.fireblocks.io/v1
api.fireblocks.io/v1
Workspace Types
Quick Experimentation
Development
Staging/Production
Purpose
Built specifically for developers to get started using Fireblocks APIs and SDKs quickly
API and Console testing on testnet blockchains and assets
Production environments interacting with mainnet blockchains and assets
Assets
Test assets
Test assets
Real assets
API
Full API access with the most limited rate limits
Full API access with limited rate limits
Full API access with increased rate limits
Exchanges
Limited exchange integration support (only testnets)
Limited exchange integration support (only testnets)
All Fireblocks exchange integrations
Fiat
Testnet only
Testnet only
All Fireblocks fiat integrations
DeFi/Web3
Testnet protocols with WalletConnect Desktop integration
Testnet protocols with WalletConnect Mobile and Desktop integrations
Full support
(requires specific Policy implementation to enable)
Fireblocks Network
N/A
N/A
All Fireblocks Network connections are available
API Co-signer
Only Fireblocks provided API Co-Signer
Fireblocks-provided or self-hosted API Co-Signer.
Self-hosted API Co-Signer
AML
N/A
N/A
Most assets are supported via Chainalysis or Elliptic
*Policies** (Formerly TAP)
Non-editable
Fully editable
Fully editable
API User Limit
Up to 5 Users
Limited to the client setting
Limited to the client setting
Support
Community support
Full Support with Help Center access
Full Support with Help Center access
Mobile Access
N/A
Fireblocks mobile app to sign/authorize transactions and  approve external connections
Fireblocks mobile app to sign/authorize transactions and  approve external connection
Derivation Path
See
Testnet and Sandbox workspace exceptions
See
Testnet and Sandbox workspace exceptions
Mainnet
Mainnet is a production-level blockchain network with cryptocurrency transactions being broadcasted, verified, and recorded. Mainnets have a base asset that can be used as funds in transactions or to pay network fees. All assets on Mainnets have real-world monetary value.
A Mainnet workspace is a fully developed and deployed environment that allows you and your organization to conduct your real-world financial operations on the Fireblocks platform.
In Mainnet workspaces, you can securely:
Transfer digital assets
Add users
Create a
Vault account
or multiple
Whitelist new addresses
Connect to supported exchanges
Connect to other
Fireblocks Network members
Configure
MPC-CMP
devices
Establish network connections
🚧
Moving to Mainnet workspaces
When you’re ready to use your Mainnet workspace, there are a few things to keep in mind before you get started.
When testing new functions in Mainnet (production) environments, use small amounts first to confirm intended functionality before upscaling to larger amounts.
Other than the users you add to both, your Mainnet and testnet workspaces are completely different workspaces. Your Mainnet workspace will require its own vault accounts and asset wallets, exchange and fiat account connections, policies, users, and more.
You must define the Mainnet workspace’s Policy rules to work in accordance with the Mainnet workspace’s various users, user groups, sources, destinations, and assets. These parameters will likely be different from what you used in your testnet workspace.
You must configure your Mainnet workspace to work with any API integrations and third-party accounts you want to carry over from your testnet workspace. This includes creating a new API key for and provisioning your API Co-Signer. Note that you can add Fireblocks Console users, adjust the Admin Quorum, and connect to exchange accounts, fiat accounts, and Fireblocks Network members before or after you configure your API integrations.
Testnet
Testnet is a blockchain test network used by developers to run tests with the blockchain. Testnets operate on their own blockchains, separate from their associated Mainnet. Testnet assets have no monetary value, and many of them reset periodically.
A Testnet workspace is a testing-level environment that only allows you to use Testnet assets for integration and testing purposes. You can also perform many of the same actions you can in a Mainnet workspace without incurring real-world fees.
In the Fireblocks Console, the "
Testnet Environment
" badge appears at the top of the page to help you identify your Testnet workspace.
Limitations of Testnet workspaces
The Testnet workspace will have certain conditions to protect you from losing real assets and compromising security while you test, such as:
Only Testnet assets and Testnet blockchains are supported (e.g., Ethereum Goerli Testnet)
Simplified signing process that removes many security features in favor of simple setup and testing, such as no mobile signing application support and no client co-signer support
Limited exchange integrations since not all exchanges support Testnet blockchains and may not work as they would on Mainnet
Fiat integrations will only work on fiat test networks
DeFi and Web3 have limited blockchain and Web3 dApp test network support
The
Fireblocks Network
is not available
Transaction screening
AML
/KYT integrations are not available
Reduced API rate limits (production-level load testing is not available)
Sandbox
Sandbox workspaces are freely available to sign up for. These workspaces are geared towards quick development and experimentation. Here are some of the highlights of Sandbox environments:
When creating API users, the CSR certificate required to generate the private key is automatically created in the browser.
Access to the Developer Area API Monitoring feature that displays the workspace's API calls and errors over 24-hour and 7-day periods.
No mobile signing devices are needed. With all transactions being auto-approved, this reduces the complexity of trying out the Fireblocks API.
Differences in Sandbox User Roles
When creating new Console or API users in Developer Sandbox workspaces, there are only three workspace roles available:
Non-Signing Admin
Editor
Viewer
In Sandbox workspaces, the Owner role is taken up by a backend service that manages auto-approvals to make experimentation and development easier. Therefore, the Non-Signing Admin replaces this role type and has the highest level of permissions, which are not present in Mainnet/Testnet workspaces, such as:
Creating and deleting users
Resetting 2FA for workspace users
Signing transactions (despite the "non-signing" in the role's name)
For more information about workspace roles and permissions in production Mainnet and Testnet workspaces,
visit our Help Center
.
Supported Mainnets, Testnets, and Assets
Visit the
Supported blockchain networks
page in our Help Center to learn more about supported Mainnets, Testnets, and assets.
Updated
20 days ago
Overview
Create Direct Custody Wallets
Table of Contents
Workspace Types
Mainnet
Testnet
Limitations of Testnet workspaces
Sandbox
Differences in Sandbox User Roles
Supported Mainnets, Testnets, and Assets

---

