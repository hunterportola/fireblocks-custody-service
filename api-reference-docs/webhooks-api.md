# Webhooks API

All URIs are relative to https://developers.fireblocks.com/reference/

## API Overview

The Webhooks API provides functionality for managing webhook notifications in Fireblocks. Webhooks allow your application to receive real-time notifications about events in your Fireblocks workspace. This API allows you to:

- Configure webhook endpoints
- Manage webhook subscriptions
- Handle webhook notifications
- Monitor webhook delivery status

### Key Features

- **Real-time Notifications**: Receive instant notifications for workspace events
- **Event Filtering**: Subscribe to specific event types
- **Delivery Tracking**: Monitor webhook delivery success and failures
- **Security**: Verify webhook authenticity with cryptographic signatures

### Supported Event Types

- Transaction status updates
- New incoming transactions
- Vault account changes
- Policy rule triggers
- User management events
- Security alerts

### Webhook Security

All webhooks are signed with RSA512 signatures to ensure authenticity. The signature is included in the `Fireblocks-Signature` header.

For detailed method documentation, parameter specifications, and code examples, please refer to the [official Fireblocks TypeScript SDK documentation](https://github.com/fireblocks/ts-sdk) - WebhooksApi section.

---

*This documentation is generated from the Fireblocks TypeScript SDK v5.0.0+*