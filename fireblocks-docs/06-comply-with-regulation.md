# 06 Comply With Regulation

This document contains 5 sections related to 06 comply with regulation.

## Table of Contents

1. [Integrating Third Party Aml Providers](#integrating-third-party-aml-providers)
2. [A Developers Guide To Constructing Encrypted Pii Messages For Binance Via Fireblocks](#a-developers-guide-to-constructing-encrypted-pii-messages-for-binance-via-fireblocks)
3. [Define Travel Rule Policies](#define-travel-rule-policies)
4. [Define Aml Policies](#define-aml-policies)
5. [Validating Travel Rule Transactions With Fireblocks And Notabene](#validating-travel-rule-transactions-with-fireblocks-and-notabene)

---

## Integrating Third Party Aml Providers {#integrating-third-party-aml-providers}

*Source: https://developers.fireblocks.com/docs/integrating-third-party-aml-providers*

Integrating third-party AML providers
Fireblocks offers direct integrations with AML providers Chainalysis and Elliptic. If you prefer to use a different provider, you can use the workflows below to integrate a third-party service into your workspace.
📘
Note
AML screening policies within Fireblocks, including our
Autofreeze
functionality, are only supported by our direct integrations. These policies will not apply to third-party providers.
Outgoing transactions
There are two methods for screening outgoing transactions: manual pre-screening and automated screening.
Method 1: Manual pre-screening
You can manually send transaction details to your AML provider before sending the transaction to the blockchain. In this scenario, one of your users initiates the transaction and sends the details to your AML provider for screening.
Once you receive the screening results, you can either reject the transaction (if the risk profile is high) or accept it and send it to Fireblocks. You can also set up alerts to notify interested parties about the transaction.
Method 2: Automated screening using the Callback Handler
You can automate third-party AML screening for outgoing transactions using:
Fireblocks API
: the endpoints used for initiating the transaction.
API Co-Signer
: a Fireblocks-provided component that automates transaction signing and must be installed on an Intel SGX-enabled server you provide.
Callback Handler
: an HTTPS server that receives the transaction details and automatically sends the details to your AML provider.
You must also develop a custom logic that determines whether to accept or reject transactions based on the AML screening result, as follows:
You initiate a transaction using the Fireblocks API.
The transaction goes through your
Policies
. If authorized, it is then sent to the co-signer gateway for signing.
The API Co-Signer (located in your secure environment) long-polls and fetches the transaction details from the co-signer gateway.
The API Co-Signer sends a request to the Callback Handler with the transaction details.
The Callback Handler sends the transaction details to your third-party AML provider for screening.
The AML provider responds with the screening result.
According to your custom logic, the Callback Handler accepts or rejects the transaction based on the screening result.
If the risk profile is high, the Callback Handler responds to the API Co-Signer with Reject. The API Co-Signer does not sign the transaction, and the transaction is canceled.
If the risk profile is acceptable, the Callback Handler responds to the API Co-Signer with Accept. The API Co-Signer signs the transaction and sends it back to the co-signer gateway for broadcasting to the blockchain.
📘
Note
The API Co-Signer expects a response within 30 seconds of sending the initial request. If the Callback Handler does not respond within 30 seconds, the transaction is not signed and is canceled.
Incoming transactions
For incoming transactions, you have two options for managing the compliance status of your transactions: automated screening or manual review.
🚧
Important
The automated and manual methods cannot be used together. You must choose one method for screening incoming transactions.
Method 1: Automated Screening
You can use a custom workflow to send incoming transaction details to your AML provider for automated screening. To do this, you must
configure a webhook
that notifies you when a new transaction is received. The webhook also contains the transaction's details, which you can then send to your AML provider.
Once you receive the screening results, you have two options:
You can
freeze
the transaction if the risk profile is high. An Admin can later
unfreeze
it.
You can do nothing if the risk profile is acceptable, and the funds remain immediately spendable within your wallet.
You can also set up alerts to notify interested parties about the transaction.
Method 2: Manual Screening Verdict
📘
Note
This feature is currently available to a limited group of customers. To enable it, contact your
Fireblocks Customer Success Manager
.
The Manual Screening Verdict feature provides a simplified, manual process for managing the compliance status of incoming transactions. Instead of relying on automated screening, it gives you full control to manually review and decide on transactions using your own internal tools and procedures.
How it works:
Pending Screening State
: All incoming transactions are automatically flagged and placed in a
PENDING_SCREENING
state. In this state, the transaction is paused until your compliance team reviews it.
Manual Review
: Your compliance team reviews the transaction using your internal procedures (e.g., AML checks or other risk controls).
Submit a Verdict
: Once the review is complete, you submit your decision via the dedicated API endpoint:
POST /aml/verdict/manual
.
ACCEPT
: This releases the transaction from its pending state, allowing it to be processed.
REJECT
: This flags the transaction as rejected for AML reasons. Rejected transactions are automatically frozen in Fireblocks.
Timeout
: If no verdict is provided within the timeout window (default: one hour), Fireblocks will automatically
REJECT
the transaction.
📘
Note
Manual Screening Verdict applies only to incoming transactions. Outgoing transactions bypass this workflow and are not affected.
Updated
20 days ago
Interact with TRUST
Constructing Encrypted PII Messages for Exchanges via Fireblocks
Table of Contents
Outgoing transactions
Method 1: Manual pre-screening
Method 2: Automated screening using the Callback Handler
Incoming transactions
Method 1: Automated Screening
Method 2: Manual Screening Verdict

---

## A Developers Guide To Constructing Encrypted Pii Messages For Binance Via Fireblocks {#a-developers-guide-to-constructing-encrypted-pii-messages-for-binance-via-fireblocks}

*Source: https://developers.fireblocks.com/docs/a-developers-guide-to-constructing-encrypted-pii-messages-for-binance-via-fireblocks*

Constructing Encrypted PII Messages for Exchanges via Fireblocks
🚧
Early Access feature
This feature is currently in Early Access. For more information about participating in Early Access, contact your Customer Success Manager.
Introduction
For institutions using Fireblocks to transact with major exchanges like Binance and Bitstamp, correctly constructing and transmitting Personally Identifiable Information (PII) is critical for ensuring regulatory compliance and the successful processing of transactions. Sending PII requires a robust security model that goes beyond standard transport-layer encryption.
This guide provides a practical, compliance-aware walkthrough for developers and compliance officers on how to structure the PII payload, handle the necessary encryption, and correctly format the
transaction.extraParameters
object in the Fireblocks API. It breaks down each field and explains the specific data requirements based on key global jurisdictions.
📘
Note for Compliance Officers
This document details the technical data structure for compliant PII transmission. The core obligation is to ensure your institution has a robust AML/CFT program that includes counterparty due diligence, risk-based transaction monitoring, and adherence to the specific data requirements of all relevant jurisdictions.
Core concept: End-to-end encryption of PII
It is critical to understand that you must
never
send raw, unencrypted PII in an API call. The
piiData
object detailed in this guide represents the plaintext data structure that must be encrypted
before
it is submitted to the Fireblocks API.
Fireblocks documentation indicates that PII encryption is a
manual implementation step
that developers must handle. This ensures a secure, end-to-end model where only the intended recipient (in this case, the specific exchange entity) can decrypt and access the sensitive user data.
Exchange PII data encryption guide (RSA-only model)
We only support
RSA-only encryption
for the transmission of PII data. Exchanges do not accept hybrid encryption (RSA + AES). Using hybrid encryption will result in failed Travel Rule submissions or empty compliance data.
RSA-only encryption model
This method encrypts the
entire PII data payload directly
with the recipient exchange's RSA public key:
Direct RSA Encryption:
Serialize the PII data to JSON and encrypt the whole payload using RSA-OAEP with SHA-256.
Single Encrypted Blob:
The result is a single base64-encoded string containing the encrypted PII data.
Send in API Call:
Pass this encrypted blob in the
piiData
field of the Fireblocks transaction request.
Production usage: Encryption & Transaction creation
In production, you must fetch the public key from Fireblocks before encrypting the PII data.
Example: RSA-only encryption utility
TypeScript
import * as forge from 'node-forge';

/**
* EXAMPLE: Encrypts each PII field individually using RSA-only encryption
*
* This is a simplified example showing how you could implement individual field encryption.
* Each developer should customize this approach based on their specific needs.
*
* @param piiData - PII data object to encrypt field by field
* @param publicKey - RSA public key in PEM format
* @returns Promise<any> - Data with each field encrypted individually
*/
export async function encryptPiiFieldsIndividually(piiData: any, publicKey: string): Promise<any> {
 /**
  * Implementation approach:
  * 1. Takes the original piiData object
  * 2. Recursively walks through each field
  * 3. Encrypts each string value separately using RSA encryptWithRSAOnly()
  * 4. Returns the same object structure but with encrypted values
  *
  * Note: This is an EXAMPLE implementation. Developers should customize
  * this logic based on their specific requirements and data structures.
  */
  // Simple recursive function to encrypt string values
 async function encryptPrimitives(obj: any): Promise<any> {
   // Encrypt all primitive values except null/undefined
   if (obj === null || obj === undefined) {
     return obj;
   }
  
   if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
     return await encryptWithRSAOnly(obj, publicKey);
   }
  
   if (Array.isArray(obj)) {
     return Promise.all(obj.map(item => encryptPrimitives(item)));
   }
  
   if (typeof obj === 'object') {
     const result: any = {};
     for (const [key, value] of Object.entries(obj)) {
       result[key] = await encryptPrimitives(value);
     }
     return result;
   }
  
   return obj;
 }

 const result = JSON.parse(JSON.stringify(piiData)); // Deep clone
  if (result.extraParameters?.piiData?.data) {
   result.extraParameters.piiData.data = await encryptStrings(result.extraParameters.piiData.data);
 } else {
   return await encryptStrings(result);
 }
  return result;
}
Example: Creating an exchange Fireblocks transaction with RSA-only encryption
TypeScript
import { FireblocksSDK } from "fireblocks-sdk";
import { encryptWithRSAOnly } from './encryptWithRSAOnly';
import { piiData } from './piiPayload';

const fireblocksSDK = new FireblocksSDK(privateKey, apiKey, baseUrl);

async function getExchangePublicKey() {
  try {
    const credentialsResponse = await fireblocksSDK.getExchangeAccountsCredentialsPublicKey({
      // Specify exchange exchange account ID
    });
    return credentialsResponse.publicKey;
  } catch (error) {
    console.error('Failed to get exchange public key:', error);
    throw error;
  }
}

async function createExchangeTransaction() {
  // 1. Get exchange's public key from Fireblocks
  const publicKey = await getExchangePublicKey();

  // 2. RSA-only encrypt each PII field individually
  const encryptedPiiData = await encryptPiiFieldsIndividually(piiData, publicKey);

  // 3. Build the Fireblocks transaction request
  const transactionRequest = {
    operation: "TRANSFER",
    source: { type: "VAULT_ACCOUNT", id: "1" },
    destination: { type: "EXCHANGE_ACCOUNT", id: "exchange_account_id" },
    amount: "100",
    assetId: "BTC",
    extraParameters: {
      piiData: encryptedPiiData
    }
  };

  // 4. Send the transaction
  const result = await fireblocksSDK.createTransaction(transactionRequest);
  console.log('Exchange transaction created:', result.id);
  return result;
}

createExchangeTransaction()
  .then(() => console.log("PII transaction sent successfully to exchange."))
  .catch(console.error);
Real-world PII data example 1: Binance compact French withdrawal scenario
This example illustrates a common real-world scenario where minimal required information is provided for a withdrawal.
Scenario:
A user is making a withdrawal from their exchange account to another beneficiary, where the user is an individual located in France.
Transaction Type:
Withdrawal
Jurisdiction:
France (FR)
Relationship:
ThirdParty
Entity:
Individual
Example: Before encryption (Compact PII data)
JSON
{
  "extraParameters": {
    "piiData": {
      "type": "exchange-service-travel-rule",
      "typeVersion": "1.0.0",
      "data": {
        "beneficiary": {
          "participantRelationshipType": "ThirdParty",
          "entityType": "Individual",
          "names": [
            {
              "primaryName": "John",
              "nameType": "Latin",
              "secondaryName": "Doe"
            }
          ],
          "postalAddress": {
            "country": "BE"
          }
        },
        "beneficiaryVASP": {
          "vaspCode": "BINANCE"
        },
        "transactionData": {
          "withdraw": {
            "isAddressVerified": true
          }
        },
        "originatingVASP": {
          "vaspCountry": "FR"
        }
      }
    }
  }
}
Example: After encryption (Compact encrypted data)
JSON
{
  "extraParameters": {
    "piiData": {
      "type": "exchange-service-travel-rule",
      "typeVersion": "1.0.0",
      "data": {
        "beneficiary": {
          "participantRelationshipType": "DkGFzfPCLi3SNl6BrrS1C4X/DmuqfVvU83iczY+pDgamI3FUTmzghoGvtjERSH6uqKo3h9gwAWQN8mYV7PGdgkV7cnSS6/H4CNJWV7BlN63RU7DmsmVdHoGbA0F7GnriQvKlnTFPU/CCXJDcsaXG7cHa5VtST8rw+acw73fnUpwUnGMLnw0QOUoYrvu6eGo+BX1aZu+Ve0hrhJTcYXXfnvekkXWCLxDu8AYltJSy4YgzsFNvHb3JyOOuPvJg3qka2NfVrzRXv+7pQy6c4eyErfBJZ6T8i/WXsu9gVZXuOC24wtZi99pP2XGz9ogW2hv9edmEUTitZXneWm26sbtwN9jBPVh4ZRLfGg9wxV1fN/g6MPVbil7Ilu6olO9gRlPj2GUyFIfNPFAziqGEw7CEFvPlQuLv5n2/Pbh98jS/sGANwjKZhXBKyy79WLs/HDVZw6E99+Vxf786HdmIc4MEyj+AELhqcdp8uF0D1/xA+hDFiDpcZjV3JASX9b8EPOaxix9P7TdPepoFoZo4fJFQtaXvAunnsYiG2bE/NareEjLZvqcHadeaCdy29sXCmxeaj1v5hL5GZJFFkBEUa9QLcle0YXQQa3ukkc1W0tChIeGwSEY/qNW/FZ5jg3Pqm8gpdwGzd0gZk/JO8YDIthtTRdgm7zjydIxVZGChTO/h4WM=",
          "entityType": "CvnHs/CzrfdTpGukJXmJH+88n2cW9C0Ezc6HtJtDzN6+e7dk+GoGrK/ia9Kptncrh7Q+6AVHR3pmrJFH10Y8kwxLoNOmJkPtNDJLoVPDSxAn4So7Jw0mA+OGXu8J1e/b1v9u4g3/2L5373MURnsrMydU0vt77YaBZgmZo0dtukLE4kGTnW2lUKexdeRs6NR99r+VQNYG38XGi2/OAjwvBPIAxfmaXBoNMCVda0JZkjlweezwIGL8theV+RMPtQBm8mUsBpbcIiBLAFA4/pQgCKVHZuUMkfaSXh6zPBga6hQu4N0fhLxTj1VwW1Mocd373ifUAn5mziMB4tunObI6jy91s0zunmIajZeHqxIvxci1sMEI6RXnuzKfbkadUzM9cyUMjnzkrQk5q5VuurxfZRqFHuw9Ikq8dNUavAetwgJipUi2aTVh0+uVgZ84QKusJ08LqD3N4k6eghZwIDUkCFXNZnK1reK+oIqGcbs8y0r+Vmr1zh5GukA55+yqRJXu/YxAlS3HIwp+HnhSvM8Wz1O5/PgCHm2iRcP3+pCYWJltkPoKPzynurAN6I1tGSak7+AiPwiJsd5sqdNylR5eFR4N28U61vYhk4nebsvvI5J+7M9+f25hs4hDloV+bmj0wzN3QnCRS3RyaPg91fdCo2iTR5PTuLvjVJ0GX/h1674=",
          "names": [
            {
              "primaryName": "SpDXvmGFXH3qe0jAVZeinBniH18VBPsAqnLz+SxidNd9Hh6XKbs10cHMPoda4Yga3dDLXSZTRMb9hJPbsYlanFgWpcIW6rq4KGeK/Q9LiN1gVSGwZrXMD2Jx/3+hPVcSUqYqGiirZpoeQqJUTzmJvglRCWDDNbE88jFcQ+XEvj0v9tC1rrHrxrowe1QaxFeOt8HMl2PjGVzUGCD9QdRsG0DbBa4To49EsvXl6qCMr11pioCWzAVgYxRJU5HlfikbsU00dxXTVVaHAFGfGgeTSBBVpNLTvUuk7Q4CW4TIa9PiDYiZsT9KW3X0tjXLs0xflrUXMXUWDC3bVfEMcFtM75YyOFrMY4IhGfyND6o+4MyeqC7LmYc09o9wmheiRS/l3J77SNc8w7tlqoSgvVVb45TDpBtf611SQ8GnCQ9rTg9rKROwPXA58micxFKrgVVYfY+E0uo90kzs/Hfw0OohrC/3vS6d3ocXAEp8FEtmCvyRxK+xgTv3obIzL6eVqI2TBDkkyjT3gGBrbS0a8GPZSKUw9W0cNnYjxZ/rxF1xBUG1gg+cE7St2yNwQ9m3gcneoB8U3AA5y/f5Zw7iz5ekAmMdrUFWf5ENNodNNv66KVNQLwpSIWeHiVkr5mqEIooAJDaFDaYKw6A2GRJzU+ZQ7ca3rOumleUq6kXfQcCmpr4=",
              "nameType": "UFvT9EbXqfGJGH3UPsXtRbwyi9VDb3JgEyGXDM6x4Pkk/R8nlfEVnKFSmt0LSU1Vnzl/k8pjMsLcap33RDENMWTRAfjasnqDK7uZCNO8m37SBZiTLmTYrX3k5V4hF0p6SQqvltPV4cye4AwALxZKtc95jzsfJUxgylaXbmuR8+W8RoHZrhid4YCFmarpC8xCz0fcrWrbRtfV/wuv4wHotkX7SQJj0pf31xsRjfDYIV6Fo0tlnhI1JTdVh+ztE9e76OcRdlpM2Fk7UM42+CXUSvvO3iP4E1ot5K7O+u+3a8pcVWNbAIycLlz79fz2LFXiQ7jc63Yg/sG/P2yQqk/ivDT/ZWjSoCNlB8oi7VDpL2ir0Xwh1+D6I9n6f1G4jc0Fkqr0DP00P93jpmBQzqPi2V7TBrnIwxPnQeEzj1SXE0ENMbj2P/PGeinGW34h6/0WFKyyOubMqLnvG5lPUusFPA7NFY7NdS/1OAU/y4J52R9YFWkW9o2jdn9G3iLbjNKx8g0yRbnT0sTXql9E+VCv2HPYS1Wuoqo/S1LhG6j0y9ugUCS1+advbxHm0/4ZD5zJ4+5FHIlH8s5+CJ7/FGFsRRN/R2jAW9GSqdzczzYm4X24l8cn4xHRWR2XO0jqlYmoH8sBMrZVgfvJnDy4KotlthZT5ooIOQJY+58x6gXnUL0=",
              "secondaryName": "KjXjKySekOb13IvuP4ainsMzGCmxK9CUeVI6VMLp3MYxz1zFbZBq95v8Ly5TBoH+RL176yioR5o4l0NHEgL8+vjjSeau/o9cHRZK16VjrGmF2MmpuFeD4NPN9IAsD8M+xeq2X06EK5ns9ebuGCADAiEGIEbBfnjZcJpUhnlllTptbuzBoeaK/k1545XMA30f6SuR+6hGxDBX6rX+vYJOvEBhSfK9km1mJ2y89it38QY2eRcDD8Li4nuLPaKrqzWGcN+Lp8KrII604D9ewUj/a9LfefrZBB5H+gL0XI2h7rVfiYNBJghXakfunS595nBNTjbxz5spuDxE7k0EqhW6t2N70FzyNVUjmxo0nFCSRViONXuiyhddZfRcIeTXJf1hXp0/cujqvOkbdrl2yPXl2pZ0/XZaCHfx76unLaLHUcFKCVpib5FXi5i7C6Gd+8QuBliUiUAdWUJGpcqQLkz7/zALdZLqISZ5WLyKENIt/Rdo/GzQ35CZVCe9TtIIIEHq0wmMArCB73KFzMrrJStefPA4tNtbWM4iwPmahoSWFYl96pIclGNdRdFNTF1jM4VgfboB27YG/6YFJMcWYJvXR5gkbeYUgRRe/q/B7iFvGKdNIrCe34iCGEZ8/hNs+ljBFmcxEbOiFjoAg3sOe3WKnpLaI5jaFyel4Jar7XkKAxg="
            }
          ],
          "postalAddress": {
            "country": "o9MZlFzz76bKfw3giyekwbhpZo3Nn1+o/NTzFQnSWaozIKa9xoAiOE8IvmU9tkT3yZLYOeaX6F6Am2hyzpers9lMHr2Ha1pOFnreQUKE9x2fEFZyAXv625Hz8Ja+ZeywlkbAok1atpc7+JC8GD7quErQwC/qgZ8yzW926JyQ38sZPHY+W0IM2sc7S0KoL77Yu5+gixQPbiUdMfYjimuRRwW+4NzsSOWUcZdQ+NB/khz/7CDc9q6tqYFuHg17sFo6QO2rQSpcgfzDrqmdCX0ZnSRBf5FZG2I0tHA2t24UuRJJGNIU66jr9b4h2pJFWpE+UwSmx8skyI+0DCk4P8gxhS6ZhQ93TGpSgpI5rWW7pJLLzlmEeVF5bm7zYQg2eu0HTUi3DEyUHfW0g/LpGEfLCudwSXRjGUUXI7tSV6BxC4EY7T5pt6RkNrnTdjSo8B4azdv06BqVjYzeJFwXL7Zo4khoaQETQf3PiTlwMQw/WQox/65IfpKfM1KhHtPFCiG1v358q2FO/S0yV6hcKNVRNfrZXG5v32DDZ8S/K8Cs0+XBEBl8OxHo581uahVKONzb2VwBGTxcXouWHVLEq928wDKnhAPvUmFMkHtkpmdSxOWr0qoMUD9WQFvkYqm9RXeczoN/RTsAqMSr1InoqfmqU9TZBCdjiMDnhe4ggAvFKkU="
          }
        },
        "beneficiaryVASP": {
          "vaspCode": "VTiePIZHqIn6q17/SWZ8fdpWga72UvaVjvwBs2PQ/R5DyN6GwDOC6msAFr3+1h/14PwFfawmWXpWu6xmKm7iyUHpMmmnnPlUKSjlNeb+k2QVTHPXYT6eboT3V8gav47mIBfv+XMm2AtXfLRGpWF5or6Q929QqxXgOOl89xwdYxRFnboSB/T9coZ2lonf15F/n+8XEMmE/g77iGwlY5pIi7VmAhi0MIJthRgxIXbuB5yzL1MtaPQr5a4tTY9J0WR6MlMjkeGODV0VyVX90aajDgTv4ocB0TLwGkC4GRTLBsdyGD3jkpp0Lion5ip+BT0MhYg2xvshef/GJ4cob2bZy+10GAdWUbid2n66HQUJjIyPuPtAZLzf/hZiL5dsgykRz/FpT291eoTeQ0V6RIYLBGSqSPkc+n56Pqum0c47Oan5078R9/k5YLpTX9DD464m5pHSPPh/sg5TeBydd31bHJy0EfwGMJPCK4yjaTlK2At6vLzhJ+BZ6au8oWoDvbCbS2bh1jJh5x/V/4HAkv/h7woGb3OY+z/GazfFEhCBAC4WdvGExHqbQhbhcOlbZr3Wt6b3Vx1U06u+acwLUwt3P9yuufAvQkjxYp60nSKKJxjj0Vnk/Qjf1vCXab8y7siEXthVO1MqTsozGtgCqzHw8aNtg7rEAykSd8AHyyjRqz8="
        },
        "transactionData": {
          "withdraw": {
            "isAddressVerified": "g6y8yN5t+5GrJfFkhqrOz5dfJjTRiIO2qYH+OXsRNaTrtoJjPwda7OOnAmuSp2yBdRFTPKxgcWzBo5fofQvOyl64RdrWmtKFkWBDAtJUzoIE5s6yk5qp+wi5+gNdo4bHmrKaJXaOsaKrO+o+kfg0ySt8K1qrsZK7AFa+yqwabUmiDwRdElromyDpACv2n2ol/1W2Oh87nAHIW8fUWsEiuI8nM83X5Do6ZlsUGjTXRhIVVuu4Yd9Jkeld1OSe2iSETFb2XEy0ml5viU5H31AJ1RQaNCvBVpzu/1fe6YgB05MQjTiL01/kn2cT3PlZ5WaKZxXQuuoNAR0y5eeJPiwfdBCCrL7Z8KJpsCRspRBXxXoUFkN56XUfBHaRwoeA4flSLfpmfKYSNcATUr13sd/fH7n6wk6mU8Zl0CJJkoWQaUCk0cM54wxWGeRtgSqPAteBsAw2olBpRrK5fIvi5YWd7ez88CtlIZwfsAI7WaMtZMTTlC8E9BdRhJVjX4neadpVfNYoiVPLiEzfo9gK5jqyeuFgYG1fAhWYvKVk+rw2Csn5iqO/AXhkEQht1riw4BnrfymFGJY8+9hrz+KTUZndG1Xw5GbFlEuitqg9yRGCUdhJVALoSeJ71YCMFIWPoq/3IRogFTqEBtzkP4N9ohUBlZVxPXZhZFc+Axe6SsaH+Wo="
          }
        },
        "originatingVASP": {
          "vaspCountry": "ppyFQ37QrH2GUityQet2+PMZdkqbgxv3tM7hiokv0TLUjZikj6TT/8jaDXumx2itIDKYr+N7zhvPtM9cm9mMWTjo2D7m3LOPNXu0uRPOCNWOQAACOlx21rC5Sc+yUazLq7e8kyi2wlF3ngH9DIjlVeQ6aGZk5q6HEWm4pvuqOaLA6h4qLsLB5VLg4ygEOw0Lqmc04Y5pKRkrB8f4MrAQtzUjwaQabUXheeAncakIKlRGYfOWYnyqKjJ+X7WD2dK95nNHahORltLeZkPVpHz7ERNqlDtRWlplbBT08PZ0pv3IVWxkFDPc1UB5NVGl0PhkdLSmCLvQe8DwmeBMZzC8o0Ks+vLlmJZbcbjYFmosaH5ZlbJh01Azs1xLaYqhNF/NwFSbYqL5vm7GsKS6wXgKCDJkikyIXG1UavKhL2HdrOIXOv07E/ox0pH7Sn8rs3p6aVM5s0fQKV5nRaM9s5ixbC3VAX5uVKG0mBSu9G//Q/RrjUXCdcaKD4lKw9hzmX1linKJCnCjEjwaDpRtPXledumNFt7CWn+dcvjG7xhOro/EeTpTcT1IqcPw+D0NnZLddNyx/xrJC5YMU3yZ7tKHLsvVZyotC6UTTjBQJUCLt0rpEvd7stZtpp/Nn5i1KeSwYbXIaEMthNZQaO63gMi8od/R0LCcYeEHInZ5qYhD1n0="
        }
      }
    }
  }
}
Real-world PII data example 2: Bitstamp compact deposit scenario
This example demonstrates a common real-world scenario where minimal required information is provided for a withdrawal.
Scenario:
A user is making a withdrawal from their exchange account to another beneficiary, where the user is an individual located in France.
Transaction Type:
Deposit
Relationship:
ThirdParty
Entity:
Individual
Example: Before encryption (Compact PII data)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "ThirdParty",
        "entityType": "Individual",
        "names": [
          {
            "primaryName": "John",
            "nameType": "Latin",
            "secondaryName": "Doe"
          }
        ],
        "dateOfBirth": "1.1.2000.",
        "postalAddress": {
          "streetName": "Oak street",
          "buildingNumber": "23",
          "city": "Boston",
          "postalCode": "02108",
          "country": "US"
        }
      },
      "originatorVASP": {
        "vaspCode": "9bfe73a6-d38e-4d14-8089-8d5a06ac7ec0"
      }
    }
  }
}
Example: After encryption (Compact encrypted data)
JSON
{
  "piiData": {
    "type": "exchange-service-travel-rule",
    "typeVersion": "1.0.0",
    "data": {
      "originator": {
        "participantRelationshipType": "UIQ+McWqzwP0DFpWd2Sm3vfduvK6N/S6lWlihgoGTE0AkBGbmqkMzgsES6rqOl5fcliHVYOh/9CdTn3tNCQXKr8yCGnBiiY9rF9ANSECbmJkm5b0h1i1Amdqna3il995Q0Lit2Zq2an5SP0vglj/3fd5F9BRehQOoBhW9+p5gYWxB3ICukdVHO0L+YLtzrR3nY0L8LESmipZ95wmJii9puiULgeEV8Xe58MyK/DHHuerzjlpvA2T18qp/p/y0aHnSFuWlGQum0BhWZ3xIOb8g/pwHszYaBzSo2tfOYg8Gc10/7emg98mlLybVdKtioKu2Jsdjj0v6BHzlp8O05UmGXecpWc0LWRCUENOV4ui+YF9dBMY/MArJNVd5E5eIuT7VmayQ7eEpsyX/ymJCPLwDUFnL9Ibl0SW4/Y17Nmz+jjTrWqXroyUgqTuYFZZNf6IRHx89/Jr7d5LlfFRHzwgDiolPRM6gfC8/5hgc1JZzk9kh1ym75SRgIVnGKADwCz8rtwfxMRIK+X91l7bn5nNb19oEoiX8hfQi+o2VSX1gUhIZQjyPz4FFdfDsyF90WQdZrCxn8irf9fNrstxQZcJicYTXnxvSFMHnqWF8P459qatcTAWpujsQnHAaXPa5Oc/fMX3Sst/t4f/onKAa/s/t0sfOwlaaGFHwMZpBgUMeDI=",
        "entityType": "c1WbvG7ievrsGv06wb7dghictBBkSJv5E76e+mXeUeO6NXOZuTzL1PiJoqUAM0h9o2fup01V+uIQWqavYmPbiooFofAGaLNhKC1kK4I39xuG7w9hEYQwh5+5J0J6yLOkVe5+pJD1d56fuV6RW7kikIpcTmINSwBMMNVfdhcFei4paBxNLuICMafMM1YzHHxa844qDpP0L0YYSz3rfJQ8Fj6UFGsg+EXqMwxSSWD9tOO8w5yfzc264BndN8byU0c7cXJtgRTkTXppCcMJtXzvRRYCQ/1mYNqcaOOgXlv4XkUfe2+/+PhSzMw7mI2rhkMwxLOpchiNDmhtglvK7kVW+3jbebzvgfhPyVWcjVweWjtgWAznfhX62U8mWWfLWMhJX++8IInh5bZfdnBAzp6hRDK7u1cxRUeBwMvdvy1rPXmUnNpsgLEXwb1WNGH3MhCbDKSo4e0J0E9/SooV4ZZJDaMcpF48rEfBy5I1GEBGzZcJBuOO1FkwqUH8Y160+1FPMe/vdy9Lee7C0r7u2ztQmU4z5m07k30mizQJly3u8bEAVpktoGuc9ujpYG35K15gybOCb7ll6+5Lzl5n4YKqM1Gfk8GSRdNlxD1MaVgKtwajIvpWTSZn416znBQWcEW1Tnezf15c5G9OM/B7LKiDhJ9OMI1fYZvGFf3Nk6A27oY=",
        "names": [
          {
            "primaryName": "JnR/jKh5u+x1BTUT5j/H6S83firFCO7gYEfVe+BBA0K7Ng3KoPA54VUt/6oXAoXQP0JZIeli3sffmnPB74XC99OTjbSyEFm2V2hGff3rAJAJ9b15PhFSDS0AbQKAV+BZeucy/nl5gOyh7mo/eEqSzEjfclj1zAYQsfDbuiMATl85vgsFqb4Nt+EwmmyiWPcUUXmsFg/eHJsNi/F0U3jsyGhD3djcloJF88GKV8dfF2XteQYMkegbLlBLPwXx5Ey+9v1fsx9FcB6oN8eu4yMISuxF86KPXMHgX59ZD2Rgd218d2gx3Fdnm0AeHq0+Sc5tJ+/URRYvMhF59+ubnIb3cIqOyslkLAngYtwK3M6aUAxpTs6tIbrBDd1QMFZDLugHgwXaTV1tRxY7bCM75VUmi0TIJnF3T5kgPtEAaiia1VbH+amxYHk7q7V1jVeevJv+TpwSZ4eiBBpx6pZEVP4iHgTnqFHgzjtX9MdQaG76LEED6HQjeIs3ikFNrpxn1YZMkaTFnuP5NiUELN823gSYVtIyUC/Z4gjxRD3X+tOrGcUq+ntYP9zj7ievPsc4JGHHF3H/tfFqbC2xHLD4cTkeLanOgpGkJkAX39EUqmxwmmyp2JRPXcly0PE++RRY6TjvX6JCbeFRrr4ycFq6sIT0p3LdfNqAjm0gyqqBwnYgEXY=",
            "nameType": "AUZXCG+yLWovnc574QwAsz3g0Yb0TnH5C41oODS2J0buSDBrdjXWoyCH3L5a+43lWBGKjqDEO5IlbNpffwRXN2yoLG6KS4z2amFDzt8wKmq5WBqZRC6RcM5AVWsqDRv+HT/44CmIXJlHDKZC3h1AGPQ0Efh6YbhTpdtIxXddzFi+PlhApnkXtyUa7KhWQQ+kQ4H+WifDFu2oSJ/2CXkpT76Sbj6O3glrBa7JRg0lIRNgV8+Xcph/8Ws3mTthkYYgac15YzO023qf3aU1N8BOyEwQuyyZUc64BTzK242uv3c170hSU2DSLAgDEJ8F4UW1w9zTp+DW/uSe7oe8l/rUSN/58QFYK+MAPAdGVA44j++sF8IuzImbXXI6ku/t8XXUFr/ToD7Vf5wgKRbujwEbiXNnGDyVDwiQWQaP20lKlhJjeYijEnWbUHslIiY4KSUQv5XYYnc7tWSt1Iy7D8XPtvO1Vp0Hg2hOGSqlwGHIN5DQY9h1QAAguSBsWf34f7J+PnSUI8mK3itmgx46/OGrYwuKwAeM15eL/afLItPJyqtvu/zAtOgo90MwK+/z2b8VJFzxyt0e1tr8c1XqfX+9y4Ohp4AMrvgaWKaNfdqVbWUjMVndWbh9SYABGyh2jC+azjlkxG3G/M8ncj9EVYs+NFCjFj878QZCovF0S409zek=",
            "secondaryName": "SJUSYKA5w5XAeS0Oz/wmhMsGqvZ2J94iJ7jXUC2BIbf+1rtzlD5B4x77fxWXGh96dDgQ6Cr+COVz7ebvSStefJDRbu65jFDcQRC0y6cnfaeU9DrERrmcbobA1LWm0/xkGhYQIEZnGaxoxYZOn8r65PD4l7Mua7g4low3lhjBGkzsNbtrp5zlGoh8QhYXpzpj0Z7oMGEcCmesx0Tq/lb4Mp7Uhc+4/njT0rFk5Ogw9G0y8VD3UEFSxhThwT8FnKwdksyNHDuTm+sJ17ozd2dN47mka8tSMEp7NWayT5rTj5CMM+P8MOV3D1EEODOaBMo6XULCsApgzDOdtXDnjCMwWJqNzYNts16fqWktzpBy6Z8iB+IDPqMbpoE1GPLSvd6RIgcjocp8uJ0wWOXxVNXV1pH0I5jOPEcM/4Q3LA/kH/3Stjdvbyx7alYkRP4shuUP9ZWUdAPwAklRrtgdSaItOhm9wuuRzTzIu8OlFBsfd53kpiYKZN3FrzeQ/XeQNwvqj5yTH7BSadyG89vXyt/JObPjK87VtY2Tk8EWOnRtCIoZ8YQXnONMaYheJgje26i/ZYI1jUTneL7OgBwkePzRBgRgsISQ7NVgIqbZInEmLuaH7dpUT5pyAB4lFQD70vR79R5+S3iEx4UbcN9CtPYlmLVXw8SsuMQ4z1SI4zIm258="
          }
        ],
        "dateOfBirth": "rvku0/k2oXk51TcqHmWJRXGNtdEtU0ruluSIOj0XytFfuQPRUomhekaGJtm2GSR9WgEa+KS4hrwtZ+87TgL45tIvEXkANurXFtIaI2thsiSfWDGqCHaFi5n/cLCUesnThU8GGvgrzlucZIWH6eQMkbVSn3HVZmuUbIDMbfieL4NI1l+T63Q6vbxRtMzfzJMDI3hiRn+7LS5BG0uLNsJ7r2cc2NR5hFht6nfKKiLn2SIL+ndoWYzVKy7vDEeNT6frbMeICCGdJVSxX+vLdhSAx29qYlQ+75iPJ4bMi5PPuJd7yp8l/14AUbYkBqjC+9tTu2zEKH0UPm1IqxHdpMpN+OJ05J+9tMOL3S/jRahqk45P/0rDuWBkyvRRsANw6Ajn/rIplw05QJA1H4k/wbT0gYU6iVF7chXA7xFS2897TtSISsKzHy3ux9sFRbeyWs2jTicuNNllECYtgs98LrAbKEewFyJ4r3vNJdNOirte1xAIUD8/BAYGKUb+74f/Yb32DlgOe8+emGtrTQZbyzqjNrnXVulONXaS0DQJ6wRMMtyOwothBZg49Jw9hjqQPMpNRU4Icpd05mmMkKkJJ8uEuDUWA5CZYHrsmYTTysxdrYUDa+BNwgL7V3zp9geZHbdoEyaPGTSFNQKiC/WL5NC4O9r+sM55QHRBRoc63+zt58U=",
        "postalAddress": {
          "streetName": "HILYP3i4FW252ELMopPjbC9t2U91+cXyfCCsaJwHkx01L/qlL8UX+h8YAuY0zsW8WEv7H9h0ZRDKqDZRdQ5zeL9hLgQUnWNoSi3ACIQR1qsa7oMoVNfhWn0tgTSKYuvkWYIuSGV5J4vwBJysNXPbtzft4bBxR2VW+nP0kxiDqslkF1mxa5phy1uoJZHauTAZIxpoatFmBTAEldSpa5IxoVrWQj4fYjQiYPAjAF46ssLVQZwK2EGnexFlc6oH2XAZtTw38XthOt7aWpPrJpLFl7iQgpVPhALfINQwgff6Y3o3XQhY2Jr/IW6P11mOUd/FrpjIo8jwrnk/5i2S52z2fotgXS7mjinm6HvqCDaUCujX+3Bo967wmm1ENAaH5Bg3OssCA+k/VXI7o7fAQ7fLUfnZcLxxKR/8108DN+Q1UrULeyk5f2IA+xTztxQHbnUCRMYfJO3nP91odKF3xkBnms/OVlNBcTRB4dBr8I0CdmmKv/3/4WU1BoHnlwMN29bPagXAVp2mHcj+J2HSoN3viC/Om0QITmD2hToX1smpBg1UQYTX3URu6uJEWiUqQZft4q9DSMgyXT6/rBskpTPGuWR1J+ULWXF2Id1ULzrRgPuszxx+a4SK8iXtWFeMGh+Y3o3SDoqXyVcigqDYJpIzuomJzVgzowrUBbwdmL3sFAM=",
          "buildingNumber": "flSWDJwwX8yDTOYbG0+D7PNQQm84plW7n12yP1gTVTL0dNt5DlWqgGCs8fXfVKH1uqCc73s7jqmX+uMej0Grb7Cm33fp330+113OnjZUnCxLRI2jXls6PFBKO/poRMyUQql/waDIfnM4bJ230cu26Ki5B0D0mDrMEkb9IIkILp+7E4lkttWmZDAez/CG4eO3PJ8NiYr15YAm4O5VCJYbgHLSHC/11+pOiinMHzySrTrDM6D/gmZ1TnqD51Y9CbgS6VWIlwOOjwSGpUEc4rUXDTedoYxr440KYLdbDpl4mBB0Fckz+UuyRxoTzyfOBYcWMdBYIm8EeMq3g2aQFfP8u326v1vmVIrKG4m+dITy/H8XZ7GJVpVm95NAtblRxQPNXSIieSQZyuKP4WHU3XlaSvP9GK519mNHPAsApOZpLLH+RPnqnCXMGcr/ZQ5tvRQWvOkO5N4HQjeVUHvrCZ5lJo8aYXFN0qKMi2T/icCm58YPHGEKj7gQM18ZtYh5SJCH+VAVbBt2c+49sCKX+A8BLeVEvfYkgIF8qCNQlal/6+LSMmMzv0MO/751CpnqpGLvEsqfx9/lgaSvxZ3RSJ2Ac1faBMAhiKP8DMoLeTNm4ooKjFBRzoP69JUPeKPZ+N7TvhoyJgL7Z/6HQ+Hs2dwsTW6W/tBwpRyxvBOjOJgwey4=",
          "city": "W8NUxiw2sMgIR5tCM75oTyaI//HTejVm/ZtYf8eec15C9J4TrUSqKKZ9By9A44nMLTQEkwF6uGNS1msS24fq48I6X2dV219icb1WR/r/+wW8HAFi0qjofqYV4hslIhF3lfVLP4R79i9uDYwMhLYcRxMFCXDMTe6zEg0b+qav/7y/6XS6DzUeHUpZhnDjQ65kNpQoAyNiw+1vXaqZCJf+fIlbSDxLGaLAZe5ue26wishv3rmqQdrALmdz5VlMG5tDrz3FakK/vup4SMMsKJHYmFCQnq+3lssB8gHsf/6swa/FMTKVEY6dOTeelcQzawfUu7O/Q1Rkb7O0ht8LquyxNgXIt2MSn3hvEucI5w/e1ZSLkf/mI+RmTsqAccR18mQRL4KAlgYtkWWBAr240k1svWfsG1F2BxcvLaqZiGOY99mjLjY3zkTWDyKHJOb5+DvdedyVaJkIoFAnuCL/iAP3U7vrmYnuFCmnlu2TsqWp2UDD59VhDo8xMl8sAuiqrRZnUDMrqMKOOAvHOvJUKWDG7iV7u8RnYO3vqMLCsIx7bVzpYs8pydCUaNesVrZYOkUGiUoCGcSQyy5O5XcfBzqo1UEY9lfkEvYDKIOOjpt4xZCc62faJv3NH0g+4w+4Fjzyozks+PgjyA0roqp+iaVSRSGeg6x/YDuvkY9W/yaOHGg=",
          "postalCode": "jycssk3S7asgoMs2mqT9HDTGQjcbEbnKWF5OFMbekXIjG98dexKySSzODLTYBfAbGcWTpA3oH+PxUzHeyZY8NJ6RNhvHjhmacsoDp+Yt9aHl9htJfwDHvkpB42sJb90suPZ3gJIOOLs2Ac1oesjKv7pdotqMZ+3YAT0xunzSAFNGrU00WW9jSZ7qavzq84QzrkhjrnlxvrKaon4C/D136kxNopcorrF3SYxRG+bD3pFbEahfnDl5pW8+uZelUIdqn95iDHWgy3Wtkh6T1jIi21rBItZ9sXmfas7x4Lp81Pw/0sid817y11pydGlK3k9rbbxPYem+zclV9QMLW4qQMZBgKaHGAvpjBdtx+OmtlibJMxKZStWCo0oJof+BZOo5LS+FKRDFCFM2sP49xnsFMjRjuPjYfAupHEoQ4rx5x9RJLED8glix+ozeyMCWN9ybW4j03qzu0hY7kk+rOCpH8C2bQaxZkDXxO+iiFhdN92/CSoQsx0dtffWe322slEuZulcXUTZ/Htk7WsQZgnqNbc77Pffrrj8ralVPY3UEnqwjtfVHkx/R1ChJNvUOHCb+VZR37iYM924iXnaZRhF0htRyNDm/VKNT8wnJgEOU0sK6QhYJTz1IOsms0M/r8/tE4EtTuIlXFHeM/ekm0a15sGDzwPmfw6y6GWhWqFVWz2A=",
          "country": "cC8LkS0FvsXXe1p04SeEqim35LDfW46Unhb6xXQbg8OBWsMSjDxA2xwOiYuRu33HfTObf3o5CHiHL96iJXp8Ou1IWs07s8kr80U1DpThBbe90a0vk0CfQLk1TYN5k/SGz8x6cyUyqPSqOGWOVFBcvqgCWJ0C8upZT1U1jYLW+um7dqiC84a32othiZkHiwyMnY6AlwG/kcIsrXxNpmoH7MH9mGxXqHg9y1reL9f8HWw9N48OBKeHHU83DiFqnR5ZvSMWRlyQko+wVh/a4gLkfWNtKcWysTnhw6dU85rXoz+CUJdjdDCYUmn40EYF/hQixj9hTOvY/aNv2Uh2IjQWDhify3iel5UGHMv0bi7amWrPkh+37rtmyteZM9oYRRusgKgTW9M2/Gm4kq/f8IarCGOcgLeXbxT1qnjAbCZXNiflC1nKVmLFqnH10SL+l/KDdIJLQZK4JX8oM22W6hP49ALqkPp5ONyNHGoJtUVgk9lbWGSMmp+U2Niye7TlC7G1XpCsJlt6zfYUsUG3tOrkJM6LsOlXHf0rrH6wLF4j7APCahQ3Ax9WvC/lFarY11tEm1mf+VwBT6LwljA1gOWmMHAI1jHDrcNaNKl7mSF4NzLaZdw7ktHqYL2wm78XKKPaI8Exi0kGrwpgdohw8FnByK/eioAr9RRfvAbFxXR+lhI="
        }
      },
      "originatorVASP": {
        "vaspCode": "Qx/d5nSqgW3i/MllXNJ/k6uaQvNZJ3r/egre0TjzsEtR8lILIe9fh3HTd5cAT68Gl5T2K+tjeMAR9hUfRe4sMtybpsUV5Z/yEclIqMg9L90Jqtmx8irLHvzaOS+3o1SoWEiFbn6p5lXPkElCHaj3ruVCXBqw0+rXUXCbVFgG6NFKJ4ZvkaJsxO2+n9h9JDEpGRqTR3KpRudfwxiC7afC03xUrkh0OYeegZ5YlrEMDrUGjKG3lFjjbGZL0JAywh/RnA6fG4dXW9VuD+0/x0XtZpG/6YSUVmQJnwAEhfGZnk2CboL34XQUpsKA+/naLP44UNjkbhsC6y4VPg5WdAv5/S4sTdKj5Wx/RUhDKissldSEdxHKSfogbESvllZxctqA68sliuiB6y8Pj10WDNruoTU5N+kwOa/9asLhDOrYykclvtNNwGUgG4yg2jSz1N/pr2J8BOqzRV6jQRjKeHgrtSnglgZS59/isjz/TjNR4AHHJbaH6wsJl0VAQMCuphv/zaVZwBU81M9uUxHyg1wV2HT6nKTf8H8U6mWuH/SwuLMYa8seS9f4yH4GbAoGLkLObVwGtbxvTH3mcgPPzQqzOujmhEO1OeftUXgnBHjns4mUnvV+TireHTMtZMv0MR8tG3Bff8pg/zymrlaLKzjfONALN2kQ+c4QO7lIO6S7WOo="
      },
      "beneficiaryVASP": {
        "vaspCountry": "fVJdps6ZNAOhABTF6lAF7hui3dGL4ijQfNinhE70UAEBVoy5r5CQ98f0iu5wjkDk8lxmskDBf2ltHVzFk90RMG5VHQASWMLXwv6NU+xp0k2tp1AFRUX3CdmsWgtoTRAMPHCmJLvwIJGkNBZDGWx84kbzIwosZ0mKfjvrm7UnHGBTSa+aisJ+DglQsBp6MxCxgQLbDx+6+MwTarrt7FQ5l5CwUEs9+3yabQWrHLjmrwHtYEGAlIjtkm0FDKskqkpysEwC7BPt5drL8UTq2GdH9UMU93a6LixJZlZpARZPWEEwPu+v0BjcIfFCBDcG+Vo+3u3lQjaJ8wm2hdIdF8Rbjg7vb1b+IFHN6Gnk4Y7zxZ/lJkKO17RxntNGXCesymKodwXKNXZt0mJMegmyXQpG1srfiRCZ7pFf3HcuKsbiXEkvd+V+//60rkGJGxFoQ4FZcbJqD4dKA3E4cVmdMDPq6EzzO/d0s4X1DyXQ8+6HuQ9Ai7YgvaPQIrYIRKWntG8tEDKCrEyQN+7WQzejmYU3sQe4+M2okH7gBoe8o3GpNmqPE/JxUO2t5tdbLieiySa+vX3T6N2DBc8003miuUMXMDfX8Jf0gi7Ynp8PXamtIj2T3ovbwTDGokdZ3PC0tsrKBHbwAiLxfk7K5S9BXObMGnHgIvpv2H1lydJjrI4XYf4="
      }
    }
  }
}
Mandatory properties per jurisdiction for Binance transactions
The mandatory properties vary from jurisdiction to jurisdiction. To simplify mapping and usage, see the following resource:
Mandatory properties for Binance withdrawals
Mandatory properties for Binance deposits
Mandatory fields for Bitstamp transactions
Deposits to and withdrawals from Bitstamp use mandatory fields instead of mandatory properties per jurisdiction:
Mandatory fields for Bitstamp withdrawals
Mandatory fields for Bitstamp deposits
Final checklist for developers
Before deploying your integration, ensure you have completed the following:
Select a cryptographic library/SDK:
Choose and integrate a library that can perform hybrid encryption (RSA-OAEP + AES-256-GCM) using a counterparty's public key.
Implement public key retrieval:
Implement the logic to securely fetch the recipient's public key from the Fireblocks API before each transaction.
Map PII fields:
Ensure your system correctly maps your customer data to the fields required by the
piiData
object structure.
Handle jurisdictional logic:
Implement logic to determine the required PII based on the transaction amount and the jurisdictions of both VASPs.
Encrypt the payload:
Confirm that all sensitive fields within the
piiData
object are correctly encrypted.
Test with Sandbox:
Use the sandbox environments provided by Fireblocks to test your implementation thoroughly.
Confirm data accuracy:
Work with your compliance team to ensure the plaintext PII being sent for encryption is accurate and matches the KYC records on file.
Updated
7 days ago
Integrating third-party AML providers
Mandatory properties for Binance withdrawals
Table of Contents
Introduction
Core concept: End-to-end encryption of PII
Exchange PII data encryption guide (RSA-only model)
RSA-only encryption model
Production usage: Encryption & Transaction creation
Example: RSA-only encryption utility
Example: Creating an exchange Fireblocks transaction with RSA-only encryption
Real-world PII data example 1: Binance compact French withdrawal scenario
Example: Before encryption (Compact PII data)
Example: After encryption (Compact encrypted data)
Real-world PII data example 2: Bitstamp compact deposit scenario
Example: Before encryption (Compact PII data)
Example: After encryption (Compact encrypted data)
Mandatory properties per jurisdiction for Binance transactions
Mandatory fields for Bitstamp transactions
Final checklist for developers

