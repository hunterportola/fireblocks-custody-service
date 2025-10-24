# 05 Process Withdrawals

This document contains 3 sections related to 05 process withdrawals.

## Table of Contents

1. [Manage Withdrawals At Scale](#manage-withdrawals-at-scale)
2. [Mandatory Fields For Bitstamp Withdrawals](#mandatory-fields-for-bitstamp-withdrawals)
3. [Mandatory Properties For Withdrawals](#mandatory-properties-for-withdrawals)

---

## Manage Withdrawals At Scale {#manage-withdrawals-at-scale}

*Source: https://developers.fireblocks.com/docs/manage-withdrawals-at-scale*

Manage Withdrawals at Scale
Overview
When users deposit money into your Fireblocks wallets, they expect to access and withdraw their funds easily whenever needed. Imagine needing your money but being unable to access it quickly - that’s the frustration you need to avoid. In any retail-facing crypto business, the withdrawal process is one of the most critical and active functions. Users rely on it to move their funds swiftly and securely, whether they're making a purchase, sending money to a friend, or transferring assets to another account.
Given the high stakes and urgency surrounding withdrawals, designing an efficient and secure withdrawal flow plays a significant role in any retail-facing blockchain-based product.
Crafting a withdrawal process that prioritizes speed, security, and user-friendliness can significantly enhance the overall user experience, making your platform the go-to choice in the competitive crypto market.
Automate the Withdrawal Flow
Setup
Automation is essential for ensuring a smooth and uninterrupted 24/7 withdrawal service in a crypto business. Relying on the manual signing of transactions is not a scalable solution and introduces significant security risks. To address these challenges, implementing an automated
Fireblocks Co-Signer
component is necessary. This approach guarantees continuous operation and enhances the overall security of the withdrawal process.
Highly Available Setup
One of the best practices for automation involves setting up a highly available system. This means implementing the Co-Signer in an active/active mode, which are systems that can take over from one another without downtime, ensuring that there is always a failover capability in place. Read more about
Fireblocks Co-Signer High Availability setup
.
Co-Signer Logging and Monitoring
Comprehensive monitoring and alert systems are vital for maintaining a secure and reliable automated signing process. Setting up these systems allows you to track the status of transactions in real-time and detect any anomalies that might indicate potential issues. Alerts should be configured to notify relevant personnel immediately during stuck transactions or suspicious activities, enabling prompt intervention and resolution.
Learn more about the
Co-Signer logging mechanism
.
Implementing Multiple Withdrawal Wallets
Using multiple withdrawal vault accounts can help alleviate the impact of stuck transactions and enable higher throughput. This approach involves distributing user withdrawal requests across several withdrawal vault accounts, reducing the risk of transaction queues.
The withdrawal requests should be executed from these withdrawal vault accounts in a “round robin” mechanism, which simply means a circular execution between these wallets.
Advantages
Mitigates Impact of Stuck Transactions:
By spreading transactions across multiple wallets, the impact of a single stuck transaction is minimized.
Enhances Transaction Throughput:
Multiple wallets can process transactions simultaneously, increasing overall throughput.
While using multiple withdrawal vault accounts offers several advantages, it also introduces operational complexity. Here are some considerations:
Balance Monitoring:
Regularly monitor the balances of each wallet to ensure sufficient liquidity.
Automated Refills:
Implement automated refill mechanisms to transfer funds between
Having multiple withdrawal wallets is beneficial for Ethereum, which uses the nonce mechanism leading to sequential transaction processing, and for UTXO-based assets like Bitcoin.
In the UTXO model, an unconfirmed output from a previous transaction that has not yet been mined can be used as input for a new transaction. This can result in two stuck transactions that depend on the confirmation of the first one.
Although mechanisms like
Replace By Fee (RBF)
or
"Child Pays For Parent" (CPFP)
exist to release stuck transactions, it is still not an ideal situation to encounter. Additionally, the Bitcoin protocol has a built-in mechanism that rejects transactions using an unconfirmed output from a transaction with more than 25 predecessors. This not only creates a queue of withdrawals but can also lead to actual withdrawal failures, which is way worse.
The number of withdrawal vault accounts required depends on your transaction volume. For most businesses, 3-4 vault accounts should suffice. However, larger operations may need more wallets to handle the load effectively.
UTXO-Based Assets Transaction Batching
The flexibility of the UTXO model allows you to control transaction inputs and outputs to minimize fees. For example, a transaction with one input and multiple outputs is more cost-effective than multiple transactions with single inputs and outputs. This is because a single transaction will have a single set of metadata, reducing the overall transaction size compared to the total size of multiple transactions.
Instead of creating multiple transactions each with single inputs and potentially one output, you can create a single transaction with multiple destinations, translating to multiple outputs. As mentioned before, creating one transaction with multiple destinations reduces the transaction's metadata size, leading to lower fees.
However, this approach requires batching withdrawal requests, meaning you collect multiple user requests over a period (e.g., every X minutes) and process them in a single transaction.
Batching transactions has both advantages and disadvantages. On one hand, it allows for cost savings by consolidating multiple withdrawals into a single transaction, thereby reducing overall transaction fees. On the other hand, it may cause slight delays for users expecting immediate withdrawals.
The key is to find a balance that optimizes costs without significantly impacting the user experience, based on the volume of withdrawal transactions in your product.
Fireblocks supports creating a single transaction with multiple destinations for UTXO-based assets only. This can be accomplished using our
Create a new transaction endpoint
by passing the
destinations
array, which contains different
destination
objects within it.
Check out the Developer Guide for creating a UTXO transaction with multiple destinations
here
.
Working with One Time Addresses
By default, any outgoing transaction in Fireblocks can only be made to a whitelisted address approved by the Workspace's Admin Approval Quorum. For businesses looking to scale their withdrawal flows and eliminate manual processes, whitelisting addresses can become inconvenient and cumbersome.
To address this, Fireblocks introduced the One Time Address (OTA) feature. OTA allows Fireblocks customers to interact with non-whitelisted addresses, streamlining the withdrawal process.
Learn more about OTA and its security aspects in the following
guide
.
Idempotent Transactions
In the context of RESTful APIs, idempotency refers to the property of an operation whereby multiple identical requests have the same effect as a single request. This means that making the same API call multiple times should not result in different outcomes. Idempotency is crucial for ensuring the reliability and consistency of operations, particularly in scenarios where network issues or client-side errors might lead to repeated requests.
📘
Learn more about API Idempotency
here
.
A common issue with non-idempotent transactions is duplicate transactions - multiple requests can result in multiple identical transactions being processed. This is especially problematic for financial operations, such as withdrawals, where it can lead to sending users more funds than they have, causing significant financial discrepancies.
To mitigate this issue, Fireblocks provides a mechanism to ensure idempotency for transaction creation using the
externalTxId
parameter.
What is
externalTxId
?
The externalTxId parameter is a unique identifier provided by the client when creating a transaction via the Fireblocks API. This parameter ensures that repeated requests with the same externalTxId will not result in multiple transactions. Instead, the API will recognize the duplicate request and handle it appropriately, maintaining idempotency. This is particularly useful if you don’t receive a response or if an API call isn’t completed successfully.
When creating transactions, Fireblocks strongly recommends using the
externalTxId
parameter in the
Create a new transaction endpoint
. This parameter ensures that the transaction is idempotent. If another transaction request is made with the same
externalTxId
value, it will be rejected with an HTTP 400 code and the following error message:
JSON
{
  "message": "The external tx id that was provided in the request, already exists",
  "code":1438
}
The main difference between the
Idempotency-Key
header, which can be provided for any PUT or POST request, and the
externalTxId
parameter is that the former is saved for only 24 hours. In contrast, the
externalTxId
is saved permanently on the Fireblocks side, and will return an error if the same value is used in a transaction created even after 24 hours from the first one.
📘
Check our Developer Guide for the externalTxId parameter
here
.
Updated
20 days ago
Estimate Transaction Fees
Boost Transactions
Table of Contents
Overview
Automate the Withdrawal Flow
Implementing Multiple Withdrawal Wallets
Advantages
UTXO-Based Assets Transaction Batching
Working with One Time Addresses
Idempotent Transactions
What is externalTxId ?

---

## Mandatory Fields For Bitstamp Withdrawals {#mandatory-fields-for-bitstamp-withdrawals}

*Source: https://developers.fireblocks.com/docs/mandatory-fields-for-bitstamp-withdrawals*

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

## Mandatory Properties For Withdrawals {#mandatory-properties-for-withdrawals}

*Source: https://developers.fireblocks.com/docs/mandatory-properties-for-withdrawals*

Mandatory properties for Binance withdrawals
Overview
To ensure compliance with Binance's Travel Rule requirements for withdrawals, it's crucial to understand the specific Personally Identifiable Information (PII) that must accompany these transactions.
This section details the mandatory properties for successful withdrawals, providing country-specific information and practical examples to guide your implementation. Adhering to these guidelines is essential for seamless and compliant asset transfers.
Bahrain
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "BH"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "BH"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "AT",
        "city": "Vienna"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "BH"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      },
      "company": {
        "name": "Acme INC"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "BH"
    }
  }
}
France
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
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
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "FR"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "AT"
      }
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "FR"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      },
      "company": {
        "name": "Acme INC"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "BH"
    }
  }
}
India
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "IN"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "IN"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "AR",
        "city": "Buenos Aires"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "IN"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AR",
        "city": "Buenos Aires"
      },
      "company": {
        "name": "ACME Inc"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "IN"
    }
  }
}
Japan
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual",
      "postalAddress": {
        "country": "AR",
        "city": "Buenos Aires"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE",
      "vaspName": "CN"
    },
    "transactionData": {
      "withdraw": {
        "txPurpose": "goods",
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "JP"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AR",
        "city": "Buenos Aires"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE",
      "vaspName": "CN"
    },
    "transactionData": {
      "withdraw": {
        "txPurpose": "goods",
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "JP"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "postalAddress": {
        "country": "AR",
        "city": "Buenos Aires"
      },
      "entityType": "Individual",
      "names": [
        {
          "primaryName": "Kanji name",
          "nameType": "Kanji"
        },
        {
          "primaryName": "Kana name",
          "nameType": "Kana"
        },
        {
          "primaryName": "John",
          "nameType": "Latin",
          "secondaryName": "Doe"
        }
      ]
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE",
      "vaspName": "CN"
    },
    "transactionData": {
      "withdraw": {
        "txPurpose": "goods",
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "JP"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "postalAddress": {
        "country": "AR",
        "city": "Buenos Aires"
      },
      "entityType": "Business",
      "names": [
        {
          "primaryName": "Kanji name",
          "nameType": "Kanji"
        },
        {
          "primaryName": "Kana name",
          "nameType": "Kana"
        },
        {
          "primaryName": "John",
          "nameType": "Latin",
          "secondaryName": "Doe"
        }
      ]
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE",
      "vaspName": "CN"
    },
    "transactionData": {
      "withdraw": {
        "txPurpose": "goods",
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "JP"
    }
  }
}
Kazakhstan
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      }
    },
    "withdraw": {
      "txnPurpose": "service"
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
      "vaspCountry": "KZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      }
    },
    "withdraw": {
      "txnPurpose": "service"
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
      "vaspCountry": "KZ"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      },
      "entityType": "Individual",
      "names": [
        {
          "primaryName": "John",
          "nameType": "Latin",
          "secondaryName": "Doe"
        }
      ]
    },
    "withdraw": {
      "txnPurpose": "service"
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
      "vaspCountry": "KZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      },
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      }
    },
    "withdraw": {
      "txnPurpose": "service"
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
      "vaspCountry": "KZ"
    }
  }
}
New Zealand
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "SomeVASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "NZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "SomeVASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "NZ"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "DZ"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "SomeVASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "NZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "DZ"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "SomeVASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "NZ"
    }
  }
}
Poland
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
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
      "vaspCountry": "PL"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
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
      "vaspCountry": "PL"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "AR"
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
      "vaspCountry": "PL"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "DZ"
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
      "vaspCountry": "PL"
    }
  }
}
South Africa
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "Some VASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "ZA"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "Some VASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "ZA"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "DZ"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "Some VASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "ZA"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "AU"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "others",
      "vaspName": "Some VASP"
    },
    "transactionData": {
      "withdraw": {
        "isAddressVerified": true
      }
    },
    "originatingVASP": {
      "vaspCountry": "ZA"
    }
  }
}
United Arab Emirates (UAE)
Sending to myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "AE"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "AE"
    }
  }
}
Sending to another beneficiary
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
        "country": "AU",
        "city": "Perth"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "AE"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "beneficiary": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AU",
        "city": "Perth"
      },
      "company": {
        "name": "ACME Inc"
      }
    },
    "beneficiaryVASP": {
      "vaspCode": "BINANCE"
    },
    "originatingVASP": {
      "vaspCountry": "AE"
    }
  }
}
Updated
20 days ago
Constructing Encrypted PII Messages for Exchanges via Fireblocks
Mandatory properties for Binance deposits
Table of Contents
Overview
Bahrain
France
India
Japan
Kazakhstan
New Zealand
Poland
South Africa
United Arab Emirates (UAE)

---

