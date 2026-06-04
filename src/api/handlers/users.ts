import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_USER_FIELDS, DEFAULT_ROLE_FIELDS, DEFAULT_API_TOKEN_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class UsersHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Users
        case 'list_users': {
          const result = await this.client.listUsers({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((user: any) =>
              filterFields(user, DEFAULT_USER_FIELDS),
            ),
          };
        }

        case 'get_user':
          return await this.client.getUser(args.userId, {
            fields: args.fields,
          });

        // Roles
        case 'list_roles': {
          const result = await this.client.listRoles({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((role: any) =>
              filterFields(role, DEFAULT_ROLE_FIELDS),
            ),
          };
        }

        case 'get_role':
          return await this.client.getRole(args.roleId, {
            fields: args.fields,
          });

        case 'create_role': {
          const { config, ...rest } = args;
          return await this.client.createRole({ ...rest, ...(config || {}) });
        }

        case 'update_role': {
          const { roleId, config, ...rest } = args;
          return await this.client.updateRole(roleId, { ...rest, ...(config || {}) });
        }

        case 'delete_role':
          return await this.client.deleteRole(args.roleId);

        // API Tokens
        case 'list_api_tokens': {
          const result = await this.client.listApiTokens(args.userId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((token: any) =>
              filterFields(token, DEFAULT_API_TOKEN_FIELDS),
            ),
          };
        }

        // Users & API Tokens (write)
        case 'create_user': {
          const { config, ...rest } = args;
          return await this.client.createUser({ ...rest, ...(config || {}) });
        }

        case 'update_user': {
          const { userId, changePassword, validationOnly, config, ...rest } = args;
          return await this.client.updateUser(userId, { ...rest, ...(config || {}) }, { changePassword, validationOnly });
        }

        case 'delete_user':
          return await this.client.deleteUser(args.userId);

        case 'create_api_token': {
          const { userId, type, config, ...rest } = args;
          return await this.client.createApiToken(userId, { ...rest, ...(config || {}) }, { type });
        }

        case 'update_api_token': {
          const { userId, apiTokenId, config, ...rest } = args;
          return await this.client.updateApiToken(userId, apiTokenId, { ...rest, ...(config || {}) });
        }

        case 'delete_api_token':
          return await this.client.deleteApiToken(args.userId, args.apiTokenId);

        // API usage stats
        case 'get_external_api_stats':
          return await this.client.getExternalApiStats({ fields: args.fields });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
