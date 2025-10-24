# Unmatched Sections

This document contains 21 sections that couldn't be categorized.

## Webhooks Notifications?__Hstc=215458440.B4Ed1436A462Ca1Ef892C4215A414852.1681749190916.1695401325841.1695411767645.460&__Hssc=215458440.9.1695411767645&__Hsfp=1728074016

*Source: https://developers.fireblocks.com/docs/webhooks-notifications?__hstc=215458440.b4ed1436a462ca1ef892c4215a414852.1681749190916.1695401325841.1695411767645.460&__hssc=215458440.9.1695411767645&__hsfp=1728074016*

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

## Docs

*Source: https://developers.fireblocks.com/docs*

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

## Create Direct Custody Wallets#Types Of Vault Structures

*Source: https://developers.fireblocks.com/docs/create-direct-custody-wallets#types-of-vault-structures*

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

## Object Model

*Source: https://developers.fireblocks.com/docs/object-model*

Fireblocks Object Model
The Fireblocks platform can be viewed as consisting of the following components:
Fireblocks Workspace
Each unique instance of Fireblocks is called a
workspace
.
Vault accounts
A
Vault account
is an easy way to separate and maintain security boundaries across assets.
Vault accounts store your asset wallets on the Fireblocks platform. Any user with the appropriate permissions can create a vault account since that is not a workspace action that requires approval.
The
Vault structure
for your application you're building on top of Fireblocks can either be 'Segregated' or 'Omnibus'.
Segregated
With this vault structure, each user of your application is assigned individual vault accounts.
For example, you may have vault accounts labeled as
User #1, User #2, User #3, etc...
each of which maps to a user of the application you are building on top of Fireblocks.
Omnibus
With this vault structure, all users of your application are assigned one, or several, centralized vault accounts.
For example, you may have a single vault account labeled as
Omnibus
, where all of your user's funds and assets are swept for a single withdrawal.
Vault wallets
Vault wallets are used to manage internal deposit addresses. Each vault wallet contains at least one deposit address for its asset type.
Each vault account can hold any number of assets supported by Fireblocks, including multiple deposit addresses for blockchains that support it, such as UTXO-based chains like BTC. Depending on the asset type, different wallets may support multiple address types or formats. Each vault wallet is assigned to a single digital asset supported by Fireblocks.
Your workspace contains multiple assets from different blockchains. You can use one of the existing assets or add a new asset to your workspace and use it as an vault wallet.
Learn how to create vault accounts and vault wallets using the Fireblocks API.
Exchange accounts
To transfer funds securely to/from exchanges, you'll need to integrate an
exchange account
by adding your API credentials for those exchanges.
Fiat accounts
To transfer fiat through one of our integrated fiat providers, you need to explicitly add your fiat provider's API credentials within your desired workspace
fiat account
.
Whitelisted/Unmanaged wallets
📘
Note:
The terms "
whitelisted wallets
" and "
unmanaged wallets
" are used interchangeably to describe wallets that are external and not under Fireblocks' management. In certain areas of the system, such as the API and Webhooks, these wallets are referred to as unmanaged wallets.
Whitelisted or unmanaged wallets are an additional security measure for interacting with various blockchain addresses. They can be named how you prefer and marked as either 'internal', 'external', or 'contract'.
Internal wallet
- a deposit address existing inside your organization.
External wallet
- a deposit address existing outside your organization.
Contract wallet
- a deposit address of an on-chain smart contract.
📘
Note:
This only applies to smart contracts on EVM-compatible blockchains.
Updated
20 days ago
Fireblocks Key Features & Capabilities
Workspace Comparison
Table of Contents
Fireblocks Workspace
Vault accounts
Segregated
Omnibus
Vault wallets
Exchange accounts
Fiat accounts
Whitelisted/Unmanaged wallets

---

## Capabilities#Transaction Authorization Policy Tap

*Source: https://developers.fireblocks.com/docs/capabilities#transaction-authorization-policy-tap*

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

## Typed Message Signing 1#What Are The Use Cases For Typed Message Signing

*Source: https://developers.fireblocks.com/docs/typed-message-signing-1#what-are-the-use-cases-for-typed-message-signing*

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

## Gas Station Setup#Gas Station Parameters

*Source: https://developers.fireblocks.com/docs/gas-station-setup#gas-station-parameters*

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

## 

*Source: https://developers.fireblocks.com/docs/mandatory-fields-for-bitstamp-deposits#/*

Mandatory fields for Bitstamp deposits
Originator: Myself (Individual)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "FirstParty",
        "entityType": "Individual",
        "names": [
          {
            "primaryName": "John",
            "nameType": "Latin",
            "secondaryName": "Doe"
          }
        ],
        "dateOfBirth": "2000-01-01",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        }
      },
      "originatingVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Originator: Myself (Corporate)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "FirstParty",
        "entityType": "Business",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "company": {
          "name": "ACME Inc"
        }
      },
      "originatingVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Originator: Third party (Individual)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "ThirdParty",
        "entityType": "Individual",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "names": [
          {
            "primaryName": "John",
            "nameType": "Latin",
            "secondaryName": "Doe"
          }
        ],
        "dateOfBirth": "2000-01-01"
      },
      "originatingVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Originator: Third party (Corporate)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "ThirdParty",
        "entityType": "Business",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "company": {
          "name": "ACME Inc"
        }
      },
      "originatingVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Updated