---

## Define Travel Rule Policies {#define-travel-rule-policies}

*Source: https://developers.fireblocks.com/docs/define-travel-rule-policies*

Define Travel Rule Policies
The
Financial Action Task Force (FATF)
recommended the Travel Rule in order to combat money laundering and terrorist trafficking activity. The rule states that Virtual Asset Service Providers (VASPs), which include businesses that exchange virtual assets, must provide additional data on the senders and recipients of certain transactions. Each jurisdiction decides which transactions must adhere to the Travel Rule and what data must be included.
🚧
Fireblocks does not permanently store any transaction data needed specifically for the Travel Rule.
All Travel Rule data is encrypted and stored with Notabene if needed. Fireblocks does not hold the keys for decrypting the information.
To help you comply with the Travel Rule, Fireblocks provides integration with Travel Rule provider
Notabene
. Notabene analyzes your incoming and outgoing transactions in real time and screens them based on your workspace’s Travel Rule policy. After Notabene screens a transaction and determines its compliance with the Travel Rule, the appropriate action can be taken automatically.
After integrating Notabene with your Fireblocks workspace, you can configure and manage various settings and policies. In your Notabene dashboard, you can configure settings related to your Notabene account. In your Fireblocks workspace, you can create a Travel Rule policy to determine which transactions should be screened and what post-screening actions should be taken based on the screening status.
You can read Notabene's documentation for more information on how they integrate with Fireblocks.
📘
Learn more about Travel Rule Integration in the following
guide
📘
Check out the
Travel Rule APIs
in the Fireblocks API Reference
Updated
20 days ago
Define AML Policies
Interact with TRUST

