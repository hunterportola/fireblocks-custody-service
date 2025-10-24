# 09 Configure Api With Co Signers

This document contains 12 sections related to 09 configure api with co signers.

## Table of Contents

1. [Generate A Csr For An Api User](#generate-a-csr-for-an-api-user)
2. [Cosigner Architecture Overview](#cosigner-architecture-overview)
3. [Gcp Confidential Space Api Co Signer](#gcp-confidential-space-api-co-signer)
4. [Intel Sgx Api Co Signer](#intel-sgx-api-co-signer)
5. [Use Cosigners For Signing Automation](#use-cosigners-for-signing-automation)
6. [Aws Nitro Api Co Signer](#aws-nitro-api-co-signer)
7. [Manage Api Keys](#manage-api-keys)
8. [Multiple Cosigners High Availability](#multiple-cosigners-high-availability)
9. [Configure Co Signer In Ha Mode](#configure-co-signer-in-ha-mode)
10. [Create Api Co Signer Callback Handler](#create-api-co-signer-callback-handler)
11. [Api Sdk Overview](#api-sdk-overview)
12. [Co Signer Security Checklist Defense Monitoring](#co-signer-security-checklist-defense-monitoring)

---

## Generate A Csr For An Api User {#generate-a-csr-for-an-api-user}

*Source: https://developers.fireblocks.com/docs/generate-a-csr-for-an-api-user*

Create a CSR for an API user
What is a CSR?
A Certificate Signing Request (CSR) is a file that contains your public key and some identifying information. Fireblocks uses the CSR to generate your API user's public key, which Fireblocks then uses to verify and authenticate your API calls.
Before you begin
Make sure you have the following:
Access to a machine where you can run OpenSSL or similar tooling
A secure location to store your private key
Step 1: Create the private key & CSR files
Using OpenSSL (recommended for most users)
Open your terminal or command line and run the following command to generate a private key and CSR:
PowerShell
openssl req -new -newkey rsa:4096 -nodes -keyout api_private.key -out api_user.csr
What this does
Creates a private key file:
api_private.key
Creates a CSR file:
api_user.csr
❗️
Security reminder
Never
upload or share the
api_private.key
file. Store it securely using a Key Management System (KMS), HSM, or encrypted file storage.
Step 2: Fill in the CSR details
When prompted, complete the following fields:
Field
Description
Common Name (CN)
Your name or the API user's name (e.g., John_the_API_Guy)
Organization (O)
Your organization's name
Organizational Unit (OU)
Optional field (e.g., API Team)
Country (C)
Two-letter country code (e.g., US)
State (ST)
Your state or province
Locality (L)
Your city
Step 3: Upload the CSR file
In the Fireblocks Console,
follow these steps to create an API user
. Note that only Admin-level workspace users (Owner, Admin, and Non-Signing Admin) can create API users.
Upload the
api_user.csr
file in the
CSR File
field.
❗️
Warning
Do
not
upload your private key! Keep the
api_private.key
file secure for signing API requests later.
Updated
20 days ago
Manage API Access
Whitelist IPs for API Keys
Table of Contents
What is a CSR?
Before you begin
Step 1: Create the private key & CSR files
Using OpenSSL (recommended for most users)
Step 2: Fill in the CSR details
Step 3: Upload the CSR file

---

## Cosigner Architecture Overview {#cosigner-architecture-overview}

*Source: https://developers.fireblocks.com/docs/cosigner-architecture-overview*

API Co-signers Architecture Overview
How automated MPC signing works
Overview
Similar to how the MPC-CMP algorithm is used to sign transactions and approve workspace configuration requests via a mobile device, the API Co-signer participates in a multi-signer MPC process. This process involves a set of independent Co-signers operated by Fireblocks, known as Cloud Co-signers, each of which holds a private key share. Refer to
this MPC-CMP article
to learn more about the API Co-signer's role in implementing the Fireblocks MPC signing algorithm.
The Co-signer eliminates the need for manual user input through the Fireblocks mobile application by automatically signing transactions and approving requests. By hosting the Co-signer in your environment and connecting it to your workspace using API users, you can configure the
Policies
to
designate the API user
that is paired with the Co-signer to automatically sign transactions that meet the criteria defined in the policy.
To automate transaction signing, host the API Co-signer in your environment on a machine or virtual machine (VM) that supports enclaves. Fireblocks API Co-signers operate on Intel SGX, AWS Nitro, or Google Cloud Confidential Spaces enclaves. They can be deployed on major cloud platforms such as Azure, AWS, Google Cloud, IBM Cloud, and Alibaba Cloud, as well as on-premises with Intel SGX-capable servers.
Fireblocks has fully integrated AWS Nitro Enclave technology. If you are currently using KMS-based AWS API Co-signers, it is recommended to upgrade to the latest Nitro version for enhanced security and performance.
Observe the diagram below, which illustrates the relationship between the customer's API Co-signer, mobile device, API users, and the Fireblocks Cloud Co-signers #1 and #2.
Refer to the articles below for detailed information on the specific architecture of each type of enclaved Co-signer:
Intel SGX Co-signer architecture running in Azure, IBM Cloud or Alibaba Cloud
Nitro Co-signer architecture running in AWS
Confidential Space Co-signer architecture running in Google Cloud
Using API users to connect the Co-signer to your workspace
To connect a new or existing Co-signer to your workspace, pair it with an API user from the workspace. Existing Co-signers are typically associated with another workspace within your organization.
Pairing the Co-signer is performed using a JWT-encoded Pairing Token obtained from the Console for a specific API user. This token is used during Co-signer installation to pair the initial API key, enabling communication with Fireblocks' SaaS. The Co-signer is identified exclusively by the workspace and the API user used to establish the connection.
The pairing process for the first API user requires admin-level access to the Fireblocks Console and root access to the Co-signer’s VM. During this process, you will provide the Co-signer with a pairing token linked to the API user, enabling the platform to recognize the Co-signer and associate it with the Workspace.
You can pair multiple API users to a single Co-signer. Additionally, API users from different Workspaces can be paired with the same API Co-signer, except when using the GCP Confidential Space Co-signer.
Connecting your business logic to the Co-signer
You can optionally connect your business logic to the Co-signer through a feature called a Callback Handler, configured per API user. The Callback Handler is an HTTPS server that receives requests from the Co-signer at a designated endpoint whenever a transaction signing or configuration approval is triggered for an API user. The Callback Handler responds with an action, such as approving or denying the request. If no Callback Handler is configured, the Co-signer will automatically sign or approve all requests for that API user.
Within a single Co-signer, some API users can operate with a configured Callback Handler, while others can function without it. When configuring a Callback Handler for a paired API user, you specify the URL of the Callback Handler server and select a secure communication method to establish a secure channel.
Refer to
Setup API Co-signer Callback Handler
to learn more about it.
Installing an API Co-signer
Available API Co-signer types
Fireblocks provides multiple deployment options for API Co-signers, available in both cloud environments and on-premises, in regions that meet the necessary enclave technology requirements. These deployment options leverage various enclave technologies to safeguard your MPC key shares, allowing you to select the solution that aligns best with your production environment requirements.
For detailed step-by-step installation guides for each Co-signer type, refer to the articles below:
Installing an SGX API Co-signer in Azure
Installing an SGX API Co-signer via Azure Marketplace
Installing an SGX API Co-signer in IBM Cloud
Installing an SGX API Co-signer in Alibaba Cloud
Installing an SGX API Co-signer on-prem
Installing a Nitro API Co-signer in AWS
Installing a Confidential Space API Co-signer in Google Cloud
Available enclave types
Learn more about the enclave technologies Fireblocks uses by referring to the following resources:
Microsoft Azure SGX Enclave-capable Confidential Compute VM
On-Premise
Intel SGX-enabled Processors
AWS Nitro Enclave-capable EC2 instance
Google Cloud Confidential Space workload container
IBM Cloud Bare Metal Servers SGX-capable machine
Alibaba Cloud Intel SGX-capable Elastic Compute Service (ECS) instance
Configuring your workspace to sign using an API Co-signer
To enable the API Co-signer to participate in MPC signing and configuration change approvals, it must be paired with an API user from your workspace. Once the pairing process is completed successfully, a unique set of MPC key shares and workspace configuration keys is generated for the API user. These keys are securely stored within your Co-signer and Cloud Co-signers #1 and #2. The key shares facilitate automatic signing for transactions initiated by you.
Note that it must be an API user with the role of
Signer
or
Admin
, so it will have MPC key shares and be able to sign.
To activate automatic signing through the Co-signer, configure the
Policies
to
designate the API user
paired with the Co-signer as the signer. When a transaction you initiate meets the criteria defined in the policy, it will be automatically signed by the Co-signer associated with the configured API user.
The process of generating and signing a Fireblocks transaction using the Fireblocks REST API, the API Co-signer, and the optional Callback Handler proceeds as follows:
A new transaction is initiated using the Fireblocks API and generated on the backend.
The transaction is evaluated against your Policies to determine if it is authorized.
If an API user paired with the API Co-signer is configured in the Policy as a designated signer, the transaction will be sent to the API Co-signer associated with that API user.
The API Co-signer, hosted in your secure environment, polls the Fireblocks SaaS for transactions requiring signing. If a transaction is available, the SaaS immediately provides the transaction details.
If a Callback Handler is configured for the API user designated as the signer, the API Co-signer sends a secure approval request to the Callback Handler.
If the Callback Handler responds with "approved," the transaction is signed in coordination with Fireblocks' Cloud Co-signers. If the response is "rejected," the transaction is declined. If the Callback Handler does not respond within 30 seconds or returns "retry," the request fails. Refer to
Setup API Co-signer Callback Handler
to learn more about it.
Manage the Co-signer's paired API users and Callback Handlers
Configuring the Co-signer from the Console and Fireblocks API
Once the Co-signer is connected to the workspace, it can be managed through the
Co-signers Management tab
located in the
Developer Center
of the Fireblocks Console.
You can also use the
Co-signer APIs (beta)
for that.
Common Co-signer operations:
Pair an additional API User
- requires the workspace owner approval
Configure the Callback Handler of an API user
- requires the workspace owner approval
Unpair an API User
(formerly known as re-enroll API user) - requires admin approval
Rename the Co-signer
Retrieve information about the Co-signer
📘
The
Pair an additional API User
and
Configure the Callback Handler of an API user
are available from the Console and APIs only for users who installed the latest Co-signer versions.
Refer to
API Co-signers versions
for more details
Configuring the Co-signer from its host machine
The AWS Nitro Co-signer and all types of SGX Co-signers can also be configured locally from the host machine using CLI commands. Refer to the
Operating the Co-signer
article for more details.
Due to Google Cloud's Workload container architecture, the GCP Confidential Space Co-signer can only be managed through Fireblocks' SaaS. Configuration operations must be performed within the workspace to which the Co-signer is connected, using either the Console or APIs. Consequently, the GCP Confidential Space Co-signer is restricted to a single workspace.
Using the Communal Test Co-signer
Due to legal regulations, Fireblocks can not take custodial responsibility for Mainnet workspaces. Therefore, this option is available only to Testnet workspaces.
Setting up a new Co-signer from scratch can be time-consuming. To accelerate development and prepare your workspace for automation and API-driven workflows, Fireblocks offers the option to use a Communal Test Co-signer before installing and configuring your own.
The Communal Test Co-signer is hosted and managed by Fireblocks and serves all customers with Testnet workspaces. Any workspace owner can approve pairing API users with it, generate MPC key share sets, and use it to sign transactions. Please refer to
this guide
to learn how to use the Communal Test Co-signer.
When you start testing and verifying your signing or approval automation workflows, we recommend setting up your self-hosted API Co-signer instance and replacing the Communal Test Co-signer as soon as your instance is ready. To stop using the Communal Test Co-signer, unpair or delete the API users that are paired with it.
Once an API user is created in a Sandbox workspace, it is automatically paired to the Fireblocks Communal Test Co-signer, which holds the MPC key shares of all the API users in the Sandbox environment across all the workspaces.
Updated
20 days ago
Use API Co-signers for Signing and Approval Automation
Intel SGX Co-signer Architecture
Table of Contents
How automated MPC signing works
Overview
Using API users to connect the Co-signer to your workspace
Connecting your business logic to the Co-signer
Installing an API Co-signer
Available API Co-signer types
Available enclave types
Configuring your workspace to sign using an API Co-signer
Manage the Co-signer's paired API users and Callback Handlers
Configuring the Co-signer from the Console and Fireblocks API
Configuring the Co-signer from its host machine
Using the Communal Test Co-signer

---

## Gcp Confidential Space Api Co Signer {#gcp-confidential-space-api-co-signer}

*Source: https://developers.fireblocks.com/docs/gcp-confidential-space-api-co-signer*

Google Cloud Confidential Space API Co-signer Architecture
📘
Learn how to install GCP Confidential Space Co-signer in the
following guide
GCP Co-signer can only connect to one workspace at a time
Like other Co-signers, the Google Cloud Confidential Space Co-signer is installed and connected to the workspace through an API user. Once installation is complete, you can manage it via the Console or APIs to add additional API users, configure their Callback Handlers, etc.
Due to Google Cloud's Confidential Space container architecture, the Co-signer can only be commanded through Fireblocks' SaaS. As a result, it is restricted to a single workspace connected to the Co-signer. All operations must be performed within this workspace using the Console or APIs.
Google Cloud resources used by the Co-signer
The Fireblocks GCP Confidential Space API Co-signer leverages Google's Confidential Space technology. It utilizes the following Google Cloud's resources:
Workload Container
: used to run the enclave.
Bucket
: used as the Co-signer's persistent storage and holds the encrypted database of the Co-signer.
KMS Customer Managed Key
: used to securely protect the Co-signer's MPC keyshares, which are stored in the Co-signer's persistent storage within a bucket.
IAM/WIP
: enables associating identities with Google Cloud's IAM roles to grant only essential permissions to specific resources in use.
🚧
Important
: Allocate a separate set of resources for each Co-signer to prevent conflicts and ensure isolation, enhancing security.
The "project" can be common between different Co-signers.
This is illustrated in the block diagram below:
Secure Co-signer database encryption scheme
The following process is implemented to build and secure the Co-signer's database:
The user creates and configures a symmetric Customer Managed Key (CMK) in the KMS.
The Co-signer, upon initialization, asks KMS to generate an additional AES 128-bit CBC key:
FBKS-DB-Key
The Co-signer initializes its encrypted database using the key
FBKS-DB-KEY
The Co-signer encrypts
FBKS-DB-KEY
using the CMK.
The Co-signer saves its encrypted database and the encrypted form of
FBKS-DB-KEY
in the GCS bucket, serving as its persistent storage.
Access to KMS, including the CMK, is restricted using a Fireblocks enclave image attestation signature and the IAM role and policies that were created by the user.
This is illustrated in the block diagram below:
Updated
20 days ago
AWS Nitro API Co-signer Architecture
Setup API Co-signer Callback Handler
Table of Contents
GCP Co-signer can only connect to one workspace at a time
Google Cloud resources used by the Co-signer
Secure Co-signer database encryption scheme

---

## Intel Sgx Api Co Signer {#intel-sgx-api-co-signer}

*Source: https://developers.fireblocks.com/docs/intel-sgx-api-co-signer*

Intel SGX Co-signer Architecture
📘
Learn how to install SGX Co-signer in Azure in the
following guide
Resources used by the SGX Co-signer
The Fireblocks SGX Co-signer utilizes Intel's SGX enclave and attestation mechanisms. It can be deployed either in cloud service providers that support compatible SGX servers or on-premise using a bare-metal server. Also, an SGX driver must be loaded into the machine. This is the only resource that is required to install and operate the Co-signer on the host machine.
The Co-signer's database is encrypted and stored on the host machine's disk, serving as the Co-signer's persistent storage.
🚧
Important
: Allocate a separate machine for each Co-signer to prevent conflicts and ensure isolation, enhancing security.
This is illustrated in the block diagram below:
Secure Co-signer database encryption scheme
The following process is implemented to build and secure the Co-signer's database:
The Co-signer, upon initialization, connects to the
Intel-SGX Remote Attestation server
that belongs to the Fireblocks SaaS and retrieves the key that encrypts its database:
FBKS-DB-Key
The Co-signer initializes its encrypted database using the key
FBKS-DB-KEY
The Co-signer encrypts
FBKS-DB-KEY
using the SGX hardware key of the host machine.
The Co-signer saves its encrypted database and the encrypted form of
FBKS-DB-KEY
in the host machine, serving as its persistent storage
The Co-signer cannot operate unless it is attested against Fireblocks' Remote Attestation server.
This is illustrated in the block diagram below:
Installation artifacts
The SGX Co-signer is comprised of several components:
Installation script: This is the CLI interface for installing and managing the Co-signer. You can retrieve the installation script from the Console. The script includes the path to a Docker image registry for downloading the Co-signer Docker image. It supports downloading images of various versions, with default versions specified if none are explicitly provided. See the
SGX Co-signer version history
for details on the image version.
Docker image: The Co-Signer's executable is wrapped in a Docker image to provide safe, versioned, and consistent installation across different platforms. The Docker image provides all the libraries and dependencies of the main executable.
Main loading executable: A slim binary that downloads and verifies the enclave and exposes command line interfaces.
Secure SGX enclave: This component contains most of the Co-Signer's code and logic. It is both encrypted and signed by Fireblocks, and it can be downloaded from the Fireblocks server during setup.
Q: Should I verify the executable's signature?
If you are using the correct Docker image, as specified by the script, there is no need for any other verification, as it is embedded in the image.
Q: Why is the enclave encrypted?
SGX allows for saving the enclave encrypted on disk with a hardware key only available to the specific CPU where the enclave would be executed. Secured enclaves prevent the risk of modification, make it impossible to reverse engineer, and hide any potential secrets embedded within them. This enclave alone is capable of reading the secrets stored by the Co-Signer.
Q: Should I verify the enclave's signature?
There is no need for that. The Fireblocks signing key is embedded within the loading executable, which verifies the enclave's signature whenever it is loaded.
Q: Where do I find the enclave in the docker image?
The enclave is only downloaded when the Co-signer goes through a setup or upgrade process, so it is omitted from the Docker image. The name of the file is
enclave.signed.so
.
The chain of trust follows the sequence:
script > image > executable > enclave
, with Fireblocks ensuring compatibility between these components. During setup or upgrade, the Co-signer downloads the latest enclave version from Fireblocks servers, which is guaranteed to be compatible with the installed executable. To ensure the enclave uses the latest published version, always use the most recent Co-signer Docker image. The safest approach is to install the Co-signer using the latest installation script.
Updated
20 days ago
API Co-signers Architecture Overview
AWS Nitro API Co-signer Architecture
Table of Contents
Resources used by the SGX Co-signer
Secure Co-signer database encryption scheme
Installation artifacts

---

## Use Cosigners For Signing Automation {#use-cosigners-for-signing-automation}

*Source: https://developers.fireblocks.com/docs/use-cosigners-for-signing-automation*

Use API Co-signers for Signing and Approval Automation
Overview
The API Co-signer automates transaction signing and workspace configuration approvals, complementing the default manual process performed via a mobile device using the Fireblocks mobile application. It is ideal for workspaces with high transaction volumes or frequent activity.
The Co-signer is a component installed and hosted in your environment on a machine with enclave support. Enclaves create a secure runtime environment that isolates and protects data and code, even from privileged users. This trusted execution environment safeguards sensitive processes from unauthorized access and tampering.
Available API Co-signer types
Fireblocks offers multiple deployment options for API Co-signers. These options are available in cloud environments and on-premises, provided the region supports the required enclave technology. Each deployment utilizes enclave technologies to protect your MPC key shares. This allows you to choose a solution that fits your production environment.
API Co-signers are supported on Intel SGX, AWS Nitro, and Google Cloud Confidential Spaces enclaves. Deployments can be made on popular cloud platforms like Azure, AWS, Google Cloud, IBM Cloud, and Alibaba Cloud. On-premises deployments are also supported using Intel SGX-capable servers.
For detailed step-by-step installation guides for each Co-signer type, refer to the articles below:
Installing an SGX API Co-signer in Azure
Installing an SGX API Co-signer via Azure Marketplace
Installing an SGX API Co-signer in IBM Cloud
Installing an SGX API Co-signer in Alibaba Cloud
Installing an SGX API Co-signer on-prem
Installing a Nitro API Co-signer in AWS
Installing a Confidential Space API Co-signer in Google Cloud
Additional resources
Use the articles below to learn more about the Co-signer's architecture and configuration:
API Co-signers Architecture Overview
Intel SGX Co-signer Architecture
AWS Nitro Co-signer Architecture
Google Cloud Confidential Space API Co-signer Architecture
Set up an API Co-signer Callback Handler
API Co-signer Security Checklist and Recommended Defense and Monitoring Systems
Configuring Multiple API Co-Signers in High Availability
Updated
20 days ago
Add Tokens
API Co-signers Architecture Overview
Table of Contents
Overview
Available API Co-signer types
Additional resources

---

## Aws Nitro Api Co Signer {#aws-nitro-api-co-signer}

*Source: https://developers.fireblocks.com/docs/aws-nitro-api-co-signer*

AWS Nitro API Co-signer Architecture
📘
Learn how to install AWS Nitro Co-signer in the
following guide
AWS resources used by the Co-signer
The Fireblocks AWS Nitro API Co-signer leverages AWS Nitro Hypervisor technology and attestation mechanisms. It utilizes the following AWS resources:
EC2 Instance
: Nitro-capable VM, through which the enclave operates.
S3 Bucket
: used as the Co-signer's persistent storage and holds the encrypted database of the Co-signer.
KMS Customer Managed Key
: used to securely protect the Co-signer's MPC keyshares, which are stored in the Co-signer's persistent storage within an S3 bucket.
IAM Role
: used to tie everything together by granting only the necessary permissions to the specific resources.
🚧
Important
: Allocate a separate set of resources for each Co-signer to prevent conflicts and ensure isolation, enhancing security.
This is illustrated in the block diagram below:
Co-signer attestation
Fireblocks uses Nitro’s Platform Configuration Register (PCR) as an attestation mechanism to ensure the enclave image file that is accessing the resources at runtime is signed by Fireblocks.
In AWS,
PCR8 (Platform Configuration Register 8)
is a part of the
Trusted Platform Module (TPM)
ecosystem and is specific to environments involving Nitro Enclaves or other secure computing contexts.
In the AWS Nitro Co-signer,
PCR8
measures specific details about the Co-signer during the secure boot process. It ensures setup integrity by validating Fireblocks' enclave image signature when accessing the Customer Managed Key (CMK).
Secure Co-signer database encryption scheme
The following process is implemented to build and secure the Co-signer's database:
The user creates and configures a symmetric Customer Managed Key (CMK) in the KMS.
The Co-signer, upon initialization, asks KMS to generate an additional AES 128-bit CBC key:
FBKS-DB-Key
The Co-signer initializes its encrypted database using the key
FBKS-DB-KEY
The Co-signer encrypts
FBKS-DB-KEY
using the CMK.
The Co-signer saves its encrypted database and the encrypted form of
FBKS-DB-KEY
in the S3 bucket, serving as its persistent storage
The access to KMS, including the CMK, is restricted using a Fireblocks enclave image attestation signature and the IAM role and policies that were created by the user.
This is illustrated in the block diagram below:
AWS Nitro installation package
The installation package contains an Enclave Image File (EIF) and a set of installation scripts. The EIF is built based on the image containing the common API Co-signer code and the AWS Nitro enclave functionality. This image is scanned for known vulnerabilities, and only then does the build process continue based on the AWS build procedure.
Updated
20 days ago
Intel SGX Co-signer Architecture
Google Cloud Confidential Space API Co-signer Architecture
Table of Contents
AWS resources used by the Co-signer
Co-signer attestation
Secure Co-signer database encryption scheme
AWS Nitro installation package

---

## Manage Api Keys {#manage-api-keys}

*Source: https://developers.fireblocks.com/docs/manage-api-keys*

Manage API Access
Fireblocks API Keys can be created via the web console or the API:
For creating API keys via the console please check the
following guide
For adding additional API keys please refer to the following
API endpoint
API Authentication
Fireblocks API involves a secure authentication process that should be followed both when creating the API key and when calling Fireblocks API with the created key.
The Fireblocks API uses an API key and a request signing process to provide a highly secure communication protocol.
The general process for creating the first API key is the following:
Create an RSA4096 private key
Run:
openssl req -new -newkey rsa:4096 -nodes -keyout fireblocks_secret.key -out fireblocks.csr -subj '/O=<your_organization>'
Generate a CSR file from the previously created RSA private key
Browse to the Fireblocks web console and go to the Settings -> Users -> Add User -> API User
Give the API key a name and choose the permissions for this key (same permission as
user roles
)
Upload the generated CSR file
Choose if
Co-Signer setup
is required
Once all of the steps above are done, and the relevant approval quorum was reached, the API Key will be ready in the Users tab and you copy the API Key value.
Every request with this API Key should follow the API Authentication scheme defined by Fireblocks.
Learn more about the required API Authentication
here
API Keys Management Best Practices
Your API credentials and accounts are a prime target for hackers. It is important to understand and implement our best practices for working securely with the Fireblocks APIs.
Role-based access control
When adding API users, ensure that the API user's role is provisioned in accordance with the least privilege principle. Fireblocks supports many different roles for role-based access control, and an API user can be any one of these.
Create as many API users as needed to separate duties and create security boundaries.
👍
Best Practice
It is best to have 2 separate API users for different functions, such as:
A 'Viewer' role that performs read-only operations.
A 'Signer' role with transaction signing capabilities.
Create Policy rules for API users
API Users with transaction initiation and signing capabilities are able to execute transactions like any other Fireblocks Console user.
It is imperative that you create strong
Policy
rules to govern what types of transactions these API users can conduct.
👍
Best Practice
It is best to create Policy rules that limit API users to transact from a specific account and only up to a certain amount. This requires additional approvals or blocks the transaction, preventing users from trying to exceed the pre-defined amount or from transacting from an unauthorized vault account.
Whitelisting IP addresses for API requests
Each API user type on your workspace can whitelist specific IP addresses to only allow API calls from the provided address(es). If there aren't any whitelisted IP addresses for a user, API requests are possible from any IP address.
🚧
Address format requirements
Only /32 IP addresses are accepted. Do not enter addresses as a range of values.
👍
Best Practice
It is best practice to explicitly whitelist the only IPs that you expect to be calling the Fireblocks API.
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
Rotating secrets
Since there are two API users' use cases (Fireblocks API and co-signers), each use case has a different way to rotate the API users:
Fireblocks API: Since it uses the CSR and the associated secret key, you need to create a new API user to rotate the users.
Cosigners: Since it uses a one-time pairing token and it gives a refresh token to get an access token, the rotation here is to re-enroll the API user to get a new pairing token, and then you do the pairing to get a new refresh token.
Fireblocks Agent for KeyLink:  It uses the pairing token, access token, and device. It does not have the MPC keys.
👍
Best Practice
Before you begin, use the
Get all API keys
endpoint to view all the API keys paired to a specific API Co-Signer in a paginated list.
Updated
20 days ago
Manage Users
Create a CSR for an API user
Table of Contents
API Authentication
API Keys Management Best Practices

---

## Multiple Cosigners High Availability {#multiple-cosigners-high-availability}

*Source: https://developers.fireblocks.com/docs/multiple-cosigners-high-availability*

Configuring Multiple API Co-signers in High Availability
Overview
You can configure multiple API Co-signers to operate in an active-active state, ensuring transaction operations align with your business continuity requirements. If one API Co-signer fails or becomes impaired, the remaining Co-signer(s) will continue signing transactions seamlessly.
Configuring multiple Co-Signers to work in parallel
Upon completing the Co-signer's setup and configuration, you can configure them to work in parallel using the Policies.
Each API Co-signer must have at least one API user assigned the Signer role. These API users should be added to the
Designated Signers / Groups
field in the Policy for the transaction types the Co-signers are authorized to sign. You can add API users individually or as part of a user group. All designated signers for the rule must be API users. A combination of API users and Fireblocks Console users is not permitted. Refer to the
following article
to learn more about creating and modifying your Policies.
Once the Owner and Admin Quorum approve the Policy update, multiple Co-signers operate in parallel. Now, the transaction signing process follows these steps:
A transaction is initiated using the Console or APIs.
Fireblocks evaluates the transaction against the workspace's Policy to match it with the appropriate rule. The rule includes API users in the Designated Signers/Groups field.
Fireblocks calls all the Co-signers that are paired with the API users listed in the Policy rule's Designated Signers/Groups field to confirm their availability for signing.
Fireblocks identifies the first available API user with a paired Co-signer and sends the transaction to that Co-signer for signing.
If a Callback Handler is configured for the API Co-signer, it determines whether the transaction is signed or rejected based on the defined callback logic. If no Callback Handler is configured, the API user signs the transaction automatically.
Configuring Policy rules for a group of API Co-signers
Exchange or fiat accounts
You cannot add multiple API users or a user group to the Designated Signers/Groups field in rules in which the Source field contains an exchange or fiat account. Doing so causes transactions that match that rule to fail automatically. You must assign a single API user in Policy rules for exchange and fiat accounts.
Policy Configuration
Depending on how you want to customize the Policy (i.e., whether you create inclusionary or exclusionary rules), you can use different methods to ensure transactions match the correct rule. In the following examples, Group 1 members are the API Co-Signers.
Method 1: Including API Co-Signers only for supported sources
Rule
Initiator
Type
Source
Dest.
Whitelisted / OTA
Amount
Time Period
Asset
Action
Approved By
Designated Signers / Group
1
Any
Tx
Any VA
Any
Whitelisted + OTA
$0
Single Tx
Any
Allow
-
Group 1
2
Any
Tx
Any
Any
Whitelisted + OTA
$0
Single Tx
Any
Approved By
Tywin
-
The rules in the table above state:
Rule 1: This rule allows any single transaction from any vault account to any whitelisted destination or one-time address with an amount greater than $0 from any asset. However, all transactions that match this rule must be signed by one of the Group 1 members.
Rule 2: This rule allows any single transaction from any source to any whitelisted destination or one-time address with an amount greater than $0 from any asset. However, all transactions that match this rule must be approved by Tywin.
Therefore, according to the first match principle, the API Co-signers only sign single transactions in which the source is a vault account.
Method 2: Excluding API Co-Signers from unsupported sources
Rule
Initiator
Type
Source
Dest.
Whitelisted / OTA
Amount
Time Period
Asset
Action
Approved By
Designated Signers / Group
1
Any
Tx
Any Exchange, Any Fiat
Any
Whitelisted + OTA
$0
Single Tx
Any
Approved By
Tywin
-
2
Any
Tx
Any
Any
Whitelisted + OTA
$0
Single Tx
Any
Approved By
Tywin
Group 1
The rules in the table above state:
Rule 1: This rule allows any single transaction from any exchange or any fiat account to any whitelisted destination or one-time address with an amount greater than $0 from any asset. However, all transactions that match this rule must be approved by Tywin.
Rule 2: This rule allows any single transaction from any source to any whitelisted destination or one-time address with an amount greater than $0 from any asset. However, all transactions that match this rule must be approved by Tywin and then signed by one of the members from Group 1.
Therefore, according to the first match principle, the API Co-Signers only sign single transactions in which the source is not an exchange or a fiat account.
Multiple API Co-signers deployment options
Co-signers can be deployed either in the cloud or on-premise, depending on your requirements. For example, you can implement a cluster with three Co-signers in an active-active-passive architecture as follows:
Active-Active Co-signers:
Two API Co-signers are deployed in separate availability zones within a cloud service provider. This configuration eliminates a single point of failure and ensures continuous operation without downtime.
Passive Co-signer:
A third API Co-signer is deployed on-premise as a failover. This on-premise Co-signer ensures redundancy, allowing for uninterrupted operation during updates or maintenance of the cloud-based Co-signers.
Backup & Recovery
Backing up the API Co-signer server and data is highly recommended for streamlining machine updates or replacement processes. This backup can also be used for disaster recovery (DR), however, it is recommended to set up an additional API Co-signer in high availability (active-active) and use it if something goes wrong. You can learn more about backing up and restoring the API Co-signer by referring to one of the articles below:
SGX API Co-Signer Backup & Recovery
AWS Nitro API Co-Signer Backup & Recovery
Best practices
To ensure business continuity, install the API Co-signers in high availability using both on-prem data centers (when possible) and cloud service providers.
If only one infrastructure provider is available for hosting all the API Co-signers, follow the best practices for each cloud service provider for setting up cross-region replication and multiple API Co-signer instances on different data centers when deploying on-prem.
Updated
20 days ago
API Co-signer Security Checklist and Recommended Defense and Monitoring Systems
Tokenize Assets
Table of Contents
Overview
Configuring multiple Co-Signers to work in parallel
Configuring Policy rules for a group of API Co-signers
Exchange or fiat accounts
Policy Configuration
Multiple API Co-signers deployment options
Backup & Recovery
Best practices

---

## Configure Co Signer In Ha Mode {#configure-co-signer-in-ha-mode}

*Source: https://developers.fireblocks.com/docs/configure-co-signer-in-ha-mode*

Configure Co-signers in High Availability
📘
Learn more about the Fireblocks API Co-signer
here
High Availability
Configuring multiple API Co-signers to work in an active-active state is a good practice.
This high availability configuration ensures that transaction operations are always running and that the transaction signing load is shared across the API Co-signers. If an API Co-signer fails or becomes impaired, the other API Co-signer(s) continues signing transactions.
In addition, configuring multiple API Co-signers can significantly improve your signing throughput.
Backup & Recovery
Backing up the API Co-signer server and data is highly recommended for streamlining machine updates or replacement processes. This backup can also be used for disaster recovery (DR), however, it is recommended to set up an additional API Co-signer in high availability (active-active) and use it if something goes wrong. You can learn more about backing up and restoring the API Co-signer by referring to one of the articles below:
SGX API Co-Signer Backup & Recovery
AWS Nitro API Co-Signer Backup & Recovery
Best practices
To ensure business continuity, install the API Co-signers in high availability using both on-prem data centers (when possible) and cloud service providers.
If only one infrastructure provider is available for hosting all the API Co-signers, follow the best practices for each cloud service provider for setting up cross-region replication and multiple API Co-signer instances on different data centers when deploying on-prem.
Updated
20 days ago
Introduction
Table of Contents
High Availability
Backup & Recovery
Best practices

---

## Create Api Co Signer Callback Handler {#create-api-co-signer-callback-handler}

*Source: https://developers.fireblocks.com/docs/create-api-co-signer-callback-handler*

Setup API Co-signer Callback Handler
Overview
📘
The API Co-signer Callback Handler is an optional feature
If a Callback Handler is not configured for an API user, the Co-signer will automatically sign or approve all requests it receives for that API user.
The Fireblocks API Co-signer can connect to a user-hosted web server called the API Co-signer Callback Handler. This handler plays a critical role by receiving signing or approval requests from the Co-signer.
An optional connection to a Callback Handler can be configured for each API user paired with the Co-signer. This enables the application of custom business or security logic before transactions associated with the paired API user are automatically signed or approved.
Implementing the Callback Handler provides several benefits:
Enhanced control
: integrate your specific business rules and security protocols.
Improved compliance
: transactions are vetted to meet internal compliance standards.
Increased security
: the additional validation layer reduces the risk of unauthorized transactions.
This integration ensures secure, compliant and customized transaction management.
Establishing a secure communication between the Co-signer and the Callback Handler
When configuring the Callback Handler server for an API user that is paired with the Co-signer, you can select one of the following options to secure the communication between the Co-signer (which acts as a client) and the Callback Handler server.
Option 1: Public key authentication
In this option, the Co-signer and the Callback Handler exchange JSON Web Token (JWT) encoded messages, each signed with their respective private keys. The Co-signer's POST request to the Callback Handler server and the Callback Handler's response to the Co-signer are authenticated using their corresponding public keys.
While you can retrieve the Co-signer's public key directly from the Co-signer, you should provide the Callback Handler public key to the Co-signer during installation or while configuring the Callback Handler for an API user. This public key corresponds to the private key used by the Callback Handler to sign JWT-encoded response messages.
For development and testing purposes, the Callback Handler can be run over HTTP. However, for production environments, we strongly recommend using HTTPS with a valid TLS certificate from a trusted Certificate Authority (CA) to ensure secure communication between the Co-signer and the Callback Handler.
Option 2: Certificate-based communication
In this option, a self-signed certificate or a certificate signed by a trusted Certificate Authority (CA) is used to establish certificate-pinning-based secure communication between the Co-signer and the Callback Handler. TLS certificate authentication occurs during SSL negotiation and is based on the certificate you provide to the Co-signer.
You provide the certificate to the Co-signer during installation or when configuring the Callback Handler for a specific API user. In this setup, both the Co-signer's POST request to the Callback Handler server and the server's response uses JSON format instead of signed JWTs.
📘
Learn more about setting the API Co-signer Callback Handler in the
following Developer Guide
.
Updated
20 days ago
Google Cloud Confidential Space API Co-signer Architecture
API Co-signer Security Checklist and Recommended Defense and Monitoring Systems
Table of Contents
Overview
Establishing a secure communication between the Co-signer and the Callback Handler
Option 1: Public key authentication
Option 2: Certificate-based communication

---

## Api Sdk Overview {#api-sdk-overview}

*Source: https://developers.fireblocks.com/docs/api-sdk-overview*

API/SDK Overview
Prerequisites
Introduction
Quickstart Guide
or
Developer Sandbox Quickstart Guide
REST API
Fireblocks provides a robust REST API for developers to leverage Fireblocks' capabilities programmatically. Our REST API is the base layer for all Fireblocks SDKs.
If you prefer to work directly with the Fireblocks API, read our
REST API Guide
.
To practice with our API before implementing any code, read the
Postman Guide
containing the pre-defined API endpoints.
Language-specific SDKs & guides
Fireblocks supports and maintains SDKs in JavaScript and Python to help you interact with the Fireblocks API. We also offer guides for languages in which we don't have a currently active SDK.
These guides provide you with a simple example to get you started and quickly past the first hurdles of securely signing API requests:
JavaScript Guide
Python Guide
Java Guide
Need help deciding which language to use?
Use the following decision tree to help you figure out which Fireblocks SDK is best for your use case.
Web3/Smart Contract
Fireblocks offers Web3 connector SDKs for developers who use a base library as part of their tech stack and want Fireblocks to act as the underlying wallet and security layer:
EVM Web3 Provider
: Learn about using
ethers.js
,
web3.js
or
web3.py
with Fireblocks as the Web3 Provider.
Additional Tools
Fireblocks Web3Provider
- A "hook" to connect Fireblocks easily as the signing mechanism is web3.js and ethers.js as described in
Ethereum Development
Fireblocks Hardhat Plugin
- An easy-to-use plugin to enable Fireblocks signing for smart contract deployment using Hardhat. More information at
Ethereum Smart Contract Development
Fireblocks Local JSON RPC
- A locally running EVM JSON RPC module that uses the Web3 Provider to use Fireblocks as the signing mechanism. This allows you to plug Fireblocks into any of the tools that require a JSON RPC URL, including different development and deployment tools.
Webhooks
Webhook notifications allow you to get push notifications for events that happen in your Fireblocks workspace directly to an HTTP webhook URL of your choice. This saves you the need to constantly check the API for updates.
Read more at
Configure Webhooks
.
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
REST API
Language-specific SDKs & guides
Need help deciding which language to use?
Web3/Smart Contract
Additional Tools
Webhooks

---

## Co Signer Security Checklist Defense Monitoring {#co-signer-security-checklist-defense-monitoring}

*Source: https://developers.fireblocks.com/docs/co-signer-security-checklist-defense-monitoring*

API Co-signer Security Checklist and Recommended Defense and Monitoring Systems
Co-signer security checklist
Only
authorized personnel
with
high-level privileges
and
full trust
from your organization may perform the Co-signers installation.
Use a clean, hardened machine for the Callback Handler server, restricting access exclusively to authorized personnel or service accounts.
Configure your network rules, cloud resources, and required policies according to the instructions provided in each API Co-signer installation guide.
Use the Callback Handler to log all approval requests, and consider utilizing it to implement additional programmatic protection logic against malicious withdrawals.
Create Policy rules that prevent API users from initiating transfers above a specific amount threshold within a certain timeframe, and require additional manual approval. These rules should apply globally to all withdrawals and withdrawals from specific external user wallets.
Fireblocks advises against disabling Linux UEFI secure boot on your API Co-signer virtual machine, as this goes beyond the security risks introduced by not validating kernel code. We recommend working around any issues you have instead. Using TrendMicro Deep Security agent on Ubuntu 20.04 is one option for secure boot support.
Co-signer recommended defense and monitoring systems
Although a quorum can be configured to approve requests, and a single MPC key share cannot be used to compromise the system, we recommend adding multiple defense and monitoring systems on Fireblocks API Co-signer instances.
Implementing the recommended defense and monitoring systems can significantly improve the security of the Fireblocks API Co-Signer and reduce the risk of security incidents.
Cloud Workload Protection
: A solution that actively monitors the instance running on the Fireblocks AWS API Co-Signer and provides real-time protection against known and unknown threats.
Event Detection and Response (EDR)
or
Extended Detection and Response (XDR)
: A solution that actively monitors the instance running on the Fireblocks AWS API Co-Signer and detects and responds to potential security threats in real-time.
Security Information and Event Management (SIEM)
: A solution to collect all login attempts to the instance running on the Fireblocks AWS API Co-Signer and provides real-time alerting and reporting on potential security incidents.
Privileged Access Management (PAM)
: A solution that actively controls and monitors access to privileged accounts, such as root access to the instance running on the Fireblocks AWS API Co-Signer. A PAM solution can also provide real-time monitoring and alerting on privileged account activity, and enforce security policies, such as password management and least privilege access.
Multi-Factor Authentication (MFA)
: An MFA solution can enforce secure authentication and access control to the instance running on the Fireblocks AWS API Co-Signer. An MFA solution can also help prevent unauthorized access and reduce the risk of account compromise.
AWS Nitro Recommendations
EC2 - EBS Volume Encryption
Enabling encryption for all EBS volumes is strongly recommended to ensure data security and compliance with best practices. While Fireblocks uses AWS Nitro to safeguard sensitive workloads, customers are advised to configure EBS encryption based on their organization’s compliance requirements and data protection policies. Encryption can be managed seamlessly through AWS Key Management Service (KMS).
CloudTrail - Enabling Service for all Regions
Fireblocks utilizes an organizational structure incorporating AWS Control Tower, a dedicated log-archive account, and automated processes to ensure comprehensive multi-region coverage for CloudTrail. While this approach is recommended, customers retain the flexibility to operate in single or multi-region modes based on their operational and regulatory requirements. Enabling CloudTrail for all applicable regions is crucial, however, to maintain visibility into account activities and meet audit requirements.
S3 - Enabling MFA Delete
MFA Delete for S3 buckets is a security best practice for protecting against accidental or unauthorized data deletion. However, Fireblocks does not enforce specific bucket policies, which must align with each customer’s internal security frameworks. Customers are encouraged to evaluate and implement MFA Delete which supports their risk management strategy.
S3 - Enabling Versioning
S3 versioning provides added protection for data backup and replication. However, Fireblocks' Co-Signer architecture does not require backup or replication of data stored in S3. Customers should assess the need for versioning based on their internal data resilience and disaster recovery policies.
S3 - Enabling Access Logging
Enabling S3 access logging requires a dedicated logging bucket. Fireblocks recognizes that customers often have centralized logging infrastructures, forwarding logs to SIEM platforms for analysis and archiving. In such cases, enabling S3 access logging may result in redundancy. Customers must ensure their existing logging solutions sufficiently cover S3 access patterns for security monitoring and compliance.
VPC - Enabling Subnet Flow Logs
While VPC Flow Logs are a valuable tool for monitoring network traffic, they can incur significant costs. Customers should evaluate the necessity of enabling VPC subnet flow logs based on their security posture, budgetary considerations, and compliance obligations. Fireblocks recommends allowing this feature to where granular network activity monitoring is required.
GCP Confidential Space Recommendations
Enabling Cloud Audit Logging
Cloud Audit Logging is critical for tracking administrative and data-access operations at the project level. As Fireblocks’ Co-Signer is deployed within customer-managed environments, customers are responsible for enabling and managing Cloud Audit Logging to meet their governance and monitoring needs.
Cloud IAM - Service Account with Admin Privileges
GCP creates a default administrative service account during the initial setup. To reduce the attack surface and adhere to the principle of least privilege, customers should delete this service account after installation unless explicitly required for operational purposes.
Cloud Storage - Enabling Buckets with Versioning
Versioning is primarily designed for backup and replication use cases. Fireblocks’ Co-Signer solution does not require this feature, and this configuration has no associated security risk. Customers may enable versioning based on their organizational backup and recovery strategies.
VPC Enabling Subnet Flow Logs
As with AWS, enabling VPC subnet flow logs in GCP provides visibility into network traffic but may incur additional costs. Customers should consider enabling this feature if their security or compliance policies necessitate detailed network traffic analysis.
API Event Monitoring
The Fireblocks Co-Signer is hosted within customer environments, and customers are responsible for implementing and managing API event monitoring. Fireblocks recommends monitoring API activity to detect anomalies and ensure compliance with security standards.
Firewall Rules
GCP creates default firewall rules during project setup, which may not align with security best practices. Customers are strongly encouraged to delete these default rules and implement custom firewall rules that adhere to the principle of least privilege and align with their security requirements.
Updated
20 days ago
Setup API Co-signer Callback Handler
Configuring Multiple API Co-signers in High Availability
Table of Contents
Co-signer security checklist
Co-signer recommended defense and monitoring systems
AWS Nitro Recommendations
GCP Confidential Space Recommendations

---

