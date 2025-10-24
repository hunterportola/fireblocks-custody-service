# Transactions API

All URIs are relative to https://developers.fireblocks.com/reference/

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancelTransaction**](#cancelTransaction) | **POST** /transactions/{txId}/cancel | Cancel a transaction
[**createTransaction**](#createTransaction) | **POST** /transactions | Create a new transaction
[**dropTransaction**](#dropTransaction) | **POST** /transactions/{txId}/drop | Drop ETH transaction by ID
[**estimateNetworkFee**](#estimateNetworkFee) | **GET** /estimate_network_fee | Estimate the required fee for an asset
[**estimateTransactionFee**](#estimateTransactionFee) | **POST** /transactions/estimate_fee | Estimate transaction fee
[**freezeTransaction**](#freezeTransaction) | **POST** /transactions/{txId}/freeze | Freeze a transaction
[**getTransaction**](#getTransaction) | **GET** /transactions/{txId} | Find a specific transaction by Fireblocks transaction ID
[**getTransactionByExternalId**](#getTransactionByExternalId) | **GET** /transactions/external_tx_id/{externalTxId} | Find a specific transaction by external transaction ID
[**getTransactions**](#getTransactions) | **GET** /transactions | List transaction history
[**rescanTransactionsBeta**](#rescanTransactionsBeta) | **POST** /transactions/rescan | rescan array of transactions
[**setConfirmationThresholdByTransactionHash**](#setConfirmationThresholdByTransactionHash) | **POST** /txHash/{txHash}/set_confirmation_threshold | Set confirmation threshold by transaction hash
[**setTransactionConfirmationThreshold**](#setTransactionConfirmationThreshold) | **POST** /transactions/{txId}/set_confirmation_threshold | Set confirmation threshold by transaction ID
[**unfreezeTransaction**](#unfreezeTransaction) | **POST** /transactions/{txId}/unfreeze | Unfreeze a transaction
[**validateAddress**](#validateAddress) | **GET** /transactions/validate_address/{assetId}/{address} | Validate destination address

## API Overview

The Transactions API is the core component for managing digital asset transactions in Fireblocks. This API provides comprehensive functionality for:

- Creating and executing transactions between different account types
- Managing transaction lifecycle (freeze, unfreeze, cancel, drop)
- Estimating transaction fees and network costs
- Retrieving transaction history and details
- Setting confirmation thresholds
- Validating destination addresses

### Key Features

- **Transaction Creation**: Create transactions between vault accounts, external wallets, exchanges, and other peer types
- **Fee Estimation**: Get accurate fee estimates before executing transactions
- **Transaction Management**: Cancel, freeze, or drop transactions as needed
- **History Tracking**: Retrieve detailed transaction history with flexible filtering
- **Address Validation**: Validate destination addresses before sending funds

### Transaction Types Supported

- Vault-to-vault transfers
- Withdrawals to external addresses
- Exchange deposits and withdrawals
- Contract interactions
- One-time address transactions

For detailed method documentation, parameter specifications, and code examples, please refer to the [official Fireblocks TypeScript SDK documentation](https://github.com/fireblocks/ts-sdk).

---

*This documentation is generated from the Fireblocks TypeScript SDK v5.0.0+*