---

## Define Aml Policies {#define-aml-policies}

*Source: https://developers.fireblocks.com/docs/define-aml-policies*

Define AML Policies
Since privacy is a key principle of blockchain technology, transactions on the blockchain do not contain any information about the people or organizations involved. However, criminals may try to use this anonymity to hide illicit fund transfers. To prevent funds from being sent to criminals or sanctioned parties, regulators in many jurisdictions have begun mandating the collection of personal data for users transacting on the blockchain.
The Fireblocks AML feature allows you to automate real-time monitoring of your crypto transactions in order to ensure compliance with Anti-Money Laundering/Counter Financing of Terrorism (AML/CFT) regulations, prevent interactions with sanctioned entities, and identify customer behavior. You can integrate your Fireblocks account with Chainalysis or Elliptic, our third-party transaction monitoring providers, to retrieve AML/CFT information on your incoming and outgoing transactions. You can also implement your own custom screening logic for AML providers that are not natively supported.
In either case, your AML provider analyzes your transactions in real time and screens them based on the policy you create. The provider then returns a risk profile based on the transaction details (including addresses). You can approve, reject, or receive alerts for transactions in response to the provided risk information.
You, the transaction owner, are responsible for compliance reporting. Fireblocks and the AML provider make reporting easy with auditable risk information available for export. In the event of a risky transaction in a jurisdiction that requires reporting, your compliance officer will need to file any regulatory requirements with the appropriate authorities.
Transaction Screening Flow
Outgoing
You initiate a transaction in your Fireblocks workspace.
The transaction passes through your AML Transaction Screening Policy to determine whether it should then be sent to your AML provider for screening.
If the transaction should be screened according to your policy, Fireblocks sends the transaction’s details to the provider to receive the transaction’s risk information and to be registered for further monitoring. Fireblocks shares the following transaction information with your AML provider:
Asset
Amount
Origin address
Beneficiary address
Blockchain hash
Your AML provider determines the transaction’s risk score and sends the result to your Fireblocks workspace.
Learn how Fireblocks handles outgoing transactions when risk scores are not available immediately
.
The integration approves or rejects the transaction based on its risk information and your Post-Screening Policy.
You can configure your Post-Screening Policy so that you receive alerts when the transaction’s risk information becomes available from your AML provider. After the screening, recorded information can be viewed in your Transaction History, the Audit Log, and your provider’s interface for auditing by your compliance team.
Incoming
Fireblocks detects an incoming transaction to your workspace.
The transaction passes through your AML Transaction Screening Policy to determine whether it should then be sent to your AML provider for screening.
If the transaction should be screened according to your policy, Fireblocks sends the transaction’s details to the provider to receive the transaction’s risk information and to be registered for further monitoring. Fireblocks shares the following transaction information with your AML provider:
Asset
Amount
Origin address
Beneficiary address
Blockchain hash
Your AML provider determines the transaction’s risk score and sends the result to your Fireblocks workspace.
Learn how Fireblocks handles incoming transactions when risk scores are not available immediately
.
The integration approves or rejects the transaction based on its risk information and your Post-Screening Policy.
You can configure your Post-Screening Policy so that you receive alerts when the transaction’s risk information becomes available from your AML provider. After the screening, recorded information can be viewed in the Transaction History, the Audit Log, and your provider’s interface for auditing by your compliance team.
📘
Learn more about AML:
Check out the
following guide
for more information about Fireblocks AML integration
Check out the
AML API endpoints
in the API Reference
Custom 3rd party AML Providers
Fireblocks offers direct integrations with AML providers Chainalysis and Elliptic. If you prefer to use a different provider, we recommend setting up workflows for integrating third parties with your workspace as described in the
following guide
Freeze & Unfreeze Transactions
Auto Freeze allows you to set rules to automatically freeze an incoming transaction’s assets in your workspace for further review upon receiving funds from a suspicious sender. Fireblocks allows you to automatically freeze incoming transactions based on the default policy or a custom policy. You can also manually freeze an incoming transaction using the Freeze Transaction API endpoint.
For UTXO-based assets, Fireblocks marks the specific transaction's inputs as unspendable.
For account-based assets, Fireblocks marks the transaction's balance as unspendable. This means you can still use the rest of your wallet or vault account's balance for other transactions.
Once Auto Freeze takes place, the transaction does not continue to other steps in transaction screening. For example, if you have both AML and Travel Rule enabled and an incoming transaction is automatically frozen during the AML Transaction Screening Policy, the transaction does not proceed to Travel Rule transaction screening.
Users assigned an Owner or Admin role can unfreeze these funds using the Fireblocks Console or the Fireblocks API.
📘
Check out the
Unfreeze Transaction API
in the Fireblocks API Reference
Updated
20 days ago
Boost Transactions
Define Travel Rule Policies
Table of Contents
Transaction Screening Flow
Outgoing
Incoming
Custom 3rd party AML Providers
Freeze & Unfreeze Transactions

