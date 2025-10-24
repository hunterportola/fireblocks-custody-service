# 16 Developer Guides

This document contains 4 sections related to 16 developer guides.

## Table of Contents

1. [Postman Guide](#postman-guide)
2. [Python Guide](#python-guide)
3. [Sandbox Quickstart](#sandbox-quickstart)
4. [Rust Guide](#rust-guide)

---

## Postman Guide {#postman-guide}

*Source: https://developers.fireblocks.com/docs/postman-guide*

Postman Guide
mdx
# Prerequisites

* [Introduction](doc:introduction)
* [Quickstart Guide](doc:quickstart) or [Developer Sandbox Quickstart](doc:sandbox-quickstart)

# Overview

Postman is an application designed to help with API integration and exploration. Intuitive for different tech skill levels, this is the tool of choice both for experienced developers and no-code enthusiasts to get familiar with our available endpoints, requests, and responses.

Using our Postman Collection, you can start testing our API before you write a single line of code.

# Install Postman and Fireblocks Collection

1. Download and install the [Postman app](https://www.postman.com/downloads/) or [use Postman online.](https://identity.getpostman.com/login?continue=https%3A%2F%2Fweb.postman.co%2Fhome)
2. <a href="https://www.postman.com/fireblockshq/fireblocks/collection/" target="_blank">
     <button type="button">
       <img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style={{ width: "128px", height: "32px" }}>
     </button>
   </a>

After following the steps above and opening Postman, you'll see the Fireblocks API collection.

> 🚧 Important
>
> Running calls in Postman for the Fireblocks API will not work unless you've properly configured your authentication settings for your environment.
>
> [Learn more about properly configuring your workspace.](doc:quickstart#workspace-preparation)

# Update environment variables

The Fireblocks Postman Collection comes with a built-in Fireblocks boilerplate environment (template).

Step 1: On the top right corner, select **No Environment** and then choose **Boilerplate Fireblocks Environment**.

<Image align="center" width="200px" src="https://files.readme.io/a6d5d49-image.png" />

Step 2: Select the eye icon next to it:

<Image align="center" width="200px" src="https://files.readme.io/88447a4-image.png" />

On the next screen, add three variables:

1. `fireblocksApiKey`: This is the API key you downloaded from the **Users** tab in Fireblocks Console.
2. `fireblocksSecretKey`: This is the `fireblocks_secret.key` file you created in the [Quickstart Guide](doc:quickstart).  
   You can set the `type` to be "secret" in order to hide the secret key content.
3. `baseUrl`: This should be set to either of the following, depending on the environment you are using:  
   Mainnet/Testnet:  `https://api.fireblocks.io/v1`  
   Developer Sandbox: `https://sandbox-api.fireblocks.io`

The result will look something like this:

![](https://files.readme.io/fc8a683-image.png)

# Making your first request

> 🚧 Important
>
> This Postman Collection makes use of a [pre-request script](https://learning.postman.com/docs/writing-scripts/pre-request-scripts/) to automatically generate the `Authorization` header for every request, which allows you to skip coding the signature process.  
> You can view this script by clicking on the "Pre-request Script" tab within the Collection.

1. The first API you will call is [List vault accounts (Paginated)](ref:get_vault-accounts-paged) in your workspace.
2. **Fireblocks API > vault > List vault accounts (Paginated)**

<Image align="center" width="300px" src="https://files.readme.io/8fd9c0f-image.png" />

3. An HTTP-200 "OK" response will be shown upon a successful API call.

# What's next?

* [API Reference](https://developers.fireblocks.com/reference/api-overview)
Updated
20 days ago
Introduction

---

## Python Guide {#python-guide}

*Source: https://developers.fireblocks.com/docs/python-guide*

Python Guide
Prerequisites
Introduction
Quickstart Guide
or
Developer Sandbox Quickstart
Overview
A Python developer can use the Fireblocks API in 2 different ways:
The Fireblocks Python SDK.
A standard HTTP library such as
http.client
or
Requests
.
In this guide, you'll set up the Fireblocks SDK and see an example of non-SDK usage (including signing the JWT token).
Additionally if you are developing on EVM chains - you might be using some of the familiar library, such as
web3.py
- Fireblocks is well intergrated into this libraries as described in the
Ethereum Development
.
Using the Fireblocks SDK
Install Python 3.6 or newer
The Fireblocks Python SDK requires
Python 3.6 or newer
. You can check which version of Python you already have installed with the following command.
python --version
or
python3 --version
Learn how to install or update Python to a newer version.
Install fireblocks-sdk
The Fireblocks Python SDK is open-source and hosted on both GitHub and PIP, the official package repository.
Source code:
https://github.com/fireblocks/fireblocks-sdk-py
Python Package:
https://pypi.org/project/fireblocks-sdk/
Installing the latest SDK is easy with
pip
:
pip3 install fireblocks-sdk
Your First Fireblocks Python script!
Now that you're set up, run a quick check for the API. The script will query existing vaults, create a new vault and then query again to see that the vaults were created.
The requests-based implementation will require some library dependencies:
requests
pyjwt
In the following scripts, make sure you're using the correct value for
api_base_url
or
base_url
for your environment:
For Sandbox workspaces:
https://sandbox-api.fireblocks.io
For Mainnet or Testnet workspaces:
https://api.fireblocks.io
Learn more about workspace differences
.
📘
Use the correct API Base URL
Depending on the script, make sure you're using the correct value for
api_base_url
or
base_url
for your environment:
For Sandbox workspaces:
https://sandbox-api.fireblocks.io
For Mainnet or Testnet workspaces:
https://api.fireblocks.io
Learn more about workspace differences
.
Python SDK
Python (requests)
from fireblocks_sdk import FireblocksSDK, VAULT_ACCOUNT, PagedVaultAccountsRequestFilters
import json

api_secret = open('</path/to/fireblocks_secret.key>', 'r').read()
api_key = '<your-api-key-here>'
api_url = 'https://sandbox-api.fireblocks.io' # Choose the right api url for your workspace type 
fireblocks = FireblocksSDK(api_secret, api_key, api_base_url=api_url)


# Print vaults before creation
vault_accounts = fireblocks.get_vault_accounts_with_page_info(PagedVaultAccountsRequestFilters())
print(json.dumps(vault_accounts, indent = 1))

# Create new vault
vault_account = fireblocks.create_vault_account(name = "Quickstart_Vault")

# Print vaults after creation
vault_accounts = fireblocks.get_vault_accounts_with_page_info(PagedVaultAccountsRequestFilters())
print(json.dumps(vault_accounts, indent = 1))
import json
import math
import secrets
import time
import urllib.parse
from hashlib import sha256

import jwt
import requests


class FireblocksRequestHandler(object):
    def __init__(self, base_url, private_key, api_key):
        self.base_url = base_url
        self.private_key = private_key
        self.api_key = api_key

    def _sign_jwt(self, path, body_json=""):
        timestamp = time.time()
        nonce = secrets.randbits(63)
        timestamp_secs = math.floor(timestamp)
        path = path.replace("[", "%5B")
        path = path.replace("]", "%5D")
        token = {
            "uri": path,
            "nonce": nonce,
            "iat": timestamp_secs,
            "exp": timestamp_secs + 55,
            "sub": self.api_key,
            "bodyHash": sha256(json.dumps(body_json).encode("utf-8")).hexdigest()
        }
        return jwt.encode(token, key=self.private_key, algorithm="RS256")

    def get_request(self, path):
        token = self._sign_jwt(path)
        headers = {
            "X-API-Key": self.api_key,
            "Authorization": f"Bearer {token}"
        }

        return requests.get(urllib.parse.urljoin(self.base_url, path), headers=headers)

    def post_request(self, path, body_json={}):
        token = self._sign_jwt(path, body_json)
        headers = {
            "X-API-Key": self.api_key,
            "Authorization": f"Bearer {token}"
        }

        response = requests.post(urllib.parse.urljoin(self.base_url, path), json=body_json, headers=headers)
        return response

api_secret = open('</path/to/fireblocks_secret.key>', 'r').read()
api_key = '<your-api-key-here>'
base_url = 'https://sandbox-api.fireblocks.io' # Choose the right api url for your workspace type 
request_handler = FireblocksRequestHandler(base_url, api_secret, api_key)

# Print vaults before creation
response = request_handler.get_request('/v1/vault/accounts_paged')
print(response.text)

# Create new vault
response = request_handler.post_request('/v1/vault/accounts', body_json={'name': 'Quickstart_Vault'})
print(response.text)

# Print vaults after creation
response = request_handler.get_request('/v1/vault/accounts_paged')
print(response.text)
🚧
Warning - Reference only
These examples are
not production-ready
and are used only for reference.
Please follow our security guidelines for secure API interaction.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Using the Fireblocks SDK
Install Python 3.6 or newer
Install fireblocks-sdk
Your First Fireblocks Python script!

---

## Sandbox Quickstart {#sandbox-quickstart}

*Source: https://developers.fireblocks.com/docs/sandbox-quickstart*

Developer Sandbox Quickstart Guide
🚧
Are you in the right place?
This guide is only for Developer Sandbox workspaces. If you have a
Testnet
or
Mainnet
workspace type, follow the
Quickstart Guide
for relevant instructions.
A developer sandbox should have the following badge in the Console:
Overview
The Fireblocks
Developer Sandbox
is a unique workspace built specifically for developers to get started using Fireblocks APIs and SDKs quickly. In the Developer Sandbox, basic default settings are pre-set to optimize the speed of exploration over other parameters, including:
A
Testnet
-only workspace:
Explore the platform without risking real funds. You can find a complete list of supported blockchain testnets
in this Help Center article
.
An automated
API co-signer
:
No need for mobile or API signing devices.
A predefined
Transaction Authorization Policy
:
Start creating basic transactions and working with smart contracts quickly with minimal friction.
API activated by default:
Make test API calls immediately.
Basic Fireblocks console features are activated by default:
Streamline your testing.
Easier developer onboarding and API key creation:
Get started within minutes.
Pre-funded wallet with a small amount of Goerli ETH:
No need to hunt for working public faucets.
Initial setup
To interact with the Fireblocks API, you will need an API key and a Private key. These keys are used to compile a
JWT
for authentication.
When you first log in, you should see a 3-step wizard to create your first API user and keys. The keys are generated in the UI for convenience (only for the
Developer Sandbox
workspace type; other workspace types allow for more secure options).
You can also create additional API users and keys by going to the Developers area in the bottom-left and clicking on the
Add API User
button in the top-right corner. Please note that Sandboxes are limited to a maximum of five API users.
By choosing "Automatic
CSR
" in the form, the Fireblocks UI can generate one for convenience. You can also choose "Custom
CSR
" for a more secure option to upload your own.
Try the Fireblocks API 🚀
Now you're ready to try the Fireblocks API using one of the Fireblocks SDKs, or the REST endpoints directly.
💻
Sandbox URLs
Developer Console UI:
https://sandbox.fireblocks.io
Sandbox API:
https://sandbox-api.fireblocks.io
Get started using our SDKs or REST API endpoints in minutes with our Postman guide.
Updated
20 days ago
Introduction
Table of Contents
Overview
Initial setup
Try the Fireblocks API 🚀

---

## Rust Guide {#rust-guide}

*Source: https://developers.fireblocks.com/docs/rust-guide*

Rust Guide
Prerequisites
Introduction
Quickstart Guide
or
Developer Sandbox Quickstart
Overview
Fireblocks does not currently provide a native Rust SDK and so the recommended approach is to use the standard HTTP REST requests when calling the Fireblocks API.
However, an open source library was developed by the developer community that adds support for the Fireblocks wallet in the commonly used
ethers-rs
library for Ethereum (EVM) development in Rust.
Ethers-rs
Ethers-rs
is a complete Ethereum & Celo library and wallet implementation in Rust.
Ethers-fireblocks
is a
community project
implementing ethers-rs compatibile Fireblocks Signer and Middleware.
🚧
ethers-fireblocks is not built by Fireblocks
Please note that while it has Fireblocks in it's name -  this is an open source library built by a member of our developer community. Fireblocks does not maintain this library and does not take responsibility for current or any future versions.
Example
Rust
use ethers_core::types::{Address, TransactionRequest};
use ethers_fireblocks::{Config, FireblocksMiddleware, FireblocksSigner};
use ethers_providers::{Middleware, Provider};
use std::convert::TryFrom;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
   let wallet_id = "1"; // Our wallet id
   let chain_id = 5; // Goerli
   let cfg = Config::new(
       &std::env::var("FIREBLOCKS_API_SECRET_PATH").expect("fireblocks secret not set"),
       &std::env::var("FIREBLOCKS_API_KEY").expect("fireblocks api key not set"),
       wallet_id,
       chain_id,
   )?;

   // Create the signer (it can also be used with ethers_signers::Wallet)
   let mut signer = FireblocksSigner::new(cfg).await;

   // Instantiate an Ethers provider
   let provider = Provider::try_from("http://localhost:8545")?;
   // Wrap the provider with the fireblocks middleware
   let provider = FireblocksMiddleware::new(provider, signer);

   // Any state altering transactions issued will be signed using
   // Fireblocks. Wait for your push notification and approve on your phone...
   let address: Address = "cbe74e21b070a979b9d6426b11e876d4cb618daf".parse()?;
   let tx = TransactionRequest::new().to(address);
   let pending_tx = provider.send_transaction(tx, None).await?;
   // Everything else follows the normal ethers-rs APIs
   // e.g. we can get the receipt after 6 confs
   let receipt = pending_tx.confirmations(6).await?;

   Ok(())
}
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Ethers-rs
Example

---

