# 04 Process Deposits

This document contains 5 sections related to 04 process deposits.

## Table of Contents

1. [Sweep Funds](#sweep-funds)
2. [Mandatory Properties For Deposits](#mandatory-properties-for-deposits)
3. [Manage Deposits At Scale](#manage-deposits-at-scale)
4. [Mandatory Fields For Bitstamp Deposits](#mandatory-fields-for-bitstamp-deposits)
5. [Sweep To Omnibus](#sweep-to-omnibus)

---

## Sweep Funds {#sweep-funds}

*Source: https://developers.fireblocks.com/docs/sweep-funds*

Sweep Funds
Overview
Once your client, aka the end-user, deposits into an intermediary vault account, most customers will want to perform a sweeping operation. This operation consolidates all deposited funds from the intermediary vault accounts into a single treasury management vault account for various business purposes.
Sweeping funds involves moving assets from address A to address B. It is important to note that this is an on-chain operation and includes
transaction fee payments
.
Trigger the Sweeping Operation
The trigger for the sweeping operation varies from customer to customer, depending on specific strategies, business needs, and regulatory requirements.
For instance, some customers may choose to sweep the funds immediately after the deposit is completed. In contrast, others may trigger the sweeping mechanism only after a certain amount of deposits (either by total balance or number of deposits). Since sweeping is an on-chain operation that incurs transaction fees, some customers opt to execute the sweeping operation only when the current network fee is below a predefined acceptable threshold. Fireblocks enables customers to monitor current network fees/gas prices using the
GET /estimate_network_fee
endpoint
.
There is no right or wrong approach; customers should determine what works best for their business needs.
Automate Sweeping
To create sweeping transactions, Fireblocks customers can use the
POST /transactions
endpoint
. First, identify the vault account from which you want to initiate the sweeping operation and then send the sweeping transaction request to the Fireblocks API. This process should be executed for every vault account from which sweeping is desired.
Automating sweeping transactions involves not only creating the transactions in a fully automated manner but also automating the entire signing process. We recommend using an
API Co-Signer
to automatically sweep funds according to your organization's logic and fee prices.
When sweeping funds, you also pay a fee in the base asset of the deposited token's blockchain. To ensure you always have enough funds for the sweeping transaction, we introduced the
Fireblocks Gas Station
feature, which automatically identifies incoming transactions to your predefined vault accounts and deposits enough of the base asset to cover fees for sweeping funds to your main treasury.
Updated
20 days ago
Manage Deposits at Scale
Work with Fireblocks Gas Station
Table of Contents
Overview
Trigger the Sweeping Operation
Automate Sweeping

---

## Mandatory Properties For Deposits {#mandatory-properties-for-deposits}

*Source: https://developers.fireblocks.com/docs/mandatory-properties-for-deposits*

Mandatory properties for Binance deposits
Overview
For incoming deposits to Binance, the Travel Rule mandates the submission of specific PII. This page outlines the necessary data fields and their formats, varying by jurisdiction, to ensure your deposits are compliant and processed without delay.
Developers should review these requirements carefully, alongside the provided country-specific descriptions and examples, to correctly structure PII messages for all deposit transactions.
Bahrain
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "BH"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "BH"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AU",
        "city": "Perth"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "BH"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
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
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "BH"
    }
  }
}
France
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "FR"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "FR"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AO"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "FR"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "AR"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "FR"
    }
  }
}
India
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "IN"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "IN"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "nationalIdentification": {
        "nationalIdentifier": "12345xyz"
      },
      "postalAddress": {
        "country": "AR",
        "subdivision": "State",
        "city": "Buenos Aires",
        "postalCode": "123123123",
        "streetName": "Oak street 123"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "IN"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AR",
        "subdivision": "State",
        "city": "Buenos Aires",
        "postalCode": "123123123",
        "streetName": "Oak street 123"
      },
      "company": {
        "name": "ACME Inc"
      },
      "registrationNumber": "pan1234"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "IN"
    }
  }
}
Japan
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "BINANCE"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "JP"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "BINANCE"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "JP"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Individual",
      "postalAddress": {
        "country": "AU",
        "city": "Perth"
      },
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
    "originatingVASP": {
      "vaspName": "BINANCE"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "JP"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AU",
        "city": "Perth"
      },
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
    "originatingVASP": {
      "vaspName": "BINANCE"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "JP"
    }
  }
}
Kazakhstan
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      }
    },
    "transactionData": {
      "deposit": {
        "txPurpose": "service"
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "KZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
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
    "transactionData": {
      "deposit": {
        "txPurpose": "service"
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "KZ"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      }
    },
    "transactionData": {
      "deposit": {
        "txPurpose": "service"
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "KZ"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
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
    "transactionData": {
      "deposit": {
        "txPurpose": "service"
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "KZ"
    }
  }
}
Poland
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "PL"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "PL"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AT"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "PL"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "AR"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "PL"
    }
  }
}
South Africa
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "deposit": {
      "receiveFrom": "1"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "ZA"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "deposit": {
      "receiveFrom": "1"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "ZA"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AR"
      }
    },
    "deposit": {
      "receiveFrom": "1"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "ZA"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "company": {
        "name": "ACME Inc"
      },
      "postalAddress": {
        "country": "AU"
      }
    },
    "deposit": {
      "receiveFrom": "1"
    },
    "transactionData": {
      "deposit": {
        "isAddressVerified": true
      }
    },
    "beneficiaryVASP": {
      "vaspCountry": "ZA"
    }
  }
}
United Arab Emirates (UAE)
Originator: Myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Individual"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "AE"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "FirstParty",
      "entityType": "Business"
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "AE"
    }
  }
}
Originator: Not myself
Individual > VASP (JSON)
Corporate/Entity > VASP (JSON)
{
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
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "AE"
    }
  }
}
{
  "type": "exchange-service-travel-rule",
  "typeVersion": "1.0.0",
  "data": {
    "originator": {
      "participantRelationshipType": "ThirdParty",
      "entityType": "Business",
      "postalAddress": {
        "country": "AT",
        "city": "Vienna"
      },
      "company": {
        "name": "ACME Inc"
      }
    },
    "originatingVASP": {
      "vaspName": "Binance"
    },
    "beneficiaryVASP": {
      "vaspCountry": "AE"
    }
  }
}
Updated
20 days ago
Mandatory properties for Binance withdrawals
Mandatory fields for Bitstamp withdrawals
Table of Contents
Overview
Bahrain
France
India
Japan
Kazakhstan
Poland
South Africa
United Arab Emirates (UAE)

