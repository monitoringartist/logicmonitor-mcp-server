import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const cloudToolHandlers: ToolHandlerMap = {
  'get_aws_account_id': async ({ client }: ToolHandlerContext): Promise<any> => {
    return await client.getAwsAccountId();
  },

  'get_aws_external_id': async ({ client }: ToolHandlerContext): Promise<any> => {
    return await client.getAwsExternalId();
  },

  'test_aws_account': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.testAwsAccount(args.config || {});
  },

  'verify_aws_billing_permissions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.verifyAwsBillingPermissions(args.config || {});
  },

  'discover_azure_subscriptions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.discoverAzureSubscriptions(args.config || {});
  },

  'test_azure_account': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.testAzureAccount(args.config || {});
  },

  'verify_azure_storage_permissions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.verifyAzureStoragePermissions(args.config || {});
  },

  'test_gcp_account': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.testGcpAccount(args.config || {});
  },

  'test_saas_account': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.testSaaSAccount(args.config || {});
  },
};
