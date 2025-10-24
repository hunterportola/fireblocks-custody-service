# 14 Explore Integrations

This document contains 8 sections related to 14 explore integrations.

## Table of Contents

1. [Connect To Exchanges And Fiat Providers](#connect-to-exchanges-and-fiat-providers)
2. [Off Exchange](#off-exchange)
3. [Configure Webhooks](#configure-webhooks)
4. [Network Link Integration Guide For Provider Connectivity](#network-link-integration-guide-for-provider-connectivity)
5. [Integrate Fireblocks With Third Party Service Providers](#integrate-fireblocks-with-third-party-service-providers)
6. [Connect To The Fireblocks Network](#connect-to-the-fireblocks-network)
7. [Add An Exchange Account](#add-an-exchange-account)
8. [Webhooks Notifications](#webhooks-notifications)

---

## Connect To Exchanges And Fiat Providers {#connect-to-exchanges-and-fiat-providers}

*Source: https://developers.fireblocks.com/docs/connect-to-exchanges-and-fiat-providers*

Connect to Exchanges and Fiat Providers
Fireblocks enables clients to connect their own (supported by Fireblocks) exchange and fiat accounts directly within the workspace.
Customers can bring their API credentials from the supported exchange or fiat account and integrate them into the Fireblocks workspace.
Once connected, clients can seamlessly transfer funds to and from the connected exchange account via the Fireblocks console or the API.
Additionally, clients can view the balances of their connected exchange accounts and set Policies and automated processes around these accounts, enhancing both control and efficiency in managing their assets.
📘
Learn more about connecting Exchange or Fiat accounts in the following guides:
Supported Exchange Accounts and configuration guides
Supported FIAT Accounts and configuration guides
📘
Check out the
Exchange Accounts
and
Fiat Accounts
management APIs in the Firebocks API Reference
📘
Check out the Exchange and Fiat Accounts Developer Guide
here
Updated
20 days ago
Execute Smart Transfers
Add an Exchange Account

---

## Off Exchange {#off-exchange}

*Source: https://developers.fireblocks.com/docs/off-exchange*

Off Exchange
Overview
Fireblocks is the digital asset management infrastructure for the leading trading desks, hedge funds, brokerages, custodians, and banks.
Through the Fireblocks Console, users connect and trade on over 30 exchanges.
As part of an important initiative, making sure that the end user still has complete control over his own asset Fireblocks offers the Off Exchange solution. This way ,the end user can enjoy the various benefits of the exchange while avoiding the risk of a centralized malfunction.
Benefits:
Complete end user control
Provide a trustable relationship, where the customer safely continues his work with the exchange
Control rate limits and response codes
Manage the supported assets
Optimize the platform load for requests from Fireblocks
Read the Fireblocks Off-Exchange official documentation
Official Public Keys
Use the following key(s) to validate requests received from Fireblocks on Off-Exchange:
Development Testing
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAtug0j82+C1WCcqCPEzEm
sao1kH4gIDHewI06SsiB1aIdZ/v+I/PTRTYhKC0JVtsio+KeF/YDWI3c1RZrMa9/
7yOoQ8QNNG0U65q2//LoSz3He6E9/7b5V+BrQwvCHPOv4kp+un9bZ23BqvX+jgJQ
aKTvjEeBUW6fOh2oupRGH51teBcQpmgPFP1b26BGFSiGBdyB1OX6qYchIv5C/XW/
d3NoOUD96kEMEsDUKCvXwPp5gelqZQoaGZZatE5AllFdJJQKXU8DWDXTJMSyxIIY
rzx6S5RToDDK/Z7SKG4k8q1pd6pViNe88DJYV6kJdSgiYThl07sATWo+6Ev6nFSo
z69Jx+BWx5v2aLJfc6ghuN7j5dOBtex+tklHMw0s1XCiE14Pyi6px9dNNJApp6wM
LIDmMeKTZ65ar22q5ySgrNQHvVOy66zRZhfOu5fueSPa4C3CBoarCpiUIQTVNzf5
AA3qBKfunIUqHYNzdvPt/MwQErW1G9XPxGC+az0Cc4qEmICUSlYiFC1BLD6YKpjP
MsPkuj2d9MYfDUQktt1IKsWOTE6NNVzmYpbZkA7TD6hcqd7rV6Zf5TcK9vvEB1V5
F0jJYUdNXygdzKOwY/OlQ0eoF5vb6XU46y24cCnKgJ23ZfdLJJrFOdpbEaooErhn
37BWbAWH9EpcHM9pFNUYOhkCAwEAAQ==
-----END PUBLIC KEY-----
Production Testing
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA9JxE/VqDSCnUD5030Ufm
CoTiOtbLGRGZ6XK1KNhtD1c0MQUtiHoCCcAmmyOlTuemaPjrscGFOdITeubEPoO1
+smHziM2LkzSgtOwdgTXA+pYxnMe9lDXCtgD5mRRUQB6IqsqZN8bJcG+VuF/mMZy
qkuUIskrjJ+kn0ZfiR0PHVYkaUzvHhmyB8ZxrQTOWLB7H+62g7ZBI1U1cOcyHnSH
HVh0TpZ573fztqQS3ECGeCnpo6jQEfBeCvwx5sBkum+3iWl9VDwXIlyjcodlYqD1
YmrYrSPJwpQlxv9zUw2LarwJU+uv3EmIRKyQdxsHO8tcXGDy6WWl/zUNw1nu6uLd
kCteOJUT/SX0QlxizLFE02AAEW0hBNT0KHhD5GVN0QRkWfAJTxLSajqKEeg7M2KO
0xfh+PMEeEOzIc3GC5xv/oJ3tFt7ZawbU19WpifUcBiU2r4HLPaijxN7K9bZIfUt
K5maCIATuqn1U05G0zXUvkgZ64fHBzwtMl3grp5t6++QiH3fShBD+hUQmPoTV9p3
vgPtigK2+USPyJVwa22YplY96XckkBToOcrvYZc710gpTRwFjQdJ/DfrUYqh4UaV
7k/n9sCDRM3sM353tMAmr6dFYHKN5OwviKD2t9RNMa3j67wqHAeLimFvAM8fMe5I
aNSwkiUjHhlLPOqPhhXl3U8CAwEAAQ==
-----END PUBLIC KEY-----
Updated
20 days ago
Wallet Link
Integrate Fireblocks with Third-Party Service Providers
Table of Contents
Overview
Official Public Keys
Development Testing
Production Testing

---

## Configure Webhooks {#configure-webhooks}

*Source: https://developers.fireblocks.com/docs/configure-webhooks*

Configure Webhooks
📘
This guide refers to the Developer Webhooks provided by Fireblocks. It should not be confused with Audit Log notifications, which serve a different purpose and can also be configured for delivery via webhooks.
Overview
Webhooks provide real-time notifications for events happening within your Fireblocks workspace, such as incoming and outgoing transactions, transaction status updates, and the addition of new vault accounts, contract wallets, internal wallets, or external wallets. By configuring webhooks, you can 'listen' for these events at your chosen URL, ensuring that all relevant event types are broadcasted to your designated endpoint.
Using webhooks offers several benefits, particularly for event-driven development. They enable immediate awareness of critical events, allowing your systems to respond quickly and automatically to changes in your workspace. This real-time monitoring enhances operational efficiency, as it can trigger automated workflows, updates, or alerts based on the specific events received. Webhooks also facilitate seamless integration with your existing applications, enabling more dynamic and responsive interactions between your Fireblocks workspace and other platforms.
When implementing webhooks, consider the reliability and scalability of the receiving endpoint. Ensure that your system can handle the volume of incoming events and process them efficiently.
In a case of missed notifications, due to some issues that your server might experience, Fireblocks offers the following API endpoints for resending webhook notifications:
Resend failed webhooks
- Resends all failed webhook notifications
Resend webhooks for a transaction by ID
- Resends webhook notifications for a transaction by its unique identifier
IP Whitelisting
Customer that wish to whitelist the IP addresses from which the Webhook notifications are going to be sent, can whitelist the following IPs:
3.134.25.131
3.23.47.185
18.223.19.147
3.141.88.232
18.189.135.42
📘
Learn more about Webhooks in the
Webhook Developer Guide here
Updated
20 days ago
Introduction
Table of Contents
Overview
IP Whitelisting

---

## Network Link Integration Guide For Provider Connectivity {#network-link-integration-guide-for-provider-connectivity}

*Source: https://developers.fireblocks.com/docs/network-link-integration-guide-for-provider-connectivity*

Network Link Integration Guide for Provider Connectivity
📘
Want to know more about the Provider Network and commercial prerequisites?
Visit
our Help Center article about the Provider Network
to learn more.
See the
Fireblocks Provider Connectivity API v2 documentation
on GitHub to learn how to connect your service to Fireblocks.
Registering as a service provider
Once your license agreement for listing your service with Fireblocks is signed, the Fireblocks technical team will request the following connected account registration settings:
Display name (e.g., "My Exchange" or "My Exchange Sandbox")
Icon (a 32x32 .svg file)
Step-by-step guide for generating an API key for your platform
A public link to your knowledge base is preferred. A shareable document or PDF is also acceptable.
Base URL for your API endpoints (e.g., "
https://my-service.com/fireblocks"
)
Will your service provide a sandbox environment?
For Off-Exchange capabilities, please provide your CSR file.
User credentials for testing
Which signing method will your server use for all requests? Please choose one of the supported options by specifying the pre-encoding function, signing algorithm, and post-encoding function during the server onboarding process.
Pre-encoding options:
URL encoded
Base64
HexStr
Base58
Base32
Signing algorithms & possible hash functions:
HMAC (SHA512, SHA3_256, or SHA256)
RSA PKCS1v15 (SHA512, SHA3_256, or SHA256)
ECDSA prime256v1/secp256k1 (SHA256 only)
Post-encoding options:
(URL encoding not supported)
Base64
HexStr
Base58
Base32
Validation tool results
IP allowlisting
All API calls from Fireblocks to your service are sent from a fixed set of IP addresses, grouped by geographical region. Your service should allowlist these addresses to allow Fireblocks communication with your servers.
Singapore
Europe
USA
18.99.36.0
18.99.36.1
18.99.36.2
18.99.36.3
18.99.36.4
18.99.36.5
18.99.36.6
18.99.36.7
18.99.36.8
18.99.36.9
52.76.208.129
18.98.161.0
18.98.161.1
18.98.161.2
18.98.161.3
18.98.161.4
18.98.161.5
18.98.161.6
18.98.161.7
18.98.161.8
18.98.161.9
18.98.161.10
18.98.161.11
18.98.161.12
18.98.161.13
18.98.161.14
18.98.161.15
18.98.161.16
18.98.161.17
18.98.161.18
18.98.161.19
18.133.153.74
3.10.68.107
3.64.123.47
18.158.242.74
3.10.103.242
3.67.233.15
18.97.132.0
18.97.132.1
18.97.132.2
18.97.132.3
18.97.132.4
18.97.132.5
18.97.132.6
18.97.132.7
18.97.132.8
18.97.132.9
40.117.39.160
Mandatory endpoints implementation per user flow
Minimum viable provider
Required
GET /capabilities
response:
"accounts": ["*"]
Required endpoints:
GET /capabilities
GET /capabilities/assets
GET /accounts
GET /accounts/{accountId}
Balance support
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"]
Required endpoints:
GET /accounts/{accountId}/balances
Transfer support
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"]
Required endpoints:
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
Blockchain transfer
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"], "transfersBlockchain": ["*"]
Required endpoints:
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
POST /accounts/{accountId}/transfers/deposits/addresses
GET /accounts/{accountId]/transfers/deposits/addresses
GET /accounts/{accountId}/transfers/deposits/addresses/{id}
POST /accounts/{accountId}/transfers/withdrawals/blockchain
Peer transfer
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"], "transfersPeerAccounts": ["*"]
For fiat assets, add "transfersFiat": ["*"] to the response.
Required endpoints:
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
POST /accounts/{accountId}/transfers/withdrawals/peeraccount
Internal transfer
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"], "transfersInternal": ["*"]
For fiat assets, add "transfersFiat": ["*"] to the response.
Required endpoints:
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
POST /accounts/{accountId}/transfers/withdrawals/subaccount
Fiat transfer
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"], "transfersFiat": ["*"]
Required endpoints:
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
POST /accounts/{accountId}/transfers/withdrawals/fiat
Trading support
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "trading": ["*"]
Required endpoints:
GET /capabilities/trading/books
GET /trading/books/{id}
GET /accounts/{accountId}/trading/orders
POST /accounts/{accountId}/trading/orders
GET /accounts/{accountId}/trading/orders/{id}
GET /accounts/{accountId}/trading/books/{id}/history
Liquidity/RFQ support
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "liquidity": ["*"]
Required endpoints:
GET /capabilities/liquidity/quotes
POST /accounts/{accountId}/liquidity/quotes
GET /accounts/{accountId}/liquidity/quotes
GET /accounts/{accountId}/liquidity/quotes/{id}
POST /accounts/{accountId}/liquidity/quotes/{id}/execute
On-/Off-Ramp & Bridging
Required
GET /capabilities
response:
"accounts": ["*"], "ramps": ["*"], "balances": ["*"]
For prefunded flows, "balances": ["*"] must be returned with
GET
account API. See below.
Required endpoints:
GET /accounts/{accountId}/capabilities/ramps
POST /accounts/{accountId}/ramps
GET /accounts/{accountId}/ramps
GET /accounts/{accountId}/ramps/{id}
GET /accounts/{accountId}/balances
(only for prefunded flows)
GET /accounts/{accountId}/rate
Your service should implement the
rate
endpoint to ensure Fireblocks customers see your service's real-time rates for asset pairs. Otherwise, Fireblocks defaults to quotes or its internal rating service.
Collateral
Required
GET /capabilities
response:
"accounts": ["*"], "balances": ["*"], "transfers": ["*"], "transfersBlockchain": ["*"], "collateral": ["*"]
Required endpoints:
GET /accounts/{accountId}/balances
GET /accounts/{accountId}/capabilities/transfers/deposits
GET /accounts/{accountId}/capabilities/transfers/withdrawals
GET /accounts/{accountId}/transfers/deposits
GET /accounts/{accountId}/transfers/deposits/{id}
GET /accounts/{accountId}/transfers/withdrawals
GET /accounts/{accountId}/transfers/withdrawals/{id}
POST /accounts/{accountId}/transfers/deposits/addresses
GET /accounts/{accountId}/transfers/deposits/addresses
GET /accounts/{accountId}/transfers/deposits/addresses/{id}
POST /accounts/{accountId}/transfers/withdrawals/blockchain
Collateral endpoints:
POST accounts/{accountId}/collateral/link
GET accounts/{accountId}/collateral/link
POST accounts/{accountId}/collateral/{collateralId}/addresses
GET accounts/{accountId}/collateral/{collateralId}/addresses
GET accounts/{accountId}/collateral/{collateralId}/addresses/{id}
POST accounts/{accountId}/collateral/{collateralId}/intents/deposits
POST accounts/{accountId}/collateral/{collateralId}/deposits
GET accounts/{accountId}/collateral/{collateralId}/deposits
GET accounts/{accountId}/collateral/{collateralId}/deposits/{collateralTxId}
POST accounts/{accountId}/collateral/{collateralId}/intents/withdrawals
POST accounts/{accountId}/collateral/{collateralId}/withdrawals
GET accounts/{accountId}/collateral/{collateralId}/withdrawals
GET accounts/{accountId}/collateral/{collateralId}/withdrawals/{collateralTxId}
POST accounts/{accountId}/collateral/{collateralId}/settlement
GET accounts/{accountId}/collateral/{collateralId}/settlement
GET accounts/{accountId}/collateral/{collateralId}/settlements/{settlementVersion}
Updated
20 days ago
Sign Typed Messages
Wallet Link
Table of Contents
Registering as a service provider
IP allowlisting
Mandatory endpoints implementation per user flow
Minimum viable provider
Balance support
Transfer support
Blockchain transfer
Peer transfer
Internal transfer
Fiat transfer
Trading support
Liquidity/RFQ support
On-/Off-Ramp & Bridging
Collateral

---

## Integrate Fireblocks With Third Party Service Providers {#integrate-fireblocks-with-third-party-service-providers}

*Source: https://developers.fireblocks.com/docs/integrate-fireblocks-with-third-party-service-providers*

Integrate Fireblocks with Third-Party Service Providers
Overview
Many organizations utilizing Fireblocks seek to integrate their workspace with third-party service providers such as accounting solutions, portfolio aggregation tools, trading platforms, and more. These providers can offer valuable insights, operational efficiencies, and additional functionality by integrating directly with a Fireblocks environment.
However, since Fireblocks might not have native integrations with all these services, it is crucial to follow best practices to ensure that assets and data remain secure while maximizing the integration's effectiveness.
This guide is structured into two main sections:
For Fireblocks Clients
: Provides step-by-step recommendations for securely integrating third-party service providers with your Fireblocks workspace, focusing on access control, API key management, and other security practices.
For Third-Party Service Providers
: Offers guidance on how to securely connect with a client’s Fireblocks environment, emphasizing API key management, efficient data synchronization, and ensuring the client’s security requirements are met.
By addressing the specific concerns of both clients and providers, this guide aims to facilitate a smooth and secure integration process that benefits both parties.
Fireblocks Clients
Best Practices for Integration
1. Limit Access Levels
Ensure third-party providers are granted
Viewer
or
Editor
roles only—never
Signer
or
Admin
access. This principle applies to both API-based and UI-based integrations. Providing limited access minimizes risk exposure to your Fireblocks environment.
2. Secure API Key Management
If a third-party provider requires API access, the provider should handle key generation securely:
The provider should create their own RSA private key and a Certificate Signing Request (CSR). Only the CSR should be shared with you.
Never accept private keys over the internet
.
🚧
Always ensure that the third-party provider generates their own RSA private key and shares only the Certificate Signing Request (CSR) with you. Never share your private key with the provider.
Refer to the
Fireblocks API Key Management Documentation
for details on secure key management.
3. Use Dedicated API Keys
Always generate a new API key specific to the third-party provider. Avoid reusing API keys from internal operations to mitigate risks and facilitate easier access management.
4. Whitelist Provider IP Addresses
To enhance security, whitelist the provider’s server IP addresses for the specific API key. This additional security measure helps ensure only authorized servers have access.
More information can be found in the
IP Whitelisting Documentation
.
5. Initial Data Synchronization
For the first data sync, it's best to manually share balance and address reports from the Fireblocks Console to avoid overloading the API and hitting rate limits.
6. Enable Webhook Notifications
To keep data synchronized without excessive API polling, enable webhooks to push real-time updates from Fireblocks to the provider.
Visit the
Webhook Configuration Guide
for setup instructions.
7. Signing Transactions
If transaction signing is required, do not grant signing privileges directly to third-party providers. Use the
Designated Signer
feature and define a
Policy
. This approach maintains security by requiring your approval before any transaction is signed by the provider.
Third-Party Service Providers (Partners)
Best Practices for Integration
1. Understand Access Roles
When integrating with a Fireblocks client, expect to receive
Viewer
or
Editor
access only.
Signer
and
Admin
roles are not granted to maintain the client's security. These roles should be sufficient for most integrations to view data and perform necessary actions. Learn more about Fireblocks user roles in the
"Manage Users
" guide.
2. Secure API Key Management
As a provider, you are responsible for securely generating and managing API keys:
Generate an RSA private key and CSR, sharing only the CSR with the Fireblocks client.
Never share private keys with clients or transmit them over the internet
.
Consult the
Fireblocks API Key Management Documentation
for specific details on managing API keys securely.
🚧
Always generate the RSA private key yourself and share the Certificate Signing Request (CSR) with the client. Never request the client to provide their private key!
3. Request a Dedicated API Key
For every new client integration, request a separate API key. This practice allows clear separation of access per client and aids in efficient management and troubleshooting.
4. Provide IP Addresses for Whitelisting
To ensure your integration is secure, supply the client with your server's IP addresses for whitelisting. This step helps secure API communication and restricts access to trusted IPs.
5. Efficient Data Synchronization
To avoid overloading the client's Fireblocks API and ensure a smooth initial data sync, it's recommended to start with balance and address reports shared directly from the Fireblocks Console. Coordinate with the client for a safe and efficient data transfer process.
6. Use Webhook Notifications
Reduce the need for frequent API polling by configuring webhooks that allow real-time updates from the Fireblocks client. This setup improves efficiency and ensures up-to-date data synchronization.
Check the
Webhook Configuration Guide
for configuration steps.
7. Transaction Initiation Without Signing
If your integration requires initiating transactions, ask the client to configure your access according to their
Policies
. This will ensure that your API key can initiate transactions, but any signing or approval must be performed by the designated signer configured in the Policy. This designated signer should be the customer themselves!
Updated
20 days ago
Off Exchange
Table of Contents
Overview
Fireblocks Clients
Best Practices for Integration
Third-Party Service Providers (Partners)
Best Practices for Integration

---

## Connect To The Fireblocks Network {#connect-to-the-fireblocks-network}

*Source: https://developers.fireblocks.com/docs/connect-to-the-fireblocks-network*

Connect to the Fireblocks Network
The Fireblocks Network is a peer-to-peer, institutional liquidity and transfer network of 1,500+ liquidity providers, lending desks, and trading counterparties. Members can discover, connect, and settle with other Fireblocks Network members quickly, easily, and securely using features available only to Network members.
Fireblocks Network features
To use Fireblocks Network features with a counterparty, connect to each other on the Network. Whether you prefer to make your Network profile discoverable or not, you can connect with other members in several ways.
Discoverable members show up in searches for connections. You can then request to add them as a connection from the search results. To connect with non-discoverable Network members you need to know their unique Network ID. If your profile is not discoverable, you can still search for other discoverable members and request to connect with them. Both your Admin Quorum as well as your counterparty’s Admin Quorum must approve new Network connections.
When you make transfers on the Fireblocks Network, you benefit from these Network features:
Automated Address Authentication (AAA)
All Fireblocks Network transfers route through an encrypted tunnel within a secure hardware enclave. With AAA, you never have to store or share deposit addresses in poorly secured and error-prone ways, such as messenger apps or copying and pasting, which means you can:
Transfer faster:
Avoid time-consuming processes like manually whitelisting new deposit addresses, sending test transfers, and finding, copying, and pasting deposit addresses to send or receive a digital asset transfer.
Prevent errors:
Avoid manual, error-prone processes like tracking and copying and pasting addresses that can cause your assets or your counterparty’s assets to go to the wrong address.
Secure transfers:
Prevent Man-in-the-Middle and Address Spoofing attacks, where hackers use malware to replace addresses on infected devices, and intercept and replace addresses while you share them over messenger apps or copy and paste them. With AAA, you don’t need to manually manage or share deposit addresses.
Future-proof connections:
With AAA, connected counterparties stay connected even if your deposit address changes. AAA will automatically remap it without resharing or reconnecting.
Flexible Network Routing
When you add new Network connections, you can define how incoming deposits are routed. You can tailor routing for Network deposits of both crypto and fiat in two ways
Route by Network profile:
Send all deposits from connections to your Network profile to a designated vault account, exchange account, or fiat account in your workspace.
Route by connection:
Tailor routing per connection. Each connection’s deposits can go to their own specific designated vault account, exchange account, or fiat account.
You can also execute all Flexible Network Routing configuration actions using the Fireblocks API. With maximum flexibility for routing and managing deposit addresses for Network transfers, you can capitalize on more opportunities faster and more easily using the Fireblocks Network.
Automatic Address Rotation
When you transfer Bitcoin or other UTXO-based tokens with Fireblocks Network connections, your deposit addresses can rotate automatically for every incoming transfer. For certain tokens, a different unique identifier is rotated on every Network transfer instead of rotating addresses.
For Ripple transfers on the Network, the deposit address stays the same, but the unique XRP tag is rotated every transfer.
For EOS, Hedera, and Stellar transfers on the Network, the deposit address stays the same, but the unique memo ID is rotated every transfer.
For Network transfers on account-based blockchains like Ethereum, Automatic Address Rotation isn’t supported and there is no other unique identifier. You can transfer account-based assets on the Fireblocks Network. However, you can’t create unique identifiers like a deposit address, tag, or memo ID for each transfer for pseudo-anonymity on the blockchain.
Since Network transfers also use Automated Address Authentication, you don’t have to track or share the new addresses. This enables you to:
Preserve privacy on the blockchain by preventing your transaction history from being easily discovered by someone searching for a deposit address.
Avoid errors from manual address rotation, like forgetting to update a connection with your new address or a copy-and-paste error while tracking or sharing.
📘
Learn how to connect over the Fireblocks Network in the Web Console
here
📘
Check out the
Fireblocks Network APIs
in the Fireblocks API reference
Updated
20 days ago
Mandatory fields for Bitstamp deposits
Execute Smart Transfers
Table of Contents
Fireblocks Network features
Automated Address Authentication (AAA)
Flexible Network Routing
Automatic Address Rotation

---

## Add An Exchange Account {#add-an-exchange-account}

*Source: https://developers.fireblocks.com/docs/add-an-exchange-account*

Add an Exchange Account
You can easily add your own exchange account to the Fireblocks workspace, provided it's supported by Fireblocks. Once connected, you can seamlessly transfer funds between your exchange account and Fireblocks via the console or API. This guide will explain to you how to add an exchange account via our TypeScript and Python SDK.
Prerequisites
Contact your CSM to enable this feature and get access to:
Get Exchange Accounts Credentials Public Key endpoint
Add an Exchange Account endpoint
Make sure to prepare your workspace and perform all the steps necessary
here
.
Install all the prerequisites for our
TypeScript
and
Python
SDK.
Add an Exchange Account via SDK
You can use the following code to add an exchange account
📘
Note:
This endpoint currently only supports the following exchanges
INDEPENDENT_RESERVE
,
BIT
,
BITHUMB
,
BITSO
,
CRYPTOCOM
,
BYBIT_V2
,
WHITEBIT
,
HITBTC
,
GEMINI
,
HUOBI
,
GATEIO
,
COINHAKO
,
BULLISH
,
BITGET
, and
LUNO
Python SDK
TypeScript SDK
import base64
import json
from fireblocks.client import Fireblocks
from fireblocks.client_configuration import ClientConfiguration
from fireblocks.base_path import BasePath 
from fireblocks.models.add_exchange_account_request import AddExchangeAccountRequest
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from pprint import pprint

my_api_key="your_api_key"

with open('your_secret_key_file_path', 'r') as file:
    secret_key_value = file.read()

configuration = ClientConfiguration(
        api_key=my_api_key,
        secret_key=secret_key_value,
        base_path=BasePath.US #Make sure to use the correct environment. Please see the note
)

with Fireblocks(configuration) as fireblocks:
    tenant_id = None
    public_key = None

    try:
        # Get exchange accounts credentials public key
        api_response = fireblocks.exchange_accounts.get_exchange_accounts_credentials_public_key().result()
        tenant_id = api_response.data.tenant_id
        public_key = api_response.data.public_key
    except Exception as e:
        print("Exception when calling ExchangeAccountAPI->get_exchange_accounts_credentials_public_key: %s\n" % e)
        exit(1)


    # Credentials encryption
    exchange_api_key = "your_exchange_account_api_key"
    exchange_api_secret = 'your_exchange_account_secret_key'

    credentials = {
        "apiKey": exchange_api_key,
        "secret": exchange_api_secret,
        "tenantId": tenant_id,
    }

    pem_public_key = load_pem_public_key(bytearray(public_key, 'utf-8'), default_backend())
    credentials_str = bytes(json.dumps(credentials, separators=(',', ':')), 'utf-8')
    ciphertext = pem_public_key.encrypt(
        credentials_str,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    encrypted_creds = bytes.decode(base64.b64encode(ciphertext))

    # Prepare add exchange account request
    add_exchange_account_request: AddExchangeAccountRequest = AddExchangeAccountRequest(            
                                    exchange_type='BIT',
                                    name='My BIT account',
                                    creds=encrypted_creds,
                                    key=exchange_api_key
    )

    try:
        # Add an exchange account
        future = fireblocks.exchange_accounts.add_exchange_account(add_exchange_account_request=add_exchange_account_request)
        api_response = future.result()  # Wait for the response
        print("The response of ExchangeAccountAPI->add_exchange_account:\n")
        pprint(api_response.data.to_json())
    except Exception as e:
        print("Exception when calling ExchangeAccountAPI->add_exchange_account: %s\n" % e)
import { readFileSync } from 'fs';
import { Fireblocks, BasePath, ExchangeAccountsApiAddExchangeAccountRequest } from "@fireblocks/ts-sdk";
import { webcrypto } from "crypto";
const crypto = webcrypto;

const EXCHANGE_API_KEY = "exchange_api_key";
const EXCHANGE_API_SECRET = "exchange_api_secret";

const FIREBLOCKS_API_SECRET_PATH = "./fireblocks_secret.key";

const fireblocks = new Fireblocks({
    apiKey: "my-api-key",
    basePath: BasePath.US, //make sure to use the correct environment. Please see the note
    secretKey: readFileSync(FIREBLOCKS_API_SECRET_PATH, "utf8"),
});

async function getExchangeAccountsCredentialsPublicKey() {
    return (await fireblocks.exchangeAccounts.getExchangeAccountsCredentialsPublicKey()).data;
}

function str2ab(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {

        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function encryptCredentials(publicKey: string, payload: any) {
    const pemHeader = '-----BEGIN PUBLIC KEY-----\n';
    const pemFooter = '\n-----END PUBLIC KEY-----';
    const extractedCode = publicKey.substring(pemHeader.length, publicKey.length - pemFooter.length);
    const binaryDerString = atob(extractedCode);
    const binaryDer = str2ab(binaryDerString);

    const cryptoPublicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true,
        ['encrypt'],
    );

    const payloadStr = JSON.stringify(payload);
    const encodedDataString = new TextEncoder().encode(payloadStr);

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        cryptoPublicKey,
        encodedDataString,
    );

    const encryptedDatab64 = arrayBufferToBase64(encryptedData);

    return encryptedDatab64;
}

async function main() {

    try {
        const credsPublicKey = await getExchangeAccountsCredentialsPublicKey();

        let credentials_payload = {
            "apiKey": EXCHANGE_API_KEY,
            "secret": EXCHANGE_API_SECRET,
            "tenantId": credsPublicKey.tenantId,
        };

        const encryptedCredentials = await encryptCredentials(credsPublicKey.publicKey, credentials_payload);

        const request: ExchangeAccountsApiAddExchangeAccountRequest = {
            addExchangeAccountRequest: {
                name: "My BIT account",
                exchangeType: "BIT",
                creds: encryptedCredentials,
                key: EXCHANGE_API_KEY
            }
        };

        const addExchangeResponse = await fireblocks.exchangeAccounts.addExchangeAccount(request);
        console.log(addExchangeResponse);
    } catch (e) {
        console.log(e)
    }
}


(async () => {
    await main();
})();
📘
Note:
Make sure you're using the correct value for the API base URL for your environment:
BasePath.US
- for production workspaces
BasePath.Sandbox
- for sandbox workspaces`
Updated
20 days ago
Connect to Exchanges and Fiat Providers
Stake Assets
Table of Contents
Prerequisites
Add an Exchange Account via SDK

---

## Webhooks Notifications {#webhooks-notifications}

*Source: https://developers.fireblocks.com/docs/webhooks-notifications*

Webhooks & Notifications
Overview
Webhooks allow you to get notifications for events that happen on your Fireblocks workspace such as:
Incoming/outgoing transactions
Transactions status updates
Newly added
Vault account
,
Contract wallet
,
Internal wallet
, or
External wallet
.
You can 'listen' for events that occur in your workspace at your chosen URL, where all event types will be broadcasted.
Configuring Webhook URLs
To configure URLs for webhook notifications, follow these steps in the Fireblocks Console:
Navigate to
Settings
>
General
, then scroll down to the
Configure Webhook URL
heading and select
Manage URLs
.
In the
Configure Webhook URL
window, enter a URL to define the HTTPS endpoint, then press
Enter
.
Select
Save
📘
Webhook URL requirement
Each webhook URL must be a complete, globally available HTTPS address (e.g.,
https://example.com
).
Once your Webhook is connected to your Fireblocks workspace, you will start receiving notifications on events in that workspace.
Receiving Webhook Notifications
Fireblocks sends events to your webhook endpoint URL(s) associated with the workspace, as part of a POST request with a JSON payload.
Validation
You can validate Fireblocks webhook events by validating the signature attached in the request header:
Fireblocks-Signature:
Base64(RSA512(_WEBHOOK_PRIVATE_KEY_, SHA512(eventBody)))
To validate the signature in
Production workspaces
, please use the public key below:
Production
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0+6wd9OJQpK60ZI7qnZG
jjQ0wNFUHfRv85Tdyek8+ahlg1Ph8uhwl4N6DZw5LwLXhNjzAbQ8LGPxt36RUZl5
YlxTru0jZNKx5lslR+H4i936A4pKBjgiMmSkVwXD9HcfKHTp70GQ812+J0Fvti/v
4nrrUpc011Wo4F6omt1QcYsi4GTI5OsEbeKQ24BtUd6Z1Nm/EP7PfPxeb4CP8KOH
clM8K7OwBUfWrip8Ptljjz9BNOZUF94iyjJ/BIzGJjyCntho64ehpUYP8UJykLVd
CGcu7sVYWnknf1ZGLuqqZQt4qt7cUUhFGielssZP9N9x7wzaAIFcT3yQ+ELDu1SZ
dE4lZsf2uMyfj58V8GDOLLE233+LRsRbJ083x+e2mW5BdAGtGgQBusFfnmv5Bxqd
HgS55hsna5725/44tvxll261TgQvjGrTxwe7e5Ia3d2Syc+e89mXQaI/+cZnylNP
SwCCvx8mOM847T0XkVRX3ZrwXtHIA25uKsPJzUtksDnAowB91j7RJkjXxJcz3Vh1
4k182UFOTPRW9jzdWNSyWQGl/vpe9oQ4c2Ly15+/toBo4YXJeDdDnZ5c/O+KKadc
IMPBpnPrH/0O97uMPuED+nI6ISGOTMLZo35xJ96gPBwyG5s2QxIkKPXIrhgcgUnk
tSM7QYNhlftT4/yVvYnk0YcCAwEAAQ==
-----END PUBLIC KEY-----
To validate the signature in
Sandbox workspaces
, please use the public key below:
Sandbox
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw+fZuC+0vDYTf8fYnCN6
71iHg98lPHBmafmqZqb+TUexn9sH6qNIBZ5SgYFxFK6dYXIuJ5uoORzihREvZVZP
8DphdeKOMUrMr6b+Cchb2qS8qz8WS7xtyLU9GnBn6M5mWfjkjQr1jbilH15Zvcpz
ECC8aPUAy2EbHpnr10if2IHkIAWLYD+0khpCjpWtsfuX+LxqzlqQVW9xc6z7tshK
eCSEa6Oh8+ia7Zlu0b+2xmy2Arb6xGl+s+Rnof4lsq9tZS6f03huc+XVTmd6H2We
WxFMfGyDCX2akEg2aAvx7231/6S0vBFGiX0C+3GbXlieHDplLGoODHUt5hxbPJnK
IwIDAQAB
-----END PUBLIC KEY-----
Check event objects
Each event is structured as an object with a type and data sub object that holds the transaction id, as well as other  related information. Your endpoint must check the event type and parse the payload of each event.
Example: transaction created webhook
JSON
{
    "type": "TRANSACTION_CREATED",
    "tenantId”:  ".........-.....-....-....-...........",
    "timestamp": 1679651214621,
    "data": {
        "id": "........-....-....-....-............",
        "createdAt": 1679651104380,
        "lastUpdated": 1679651104380,
        "assetId": "WETH_TEST3",
        "source": {
            "id": "0",
            "type": "VAULT_ACCOUNT",
            "name": "Main",
            "subType": ""
        },
        "destination": {
            "id": "12",
            "type": "VAULT_ACCOUNT",
            "name": "MintBurn",
            "subType": ""
        },
        "amount": 0.001,
        "sourceAddress": "",
        "destinationAddress": "",
        "destinationAddressDescription": "",
        "destinationTag": "",
        "status": "SUBMITTED",
        "txHash": "",
        "subStatus": "",
        "signedBy": [],
        "createdBy": ".........-.....-....-....-...........",
        "rejectedBy": "",
        "amountUSD": null,
        "addressType": "",
        "note": "",
        "exchangeTxId": "",
        "requestedAmount": 0.001,
        "feeCurrency": "ETH_TEST3",
        "operation": "TRANSFER",
        "customerRefId": null,
        "amountInfo": {
            "amount": "0.001",
            "requestedAmount": "0.001"
        },
        "feeInfo": {},
        "destinations": [],
        "externalTxId": null,
        "blockInfo": {},
        "signedMessages": [],
        "assetType": "ERC20"
    }
}
Example: transaction status updated webhook
JSON
{
    "type": "TRANSACTION_STATUS_UPDATED",
    "tenantId”:  ".........-.....-....-....-...........",
    "timestamp": 1679651214621,
    "data": {
        "id": "........-....-....-....-............",
        "createdAt": 1680014718734,
        "lastUpdated": 1680014729691,
        "assetId": "TRX_USDT",
        "source": {
            "id": "",
            "type": "UNKNOWN",
            "name": "External",
            "subType": ""
        },
        "destination": {
            "id": "2107",
            "type": "VAULT_ACCOUNT",
            "name": "Main",
            "subType": ""
        },
        "amount": 370,
        "networkFee": 27.2559,
        "netAmount": 370,
        "sourceAddress": "",
        "destinationAddress": "",
        "destinationAddressDescription": "",
        "destinationTag": "",
        "status": "COMPLETED",
        "txHash": "e9e1asdade125be06638c8675fdsfsdc79594dd45ff095b7683c3f03b81a9389684",
        "subStatus": "CONFIRMED",
        "signedBy": [],
        "createdBy": "",
        "rejectedBy": "",
        "amountUSD": 0,
        "addressType": "",
        "note": "",
        "exchangeTxId": "",
        "requestedAmount": 370,
        "feeCurrency": "TRX",
        "operation": "TRANSFER",
        "customerRefId": "........-....-....-....-............",
        "numOfConfirmations": 1,
        "amountInfo": {
            "amount": "370",
            "requestedAmount": "370",
            "netAmount": "370",
            "amountUSD": null
        },
        "feeInfo": {
            "networkFee": "27.2559"
        },
        "destinations": [],
        "externalTxId": null,
        "blockInfo": {
            "blockHeight": "49800684",
            "blockHash": "0000000002f7e5ece07efd8dfnjngfh76dda5f2645a9aba5e6h4534ba1bc7d97a8e2"
        },
        "signedMessages": [],
        "amlScreeningResult": {
            "screeningStatus": "BYPASSED",
            "bypassReason": "PASSED_BY_POLICY",
            "timestamp": 1680014729455
        },
        "assetType": "TRON_TRC20"
    }
}
Response
The Fireblocks server will look for a response to confirm the webhook notification was received. All webhook events should receive an HTTP-200 (OK) response.
If no response is received, Fireblocks resends 5xx errors and timeout requests several more times. The retry schedule (in seconds) is 5, 15, 35, 75, 155, 315, 635, 1275, 2555, 5115.
Code Examples
JavaScript
Python
const crypto = require("crypto");
const express = require("express");
const bodyParser = require('body-parser')

const port = 3000;

const publicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0+6wd9OJQpK60ZI7qnZG
jjQ0wNFUHfRv85Tdyek8+ahlg1Ph8uhwl4N6DZw5LwLXhNjzAbQ8LGPxt36RUZl5
YlxTru0jZNKx5lslR+H4i936A4pKBjgiMmSkVwXD9HcfKHTp70GQ812+J0Fvti/v
4nrrUpc011Wo4F6omt1QcYsi4GTI5OsEbeKQ24BtUd6Z1Nm/EP7PfPxeb4CP8KOH
clM8K7OwBUfWrip8Ptljjz9BNOZUF94iyjJ/BIzGJjyCntho64ehpUYP8UJykLVd
CGcu7sVYWnknf1ZGLuqqZQt4qt7cUUhFGielssZP9N9x7wzaAIFcT3yQ+ELDu1SZ
dE4lZsf2uMyfj58V8GDOLLE233+LRsRbJ083x+e2mW5BdAGtGgQBusFfnmv5Bxqd
HgS55hsna5725/44tvxll261TgQvjGrTxwe7e5Ia3d2Syc+e89mXQaI/+cZnylNP
SwCCvx8mOM847T0XkVRX3ZrwXtHIA25uKsPJzUtksDnAowB91j7RJkjXxJcz3Vh1
4k182UFOTPRW9jzdWNSyWQGl/vpe9oQ4c2Ly15+/toBo4YXJeDdDnZ5c/O+KKadc
IMPBpnPrH/0O97uMPuED+nI6ISGOTMLZo35xJ96gPBwyG5s2QxIkKPXIrhgcgUnk
tSM7QYNhlftT4/yVvYnk0YcCAwEAAQ==
-----END PUBLIC KEY-----`.replace(/\\n/g, "\n");

const app = express();

app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
    const message = JSON.stringify(req.body);
    const signature = req.headers["fireblocks-signature"];

    const verifier = crypto.createVerify('RSA-SHA512');
    verifier.write(message);
    verifier.end();

    const isVerified = verifier.verify(publicKey, signature, "base64");
    console.log("Verified:", isVerified);

    res.send("ok");
});

app.listen(port, () => {
    console.log(`Webhook running at http://localhost:${port}`);
});
import falcon
import json
import rsa
import base64

FIREBLOCKS_PUBLIC_KEY = """
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0+6wd9OJQpK60ZI7qnZG
jjQ0wNFUHfRv85Tdyek8+ahlg1Ph8uhwl4N6DZw5LwLXhNjzAbQ8LGPxt36RUZl5
YlxTru0jZNKx5lslR+H4i936A4pKBjgiMmSkVwXD9HcfKHTp70GQ812+J0Fvti/v
4nrrUpc011Wo4F6omt1QcYsi4GTI5OsEbeKQ24BtUd6Z1Nm/EP7PfPxeb4CP8KOH
clM8K7OwBUfWrip8Ptljjz9BNOZUF94iyjJ/BIzGJjyCntho64ehpUYP8UJykLVd
CGcu7sVYWnknf1ZGLuqqZQt4qt7cUUhFGielssZP9N9x7wzaAIFcT3yQ+ELDu1SZ
dE4lZsf2uMyfj58V8GDOLLE233+LRsRbJ083x+e2mW5BdAGtGgQBusFfnmv5Bxqd
HgS55hsna5725/44tvxll261TgQvjGrTxwe7e5Ia3d2Syc+e89mXQaI/+cZnylNP
SwCCvx8mOM847T0XkVRX3ZrwXtHIA25uKsPJzUtksDnAowB91j7RJkjXxJcz3Vh1
4k182UFOTPRW9jzdWNSyWQGl/vpe9oQ4c2Ly15+/toBo4YXJeDdDnZ5c/O+KKadc
IMPBpnPrH/0O97uMPuED+nI6ISGOTMLZo35xJ96gPBwyG5s2QxIkKPXIrhgcgUnk
tSM7QYNhlftT4/yVvYnk0YcCAwEAAQ==
-----END PUBLIC KEY-----
"""

signature_pub_key = rsa.PublicKey.load_pkcs1_openssl_pem(FIREBLOCKS_PUBLIC_KEY)

class RequestBodyMiddleware(object):
    def process_request(self, req, resp):
        req.body = req.bounded_stream.read()

class AuthMiddleware(object):
    def process_request(self, req, resp):
        signature = req.get_header('Fireblocks-Signature')

        if signature is None:
            raise falcon.HTTPUnauthorized('Signature required')

        if not self._signature_is_valid(req.body, signature):
            raise falcon.HTTPUnauthorized('Invalid signature')

    def _signature_is_valid(self,  body, signature):
        try:
            hashing_alg = rsa.verify(body, base64.b64decode(signature), signature_pub_key)
            return hashing_alg == "SHA-512"
        except rsa.pkcs1.VerificationError:
            return False

class DummyRequest(object):
    def on_post(self, req, resp):
        obj = json.loads(req.body.decode("utf-8"))
        print(obj)
        resp.status = falcon.HTTP_201


# Create falcon app
app = falcon.API(
    middleware=[
        RequestBodyMiddleware(),
        AuthMiddleware()
    ]
)

app.add_route('/webhook', DummyRequest())


if __name__ == '__main__':
    from wsgiref import simple_server  # NOQA
    httpd = simple_server.make_server('127.0.0.1', 8000, app)
    httpd.serve_forever()
🚧
Warning - Reference only
These examples are
not production-ready
and are used only for reference.
Please follow our security guidelines for secure API interaction.
Resending Notifications
Resend all failed webhook notifications
The following command re-sends
all
the failed webhooks pending the backoff retry mechanism being re-sent.
Python
JavaScript
result = fireblocks.resend_webhooks()
const result = await fireblocks.resendWebhooks();
The above command returns
webhookCount
which is the number of re-sent webhook notifications.
Resend missed notifications for a specific transaction
Use the following command to re-send a missing webhook notification per specific transaction:
Python
JavaScript
result = fireblocks.resend_transaction_webhooks_by_id(txId, resend_created, resend_status_updated)
const result = await fireblocks.resendTransactionWebhooksById(txId, resendCreated, resendStatusUpdated);
Returns 200 on success
Updated
20 days ago
Introduction
Table of Contents
Overview
Configuring Webhook URLs
Receiving Webhook Notifications
Resending Notifications
Resend all failed webhook notifications
Resend missed notifications for a specific transaction

---