---

## Validating Travel Rule Transactions With Fireblocks And Notabene {#validating-travel-rule-transactions-with-fireblocks-and-notabene}

*Source: https://developers.fireblocks.com/docs/validating-travel-rule-transactions-with-fireblocks-and-notabene*

Validating Travel Rule transactions with Fireblocks and Notabene
Prerequisites
Introduction
Quickstart Guide
API/SDK Overview
Overview
📘
Note
This guide contains links to Notabene API documentation, which is password protected. If you need help accessing it, contact your Customer Success Manager.
The Travel Rule states that Virtual Asset Service Providers (VASPs), which include businesses that exchange virtual assets, must provide additional data on the senders and recipients of certain transactions. Each jurisdiction decides which transactions must adhere to the Travel Rule and what data must be included.
The Fireblocks API allows you to send your transactions to Notabene to ensure they comply with the Travel Rule. After creating a key to encrypt personally identifiable information (PII) data included in the transactions, you use the Validation API to verify all the necessary data is included for the Travel Rule check. Once these API calls are set up, you can use the Fireblocks SDK or the Fireblocks API to submit your transactions for Travel Rule validation.
The following transaction routes in Fireblocks are not subject to Travel Rule screening:
Gas Station to Vault
Vault to Network Connection(s)
Vault to Exchange
Vault to Vault
Before you begin
Before you can validate Travel Rule transactions, you must create a dedicated DID Key for encrypting customer PII data and add it to your Notabene VASP account. With this public-private keypair, you allow other VASPs to retrieve the public key and encrypt PII data to you.
You can create a new key pair using
@notabene/cli
and then publishing it to the Notabene directory under the pii_didkey field.
Creating an encryption key
Install the Notabene CLI tool.
Install the library globally using Yarn
yarn global add @notabene/cli
or NPM
npm i -g @notabene/cli
.
Ensure the path to globally installed packages is in your $PATH environment variable.
Generate an M2M token.
Generate an M2M token for use with the Notabene Travel Rule gateway:
notabene auth:token
.
Create the encryption key.
You can use the CLI to generate a key that can be used to encrypt PII information to be sent as part of a Travel Rule message:
notabene keys:create
.
This generates a JSON object containing an
Ed25519
key and metadata which can be passed to the
Notabene SDK
when creating transactions to encrypt the PII.
JSON
{  
  "did":"did:key:z6MkjwpTikNZkp**\*\***\*\***\*\***\*\*\*\***\*\***\*\***\*\***",  
  "controllerKeyId":"519b59a6b7ebf128f6c6\***\*\*\*\*\***\*\*\***\*\*\*\*\***",  
  "keys":\[{"type":"Ed25519","kid":"519b59a6b7eb768**\*\*\*\***\*\***\*\*\*\***\*\*\*\***\*\*\*\***\*\***\*\*\*\***",  
  "publicKeyHex":"519b59a6b7ebf128f6c7**\*\***\*\***\*\***\*\*\*\***\*\***\*\***\*\***",  
  "meta":{"algorithms":["Ed25519","EdDSA"]},  
  "kms":"local",  
  "privateKeyHex":"0d07d8acda928f98765e4a0b80013e2be369c29564419a\***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***"}],  
  "services":\[],  
  "provider":"did:key"  
}
Adding the encryption key to your Notabene account
After creating your encryption key, you must add it to your Notabene VASP account. Send a PUT request to
/v1/screening/travel-rule/vasp/update
with your VASP DID Key and JSON DID Key.
JavaScript
/**
     * Update VASP for travel rule compliance
     */
    public async updateVasp(vaspInfo: TravelRuleVasp): Promise<TravelRuleVasp> {
        return await this.apiClient.issuePutRequest(`/v1/screening/travel-rule/vasp/update`, vaspInfo);
    }
