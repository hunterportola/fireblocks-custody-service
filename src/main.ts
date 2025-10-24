import 'dotenv/config';
import { Fireblocks, BasePath, TransferPeerPathType } from "@fireblocks/ts-sdk";

// Read API keys from environment variables
const apiKey = process.env.FIREBLOCKS_API_KEY;
const secretKey = process.env.FIREBLOCKS_SECRET_KEY;

// Check if the keys are loaded correctly
if (!apiKey || !secretKey) {
  throw new Error("API key and secret key must be set in the .env file");
}

// Initialize a Fireblocks API instance with environment variables
const fireblocks = new Fireblocks({
    apiKey: apiKey,
    basePath: BasePath.Sandbox, // or assign directly to "https://sandbox-api.fireblocks.io/v1";
    secretKey: secretKey,
});


// creating a new vault account
async function createVault() {
    try {
        const vault = await fireblocks.vaults.createVaultAccount({
            createVaultAccountRequest: {
                name: 'My First Vault Account',
                hiddenOnUI: false,
                autoFuel: false
            }
        });
        console.log(JSON.stringify(vault.data, null, 2))
    } catch (e) {
        console.log(e);
    }
}

//retrive vault accounts
async function getVaultPagedAccounts(limit: number) {
    try {
        const vaults = await fireblocks.vaults.getPagedVaultAccounts({
            limit
        });
        console.log(JSON.stringify(vaults.data, null, 2))
    } catch (e) {
        console.log(e);
    }
}

// create a transaction
async function createTransaction(assetId, amount, srcId, destId) {
    let payload = {
        assetId,
        amount,
        source: {
            type: TransferPeerPathType.VaultAccount,
            id: String(srcId)
        },
        destination: {
            type: TransferPeerPathType.VaultAccount,
            id: String(destId)
        },
        note: "Your first transaction!"
    };
    const result = await fireblocks.transactions.createTransaction({ transactionRequest: payload });
    console.log(JSON.stringify(result, null, 2));
}


// createVault()
// getVaultPagedAccounts(10)
// createTransaction("ETH_TEST5", "0.1", "0", "1")