---

## Manage Deposits At Scale {#manage-deposits-at-scale}

*Source: https://developers.fireblocks.com/docs/manage-deposits-at-scale*

Manage Deposits at Scale
Overview
One of the most important processes for a business is the ability to handle deposits made by clients. To facilitate this, each client needs their own wallet for the asset they want to deposit.
This requirement applies to both scenarios: deposits made by clients from external sources and on-ramp processes such as purchasing crypto and storing it in their address. Both flows result in the creation of a new wallet for the specific user.
Businesses serving hundreds of thousands or even millions of users need to create and manage these addresses and the deposited funds in the most operationally and cost-effective ways.
In this guide, we will outline the recommended workflows for Fireblocks clients to achieve an efficient setup for processing user deposits. The topics covered include:
Setting up the correct wallet structure for your use case
Receiving notifications on incoming transfers
Processing UTXO and Tag/Memo-based asset deposits
Processing account-based asset deposits
Best practices for generating deposit addresses
Validating wallet balances
Maintaining an internal ledger
Setup the Wallet Structure
The wallet structure, or as we call it in Fireblocks, the vault structure, that you set up will directly impact the capabilities, efficiency, and operational load of your business. Fireblocks recommends one of the following two setups, depending on the type of your operation:
Segregated Vault Structure
: Ideal for customers running a B2B business. This setup is recommended for those who want full segregation of their clients' funds.
Omnibus Vault Structure
: Ideal for customers running a B2C business. This setup is recommended for those who want to create a dedicated wallet for each user and then sweep the funds into a single Treasury wallet.
📘
Learn more about the Fireblocks
Vault Structure types
Get Notifications for Incoming Transactions
To receive notifications about incoming transactions to your Fireblocks wallets, we recommend using the Webhook service.
Webhooks are push notifications sent by Fireblocks to a URL specified by the customer. This service sends notifications about various events in your Workspace, including incoming funds. Each incoming transaction triggers a series of events, starting with an alert that a new transaction has been identified, followed by subsequent notifications about the transaction's completion status.
📘
Learn more about the Fireblocks
Webhook service
Process UTXO and Tag/Memo Based Assets Deposits
Customers who find the Omnibus structure suitable for their business needs and work with UTXO-based assets will notice that all such assets (e.g., BTC, BCH, LTC, DOGE, ADA) are deposited into a single "Deposit" vault account. Each user has their own deposit address identified by the
description
parameter.
Processing these funds is straightforward in terms of address generation and management, but it introduces some potential challenges that should be considered during the integration phase. When running a retail-facing business and processing a large volume of UTXO-based asset deposits, customers may find that their deposit vault account accumulates a significant number of unspent transaction outputs (UTXOs) for a specific asset. Efficiently managing these UTXOs is crucial for the following reasons:
Creating Outgoing Transactions
: Customers might want to move deposited funds (or part of them) to different venues such as exchange accounts, withdrawal vaults, or even a cold wallet. The number of UTXOs that can be selected for a transaction is limited to 250 UTXOs per transaction. This limitation could prevent customers from moving the desired amount if the selected 250 UTXOs do not add up to the intended amount. This depends on the UTXO selection mechanism in your Fireblocks wallet, which by default chooses the
smallest confirmed UTXOs first
. The selection mechanism can be adjusted to select the largest confirmed UTXOs first, based on customer preference.
Fee Efficiency
: If a wallet has many small UTXOs, creating outgoing transactions will require selecting more UTXOs to reach the required amount. This results in larger transaction sizes and higher fees, making the transaction more attractive to miners/validators.
To overcome the mentioned in the above, customer should implement a UTXO consolidation logic as described in the following section.
UTXO Consolidation
UTXO-based transactions in Fireblocks have a limit of 250 inputs (UTXOs) per transaction. Additionally, there must be a logic to select the inputs for a transaction, which Fireblocks implements as follows:
DEFAULT Selection Mechanism
: By default, Fireblocks selects the first 250 smallest confirmed inputs available for a specified vault account. This helps customers use up small UTXOs and reduce the number of available UTXOs in their vault account.
Configurable Selection Mechanism
: Fireblocks can be configured to select the 250 largest confirmed inputs first. This configuration requires opening a request with our support team.
This consolidation transaction is typically made from the Deposits vault account to one of the Withdrawals vault accounts to maintain a sufficient asset balance for user withdrawals. However, the transaction can also be executed with multiple destinations, such as different vault accounts, exchange accounts, external addresses, or even a cold wallet.
The trigger for the consolidation process can be based on the number of deposits made into the Deposits vault account. For instance, customers can decide that after every 250 deposits (tracked by an internal counting logic), the system will automatically create the consolidation transaction. Others may choose to execute this transaction based on current network fees to save on transaction costs.
Fireblocks provides two important endpoints to help clients build their UTXO consolidation logic:
Get Maximum Spendable Amount in a Single Transaction
: This endpoint returns the maximum amount of a particular asset that can be spent in a single transaction from a specified vault account.
Create Transaction
: This endpoint creates a transaction with the specified amount returned from the endpoint above.
Additionally, clients who want to trigger the consolidation transaction based on the number of deposits made into their Deposits vault account can use the Fireblocks
Webhook service
to get notifications on completed incoming transfers.
📘
Check out the UTXO Consolidation
Developer Guide
Process Account Based Asset Deposits
Customers who want to generate a unique address for each of their end-users need to create a new intermediary vault account for each user and then the required vault wallet within this newly generated vault account. This is necessary because account-based assets do not support the generation of multiple addresses under the same wallet.
Once the generated address is shared with the end-user and the end-user makes a deposit into that vault account, most customers will want to perform a sweeping operation. This operation consolidates all deposited funds from the intermediary vault accounts into a single treasury management vault account for various business purposes.
Sweeping funds involves moving assets from address A to address B. It is important to note that this is an on-chain operation and includes transaction fee payments.
📘
Learn more about the
Sweeping Mechanism
While sweeping base assets like ETH is straightforward, sweeping deposited ERC20 tokens presents a challenge. This is because the transaction fee must be paid in the network's base asset, which end-users might not have in their wallets. To address this issue, Fireblocks recommends using the Fireblocks Gas Station feature.
📘
Learn more about the Fireblocks
Gas Station
Create Deposit Addresses Best Practices
Customers serving hundreds of thousands or even millions of users will eventually need to create a corresponding number of deposit addresses within a single vault account (for UTXO deposits) and/or intermediate vault accounts (for Account Based assets) in their workspace. A basic implementation is to create a new deposit address or vault account for the end-user whenever the user registers for the service or requests a deposit address for a specific coin.
In this setup, customers make a real-time API call to Fireblocks to generate a new deposit address or create a new vault account with a vault wallet for the requested asset, triggered by the end-user request.
While this approach is acceptable, the best practice we recommend is to create these deposit addresses or intermediate vault accounts proactively. Fireblocks customers should run a service that continuously creates addresses, vault accounts, and vault wallets, regardless of user requests.
This proactive approach means maintaining a pool of pre-generated vault accounts and addresses. When a user requests a new deposit address, customers can quickly assign a pre-generated address instead of making a real-time API call to Fireblocks. This reduces the risk of encountering API errors in real-time and significantly decreases the waiting time for users to receive a new address, thereby enhancing the user experience and providing a near real-time service.
To associate the pre-generated address with the end-user, during the assigning process on the customer's side, the following APIs should be called to synchronize both Fireblocks and the customer's internal system with the user reference:
UTXO and Tag/Memo Based Assets
: When assigning a new UTXO-based asset deposit address within your Deposit vault account for a new user, call the
Update Address Description API endpoint
with the newly assigned user reference as the description.
Account-Based Assets
: When assigning a new intermediate vault account for an end-user, call the
Rename a Vault Account API endpoint
with the newly assigned user reference as the vault account name. Ensure that the vault account name does not contain any PII data.
Validate Balances
Fireblocks allows you to receive notifications about incoming transactions to your Fireblocks vault accounts. A common setup for Fireblocks customers is to subscribe to the webhook service and get notified whenever a new deposit is made into a vault account. When an event for an incoming transaction is triggered, followed by an event confirming the deposit's completion, the typical setup on the customer's end will automatically update the internal ledger and adjust the balance of the user associated with the deposited vault account.
While this approach is generally correct, Fireblocks recommends implementing additional validation steps before crediting the end user with the deposited amount to avoid potential loss of funds.
🚧
Validating Incoming Balances is crucial!
Learn more about the best practices for validating balances and performing reconciliation processes in the following
guide
Maintain an Internal Ledger
An internal ledger is a fundamental component to consider when building a retail-facing solution. Essentially, it records incoming transfers and balances for your users.
Maintaining this ledger is crucial because funds deposited by users into their accounts are often swept or moved to a different account, as described in the sweeping mechanism section. You need to accurately track how much each user has deposited and what balance should be displayed in your system.
Fireblocks does not provide a built-in component or feature for this specific need, so customers can implement it in any way they see fit. However, Fireblocks offers all the necessary utility tools and features to effectively maintain such a ledger. This includes APIs for validation and reconciliation processes and a webhook service that allows you to create an event-driven system triggered by various events in your Fireblocks workspace.
Updated
20 days ago
Deposit Control & Confirmation Policy
Sweep Funds
Table of Contents
Overview
Setup the Wallet Structure
Get Notifications for Incoming Transactions
Process UTXO and Tag/Memo Based Assets Deposits
UTXO Consolidation
Process Account Based Asset Deposits
Create Deposit Addresses Best Practices
Validate Balances
Maintain an Internal Ledger

---

## Mandatory Fields For Bitstamp Deposits {#mandatory-fields-for-bitstamp-deposits}

*Source: https://developers.fireblocks.com/docs/mandatory-fields-for-bitstamp-deposits*

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

## Sweep To Omnibus {#sweep-to-omnibus}

*Source: https://developers.fireblocks.com/docs/sweep-to-omnibus*

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