Validation and sending Travel Rule transactions
Validating transactions ensures all the necessary information is included in the Travel Rule check. After you transaction has been validated, you can send the transaction to the counterparty.
The Travel Rule transaction flow consists of four steps:
Initial validation
Collecting additional data
Validating the full transaction
Sending the Travel Rule transaction
Step 1: Initial validation
The Transaction Validate API call checks what beneficiary details are required by your jurisdiction and the beneficiary VASP’s jurisdiction. Since Travel Rule compliance is only required for transactions above a certain threshold, the Transaction Validate API call also checks whether or not the transaction meets the threshold and must comply with the Travel Rule. Travel Rule thresholds and required data are defined by the
jurisdictions
of the VASPs involved.
This API works with a
customerToken
and may be used from the front end of your application.
Learn more about how the validation API works
.
Example
JSON
{
  "transactionAsset": "BTC",
  "destination": "bc1qxy2kgdygjrsqtzq2n0yrf1234p83kkfjhx0wlh",
  "transactionAmount": "10",
  "originatorVASPdid": "did:ethr:0x44957e75d6ce4a5bf37aae117da86422c848f7c2",
  "originatorEqualsBeneficiary": false
}
Response
JSON
{  
    "isValid": false,  
    "type": "NON_CUSTODIAL",  
    "beneficiaryAddressType": "UNKNOWN",  
    "addressSource": "UNKNOWN",  
    "errors": [  
        "beneficiaryNameMissing",  
        "beneficiaryOwnershipProofMissing"  
    ]  
}
The response to this initial validation step tells us:
If the value of this transaction is above or below the Travel Rule threshold.
If the destination address was identified by blockchain analytics or your address book.
If the address was not automatically identified, search and select the correct VASP from Notabene’s directory by querying
Search API
. You can search using the
/v1/screening/travel_rule/vasp?q=Fireblocks
API endpoint.
Response
JSON
{
    "isValid": "true" or "false",
    "type": "BELOW_THRESHOLD" or "TRAVELRULE" or "NON_CUSTODIAL",
    "beneficiaryAddressType": "UNKNOWN" or "HOSTED" or "UNHOSTED",
    "addressSource": "ADDRESS_GRAPH" or "NAME_OF_BLOCKCHAIN_ANALYTICS",
    "beneficiaryVASPname": "VASP_NAME",
    "errors": "MISSING_FIELDS_REQUIRED_BY_YOUR_JURISDICTION"
    "warnings": "MISSING_FIELDS_REQUIRED_BY_COUNTERPARTY_JURISDICTION"
}
Read the Notabene API documentation for more information on the responses to the Transaction Validate API call
.
If the transaction is below the threshold, you don’t need to collect data for the Travel Rule. Depending on the initial call response, the following scenarios can happen:
Known VASP (address book)
Known VASP (blockchain analytics)
Known VASP (manually selected)
Unknown/unlisted VASP
Unhosted wallet
Step 2: Collecting additional data
Once you perform the initial validation step to determine if the Travel Rule data requirements apply, you have two options to collect the necessary information listed in the errors array from step 1. You can use the Notabene widget or replicate the widget's functionality using API calls.
Read the Notabene API documentation for more information on front-end data collection
.
Step 3: Validating the full transaction
After reacting to the response of the initial Transaction Validate API call and collecting the necessary information about the beneficiary, you can perform a final request to confirm that you have all the data needed for the Travel Rule.
The Transaction Validate Full API call validates the beneficiary and the originator data included in your transaction. The originator data is the information about your organization and is static.
This API requires an
accessToken
and must be called from the back-end of your application.
Learn more about how the validation API works
.
Example
JSON
{  
    "transactionAsset": "ETH",  
    "destination": "bc1qxy2kgdygjrsqtzq2n0yrf1234p83kkfjhx0wlh",  
    "transactionAmount": "10000000000000000000",  
    "originatorVASPdid": "{{vaspDID}}",  
    "originatorEqualsBeneficiary": false,  
    "beneficiaryVASPdid": "did:ethr:0x47463999eb42dc2aaacb29624c512603221227a1",  
    "beneficiaryName": "Bruce Wayne",  
    "beneficiaryAccountNumber": "bc1qxy2kgdygjrsqtzq2n0yrf1234p83kkfjhx0wlh"  
}
Response
JSON
{  
    "isValid": true,  
    "type": "TRAVELRULE",  
    "beneficiaryAddressType": "HOSTED",  
    "addressSource": "ADDRESS_GRAPH",  
    "beneficiaryVASPname": "Notabene VASP US"  
}
If all the necessary information is included, you receive the response
isValid
=
true
.
Step 4: Sending the Travel Rule transaction
Once the full transaction is validated, move the information used in the final validation request to the back-end, add information about your customer (the originator), and create the actual Travel Rule message using the Fireblocks API or the Fireblocks SDK.
If the outgoing transaction doesn’t contain a Travel Rule message, the transaction bypasses screening.
Fireblocks API
First, encrypt the data for the transaction using the Notabene PII SDK. This encryption ensures the privacy and security of PII data during the transaction. The PII data should only be decrypted by authorized parties.
JavaScript
import PIIsdk, { PIIEncryptionMethod } from "@notabene/pii-sdk";
import { TransactionArguments, TravelRule, TravelRuleEncryptionOptions, TravelRuleOptions } from "./types";
import * as util from "util";

