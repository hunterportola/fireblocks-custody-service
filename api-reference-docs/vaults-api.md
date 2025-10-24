# Vaults API

All URIs are relative to https://developers.fireblocks.com/reference/

Method | HTTP request | Description
------------- | ------------- | -------------
[**activateAssetForVaultAccount**](#activateAssetForVaultAccount) | **POST** /vault/accounts/{vaultAccountId}/{assetId}/activate | Activate a wallet in a vault account
[**attachTagsToVaultAccounts**](#attachTagsToVaultAccounts) | **POST** /vault/accounts/attached_tags/attach | Attach tags to a vault accounts
[**createLegacyAddress**](#createLegacyAddress) | **POST** /vault/accounts/{vaultAccountId}/{assetId}/addresses/{addressId}/create_legacy | Convert a segwit address to legacy format
[**createMultipleAccounts**](#createMultipleAccounts) | **POST** /vault/accounts/bulk | Bulk creation of new vault accounts
[**createMultipleDepositAddresses**](#createMultipleDepositAddresses) | **POST** /vault/accounts/addresses/bulk | Bulk creation of new deposit addresses
[**createVaultAccount**](#createVaultAccount) | **POST** /vault/accounts | Create a new vault account
[**createVaultAccountAsset**](#createVaultAccountAsset) | **POST** /vault/accounts/{vaultAccountId}/{assetId} | Create a new wallet
[**createVaultAccountAssetAddress**](#createVaultAccountAssetAddress) | **POST** /vault/accounts/{vaultAccountId}/{assetId}/addresses | Create new asset deposit address
[**detachTagsFromVaultAccounts**](#detachTagsFromVaultAccounts) | **POST** /vault/accounts/attached_tags/detach | Detach tags from a vault accounts
[**getAssetWallets**](#getAssetWallets) | **GET** /vault/asset_wallets | List asset wallets (Paginated)
[**getCreateMultipleDepositAddressesJobStatus**](#getCreateMultipleDepositAddressesJobStatus) | **GET** /vault/accounts/addresses/bulk/{jobId} | Get job status of bulk creation of new deposit addresses
[**getCreateMultipleVaultAccountsJobStatus**](#getCreateMultipleVaultAccountsJobStatus) | **GET** /vault/accounts/bulk/{jobId} | Get job status of bulk creation of new vault accounts
[**getMaxSpendableAmount**](#getMaxSpendableAmount) | **GET** /vault/accounts/{vaultAccountId}/{assetId}/max_spendable_amount | Get the maximum spendable amount in a single transaction.
[**getPagedVaultAccounts**](#getPagedVaultAccounts) | **GET** /vault/accounts_paged | List vault accounts (Paginated)
[**getPublicKeyInfo**](#getPublicKeyInfo) | **GET** /vault/public_key_info | Get the public key information
[**getPublicKeyInfoForAddress**](#getPublicKeyInfoForAddress) | **GET** /vault/accounts/{vaultAccountId}/{assetId}/{change}/{addressIndex}/public_key_info | Get the public key for a vault account
[**getUnspentInputs**](#getUnspentInputs) | **GET** /vault/accounts/{vaultAccountId}/{assetId}/unspent_inputs | Get UTXO unspent inputs information
[**getVaultAccount**](#getVaultAccount) | **GET** /vault/accounts/{vaultAccountId} | Find a vault account by ID
[**getVaultAccountAsset**](#getVaultAccountAsset) | **GET** /vault/accounts/{vaultAccountId}/{assetId} | Get the asset balance for a vault account
[**getVaultAccountAssetAddressesPaginated**](#getVaultAccountAssetAddressesPaginated) | **GET** /vault/accounts/{vaultAccountId}/{assetId}/addresses_paginated | List addresses (Paginated)
[**getVaultAssets**](#getVaultAssets) | **GET** /vault/assets | Get asset balance for chosen assets
[**getVaultBalanceByAsset**](#getVaultBalanceByAsset) | **GET** /vault/assets/{assetId} | Get vault balance by asset
[**hideVaultAccount**](#hideVaultAccount) | **POST** /vault/accounts/{vaultAccountId}/hide | Hide a vault account in the console
[**setCustomerRefIdForAddress**](#setCustomerRefIdForAddress) | **POST** /vault/accounts/{vaultAccountId}/{assetId}/addresses/{addressId}/set_customer_ref_id | Assign AML customer reference ID
[**setVaultAccountAutoFuel**](#setVaultAccountAutoFuel) | **POST** /vault/accounts/{vaultAccountId}/set_auto_fuel | Turn autofueling on or off
[**setVaultAccountCustomerRefId**](#setVaultAccountCustomerRefId) | **POST** /vault/accounts/{vaultAccountId}/set_customer_ref_id | Set an AML/KYT customer reference ID for a vault account
[**unhideVaultAccount**](#unhideVaultAccount) | **POST** /vault/accounts/{vaultAccountId}/unhide | Unhide a vault account in the console
[**updateVaultAccount**](#updateVaultAccount) | **PUT** /vault/accounts/{vaultAccountId} | Rename a vault account
[**updateVaultAccountAssetAddress**](#updateVaultAccountAssetAddress) | **PUT** /vault/accounts/{vaultAccountId}/{assetId}/addresses/{addressId} | Update address description
[**updateVaultAccountAssetBalance**](#updateVaultAccountAssetBalance) | **POST** /vault/accounts/{vaultAccountId}/{assetId}/balance | Refresh asset balance data

## API Overview

The Vaults API provides comprehensive management of vault accounts, which are the primary storage containers for digital assets in Fireblocks. This API allows you to:

- Create and manage vault accounts
- Handle assets within vault accounts
- Manage deposit addresses
- Configure account settings like auto-fuel and AML/KYT references
- Retrieve account balances and transaction history

For detailed method documentation, parameter specifications, and code examples, please refer to the [official Fireblocks TypeScript SDK documentation](https://github.com/fireblocks/ts-sdk).

---

*This documentation is generated from the Fireblocks TypeScript SDK v5.0.0+*