7 days ago
Mandatory fields for Bitstamp withdrawals
Connect to the Fireblocks Network
Table of Contents
Originator: Myself (Individual)
Originator: Myself (Corporate)
Originator: Third party (Individual)
Originator: Third party (Corporate)

---

## Boost Transactions 1#Rbf And Cpfp In Fireblocks

*Source: https://developers.fireblocks.com/docs/boost-transactions-1#rbf-and-cpfp-in-fireblocks*

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

## Sweep To Omnibus#Internal Ledger For Tracking The Balance Of End Users

*Source: https://developers.fireblocks.com/docs/sweep-to-omnibus#internal-ledger-for-tracking-the-balance-of-end-users*

Sweep to Omnibus
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Overview
For customers covering different market segments, the Fireblocks platform can support several different use cases by offering two options for your main
vault structure
:
Segregated
account
vault structure and
omnibus account
vault structure.
📘
Important:
Detailed information about each of these vault structures and how each can be implemented per use case. It's important to understand the differences.
Intermediate vault accounts
: This is the
vault account
assigned to an end client. Because you could have numerous end clients, you can use the Fireblocks API to automatically generate as many intermediate vault accounts as needed.
Omnibus deposits
: This is the central vault omnibus account where end-client funds are swept and stored.
Withdrawal pool
: This is the vault account containing funds allocated for end-client withdrawal requests. More than one withdrawal pool vault account is required due to blockchain limitations.
Learn more about best practices for structuring your Fireblocks Vault.
Sweeping
The sweeping operation moves the funds from the intermediate vault accounts, assigned to your end-users for their deposits, into your
omnibus account
.
As an on-chain transfer of funds, sweeping requires you to pay fees from a source vault account. Set the triggering factor for when sweeping logic is applied based on business needs.
For example, this can be:
Based on the capacity of the funds accumulated inside the Intermediate vault account
Periodically based on a set time frame (daily, weekly)
Based on the network fees - These fluctuate during different times of the day.
📘
Reconciliation, crediting, and confirmation control
To learn more about additional parameters that affect sweeping, see below.
Reconciliation & crediting
- You can create an automated mechanism that notifies your organization or clients about incoming transactions via webhook notifications or by using the Fireblocks API.
Deposit control & Control policy
- The Deposit Control & Confirmation Policy lets you specify how many network confirmations are required for an incoming transaction to clear so its funds can be credited to a wallet.
Fueling
Sweeping will move the funds into your omnibus account from vault accounts existing on intermediate vault accounts that are assigned to your end-users for their deposits.
When sweeping non-base assets from intermediate vault accounts, such as ERC-20 tokens, the transaction fee should be paid in the base asset.
👍
Example
USDC transfer fees on Ethereum are paid in ETH. Therefore, these accounts must be fueled with ETH (or "gas") to fund the transaction fees that are required for sweeping.
Fireblocks provides an automated fueling service known as the
Gas Station
to save you the trouble of managing this manually. You can learn more about it in the
Gas station setup and usage
guide.
Example
Step 1: Create the vault accounts in batch
This guide assumes you use a backed “internal ledger” system that will correlate the internal customer ref ID with your new Fireblocks vault account ID.
See a basic example of an internal ledger mechanism description.
Using the following code example:
Create the vault accounts for your end-users using your chosen naming convention to identify the vault accounts for your user deposits.
Create your ETH deposit address under the vault accounts.
Create your omnibus vault account used as the treasury account.
The example demonstrates calling either the
createVaultAccounts
or
create_vault_accounts
function that is passed with the
amount
parameter value as the number of vault accounts you wish to create for your sweeping batch, the underlying vault accounts, the name used to describe the batch, and the treasury omnibus account that will be used for the sweeping process.
In the example below, 3 vault accounts are created
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
            }
            vaultWallet = await fireblocks.createVaultAsset(Number(vault.vaultID), assetId);
            console.log("Created vault account", vault.vaultName,":", "with wallet address:", vaultWallet.address);
    };
 }
 createVaultAccounts(2, "ETH","END-USER-#","treasuryVaultName");
ASSET = "ETH_TEST"
def create_vault_accounts(amount: int) -> dict:
   """
   :param amount: Amount of vault accounts to create (one, per end user).
   :return: A dictionary where keys are the vault names and IDs are the co-responding values.
   """
   vault_dict = {}
   counter = 1

   while counter <= amount:
       vault_name = f"End-User {counter} Vault"
       vault_id = fireblocks.create_vault_account(name=vault_name, hiddenOnUI=True)['id']
       fireblocks.create_vault_asset(vault_id, ASSET)
       vault_dict[vault_name] = vault_id
       counter += 1
   else:
       vault_name = "Treasury"
       vault_id = SDK.create_vault_account(name=vault_name)['id']
       fireblocks.create_vault_asset(vault_id, ASSET)
       vault_dict[vault_name] = vault_id

   return vault_dict
Step 2: Create the sweeping logic
This guide assumes that your "internal ledger" can produce a list of vault accounts that are relevant for treasury sweeping. For a basic "internal ledger" mechanism description, review the section at the bottom of this article.
You will define which vault accounts will be swept to your omnibus account. The next example shows the sweeping of any account that has at least 1 ETH to the relevant treasury account.
Define the intermediate vault accounts that you wish to sweep their funds from.
Initiate the Create Transaction loop.
Testing
Add this code block to the code you built using any of the language-specific guides under the
Developing with Fireblocks
section.
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

