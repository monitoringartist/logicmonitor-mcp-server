import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const usersTools: Tool[] = [
  // User Management Tools
  {
    name: 'list_users',
    description: 'List all users in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of users with: id, username, email, roles, status (active/suspended), last login time, created date, API token count. ' +
      '\n\n**When to use:** ' +
      '\n- Audit user access' +
      '\n- Find user IDs for API token management' +
      '\n- Check who has admin access' +
      '\n- Identify inactive users' +
      '\n- Compliance reporting' +
      '\n\n**Common filter patterns:** ' +
      '\n- Active users: filter:"status:active"' +
      '\n- By email: filter:"email\\~\\*@company.com"' +
      '\n- By role: filter:"roles:\\*administrator\\*"' +
      '\n- Recent logins: filter:"lastLoginOn>{epoch}"' +
      '\n- Never logged in: filter:"lastLoginOn:0"' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_user" (details), "list\\_roles" (available roles), "list\\_api\\_tokens" (user\'s API tokens).',
    annotations: {
      title: 'List users',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_user',
    description: 'Get detailed information about a specific user by their ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete user details: username, email, firstName, lastName, roles (permissions), status (active/suspended), last login time, created date, phone, timezone, API token count, two-factor auth status. ' +
      '\n\n**When to use:** ' +
      '\n- Review user permissions and roles' +
      '\n- Check last login time (identify inactive users)' +
      '\n- Verify contact information' +
      '\n- Audit user access before modification' +
      '\n- Get user details for API token management' +
      '\n\n**Key information:** ' +
      '\n- roles: Array of role names (defines permissions)' +
      '\n- status: "active" (can login) vs "suspended" (access revoked)' +
      '\n- lastLoginOn: Epoch timestamp (identify inactive accounts)' +
      '\n- apiTokens: Number of active API tokens' +
      '\n- twoFAEnabled: Whether 2FA is configured' +
      '\n\n**Security audit use cases:** ' +
      '\n- Find users who haven\'t logged in for 90+ days' +
      '\n- Review which users have admin roles' +
      '\n- Check if former employees still have access' +
      '\n- Verify API token usage per user' +
      '\n\n**Workflow:** Use "list\\_users" to find userId, then use this tool for complete user profile. ' +
      '\n\n**Related tools:** "list\\_users" (find user), "list\\_roles" (see available roles), "list\\_api\\_tokens" (view user\'s tokens), "update\\_user" (modify).',
    annotations: {
      title: 'Get user details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'The ID of the user to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['userId'],
    },
  },

  // Role Tools
  {
    name: 'list_roles',
    description: 'List all roles (permission sets) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of roles with: id, name, description, custom flag, associated users count, permissions (view/manage/delete for resources/alerts/reports/settings). ' +
      '\n\n**What are roles:** Permission templates assigned to users. Control who can view/modify/delete resources, alerts, dashboards, settings. Essential for RBAC (role-based access control). ' +
      '\n\n**When to use:** ' +
      '\n- Discover available roles before creating users' +
      '\n- Audit permission structure' +
      '\n- Find role IDs for user assignment' +
      '\n- Compare custom vs built-in roles' +
      '\n- Compliance documentation' +
      '\n\n**Built-in roles (examples):** ' +
      '\n- administrator: Full access to everything' +
      '\n- readonly: View-only access to monitoring data' +
      '\n- manager: Manage resources/devices/alerts but not settings' +
      '\n\n**Custom roles:** Organizations create custom roles for specific needs (e.g., "database-team-role", "view-prod-only"). ' +
      '\n\n**Common use cases:** ' +
      '\n- "What roles exist?" → List all to see options' +
      '\n- "Who can delete resources/devices?" → Check which roles have delete permissions' +
      '\n- "Create read-only user" → Find "readonly" role ID for user creation' +
      '\n\n**Workflow:** Use this tool to discover roles, then "get\\_role" for detailed permissions, then use in "create\\_user" or "update\\_user". ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_role" (detailed permissions), "list\\_users" (see user assignments), "create\\_user" (assign roles to new users).',
    annotations: {
      title: 'List roles',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_role',
    description: 'Get detailed information about a specific role by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete role details: name, description, custom flag, detailed permission matrix (view/manage/delete/acknowledge for each area: resources/devices, alerts, dashboards, reports, settings, users). ' +
      '\n\n**When to use:** ' +
      '\n- Review exact permissions before assigning role' +
      '\n- Compare roles to choose correct one' +
      '\n- Document security policies' +
      '\n- Audit what a role can/cannot do' +
      '\n- Before creating custom role (use as template)' +
      '\n\n**Permission granularity returned:** ' +
      '\n- Resources: Can view/add/modify/delete resource/device' +
      '\n- Alerts: Can view/acknowledge/manage alert rules' +
      '\n- Dashboards: Can view/create/edit/delete dashboards' +
      '\n- Reports: Can view/create/schedule reports' +
      '\n- Settings: Can modify datasources/collectors/integrations' +
      '\n- Users: Can manage other users/roles' +
      '\n\n**Use cases:** ' +
      '\n- Security audit: "Can this role delete production resources/devices?"' +
      '\n- Least privilege: Choose role with minimal required permissions' +
      '\n- Documentation: Export role permissions for compliance' +
      '\n- Role comparison: Compare multiple roles to find right fit' +
      '\n\n**Workflow:** Use "list\\_roles" to find roleId, then use this tool to review detailed permissions before assigning to users. ' +
      '\n\n**Related tools:** "list\\_roles" (find roles), "list\\_users" (see who has this role), "create\\_role" (create custom role).',
    annotations: {
      title: 'Get role details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        roleId: {
          type: 'number',
          description: 'The ID of the role to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['roleId'],
    },
  },
  {
    name: 'create_role',
    description: 'Create a new role in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a custom role with a specific set of privileges that can then be assigned to users. ' +
      '\n\n**Required:** name and privileges (the array of privilege objects granting access to specific resources/features). ' +
      '\n\n**Privilege structure:** Each privilege typically has `objectType` (e.g., "dashboard\\_group", "device\\_group", "setting"), `objectId`, `objectName`, and `operation` ("read"/"write"/"ack"). Pass the full privileges array (and any other Role fields) via `config`. ' +
      '\n\n**Tip:** Use "get\\_role" on an existing role as a template for the privileges array. ' +
      '\n\n**Related tools:** "get\\_role" (template/verify), "list\\_roles", "update\\_role", "create\\_user" (assign the role).',
    annotations: { title: 'Create role', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The role name' },
        description: { type: 'string', description: 'The role description' },
        config: {
          type: 'object',
          description: 'Role attributes merged into the request body. Must include `privileges` (array). May include roleGroupId, twoFARequired, requireEULA, customHelpLabel, customHelpURL, etc.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name', 'config'],
    },
  },
  {
    name: 'update_role',
    description: 'Update a role in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** roleId plus any of name, description, or additional fields (e.g., the `privileges` array) via `config`. Partial update. ' +
      '\n\n**⚠️ Note:** Replacing the `privileges` array changes what every user assigned this role can access. Use "get\\_role" first to retrieve the current privileges and modify from there. ' +
      '\n\n**Related tools:** "get\\_role" (retrieve current config), "list\\_roles".',
    annotations: { title: 'Update role', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        roleId: { type: 'number', description: 'The ID of the role to update' },
        name: { type: 'string', description: 'New role name' },
        description: { type: 'string', description: 'New role description' },
        config: {
          type: 'object',
          description: 'Role attributes to update, merged into the request body (e.g., privileges, roleGroupId, twoFARequired).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['roleId'],
    },
  },
  {
    name: 'delete_role',
    description: 'Delete a role from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot be undone. A role that still has users assigned to it generally cannot be deleted — reassign those users first. ' +
      '\n\n**Required parameters:**' +
      '\n- roleId: The ID of the role to delete (from "list\\_roles")' +
      '\n\n**Before deleting:** Use "get\\_role" to check `associatedUserCount`. ' +
      '\n\n**Related tools:** "get\\_role" (check user count), "list\\_roles", "update_user" (reassign users).',
    annotations: { title: 'Delete role', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        roleId: { type: 'number', description: 'The ID of the role to delete.' },
      },
      additionalProperties: false,
      required: ['roleId'],
    },
  },

  // API Token Tools
  {
    name: 'list_api_tokens',
    description: 'List API tokens for a specific user in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of API tokens for specified user with: id, note (description), created date, last used date, status (active/inactive), access ID, roles inherited from user. ' +
      '\n\n**What are API tokens:** Authentication credentials for LogicMonitor REST API. Alternative to username/password for programmatic access. Each token inherits permissions from its user. ' +
      '\n\n**When to use:** ' +
      '\n- Audit API access per user' +
      '\n- Find unused/stale tokens for security cleanup' +
      '\n- Check last usage time' +
      '\n- Inventory API integrations' +
      '\n- Before creating new token (check if existing one available)' +
      '\n\n**Security considerations:** ' +
      '\n- Each token has Access ID and Access Key (like username/password for API)' +
      '\n- Token inherits all permissions from user (if user is admin, token has admin rights)' +
      '\n- Tokens never expire automatically (must be manually revoked)' +
      '\n- Last used date helps identify unused tokens that should be removed' +
      '\n\n**Common use cases:** ' +
      '\n- **Security audit:** "Find all API tokens, check last usage, remove stale ones"' +
      '\n- **Integration tracking:** "Which integrations are using this user\'s tokens?"' +
      '\n- **Access review:** "What API access does this user have?"' +
      '\n- **Token rotation:** "List all tokens before rotating credentials"' +
      '\n\n**Best practices:** ' +
      '\n- Create service accounts (dedicated users) for API integrations instead of personal user tokens' +
      '\n- Add descriptive notes to tokens (e.g., "Terraform automation", "Grafana integration")' +
      '\n- Regularly audit and remove unused tokens (check lastUsedOn timestamp)' +
      '\n- Use least-privilege: Create users with minimal required permissions, then create tokens for those users' +
      '\n\n**Security workflow:** ' +
      '\n- List all users with "list\\_users"' +
      '\n- For each user, use this tool to check their API tokens' +
      '\n- Review lastUsedOn - if >90 days, consider revoking' +
      '\n- Check note field to understand token purpose' +
      '\n\n**Workflow:** Use this tool with userId from "list\\_users" to audit that user\'s API access. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "list\\_users" (find userId), "create\\_api\\_token" (generate new), "delete\\_api\\_token" (revoke access).',
    annotations: {
      title: 'Get API tokens',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'The user ID',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['userId'],
    },
  },
  {
    name: 'create_user',
    description: 'Create a new user (admin) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a LogicMonitor user account and assigns roles. ' +
      '\n\n**Required:** the user definition via `config` — at minimum username and roles (array of role names or {id} objects). May include email, firstName, lastName, password, etc. ' +
      '\n\n**Related tools:** "list\\_users", "list\\_roles" (find role names), "create\\_api\\_token" (issue API credentials).',
    annotations: { title: 'Create user', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The Admin/user definition merged into the request body (username, roles, email, etc.).' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_user',
    description: 'Update a user (admin) in LogicMonitor (LM) monitoring. Partial update via `config`. ' +
      '\n\n**Parameters:** userId, `config` (fields to change), optional changePassword, validationOnly. ' +
      '\n\n**Related tools:** "get\\_user", "list\\_users".',
    annotations: { title: 'Update user', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: 'The user (admin) ID to update' },
        changePassword: { type: 'boolean', description: 'Whether this update changes the password.' },
        validationOnly: { type: 'boolean', description: 'Validate the change without persisting.' },
        config: { type: 'object', additionalProperties: true, description: 'User fields to update.' },
      },
      additionalProperties: false,
      required: ['userId', 'config'],
    },
  },
  {
    name: 'delete_user',
    description: 'Delete a user (admin) from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot be undone. Any API tokens owned by the user are also removed. ' +
      '\n\n**Related tools:** "get\\_user", "list\\_users".',
    annotations: { title: 'Delete user', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: 'The user (admin) ID to delete' },
      },
      additionalProperties: false,
      required: ['userId'],
    },
  },
  {
    name: 'create_api_token',
    description: 'Create an API token for a user in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ Security:** The response includes the Access Key — store it securely; it cannot be retrieved again. The token inherits the user\'s permissions. ' +
      '\n\n**Parameters:** userId, `config` (e.g., { "note": "Terraform automation" }), optional type. ' +
      '\n\n**Related tools:** "list\\_api\\_tokens", "delete\\_api\\_token".',
    annotations: { title: 'Create API token', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: 'The user (admin) ID to create the token for' },
        type: { type: 'string', description: 'Token type (optional).' },
        config: { type: 'object', additionalProperties: true, description: 'The API token definition (e.g., note).' },
      },
      additionalProperties: false,
      required: ['userId', 'config'],
    },
  },
  {
    name: 'update_api_token',
    description: 'Update an API token (e.g., note or status) for a user in LogicMonitor (LM) monitoring. Partial update via `config`. ' +
      '\n\n**Parameters:** userId, apiTokenId, `config` (fields to change, e.g., { "status": 2 } to disable). ' +
      '\n\n**Related tools:** "list\\_api\\_tokens".',
    annotations: { title: 'Update API token', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: 'The user (admin) ID that owns the token' },
        apiTokenId: { type: 'number', description: 'The API token ID to update' },
        config: { type: 'object', additionalProperties: true, description: 'Token fields to update (e.g., note, status).' },
      },
      additionalProperties: false,
      required: ['userId', 'apiTokenId', 'config'],
    },
  },
  {
    name: 'delete_api_token',
    description: 'Delete (revoke) an API token for a user in LogicMonitor (LM) monitoring. Cannot be undone. ' +
      '\n\n**Parameters:** userId, apiTokenId. ' +
      '\n\n**Related tools:** "list\\_api\\_tokens" (find the token ID).',
    annotations: { title: 'Delete API token', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: 'The user (admin) ID that owns the token' },
        apiTokenId: { type: 'number', description: 'The API token ID to revoke' },
      },
      additionalProperties: false,
      required: ['userId', 'apiTokenId'],
    },
  },

  // API usage stats
  {
    name: 'get_external_api_stats',
    description: 'Get external API usage statistics for the LogicMonitor (LM) portal.',
    annotations: { title: 'Get external API stats', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },

];