const requiredFields = [
    "baseURLPII",
    "audiencePII",
    "clientId",
    "clientSecret",
    "authURL",
    "jsonDidKey",
];

export class PIIEncryption {
    public toolset: PIIsdk;

    constructor(private readonly config: TravelRuleOptions) {
        this.config = config;
        const missingFields = requiredFields.filter(
            (field) => !(field in this.config)
        );

        if (missingFields.length > 0) {
            throw new Error(
                `Missing PII configuration fields: ${missingFields.join(", ")}`
            );
        }

        this.toolset = new PIIsdk({
            piiURL: config.baseURLPII,
            audience: config.audiencePII,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authURL: config.authURL,
        });
    }

    async hybridEncode(transaction: TransactionArguments, travelRuleEncryptionOptions?: TravelRuleEncryptionOptions) {
        const { travelRuleMessage } = transaction;
        const pii = travelRuleMessage.pii || {
            originator: travelRuleMessage.originator,
            beneficiary: travelRuleMessage.beneficiary,
        };
        const { jsonDidKey } = this.config;
        const counterpartyDIDKey = travelRuleEncryptionOptions?.beneficiaryPIIDidKey;

        let piiIvms;

        try {
            piiIvms = await this.toolset.generatePIIField({
                pii,
                originatorVASPdid: travelRuleMessage.originatorVASPdid,
                beneficiaryVASPdid: travelRuleMessage.beneficiaryVASPdid,
                counterpartyDIDKey,
                keypair: JSON.parse(jsonDidKey),
                senderDIDKey: JSON.parse(jsonDidKey).did,
                encryptionMethod: travelRuleEncryptionOptions?.sendToProvider
                    ? PIIEncryptionMethod.HYBRID
                    : PIIEncryptionMethod.END_2_END,
            });
        } catch (error) {
            const errorMessage = error.message || error.toString();
            const errorDetails = JSON.stringify(error);
            throw new Error(`Failed to generate PII fields error: ${errorMessage}. Details: ${errorDetails}`);
        }

        transaction.travelRuleMessage = this.travelRuleMessageHandler(travelRuleMessage, piiIvms);

        return transaction;
    }