const sweepToOmnibus = async (
  vaNamePrefix: string,
  minAmount: number,
  assetId: string,
  omnibusVaId: string,
): Promise<
  Array<{
    fromVaName: string;
    fromVaId: string;
    txId: string;
    grossAmount: string;
  }>
> => {
  let sweepingInfo: any[] = [];

  const vaultsToSweepFrom = await fireblocks.vaults.getPagedVaultAccounts({
    namePrefix: vaNamePrefix,
    assetId,
    minAmountThreshold: minAmount,
  });

  if (vaultsToSweepFrom.data.accounts) {
    await Promise.all(
      vaultsToSweepFrom.data.accounts.map(
        async (vaultAccount: VaultAccount) => {
          if (vaultAccount.assets && vaultAccount.assets.length > 0) {
            const createTxResponse =
              await fireblocks.transactions.createTransaction({
                transactionRequest: {
                  assetId,
                  source: {
                    type: TransferPeerPathType.VaultAccount,
                    id: vaultAccount.id,
                  },
                  destination: {
                    type: TransferPeerPathType.VaultAccount,
                    id: omnibusVaId,
                  },
                  amount: vaultAccount.assets[0].available,
                },
              });

            sweepingInfo.push({
              fromVaName: vaultAccount.name,
              fromVaId: vaultAccount.id,
              txId: createTxResponse.data.id,
              grossAmount: vaultAccount.assets[0].available,
            });
          }
        },
      ),
    );
  }

  console.log(
    "Initiated sweeping transactions:\n" +
      JSON.stringify(sweepingInfo, null, 2),
  );
  return sweepingInfo;
};

sweepToOmnibus("END-USER-#", 0.1, "ETH_TEST5", "0");
async function sweep(vaultAccountNamePrefixtoSweep, sweepAmount, assetId, treasuryVaultAccountId){
    vaultListToSweep = await fireblocks.getVaultAccountsWithPageInfo({namePrefix: vaultAccountNamePrefixtoSweep, assetId: assetId, minAmountThreshold:sweepAmount});
    for (let i = 0; i < Object.keys(vaultListToSweep.accounts).length; i++) {
        await fireblocks.createTransaction({
            "assetId" : assetId,
            "source" : {
                "type" : PeerType.VAULT_ACCOUNT,
                "id" : vaultListToSweep.accounts[i].id
            },
            "destination" : {
                "type" : PeerType.VAULT_ACCOUNT,
                "id" : String(treasuryVaultAccountId)
            },
            "amount" : vaultListToSweep.accounts[i].assets[0].total,
        })
    };
    vaultListToSweep.accounts.forEach(element => {
        console.log("Swept", "Vault id:", element.id,", Vault name:", element.name);
    })
 }
sweep("END-USER-#",1,"ETH","0");
ASSET = "ETH_TEST"
def sweep_accounts(treasury_vault_id: str) -> dict:
   """
   :param treasury_vault_id: The vault that will receive all the funds.
   :return: A dictionary of accounts swept with the values being the amount transferred.
   """
   vault_dict = {}
   vault_accounts = fireblocks.get_vault_accounts(name_prefix="End-User")
   for vault in vault_accounts['accounts']:
       for asset in vault['assets']:
           if asset['id'] == ASSET and int(asset['amount']) >= 1:
               fireblocks.create_transaction(
                   asset_id=ASSET,	
                   amount=asset['amount'],
                   source=TransferPeerPath(
                       peer_type=VAULT_ACCOUNT,
                       peer_id=vault['id']
                   ),
                   destination=DestinationTransferPeerPath(
                       peer_type=VAULT_ACCOUNT,
                       peer_id=treasury_vault_id
                   )
               )
               vault_dict[vault['name']] = asset['amount']
              
   return vault_accounts
Internal ledger for tracking the balance of end users
To track customer funds when utilizing the omnibus structure, Fireblocks customers typically maintain an "internal ledger". You can maintain an internal ledger using a 3rd party software vendor.
A reasonable basic logic for internal ledger management would be:
Check assets balance periodically and then populate the values to update the database file.
Update the balance upon every deposit and withdrawal.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Sweeping
Fueling
Example
Internal ledger for tracking the balance of end users

---

## 

*Source: https://developers.fireblocks.com/docs/mandatory-fields-for-bitstamp-withdrawals#/*

