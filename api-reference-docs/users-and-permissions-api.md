# Users and Permissions API

All URIs are relative to https://developers.fireblocks.com/reference/

## API Overview

The Users and Permissions API provides functionality for managing workspace users, API keys, and access controls in Fireblocks. This includes managing console users, API users, and user groups. The API allows you to:

- Manage console users and their permissions
- Create and manage API users and keys
- Configure user groups and access controls
- Handle user authentication and authorization

### Key Components

#### API User API
- Create and manage API users
- Generate and rotate API keys  
- Configure API user permissions

#### Console User API
- Manage console user accounts
- Handle user roles and permissions
- Configure user access controls

#### User Groups API (Beta)
- Create and manage user groups
- Assign users to groups
- Configure group-based permissions

### Key Features

- **User Management**: Create, update, and manage user accounts
- **API Key Management**: Generate, rotate, and revoke API keys
- **Permission Controls**: Configure fine-grained access permissions
- **Group Management**: Organize users into groups for easier administration
- **Audit Trails**: Track user activities and permission changes

### Security Features

- Multi-factor authentication support
- Role-based access control (RBAC)
- API key rotation capabilities
- Session management
- Audit logging for all user activities

For detailed method documentation, parameter specifications, and code examples, please refer to the [official Fireblocks TypeScript SDK documentation](https://github.com/fireblocks/ts-sdk) - ApiUserApi, ConsoleUserApi, and UserGroupsBetaApi sections.

---

*This documentation is generated from the Fireblocks TypeScript SDK v5.0.0+*