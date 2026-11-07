import { filterFields, DEFAULT_USER_FIELDS, DEFAULT_ROLE_FIELDS, DEFAULT_API_TOKEN_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const usersToolHandlers: ToolHandlerMap = {
  'list_users': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listUsers({
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
  },

  'get_user': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getUser(args.userId, {
      fields: args.fields,
    });
  },

  'list_roles': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listRoles({
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
  },

  'get_role': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getRole(args.roleId, {
      fields: args.fields,
    });
  },

  'create_role': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createRole({ ...rest, ...(config || {}) });
  },

  'update_role': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { roleId, config, ...rest } = args;
    return await client.updateRole(roleId, { ...rest, ...(config || {}) });
  },

  'delete_role': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteRole(args.roleId);
  },

  'list_api_tokens': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listApiTokens(args.userId, {
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
  },

  'create_user': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createUser({ ...rest, ...(config || {}) });
  },

  'update_user': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { userId, changePassword, validationOnly, config, ...rest } = args;
    return await client.updateUser(userId, { ...rest, ...(config || {}) }, { changePassword, validationOnly });
  },

  'delete_user': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteUser(args.userId);
  },

  'create_api_token': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { userId, type, config, ...rest } = args;
    return await client.createApiToken(userId, { ...rest, ...(config || {}) }, { type });
  },

  'update_api_token': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { userId, apiTokenId, config, ...rest } = args;
    return await client.updateApiToken(userId, apiTokenId, { ...rest, ...(config || {}) });
  },

  'delete_api_token': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteApiToken(args.userId, args.apiTokenId);
  },

  'get_external_api_stats': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getExternalApiStats({ fields: args.fields });
  },
};
