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

// Export functions for use in other modules
export { fireblocks };

// Example usage - uncomment to run
// createVault()
// getVaultPagedAccounts(10)
// createTransaction("ETH_TEST5", "0.1", "0", "1")

// creating a new vault account
export async function createVault() {
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

//retrieve vault accounts
export async function getVaultPagedAccounts(limit: number) {
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
export async function createTransaction(assetId: string, amount: string, srcId: string, destId: string) {
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
    console.log(JSON.stringify(result.data, null, 2));
}