Mandatory fields for Bitstamp withdrawals
Sending to myself (Individual)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "beneficiary": {
        "participantRelationshipType": "FirstParty",
        "entityType": "Individual",
        "names": [
          {
            "primaryName": "John",
            "nameType": "Latin",
            "secondaryName": "Doe"
          }
        ],
        "dateOfBirth": "2000-01-01",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        }
      },
      "beneficiaryVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Sending to myself (Corporate)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "beneficiary": {
        "participantRelationshipType": "FirstParty",
        "entityType": "Business",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "company": {
          "name": "ACME Inc"
        }
      },
      "beneficiaryVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Sending to another beneficiary (Individual)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "beneficiary": {
        "participantRelationshipType": "ThirdParty",
        "entityType": "Individual",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "names": [
          {
            "primaryName": "John",
            "nameType": "Latin",
            "secondaryName": "Doe"
          }
        ],
        "dateOfBirth": "2000-01-01"
      },
      "beneficiaryVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Sending to another beneficiary (Corporate)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "beneficiary": {
        "participantRelationshipType": "ThirdParty",
        "entityType": "Business",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "1",
          "city": "Boston",
          "postalCode": "02001",
          "country": "US"
        },
        "company": {
          "name": "ACME Inc"
        }
      },
      "beneficiaryVASP": {
        "vaspCode": "914a9dae-4234-45d1-be83-fd40e818e381"
      }
    }
  }
}
Updated
7 days ago
Mandatory properties for Binance deposits
Mandatory fields for Bitstamp deposits
Table of Contents
Sending to myself (Individual)
Sending to myself (Corporate)
Sending to another beneficiary (Individual)
Sending to another beneficiary (Corporate)

---

## Creating A Transaction#Optional Parameters

*Source: https://developers.fireblocks.com/docs/creating-a-transaction#optional-parameters*

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

## Error Handling#400   Bad Request

*Source: https://developers.fireblocks.com/docs/error-handling#400---bad-request*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Whitelist Addresses#Work With One Time Addresses

*Source: https://developers.fireblocks.com/docs/whitelist-addresses#work-with-one-time-addresses*

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

## Error Handling#403   Forbidden

*Source: https://developers.fireblocks.com/docs/error-handling#403---forbidden*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Error Handling#4Xx Status Codes

*Source: https://developers.fireblocks.com/docs/error-handling#4xx-status-codes*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Error Handling#404   Not Found

*Source: https://developers.fireblocks.com/docs/error-handling#404---not-found*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Error Handling#Non Http Errors

*Source: https://developers.fireblocks.com/docs/error-handling#non-http-errors*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Quickstart#Creating An Api User

*Source: https://developers.fireblocks.com/docs/quickstart#creating-an-api-user*

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

## Error Handling#500 Status Code

*Source: https://developers.fireblocks.com/docs/error-handling#500-status-code*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

## Error Handling#401   Unauthorized

*Source: https://developers.fireblocks.com/docs/error-handling#401---unauthorized*

Error Handling
Overview
Understanding errors and how to handle them is critical to user experience and business operations when working with
any
third-party API.
Some errors might include:
A timeout as the third-party service is experiencing issues or is down.
An improperly formatted request due to user error or a non-fatal software bug.
A runtime error due to a system state or an "unexpected" error.
These types of errors are important to handle when working with third-party APIs and handling individual errors will depend on the nature of each API call.
Error types
In this section, we will dive into how to handle API errors when using Fireblocks API in terms of best practices and common pitfalls.
As the Fireblocks API uses HTTP requests to send the calls, we will look into three main error types:
Non-HTTP errors
4xx status codes
500 status code
👍
How to handle unspecified errors
While we do our best to cover all the errors that are possible, and are constantly improving error reporting, you might encounter an error you did not read about in this guide, or the approach and best practices do not suffice.
We recommend making sure to read the message that accompanies every Fireblocks API error as these are usually descriptive and can help pinpoint the issue.
Non-HTTP errors
Non-HTTP errors are a broad error type that relates to anything that is not specifically a response back from the Fireblocks API. As a result, this error type may contain many individual errors that can typically be resolved with the relevant third-party documentation.
Examples of such errors include:
Errors that prevent the execution of
.js
or
.py
(or any other extension) files such as
command not found
, or
No such file or directory
Errors relating to internal formatting of a file (missing indent, missing bracket,
==
instead of
===
)
Errors relating to system state, such as lack of memory, or network connectivity issues
As described in our API guides, signing a
JWT
(JSON Web Token) is a critical part of API usage as the means of authenticating your message and validating your identity. (This assumes the private key used to sign your API request is securely stored and not available to anyone else).
You may be unable to sign the JWT token if you are experiencing issues with your private key. These issues are classified as "
private key corruption
". While uncommon, it can be a serious issue when trying to sign API requests.
Private key corruption
Observe the following error message:
(If you are unfamiliar with this error, a Google search will yield many results pointing to authentication problems.)
Execution Output - JavaScript
Execution Output - Python
Error:  Error: error:1E08010C:DECODER routines::unsupported
    at Sign.sign (/myproject/lib/internal/crypto/sig.js:131:29)
    at Object.sign /myproject/node_modules/jwa/index.js:152:45)
    at Object.jwsSign [as sign] (/myproject/node_modules/jws/lib/sign-stream.js:32:24)
    at module.exports [as sign] (/myproject/node_modules/jsonwebtoken/sign.js:204:16)
    at ApiTokenProvider.signJwt (/myproject/fireblocks-sdk-js/src/api-token-provider.ts:11:28)
    at ApiClient.<anonymous> (/myproject/fireblocks-sdk-js/src/api-client.ts:15:41)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/api-client.js:8:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/api-client.js:4:12)
    at ApiClient.issueGetRequest (/myproject/fireblocks-sdk-js/dist/api-client.js:27:16)
    at FireblocksSDK.<anonymous> (/myproject/fireblocks-sdk-js/src/fireblocks-sdk.ts:537:37)
    at Generator.next (<anonymous>)
    at /myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:18:71
    at new Promise (<anonymous>)
    at __awaiter (/myproject/fireblocks-sdk-js/dist/fireblocks-sdk.js:14:12)