    private travelRuleMessageHandler(travelRuleMessage: TravelRule, piiIvms: any): TravelRule {
        travelRuleMessage.beneficiary = piiIvms.beneficiary;
        travelRuleMessage.originator = piiIvms.originator;

        return travelRuleMessage;
    }
}
Then, create the transaction using the
createTransaction
endpoint and include the information you validated with Notabene.
JavaScript
const travelRuleEncryptedMessage = {
  originatorVASPdid: 'did:ethr:0x44957e75d6ce4a5bf37aae117da86422c848f7c2',
  travelRuleBehavior: false,
  beneficiaryVASPdid: 'did:ethr:0xf9139d9ca3cd9824a7fb623b1d34618a155137bc',
  beneficiaryVASPname: '',
  originatorDid: '',
  beneficiaryDid: '',
  originator: {
    originatorPersons: [
      {
        naturalPerson: {
          name: [
            {
              nameIdentifier: [
                {
                  primaryIdentifier: 'QmQMWeaZVMuR4eD2YxLwLT6uEdnbNX5f5KS1V6rWWgdNN4',
                  secondaryIdentifier: 'QmQUusxQZ2GAezHKKAgMnj4ZRrRCccZfeADmeeQGxfKEwe'
                }
              ]
            }
          ],
          geographicAddress: [
            {
              streetName: 'QmdMT2uowJmQnefc1noRxGx69pAa3tvAeEvNEAsEe8aKac',

  ............
  ......
}

const transaction = {
        assetId: 'XRP_TEST',
        source: {
            type: 'VAULT_ACCOUNT',
            id: '0',
            virtualId: undefined,
            virtualType: undefined
        },
        destination: {
            type: 'ONE_TIME_ADDRESS',
            id: undefined,
            oneTimeAddress: {
                address: 'rn7tTh4Dvsc3G5k1TJo9X1vpHREG3Cac6r',
                tag: undefined
            },
            virtualId: undefined,
            virtualType: undefined
        },
        operation: 'TRANSFER',
        amount: '5.007',
        fee: undefined,
        gasPrice: undefined,
        gasLimit: undefined,
        feeLevel: undefined,
        maxFee: undefined,
        failOnLowFee: false,
        priorityFee: undefined,
        note: 'Created with love by fireblocks SDK from BDD Travel Rule TEST',
        autoStaking: undefined,
        cpuStaking: undefined,
        networkStaking: undefined,
        replaceTxByHash: '',
        extraParameters: undefined,
        destinations: undefined,
        externalTxId: undefined,
        treatAsGrossAmount: undefined,
        travelRuleMessage: travelRuleEncryptedMessage,
    }


....

apiClient.issuePostRequest("https://api.fireblocks.io/v1/transactions", transaction);
Fireblocks SDK
To create a Fireblocks blockchain transaction with encrypted PII data, you must provide the necessary Notabene PII SDK credentials in the
sdkOptions
field. You can choose to use an
end-to-end encryption method
or a
hybrid encryption method
.
JavaScript
fireblocks = new FireblocksSDK(privateKey, userId, serverAddress, undefined, {  
        customAxiosOptions: {  
            interceptors: {  
                response: {  
                    onFulfilled: (response) => {  
                        console.log(`Request ID: ${response.headers["x-request-id"]}`);  
                        return response;  
                    },  
                    onRejected: (error) => {  
                        console.log(`Request ID: ${error.response.headers["x-request-id"]}`);  
                        throw error;  
                    }  
                }  
            }  
        },  
        travelRuleOptions: {  
            kmsSecretKey:  
                "75099860d284bb22a2c96a6e41ee024d04171a4ba33b2f3720d2bec17d1ced78",  
            authURL: "<https://auth.notabene.id">,  
            baseURL: "<https://api.notabene.dev">,  
            audience: "<https://api.notabene.dev">,  
            baseURLPII: "<https://pii.notabene.dev">,  
            audiencePII: "<https://pii.notabene.dev">,  
            clientId: "7iQ6MNg**\*\***\*\***\*\***\***\*\***\*\***\*\***",  
            clientSecret: "1rg17YZtmFT\***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***",  
            jsonDidKey: "{\"did\":\"did:key:z6MknL8ERKo2MqArMvJdA2EdZcUWehR7t3gDDc9hsbB7TCfZ\",\"controllerKeyId\":\"75099860d284bb22a2c96a6e41ee024d04171a4ba33b2f3720d2bec17d1ced78\",\"keys\":\[{\"type\":\"Ed25519\",\"kid\":\"75099860d284bb22a2c96a6e41ee024d04171a4ba33b2f3720d2bec17d1ced78\",\"publicKeyHex\":\"75099860d284bb22a2c96a6e41ee024d04171a4ba33b2f3720d2bec17d1ced78\",\"meta\":{\"algorithms\":[\"Ed25519\",\"EdDSA\"]},\"kms\":\"local\",\"privateKeyHex\":\"c0add0d8b45f704bbc8235d05ee449dc19453dce94df2b07c7bddb36cf7de59475099860d284bb22a2c96a6e41ee024d04171a4ba33b2f3720d2bec17d1ced78\"}],\"services\":\[],\"provider\":\"did:key\"}"  
        }  
    });
Then provide the Travel Rule Message data to Fireblocks Transaction in the requested format.
JSON
{  
    "transactionAsset": "ETH",  
    "transactionAmount": "10044000000000000000",  
    "originatorVASPdid": "{{vaspDID}}",  
    "beneficiaryVASPdid": "did:ethr:0xc7d10be62c7a5af366a13511fe5e0584b8918114",  
    "transactionBlockchainInfo": {  
        "txHash": "",  
        "origin": "5342b5234hioutewry87y78sdfghy783t4t34",  
        "destination": "0xDB6A31EC49D5FB35EF6BA6CE0A3B071C8BA7F7F0"  
    },  
    "originator": {  
        "originatorPersons": \[  
            {  
                "naturalPerson": {  
                    "name": \[  
                        {  
                            "nameIdentifier": [  
                                {  
                                    "primaryIdentifier": "Wunderland",  
                                    "secondaryIdentifier": "Alice"  
                                }  
                            ]  
                        }  
                    ],  
                    "geographicAddress": [  
                        {  
                            "streetName": "Robinson road",  
                            "townName": "Singapore",  
                            "country": "SG",  
                            "buildingNumber": "71",  
                            "postCode": "123456"  
                        }  
                    ],  
                    "nationalIdentification": {  
                        "countryOfIssue": "SG",  
                        "nationalIdentifier": "987654321",  
                        "nationalIdentifierType": "DRLC"  
                    }  
                }  
            }  
        ],  
        "accountNumber": [  
            "5342b5234hioutewry87y78sdfghy783t4t34"  
        ]  
    },  
    "beneficiary": {  
        "beneficiaryPersons": \[  
            {  
                "naturalPerson": {  
                    "name": \[  
                        {  
                            "nameIdentifier": [  
                                {  
                                    "primaryIdentifier": "Bobson",  
                                    "secondaryIdentifier": "Bob"  
                                }  
                            ]  
                        }  
                    ]  
                }  
            }  
        ],  
        "accountNumber": [  
            "5643jn5h34y2g7hg42jt24j890y345gfgh65"  
        ]  
    }  
}
JavaScript
/**
 * Creates a new transaction with the specified options
 */
public async createTransaction(transactionArguments: TransactionArguments, requestOptions?: RequestOptions, travelRuleEncryptionOptions?: TravelRuleEncryptionOptions): Promise<CreateTransactionResponse> {
    const opts = { ...requestOptions };

    if (transactionArguments?.travelRuleMessage) {
        transactionArguments = await this.piiClient.hybridEncode(transactionArguments, travelRuleEncryptionOptions);
    }

    if (transactionArguments.source?.type === PeerType.END_USER_WALLET && !opts.ncw?.walletId) {
        const { walletId } = transactionArguments.source;
        opts.ncw = { ...opts.ncw, walletId };
    }

    return await this.apiClient.issuePostRequest("/v1/transactions", transactionArguments, opts);
}
Get VASP details
You can use the
POST {{baseUrl}}/tx/vasp/{did}
API call to get details on a specific VASP from Notabene’s database. This API call allows you to receive your VASPdid key from Notabene. Once received, you can use it to
integrate your workspace with Notabene
.
JSON
{  
"vasps": \[  
{  
"did": "did:ethr:0x44957e75d6ce4a5bf37aae117da86422c848f7c2",  
"name": "Fireblocks",  
"verificationStatus": "PENDING",  
"addressLine1": "Tel Aviv",  
"addressLine2": null,  
"city": "Tel Aviv",  
"country": "IL",  
"emailDomains": "[\"fireblocks.com\"]",  
"website": "<https://fireblocks.com">,  
"logo": null,  
"legalStructure": "CORPORATION",  
"legalName": "Fireblocks Ltd",  
"yearFounded": "2018",  
"incorporationCountry": "IL",  
"isRegulated": "NO",  
"otherNames": null,  
"identificationType": null,  
"identificationCountry": null,  
"businessNumber": null,  
"regulatoryAuthorities": null,  
"jurisdictions": "IL",  
"street": null,  
"number": null,  
"unit": null,  
"postCode": null,  
"state": null,  
"certificates": null,  
"description": null,  
"travelRule_OPENVASP": null,  
"travelRule_SYGNA": null,  
"travelRule_TRISA": null,  
"travelRule_TRLIGHT": "active",  
"travelRule_EMAIL": null,  
"travelRule_TRP": null,  
"travelRule_SHYFT": null,  
"travelRule_USTRAVELRULEWG": null,  
"createdAt": "2022-12-01T09:12:11.048Z",  
"createdBy": "did:ethr:0x44957e75d6ce4a5bf37aae117da86422c848f7c2",  
"updatedAt": "2023-04-20T21:13:46.696Z",  
"updatedBy": null,  
"lastSentDate": "2023-04-20T21:13:46.678Z",  
"lastReceivedDate": "2023-04-18T18:36:40.331Z",  
"documents": null,  
"hasAdmin": true,  
"isNotifiable": true,  
"issuers": {  
"verificationStatus": {  
"issuerDid": "did:ethr:0x19b5ff8440019b635a86bbb632db854f2ea80423"  
},  
"emailDomains": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"travelRule_TRLIGHT": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"jurisdictions": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"country": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"city": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"addressLine1": {  
"issuerDid": "did:ethr:0xf33cbc1a777bcfba6f9f66de276e8072d18fadae"  
},  
"isReg
Additional resources
Notabene docs
Testing transactions
Postman Collection
More code samples for using the PII-SDK and Fireblocks API
Updated
20 days ago
Introduction
Table of Contents
Prerequisites
Overview
Before you begin
Creating an encryption key
Adding the encryption key to your Notabene account
Validation and sending Travel Rule transactions
Step 1: Initial validation
Step 2: Collecting additional data
Step 3: Validating the full transaction
Step 4: Sending the Travel Rule transaction
Get VASP details
Additional resources

---

