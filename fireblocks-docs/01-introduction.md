# 01 Introduction

This document contains 7 sections related to 01 introduction.

## Table of Contents

1. [Introduction](#introduction)
2. [Quickstart](#quickstart)
3. [Developer Center](#developer-center)
4. [What Is Fireblocks](#what-is-fireblocks)
5. [Overview](#overview)
6. [Getting Started](#getting-started)
7. [Quickstart Guide](#quickstart-guide)

---

## Introduction {#introduction}

*Source: https://developers.fireblocks.com/docs/introduction*

Introduction
Documentation Overview
Welcome to the Fireblocks
Developer Portal
!
Here, you'll find all the resources you need to start using our API and integrate it into your existing solution. Our robust API reference documentation and code libraries will help you get started quickly, while our tutorials and guides will assist you in building more advanced features and integrations with our API.
Explore & Design
This section is designed to explore Fireblocks' capabilities, guide you through product design, and provide best practices. Here, you will find a wealth of guides that will walk you through Fireblocks' features and functionalities, helping you build your product with Fireblocks in the most effective way possible.
Build & Integrate
This section is dedicated to developers. It starts with an introduction to Fireblocks' SDK and developer tools, and includes various code examples for different features. If you're looking to start developing on Fireblocks, this section provides the code references and best practices you need to get started.
API Reference
The API Reference section is an integral part of the
Build & Integrate
. Here, you can explore all Fireblocks API endpoints, familiarize yourself with the data structures, and access code snippets with our SDKs. This section is designed to help you start building quickly and easily, with all the information you need to integrate Fireblocks' API into your projects effectively.
Updated
19 days ago
What Is Fireblocks?
Table of Contents
Documentation Overview
Explore & Design
Build & Integrate
API Reference

---

## Quickstart {#quickstart}

*Source: https://developers.fireblocks.com/docs/quickstart*

Quickstart
The Fireblocks
Developer Portal
helps you get started quickly developing your exciting Fireblocks API and SDK integrations. The Fireblocks REST API lets you interact programmatically with the Fireblocks platform for a variety of use cases:
Manage your workspace and users.
Manage vaults and internal & external wallets.
Automate transaction flows.
Set up the
Gas Station
service.
Configure webhooks to receive push notifications and more!
Workspace preparation
First, ensure your workspace Owner has
properly configured the account and workspace
(Not required for Sandbox accounts)
Your workspace has API access enabled (Not required for Sandbox accounts)
Your workspace has a
Policy
defined. Learn more about
Policies
(Not required for Sandbox accounts)
You have an
API Co-Signer
configured (Not required for Sandbox accounts)
For testnet:
Communal test co-signer
. Learn more about
the Fireblocks Communal Test Co-Signer
.
For Mainnet: An SGX-enabled Co-Signer. Learn more about
API co-signer admin info for SGX-enabled server provisioning.
You have or are an Owner/Admin user who can create the API key.
You know the user role you need to create.
See user roles admin info
.
API key creation
API key types
First, we need to understand the types of API keys and their permissions. Each API key role contains other capabilities in addition to transaction permissions.
Learn more about user roles
.
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
Step 1: Generate a CSR file
🚧
Before you begin
If you're generating a CSR file on a Windows machine, you must first install OpenSSL.
Install Win32OpenSSL
.
Use the default installation settings.
Type
OpenSSL Command Prompt
into the Windows search bar and open the application. From here, you will be able to run OpenSSL commands.
The Fireblocks API uses an API key and a request signing process to provide a highly secure communication protocol. You will create both of these in this process and then store them in a secure location to be used for API key creation as well as running the API calls:
Run the following command line to generate an RSA 4096 private key (stored in
fireblocks_secret.key
) and
CSR
(stored in
fireblocks.csr
):
openssl req -new -newkey rsa:4096 -nodes -keyout fireblocks_secret.key -out fireblocks.csr -subj '/O=<your_organization>'
Step 2: Create an API key
To create an API key with a signing role, complete the following steps:
In the Fireblocks Console, go to
Settings
>
Users
.
On the Users tab, select
Add user
.
Toggle the user type to
API User
.
Complete the following fields:
Name:
Enter the name you want to give the API user in your workspace.
Role:
Select the user role defined earlier.
Attach CSR File:
Upload the CSR file created in the previous step.
Co-Signer Setup:
Choose the appropriate co-signer defined earlier.
First user on this machine:
[
SGX server enabled only
] If this is the first user configured on this SGX-enabled Co-Signer server, select this checkbox.
Select
Add User
. A new user with a small key icon next to it appears in the user list.
Select the key to copy the API key.
Approving API keys and Co-Signer pairing
Approving API keys
Your workspace's Owner and Admins receive an approval notification on their mobile device when a new Console user or API key is requested to be added.
Users are not added to a workspace until the workspace's Owner approves them and the request to add them meets the
Admin Quorum threshold
. After they are added to the workspace, continue the onboarding process.
Co-Signer pairing (Not required for Sandbox accounts)
API keys with signing or approving permissions must be paired with an API Co-Signer.
Select the
Pending Activation
status on the user row to copy the pairing token.
Use the pairing token to pair the API user with your API Co-Signer machine.
Try the API
Now, you can try the API using one of our SDKs or the REST API endpoints.
Get started using our SDKs or REST API endpoints in minutes with our Postman guide
.

---

## Developer Center {#developer-center}

*Source: https://developers.fireblocks.com/docs/developer-center*

Developer Center
Overview
The Developer Center page lets your organization view and monitor your workspace's API activity in the Fireblocks Console.
The
Overview
tab lets you view a bar graph showing the distribution of your workspace's API requests. The default view is a seven-day distribution, but you can toggle it to view the last 24 hours of activity in one-hour windows.
Below the graph, you can view the category of each API request and what percentage that category makes up of the total distribution. Next to the percentage is the actual number of requests made within each category.
API monitoring
The
API monitoring
tab lets you view a line graph of the types of requests made over the last seven days. Like on the Overview tab, you can switch the view to a 24-hour format divided into one-hour windows.
Below the graph, a table shows a breakdown of each request by date and time, method, category, endpoint, response code, and the number of requests made. If your workspace has numerous requests, you can search the table using the search bar above it or filter the graph and the table using the Filters tree list on the left side of the page. You can filter by response code, method, and category.
📘
Response code 429
Response code 429, typically reserved for rate limited responses, is an upcoming feature that is not currently available to view or filter by.
API users
❗️
Only available to Admin-level workspace users
The
API users
tab is only available to Admin-level workspace users such as the Owner, Admins, and Non-Signing Admins. The tab does not appear to any other user roles.
The
API users
tab lets you create and manage your workspace's API users. A table shows a list of the workspace's API users by name, role, API key, what user group (or groups) they're in, and their current status.
Visit our Help Center to learn more about:
Adding API users
Re-enrolling API users
Deleting users
(Owner only)
Updated
20 days ago
Data Privacy and Protection
Manage Users
Table of Contents
Overview
API monitoring
API users

---

## What Is Fireblocks {#what-is-fireblocks}

*Source: https://developers.fireblocks.com/docs/what-is-fireblocks*

What Is Fireblocks?
Fireblocks is a user-friendly platform that uses direct custody to build new blockchain-based products and manage your digital asset operations. Direct custody is a type of self-custody that seamlessly blends high performance, zero counterparty risk, and multiple layers of security. With Fireblocks, you're always the owner and controller of your assets.
The Fireblocks direct custody model follows five core Custody & Risk Principles:
Provide an environment with zero counterparty risk.
Eliminate external and internal attack vectors.
Guarantee business continuity.
Ensure granular control and visibility of every transaction.
Deliver high-performance products and services with ease of use.
Learn more about Fireblocks’ Custody & Risk Principles.
The Fireblocks platform is comprised of three core components:
Digital Asset Wallets
Secure, and scalable MPC-based wallets with robust key management to custody digital assets. The Fireblocks MPC-CMP protocol redefines private key security, never gathering a private key as one whole, eliminating risk. Fireblocks customers use our wallets for a range of operations, such as treasury, trading, cold storage, royalties, NFTs, smart contracts, and user wallets.
Platform Governance
The Policy Engine automates governance policies for transaction rules and admin approvals. It enables you to configure a list of rules that dictate how transactions are handled and approved. A rule can set whether a transaction is blocked, approved, or requires additional signers using filters.
Policy Engine rules for various destinations, such as internal wallets, network connections, exchanges, fiat providers, whitelisted addresses, and contract wallets.
Treasury Management
Fireblocks' single platform centralizes wallet and address management to simplify crypto and NFT treasury operations. Wallets are organized into Vault accounts (segregated or omnibus) where you can set specific transaction policies to protect the movement of funds.
The Fireblocks Network ensures transfers from Fireblocks wallets are simple and secure. The Network automatically authenticates deposit addresses to avoid manual deposit address entry and the need for test transfers.
Over 30 exchanges and fiat providers are connected to the Fireblocks Network, enabling you to securely deposit and withdraw from their exchange accounts. Thousands of businesses are also connected to the Fireblocks Network for secure peer-to-peer transfers.
Fireblocks Multi-layer Security
Fireblocks has created a multi-layer security matrix that layers MPC, secure enclaves, our signature Policy Engine, and an asset transfer network to provide the strongest software and hardware defense available against evolving attack vectors.
Because we understand that no security technology alone is unbreakable, our approach to security protects all attack surfaces in a redundant structure to provide multiple fail-safes, in the event one security control fails.
Our security structure provides a truly secure environment for storing, transferring, and issuing digital assets. This ensures that your assets are protected from cyberattacks, internal colluders, and human errors. As a result, Fireblocks serves as the foundation for 1,000s of digital asset businesses and has securely transferred over $3T in digital assets.
Multi-Layer Security In-Depth
Layer 1: MPC-CMP
MPC (multi-party computation) is a cryptographic technology that stores secret information with each party, then solves a problem that requires the unshared, decentralized input of all these parties' secret information. Fireblocks uses MPC over other technologies such as Multisig because MPC is protocol agnostic, operationally flexible, and less costly as signing occurs off-chain.
Fireblocks developed the MPC-CMP protocol that applies this concept to blockchain-based ECDSA and EdDSA signatures (used by all blockchains). The Fireblocks MPC-CMP protocol redefines private key security, never gathering a private key as one whole. MPC-CMP also requires fewer transaction rounds for signing (8x faster than standard MPC) and is available with cold storage signing where key shares are stored offline.
Fireblocks distributes the cryptographic MPC shares across multiple tier-1 cloud environments to ensure an extra layer of security even if one of the physical data centers is compromised. You can also store MPC shares across on-prem data centers or configure a hybrid scenario.
Layer 2: Secure Enclaves
Fireblocks utilizes Intel SGX, a hardware-level enclave that isolates selected code and data within a system. It is designed to protect the cryptographic material, the cryptographic algorithm (MPC and ZKPs), and the execution of sensitive parts of the software from both insiders (such as rogue admins) and hackers.
As the MPC key shares are stored in SGX, they cannot be extracted even if malware or a hacker has control over the server’s OS – as the memory space and the data in the SGX enclave are encrypted. We also utilize SGX to secure API keys. In the trusted execution environments (TEEs) where we store these exchange credentials, the information cannot be retrieved by hackers, inside colluders, or even Fireblocks employees.
Layer 3: Policy Engine
Fireblocks’ Policy Engine allows you to configure a list of rules that affect how transactions are handled and approved. A rule can set whether a transaction is blocked, approved, or requires additional signers using filters such as source, destination, asset, and amount.
Fireblocks secures the Policy Engine itself using SGX and distributes policy verification across several MPC servers. Policy rules are signed by a quorum of admins and encrypted within SGX; the engine is implemented inside of the SGX enclave and the code cannot be modified. This prevents both hackers and even insiders from modifying the implemented rules or the logic of the policy engine.
Layer 4: Fireblocks Network
The Fireblocks Network is an institutional asset transfer network that completely mitigates the risks associated with deposit addresses by automating deposit address authentication and rotation. The Fireblocks Network entirely removes the need to copy and paste deposit addresses, then authenticate them using test transfers and whitelisting procedures.
Without an authentication network, it’s possible for assets to be lost through deposit address spoofing or human errors (such as entering a deposit address for a counterparty that they’ve already rotated out).
Additional Security Measures
Admin Quorum
The
Admin Quorum
defines the minimum number of administrators required to approve connections and workspace changes. This includes whitelisting addresses, approving network connections, exchange accounts, external destination addresses, approving new users, and approving other workspace configuration changes. The admin quorum prevents insider attacks, such as an administrator trying to whitelist their personal wallet address to steal funds.
Multi-factor Authentication
Two-factor authentication is required at a minimum for all Fireblocks users. Any authenticator app may be used such as apps from Google, Microsoft, LastPass, or Yubico.
Logging
All activity within the Fireblocks workspace, including administrative changes, and transactions are securely logged for auditing purposes. These logs can be viewed natively within the Fireblocks console, or exported to any log aggregation system, such as a SIEM.
Updated
20 days ago
Introduction
Explore Use Cases
Table of Contents
Fireblocks Multi-layer Security
Multi-Layer Security In-Depth
Additional Security Measures

---

## Overview {#overview}

*Source: https://developers.fireblocks.com/docs/overview*

Overview
📘
Unsure about which custody model is right for you?
Read our “
Guide to Digital Asset Wallets and Service Providers
” for insights into evaluating digital asset wallet and service providers for your business
Overview
Fireblocks provides customers with an option to choose what custody model works best for their use case. In this guide we will outline the main technical and conceptual differences between Embedded Wallets and Direct Custody wallets.
Following are the main differences between direct custody and Embedded Wallets wallets in Fireblocks.
Direct custody wallets use a 3-of-3 multi-party computation (MPC) signature scheme while Embedded Wallets wallets use a 2-of-2 signature scheme.
There is only one master key per workspace for direct custody wallets, while each Embedded Wallets wallet has its own master key.
UTXO-based assets, such as BTC, can have multiple deposit addresses per wallet per vault account for direct custody wallets. For Embedded Wallets wallets, one wallet can have multiple accounts while each account can hold only 1 BTC address.
The Fireblocks Network and exchange integrations are supported for direct custody wallets only.
Direct Custody Wallets
Structure
The main section of the workspace is the Fireblocks Vault which holds all MPC wallets.
Inside the Vault, an unlimited number of vault accounts can be created. This allows to segregate between distinct clients and various use cases.
Each vault account can hold as many asset wallets as you need. However, you can only have one wallet per asset.
In a vault account, asset wallets can accommodate numerous deposit addresses for UTXO-based assets, while account-based assets are assigned with a single address.
Secret key management and wallet derivation
Each vault account is identified by its
vault account ID
. This identifier is used for derivation of the asset wallets in a specific vault account.
Using one master key (split into three key shards) for the entire workspace, you can create an unlimited number of vault accounts. The vault account ID acts as the account value of the derivation path.
Each asset within this specific Vault would be derived according to the following structure: m/purpose/coinType/account/change/index.
m
: master private key
purpose
: the derivation standard (BIP44 in our example)
coinType
: the unique identifier of an asset (0 for BTC, 60 for ETH, etc.)
account
: the vault account ID
change
: always 0
index
: the address index (always 0 except for UTXO based assets such as Bitcoin)
Embedded Wallets
Structure
Fireblocks Embedded Wallets wallets can be used in parallel with direct custody wallets. One workspace can support both structures. However, Fireblocks strongly recommends splitting the direct custody and the Embedded Wallets parts of your business into two different workspaces due to some settings that are shared by both types of wallets in the same workspace.
Fireblocks Embedded Wallets wallets use 2-of-2 MPC signature scheme. One key share is stored within an Intel SGX-enabled server managed by Fireblocks, and the second key share is stored on the end user's device.
Secret key management and wallet derivation
The derivation for Embedded Wallets wallets is almost the exact same as the derivation for direct custody wallets. The main difference is that each Embedded Wallets wallet will have its own master key, which is split into two key shards. In a single Embedded Wallets wallet, you can create an unlimited number of accounts while each account can have only one supported asset per asset type.
Updated
20 days ago
Segregate Duties
Compare Workspace Types
Table of Contents
Overview
Direct Custody Wallets
Structure
Secret key management and wallet derivation
Embedded Wallets
Structure
Secret key management and wallet derivation

---

## Getting Started {#getting-started}

*Source: https://developers.fireblocks.com/docs/getting-started*

Getting Started
Set up the welcome page for your API to help users make their first call.
1
Pick a language
Shell
Node
Ruby
PHP
Python
Java
C#
2
Try it!
RESPONSE
Click
Try It!
to start a request and see the response here!

---

## Quickstart Guide {#quickstart-guide}

*Source: https://developers.fireblocks.com/docs/quickstart-guide*

Quickstart Guide
❗️
Are you in the right place?
This guide is for standard
Testnet
and
Mainnet
workspaces. If you have a
Developer Sandbox
workspace type, follow the
Developer Sandbox Quickstart
guide for relevant instructions.
You can sign up for a Fireblocks Sandbox environment
here
.
About this guide
The Fireblocks
Developer Portal
helps you get started quickly developing your exciting Fireblocks API and SDK integrations. The Fireblocks REST API lets you interact programmatically with the Fireblocks platform for a variety of use cases:
Manage your workspace and users.
Manage vaults and internal & external wallets.
Automate transaction flows.
Set up the
Gas Station
service.
Configure webhooks to receive push notifications and more!
Workspace preparation
First, ensure your workspace Owner has
properly configured the account and workspace
.
Your workspace has API access enabled.
Your workspace has a
Transaction Authorization Policy
(TAP) defined. Learn more about the
TAP
.
You have an
API Co-Signer
configured.
For testnet:
Communal test co-signer
. Learn more about
the Fireblocks Communal Test Co-Signer
.
For Mainnet: An SGX-enabled Co-Signer. Learn more about
API co-signer admin info for SGX-enabled server provisioning.
You have or are an Owner/Admin user who can create the API key.
You know the user role you need to create.
See user roles admin info
.
API key creation
API key types
First, we need to understand the types of API keys and their permissions. Each API key role contains other capabilities in addition to transaction permissions.
Learn more about user roles
.
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
Step 1: Generate a CSR file
🚧
Before you begin
If you're generating a CSR file on a Windows machine, you must first install OpenSSL.
Install Win32OpenSSL
.
Use the default installation settings.
Type
OpenSSL Command Prompt
into the Windows search bar and open the application. From here, you will be able to run OpenSSL commands.
The Fireblocks API uses an API key and a request signing process to provide a highly secure communication protocol. You will create both of these in this process and then store them in a secure location to be used for API key creation as well as running the API calls:
Run the following command line to generate an RSA 4096 private key (stored in
fireblocks_secret.key
) and
CSR
(stored in
fireblocks.csr
):
openssl req -new -newkey rsa:4096 -nodes -keyout fireblocks_secret.key -out fireblocks.csr -subj '/O=<your_organization>'
Step 2: Create an API key
To create an API key with a signing role, complete the following steps:
In the Fireblocks Console, go to
Settings
>
Users
.
On the Users tab, select
Add user
.
Toggle the user type to
API User
.
Complete the following fields:
Name:
Enter the name you want to give the API user in your workspace.
Role:
Select the user role defined earlier.
Attach CSR File:
Upload the CSR file created in the previous step.
Co-Signer Setup:
Choose the appropriate co-signer defined earlier.
First user on this machine:
[
SGX server enabled only
] If this is the first user configured on this SGX-enabled Co-Signer server, select this checkbox.
Select
Add User
. A new user with a small key icon next to it appears in the user list.
Select the key to copy the API key.
Approving API keys and Co-Signer pairing
Approving API keys
Your workspace's Owner and Admins receive an approval notification on their mobile device when a new Console user or API key is requested to be added.
Users are not added to a workspace until the workspace's Owner approves them and the request to add them meets the
Admin Quorum threshold
. After they are added to the workspace, continue the onboarding process.
Co-Signer pairing
API keys with signing or approving permissions must be paired with an API Co-Signer.
Select the
Pending Activation
status on the user row to copy the pairing token.
Use the pairing token to pair the API user with your API Co-Signer machine.
Try the API
Now, you can try the API using one of our SDKs or the REST API endpoints.
Get started using our SDKs or REST API endpoints in minutes with our Postman guide
.
Updated
20 days ago
Introduction
Table of Contents
About this guide
Workspace preparation
API key creation
API key types
Step 1: Generate a CSR file
Step 2: Create an API key
Approving API keys and Co-Signer pairing
Approving API keys
Co-Signer pairing
Try the API

---