Traceback (most recent call last):
  File "/myproject/venv/lib/python3.10/site-packages/jwt/algorithms.py", line 257, in prepare_key
    key = load_pem_private_key(key, password=None)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/primitives/serialization/base.py", line 22, in load_pem_private_key
    return ossl.load_pem_private_key(data, password)
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 900, in load_pem_private_key
    return self._load_key(
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1168, in _load_key
    self._handle_key_loading_error()
  File "/myproject/venv/lib/python3.10/site-packages/cryptography/hazmat/backends/openssl/backend.py", line 1227, in _handle_key_loading_error
    raise ValueError(
ValueError: ('Could not deserialize key data. The data may be in an incorrect format, it may be encrypted with an unsupported algorithm, or it may be an unsupported key type (e.g. EC curves with explicit parameters).', [_OpenSSLErrorWithText(code=503841036, lib=60, reason=524556, reason_text=b'error:1E08010C:DECODER routines::unsupported')])
The issue within this error is a "corruption" of the private key. "Corruption" can also mean human error such as submitting an incorrect file that is not a private key. Follow the instructions below to resolve this error.
Verify that the file being used is indeed a private key.
A private key typically looks like this:
Example key file format
-----BEGIN PRIVATE KEY-----
           ...
-----END PRIVATE KEY-----
Verify that the private key is intact.
Generate something out of the private key using OpenSSL.
This command will attempt to convert the private key into its corresponding public key:
openssl rsa -in <api-private-key>.key -pubout
A valid response will look something like this:
-----BEGIN PUBLIC KEY-----
            ...
-----END PUBLIC KEY-----
4xx status codes
4xx status codes are codes that are returned as part of an HTTP request to indicate a problem on the client's side - in the context of this article, it means that there is an issue with the request that you have sent.
We will look into 3 specific status codes and how to handle each of them:
400 - Bad request
Indicates that the API request itself is incorrect and contains invalid or incorrect values
401 - Unauthorized
- Indicates that the API request is sent with invalid authentication information (for example, bad JWT)
403 - Forbidden
- Indicates that the API request is trying to perform something that the user is not allowed to do
404 - Not found
- Indicates that the API request is trying to query a page that does not exist
In addition to the three codes, we would also like to remind you that there is the status code
429 Too many requests
, which is caused by breaking the rate limits. More information can be found in the
Working with Rate Limits
article.
🚧
Example code
The example code is written to illustrate how to approach the described scenario. It might contain functions or types which are not explicitly written out, but we add a short description of what they do after the code sample.
No such type or function is written in the SDK and they merely are used to illustrate some logical container for an operation.
🚧
Assumptions for examples
Throughout each Error Handling section the following assumptions apply:
The user input
may not
be valid, through function call or direct integration.
The network connection is functioning as expected.
The system has sufficient resources (memory and disk space).
This is important for security and stability, as it shows how to ensure your information is valid before submitting the request and how to double-check or sanitize the user input.
Typical validations are provided at the bottom of the article.
400 - Bad request
As mentioned above, 400 response codes indicate that the request you sent contains incorrect information or is invalid.
400 example - Bad request
Your internal database links users per asset public keys with their internal database reference (for example, their user ID).
To do this, upon registration or upon some update, your code calls the following
getPublicKey
\
get_public_key
function with the asset
supplied by the user
:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKey = await fbks.getPublicKeyInfoForVaultAccount({
    vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
    assetId:asset,
    compressed:true,
    addressIndex:"0",
    change:"0"
  });
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123";

def get_public_key(fbks, asset):
  """
  fbks - FireblocksSDK instance
  asset - the asset id
  """
  pub_key = fbks.get_public_key_info_for_vault_account(
    vault_account_id=DEFAULT_VAULT_ACCOUNT_ID, 
    asset_id=asset, 
    compressed=False, 
    change="0", 
    address_index="0"
  )
  # ... Some extra work on the public key ...
The user mistakenly put an invalid asset (for example
BTC1
instead of
BTC
). Your code will receive the following error:
JavaScript
Python
Error: Request failed with status code 400
    at createError (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/createError.js:16:15)
    at settle (/myproject/fireblocks-sdk-js/node_modules/axios/lib/core/settle.js:17:12)
    at IncomingMessage.handleStreamEnd (/myproject/fireblocks-sdk-js/node_modules/axios/lib/adapters/http.js:293:11)
    at IncomingMessage.emit (node:events:525:35)
    at endReadableNT (node:internal/streams/readable:1359:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)
Traceback (most recent call last):
  File "/myproject/main.py", line 10, in <module>
    get_public_key(fbksSdk, "jngjewqn")
  File "/myproject/main.py", line 8, in get_public_key
    fbks.get_public_key_info_for_vault_account(vault_account_id="2", asset_id=asset, compressed=False, change="0", address_index="0")
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1066, in get_public_key_info_for_vault_account
    return self._get_request(url)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 1334, in _get_request
    return handle_response(response, page_mode)
  File "/myproject/venv/lib/python3.10/site-packages/fireblocks_sdk/sdk.py", line 22, in handle_response
    raise FireblocksApiException("Got an error from fireblocks server: " + response.text, error_code)
fireblocks_sdk.api_types.FireblocksApiException: 
  Got an error from fireblocks server: {
    "message":"The asset 'rando' is not supported by Fireblocks, please check the supported assets endpoint.",
    "code":1503
  }
For cases where you receive a 400 HTTP status code error, try using a
try{}catch{}
\
try:...except...
block. This can be used to handle the error in the proper way, like notifying the user or adjusting the input parameters before attempting the call again.
The following is an example of how these types of 400-based errors can be handled for the specific scenario we described:
JavaScript
Python
const DEFAULT_VAULT_ACCOUNT_ID = "123";
/**
fbksSdk - an instance of FireblocksSDK
asset - the asset id
*/
async function getPublicKey(fbksSdk, asset){
  let pubKeyResponse = undefined;
  try{
    pubKeyResponse = await fbks.getPublicKeyInfoForVaultAccount({
      vaultAccountId: DEFAULT_VAULT_ACCOUNT_ID,
      assetId:asset,
      compressed:true,
      addressIndex:"0",
      change:"0"
    });
  } catch (e) {
    let response = e.response;
    if(response.status < 400 || response.status >= 500){
      	// Non request based error
      	// We assume that execution of this function will be halted after this block is done
    }
    
    let respData = response.data;
    if(respData.code === 1503){ // This is discussed later on in the article
      	return new Error("The asset you specified is invalid, please verify that you're sending the correct asset.");
    }
    
    // Other handling
  }
  //... Some extra work on the public key ...
}
DEFAULT_VAULT_ACCOUNT_ID = "123"
# fbksSdk - an instance of FireblocksSDK
# asset - the asset id
def get_public_key(fbks_sdk, asset):
    pub_key = None
    try:
        pub_key = fbks_sdk.get_public_key_info_for_vault_account(
            vault_account_id=DEFAULT_VAULT_ACCOUNT_ID,
            asset_id=asset,
            compressed=True,
            address_index=0,
            change=0
        )
    except FireblocksApiException as e:
        if e.error_code == 1503:
            raise Exception("The asset you specified is invalid, please verify that you're sending the correct asset.")
        
        # Other handling
    
    # ... Some extra work on the public key ...
In both code samples, start by verifying that you received a 4xx response code (for 5xx refer to the information below). Then, you'll get the call response data and reference the parameter called
code
which represents the error code returned for the request. Each error code indicates a different issue with the request.
Refer to our API Responses page to learn more.
* Fireblocks Python SDK does this seamlessly for 4xx and 5xx errors, therefore handling should only consider the error code or message
Handling a 400 error
When a 400 response is returned from the Fireblocks API, you will receive the following message:
Error response data
{
  error_code: number (optional)
  message: string
}
This message will provide a description to inform you of any potential issues.
A best practice for error handling that you can see below is setting up a proper error handling flow for sensitive error code responses. This is done by first outlining the following:
Identify the features/components you're using - Are you performing wallet-specific operations (whitelisting, creating a new wallet, adding a deposit address to a wallet, etc.)?
Identify the user / system-provided inputs - What is constant? What is received as part of the system state (a database query, a read from a file, etc.)? What is received from user input?
Identify the potential errors from the
API Responses page
.
After you've identified the points above, prepare your error handling respective to the API calls to best fit your needs (inform the user, run some runtime fix of the system state, etc.).
Implementing 400 error handling
📘
Integrating into your code
The code sample, as well as the general flow, is customizable to fit your code, business logic, or existing implementation.
The best practice is to change the code (shown below) to match your code language preference, as well as your business-specific practices, regulations and systems.
Errors should also receive the same treatment, with the errors written in this section as an example, and should be changed to work with your flow.
The most important part to take away from this section is to identify the components you'll be using and what potential errors might occur based on what input you'll receive.
For example, you're working on a system that receives a request from a user to perform a withdrawal of some amount of a given asset from their Fireblocks asset wallet address.
Refresh the balance of the specific asset they'd want to withdraw from the vault account we assigned to this user - using the
refresh asset balance data
operation.
Create a transaction to send the asset from their vault account to the target address - using the
create transaction
operation.
The refresh balance operation uses a vault account (
vaultAccountId
) and an asset (
assetId
), while the create transaction has very many potential parameters. This means that the errors returned from these parameters You can narrow down the cause of the error by going through each operation requirement to perform for your desired end result.
The
refresh asset balance data
operation requires a valid vault account Id and a valid asset.
The
create transaction
operation requires:
A valid asset (can be assumed valid after operation #1 takes place)
A valid amount of said asset (which does not exceed what they have in the wallet)
A valid target address
Referencing the
API Responses page
shows that given the operation requirements you should expect to see these error codes:
1503
- invalid asset
11001
- invalid vault account id
You might be asking yourself - what about the amount and the target address? While incorrect in the scope of the example, these values could theoretically be anything (within their given domains, amount as a positive integer, and address as a string of some length).
🚧
Monitoring transaction status
The failures caused by amount and destination address values are not covered in this guide.
Please refer to Monitoring transaction status for more information about these specific errors.
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function withdrawal(userId, asset, amount, to){ 
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    if(!validateToAddress(to, asset)){
          return new Error("The address provided does not match conventions for the asset specificed.");
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    let assetBalance = undefined;
    try{
        assetBalance = parseFloat((await fbks.refreshVaultAssetBalance(userVaultAccountId, asset)).available);
    } catch (e) {
        fbksError(e);
    }

    // At this point you might want to do additional checks against different information
    // in your system, depending on what your needs are.

    let txArgs = {
        source: {
            type: PeerType.VAULT_ACCOUNT,
            id: userVaultAccountId
        },
        destination: {
            type: PeerType.ONE_TIME_ADDRESS,
            oneTimeAddress: {
                address: to
            }
        },
        operation: TransactionOperation.TRANSFER,
        amount: amount,
        assetId: asset
    };


    try{
        let {txId: id} = (await fbks.createTransaction(txArgs));
        // Continue monitoring the transaction
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1503:
            throw new Error("The asset specified is invalid");
        case 11001:
            // In this scenario, since the vault account Id is stored in a local database, we might want to
            // show a different error or potentially raise an alert, depending on your needs.
            throw new Error("The vault account Id used is invalid");
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def withdrawal(user_id, asset, amount, to):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    if not validate_address(to, asset):
        raise Exception("The address provided does not match conventions for the asset specificed.")

    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    asset_balance = None
    try:
        asset_balance = fbks.refresh_vault_asset_balance(user_vault_account_id, asset)
    except FireblocksApiException as e:
        fbks_error_handler(e)

    try:
        fbks.create_transaction(
            tx_type=fireblocks_sdk.TRANSACTION_TRANSFER,
            amount=amount,
            source=TransferPeerPath(fireblocks_sdk.VAULT_ACCOUNT, user_vault_account_id),
            destination=DestinationTransferPeerPath(fireblocks_sdk.ONE_TIME_ADDRESS, one_time_address=to)
        )
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1503:
        raise Exception("The asset specified is invalid")
    elif e.error_code == 11001:
        # In this scenario, since the vault account Id is stored in a local database, we might want to
        # show a different error or potentially raise an alert, depending on your needs.
        raise Exception("The vault account Id used is invalid")
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the above code (almost identical for Python);
Lines 4-6
: Performs checks on the user. (This depends on your business logic.)
Lines 7-9
: Performs validation of the
to
address. Using the asset, you'll see the format of the address to expect. You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Example: BTC SegWit will start with
bc1
, and EVM-based chains will be a 40-character hex (with
0x
prefix and checksummed). You'll have to define this more thoroughly, however, there are libraries that already provide this functionality.
Line 11
: Get the vault account id for the user. Similar to #1 it depends on your business logic and specific setup.
Lines 13-17
: Refresh the balance of the provided information (asset and vault account ID), using the try and catch you catch any exceptions, and send them to the generic API handler (this is also specific to your implementation, the way it's described here might not be the correct way to handle it in your code). If there was an error, with one of the expected, we return some descriptive error message which can be changed to explain to the user what to do.
Lines 22-36
: Build the withdrawal transaction.
Lines 39-43
: Send the transaction. Refer to our generic handler for any error generated from creating the transaction.
❗️
Fixing live error code
11001
The only part of the above code above that does not apply to live error handling error code
11001
, which specifies an invalid vault account.  In this example is derived from a mock database. In live scenarios you will need to decide how to fix this yourself.
401 - Unauthorized
This error, though not common, basically occurs when a request that was sent contains either a missing, invalid, or otherwise incorrect JWT, and therefore the transaction fails.
Different codes indicate different reasons for the error caused in the JWT. Unless there is a  widespread issue with the SDKs themselves, 401 error response codes will only result from:
Signing with a different user's private key (e.g. signing with another API user's key instead of yours)
Signing with the correct private key, but the incorrect User ID.
Both scenarios are not directly code related, and will most likely occur during the development stages of integration or executions of impromptu scripts such as staking. As a result, we cannot provide code samples to address this.
Refer to the API Responses page to review codes related to 401 errors for JWT.
When encountered, simply validate the API User key and API User secret path (make sure it contains the correct private key). A JWT error code might indicate a critical issue on the production server which you should address immediately. If you encounter such an error during production, do the same on the server that the code is running on.
The only other cause of this error is when you do not use the official, unedited Fireblocks SDK (or one of the specific supported side branches). In this instance, modifications to the source code of the Fireblocks SDK caused the error.
To address this, you'll need to check code modification and check if a change was made that would yield such an error. Keep in mind, however, that there is no beneficial need to perform changes to the Fireblocks SDK. Therefore, we will not discuss any further details on this matter.
403 - Forbidden
For specific API calls, such as
get audit logs
or
list users
, you might receive HTTP status code 403.  This is uncommon since the API currently does not include user changes capabilities and only a small number of operations that can trigger 403.
If you see that you might run into the error, test the code prior to moving it to production. This can make certain that your API user has the sufficient permissions needed.
Refer to the API Responses page to review specific 403 errors.
404 - Not Found
A very common error code, "404 not found". This indicates that the page you were looking for, does not exist. Simply, this error message type states that whatever query you performed, whatever information you wanted to get - does not exist.
How to address such an issue:
Identify what's missing - These errors usually happen with GET requests, more than with other HTTP methods, and those GET requests are usually no more than 3 different arguments (with some exceptions), to help you pinpoint which one is "incorrect".
Address the missing data by either regenerating it using a new Fireblocks API call or raising an exception/error to notify upstream whoever sent this data.
Let's take a look at an example:
We provide some code that is invoked by a different component of the system. This code will query a vault account for the number of different assets this wallet contains. If there are more than 10 different assets,
true
, otherwise, this value is
false
.
Using the
Find a vault account by ID
API reference, you know this specific call uses the vault feature, therefore you can quickly identify the likely one:
1004
- No vault account by that Id
You can assume this since the response of the API call provides all the data you need, while only needing a single argument - the vault account Id. So, you can identify that this is the most suitable error code.
The code:
JavaScript
Python
// Fireblocks SDK initialized beforehand and is defined as the parameter - fbks 
// There exists some variable which allows us to query a database for information, defined as - dbSvc
async function sufficientAssets(userId){
    if(!dbSvc.userExists(userId)){
        return new Error(`Unknown user: ${userId}`);
    }
    // We assume that the information is stored somewhere you are able to retrieve it, but where it's stored is irrelevant, this is merely for the example
    let userVaultAccountId = dbSvc.getVaultAccountForUser(userId);
    try{
        let numberOfAssets = (await fbks.getVaultAccountById(userVaultAccountId)).assets.length;
        return numberOfAssets <= 10;
    } catch (e) {
        fbksError(e);
    }
}

// This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
// allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
// be written without using this function
function fbksError(e){
    let resp = e.response;
    if(resp !== 400) {
        // Handle other errors and return
    }

    let respData = resp.data;
    switch(respData.code){
        case 1004:
            throw new UnknownVaultAccountIdError();
        default:
            // If we didn't map the potential error code, it's important to write as much information
            // about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
            logUnexpectedError(`Faced error: ${util.inspect(respData,false,null,true)} which is not mapped.`);
            throw new Error("Unexpected error - please try again later");
    }
}
# Fireblocks SDK initialized beforehand and is defined as the parameter - fbks
# There exists some variable which allows us to query a database for information, defined as - db_svc
def sufficient_assets(user_id):
    if not db_svc.user_exists(user_id):
        raise Exception(f"User does not exist: {user_id}")
    
    user_vault_account_id = db_svc.get_vault_account_for_user(user_id)
    try:
        asset_count = len(fbks.get_vault_account_by_id(user_vault_account_id)["assets"])
        return asset_count <= 10
    except FireblocksApiException as e:
        fbks_error_handler(e)

# This function is used as a generic error handler for all FireblocksAPI calls, preventing us from duplicating code and
# allowing us to easily fix issues in a single location. If a call requires custom handling, its catch clause can
# be written without using this function
def fbks_error_handler(e):
    if e.error_code == 1004:
        raise UnknownVaultAccountIdException()
    else:
        # If we didn't map the potential error code, it's important to write as much information
        # about the error as possible, that way we can patch the code with minimal replications or intrusive investigation
        log_unexpected_error(f"Faced error: {e} which is not mapped.")
        raise Exception("Unknown error - please try again later")
Let's dissect the code once more (almost identical for python):
Lines 4-6: Check the existence of such a
userId
Line 8: Finds the vault account correlated to this
userId
Let's assume, in this case, that if no such vault account exists in your internal database, you need to add a new entry incrementing from the last added vault account id
Lines 9-14: Gets the vault account and counts the number of assets. Returns based on our previous explanation (at most 10).
If there is an error, handle using the generic error handler. If there is an error code
1004
, you'll receive a specific type of error. This type of error, in our scenario, will generate a new vault account by something upstream from where the error occurred.
500 status code
500 status code is an indication that there was an issue that happened on the server side.  Due to this, it is not possible for us to provide a way to handle such errors in the same manner as we did for the 4xx errors.
We suggest the following:
Do not immediately attempt the request again
Double-check the parameters you're passing, it might be that one of the parameters you're passing is not formatted correctly, thus resulting in a failure in our backend
Check the
status page
to check if there is an ongoing issue
Open a Support ticket / reach out to Support on Slack to see address the issue
Common validations to perform
Generally, validations should be done based on your needs and as soon as you have sufficient details to validate them. This will divide into two potential scenarios (but not limited to those two):
You received the value and can immediately perform validation on that value
You received the value but some additional data is required before performing the validation
We provide some common validations that can and should be done which will lower your risk of getting errors in your response that is caused by your code.
Asset validation - When getting an asset, always verify that the asset is indeed a supported one.
More information can be found in the supported assets API reference
.
OTA
validation - When using one-time address, which is received from the user themselves, ensure that the format of the address matches the format of the network.
For example, BTC SegWit will require an address starting with
bc1
and complying with Bech32 formatting. EVMs will be a 40-character checksummed hex string with a prefix of
0x
.
Amount validation - In cases where you allow users to specify amounts, such as partial withdrawal uses, you'll always need to:
Get the current balance available for the user, either via an API call or via an internal ledger (depending on your business logic).
Verify that the amount is a positive decimal value in the range of (0, retrieved balance] (excluding 0).
Vault account validation - Ensure the vault account is a non-negative integer.
You might want to add restrictions (both in your
Transaction Authorization Policy
and in your code, to prevent access to vault accounts you don't want users to be able to access).
Updated
20 days ago
Introduction
Table of Contents
Overview
Error types
Non-HTTP errors
Private key corruption
4xx status codes
400 - Bad request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 status code
Common validations to perform

---

