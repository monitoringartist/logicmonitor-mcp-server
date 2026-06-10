import { BaseClient, LMResponse } from './base-client.js';

export class CloudClient extends BaseClient {
  // Cloud Onboarding (AWS / Azure / GCP)
  async getAwsAccountId() {
    return this.request<LMResponse<any>>('GET', '/aws/accountId');
  }

  async getAwsExternalId() {
    return this.request<LMResponse<any>>('GET', '/aws/externalId');
  }

  async testAwsAccount(body: any) {
    return this.request<LMResponse<any>>('POST', '/aws/functions/testAccount', body);
  }

  async verifyAwsBillingPermissions(body: any) {
    return this.request<LMResponse<any>>('POST', '/aws/functions/verifyBillingPermissions', body);
  }

  async discoverAzureSubscriptions(body: any) {
    return this.request<LMResponse<any>>('POST', '/azure/functions/discoverSubscriptions', body);
  }

  async testAzureAccount(body: any) {
    return this.request<LMResponse<any>>('POST', '/azure/functions/testAccount', body);
  }

  async verifyAzureStoragePermissions(body: any) {
    return this.request<LMResponse<any>>('POST', '/azure/functions/verifyStorageAccountsPermissions', body);
  }

  async testGcpAccount(body: any) {
    return this.request<LMResponse<any>>('POST', '/gcp/functions/testAccount', body);
  }

  // SaaS account
  async testSaaSAccount(body: any) {
    return this.request<LMResponse<any>>('POST', '/saas/functions/testAccount', body);
  }
}
