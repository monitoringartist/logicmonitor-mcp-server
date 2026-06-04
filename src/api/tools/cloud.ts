import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const cloudTools: Tool[] = [
  // Cloud Onboarding - AWS
  {
    name: 'get_aws_account_id',
    description: 'Get the LogicMonitor (LM) AWS account ID used for cross-account IAM role trust during AWS cloud onboarding.',
    annotations: { title: 'Get AWS account ID', readOnlyHint: true },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'get_aws_external_id',
    description: 'Get the external ID used to configure the AWS IAM trust relationship for LogicMonitor (LM) cloud onboarding.',
    annotations: { title: 'Get AWS external ID', readOnlyHint: true },
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'test_aws_account',
    description: 'Test AWS account credentials/permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation; does not mutate resources. Provide payload via "config".',
    annotations: { title: 'Test AWS account', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'AWS account test payload (e.g., externalId, assumedRoleArn).' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'verify_aws_billing_permissions',
    description: 'Verify AWS billing/CUR permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation. Provide payload via "config".',
    annotations: { title: 'Verify AWS billing permissions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'AWS billing verification payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

  // Cloud Onboarding - Azure
  {
    name: 'discover_azure_subscriptions',
    description: 'Discover Azure subscriptions available for LogicMonitor (LM) cloud onboarding. Read-oriented; does not mutate resources. ' +
      '\n\n**Required:** A `config` containing the Azure service-principal credentials. An empty `config` returns "Missing Azure account". ' +
      '\n\n**Expected config fields:** `clientId`, `secretKey`, and `tenantId` (Azure AD application/service-principal used by LM to enumerate subscriptions).',
    annotations: { title: 'Discover Azure subscriptions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          additionalProperties: true,
          description: 'Azure service-principal credentials. Must include clientId, secretKey, and tenantId.',
        },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'test_azure_account',
    description: 'Test Azure account credentials/permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation. Provide payload via "config".',
    annotations: { title: 'Test Azure account', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Azure account test payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'verify_azure_storage_permissions',
    description: 'Verify Azure storage account permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation. Provide payload via "config".',
    annotations: { title: 'Verify Azure storage permissions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Azure storage verification payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

  // Cloud Onboarding - GCP
  {
    name: 'test_gcp_account',
    description: 'Test GCP account credentials/permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation. Provide payload via "config".',
    annotations: { title: 'Test GCP account', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'GCP account test payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

  // SaaS account
  {
    name: 'test_saas_account',
    description: 'Test SaaS account credentials/permissions for LogicMonitor (LM) cloud onboarding. Read-oriented validation. Provide payload via "config".',
    annotations: { title: 'Test SaaS account', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'SaaS account test payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

];
