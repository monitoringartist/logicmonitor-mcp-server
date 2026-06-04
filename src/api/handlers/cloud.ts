import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class CloudHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Cloud Onboarding - AWS
        case 'get_aws_account_id':
          return await this.client.getAwsAccountId();

        case 'get_aws_external_id':
          return await this.client.getAwsExternalId();

        case 'test_aws_account':
          return await this.client.testAwsAccount(args.config || {});

        case 'verify_aws_billing_permissions':
          return await this.client.verifyAwsBillingPermissions(args.config || {});

        // Cloud Onboarding - Azure
        case 'discover_azure_subscriptions':
          return await this.client.discoverAzureSubscriptions(args.config || {});

        case 'test_azure_account':
          return await this.client.testAzureAccount(args.config || {});

        case 'verify_azure_storage_permissions':
          return await this.client.verifyAzureStoragePermissions(args.config || {});

        // Cloud Onboarding - GCP
        case 'test_gcp_account':
          return await this.client.testGcpAccount(args.config || {});

        // SaaS account
        case 'test_saas_account':
          return await this.client.testSaaSAccount(args.config || {});
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
