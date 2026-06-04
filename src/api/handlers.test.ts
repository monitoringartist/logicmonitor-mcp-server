/**
 * Tests for LogicMonitor API Handlers
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LogicMonitorHandlers } from './handlers.js';
import { LogicMonitorClient } from './client.js';
import { LogicMonitorApiError } from '../utils/core/lm-error.js';

// Mock the client
jest.mock('./client.js');
jest.mock('../utils/helpers/batch-processor.js');

describe('LogicMonitorHandlers', () => {
  let handlers: LogicMonitorHandlers;
  let mockClient: jest.Mocked<LogicMonitorClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      listResources: jest.fn(),
      getDevice: jest.fn(),
      createDevice: jest.fn(),
      updateDevice: jest.fn(),
      deleteDevice: jest.fn(),
      listDeviceGroups: jest.fn(),
      getDeviceGroup: jest.fn(),
      createDeviceGroup: jest.fn(),
      updateDeviceGroup: jest.fn(),
      deleteDeviceGroup: jest.fn(),
      listAlerts: jest.fn(),
      getAlert: jest.fn(),
      acknowledgeAlert: jest.fn(),
      addAlertNote: jest.fn(),
      listCollectors: jest.fn(),
      getCollector: jest.fn(),
      createCollector: jest.fn(),
      updateCollector: jest.fn(),
      deleteCollector: jest.fn(),
      getCollectorInstallerUrl: jest.fn(),
      acknowledgeCollectorDownAlert: jest.fn(),
      executeDebugCommand: jest.fn(),
      getDebugCommandResult: jest.fn(),
      listDataSources: jest.fn(),
      getDataSource: jest.fn(),
      listDeviceDataSourceInstances: jest.fn(),
      getDeviceDataSourceInstanceData: jest.fn(),
      createDeviceDataSourceInstance: jest.fn(),
      updateDeviceDataSourceInstance: jest.fn(),
      deleteDeviceDataSourceInstance: jest.fn(),
      getDeviceDataSourceInstanceGraphData: jest.fn(),
      getDeviceDataSourceData: jest.fn(),
      listDeviceDataSourceInstanceGroups: jest.fn(),
      getDeviceDataSourceInstanceGroup: jest.fn(),
      createDeviceDataSourceInstanceGroup: jest.fn(),
      updateDeviceDataSourceInstanceGroup: jest.fn(),
      updateInstanceGroupAlertThreshold: jest.fn(),
      getDeviceDataSourceInstanceGroupOverviewGraphData: jest.fn(),
      listDeviceAlertSettings: jest.fn(),
      listDeviceInstanceAlertSettings: jest.fn(),
      getDeviceInstanceAlertSetting: jest.fn(),
      updateDeviceInstanceAlertSetting: jest.fn(),
      listDeviceInstanceConfigs: jest.fn(),
      getDeviceInstanceConfig: jest.fn(),
      collectDeviceInstanceConfig: jest.fn(),
      listNetflowFlows: jest.fn(),
      listNetflowPorts: jest.fn(),
      listNetflowEndpoints: jest.fn(),
      getDeviceTopTalkersGraph: jest.fn(),
      getDeviceSDTHistory: jest.fn(),
      getDeviceDataSourceSDTHistory: jest.fn(),
      getDeviceInstanceSDTHistory: jest.fn(),
      createDeviceProperty: jest.fn(),
      deleteDeviceProperty: jest.fn(),
      listDeviceAlerts: jest.fn(),
      listDeviceEventSources: jest.fn(),
      scheduleDeviceAutoDiscovery: jest.fn(),
      getDevicesDeltaId: jest.fn(),
      getDevicesDelta: jest.fn(),
      createDashboardGroup: jest.fn(),
      updateDashboardGroup: jest.fn(),
      deleteDashboardGroup: jest.fn(),
      cloneDashboardGroup: jest.fn(),
      listLogSources: jest.fn(),
      getLogSource: jest.fn(),
      createLogSource: jest.fn(),
      updateLogSource: jest.fn(),
      deleteLogSource: jest.fn(),
      importLogSource: jest.fn(),
      listPropertyRules: jest.fn(),
      getPropertyRule: jest.fn(),
      createPropertyRule: jest.fn(),
      updatePropertyRule: jest.fn(),
      deletePropertyRule: jest.fn(),
      importPropertyRule: jest.fn(),
      createDataSource: jest.fn(),
      updateDataSource: jest.fn(),
      deleteDataSource: jest.fn(),
      importDataSource: jest.fn(),
      listDataSourceOverviewGraphs: jest.fn(),
      getDataSourceOverviewGraph: jest.fn(),
      listDataSourceDevices: jest.fn(),
      listDataSourceUpdateReasons: jest.fn(),
      listActionChains: jest.fn(),
      getActionChain: jest.fn(),
      createActionChain: jest.fn(),
      updateActionChain: jest.fn(),
      deleteActionChain: jest.fn(),
      listActionRules: jest.fn(),
      getActionRule: jest.fn(),
      createActionRule: jest.fn(),
      updateActionRule: jest.fn(),
      deleteActionRule: jest.fn(),
      setActionRuleStatus: jest.fn(),
      listDashboards: jest.fn(),
      getDashboard: jest.fn(),
      createDashboard: jest.fn(),
      updateDashboard: jest.fn(),
      deleteDashboard: jest.fn(),
      generateDashboardLink: jest.fn(),
      generateResourceLink: jest.fn(),
      generateAlertLink: jest.fn(),
      generateWebsiteLink: jest.fn(),
      listDashboardGroups: jest.fn(),
      getDashboardGroup: jest.fn(),
      listReports: jest.fn(),
      getReport: jest.fn(),
      createReport: jest.fn(),
      updateReport: jest.fn(),
      deleteReport: jest.fn(),
      generateReport: jest.fn(),
      getReportTaskResult: jest.fn(),
      listWebsites: jest.fn(),
      getWebsite: jest.fn(),
      createWebsite: jest.fn(),
      updateWebsite: jest.fn(),
      deleteWebsite: jest.fn(),
      listWebsiteGroups: jest.fn(),
      getWebsiteGroup: jest.fn(),
      createWebsiteGroup: jest.fn(),
      updateWebsiteGroup: jest.fn(),
      deleteWebsiteGroup: jest.fn(),
      listWebsiteGroupWebsites: jest.fn(),
      listWebsiteGroupSDTs: jest.fn(),
      getWebsiteGroupSDTHistory: jest.fn(),
      listUsers: jest.fn(),
      getUser: jest.fn(),
      listRoles: jest.fn(),
      getRole: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      listApiTokens: jest.fn(),
      listSDTs: jest.fn(),
      getSDT: jest.fn(),
      createDeviceSDT: jest.fn(),
      createSDT: jest.fn(),
      updateSDT: jest.fn(),
      deleteSDT: jest.fn(),
      listConfigSources: jest.fn(),
      getConfigSource: jest.fn(),
      createConfigSource: jest.fn(),
      updateConfigSource: jest.fn(),
      deleteConfigSource: jest.fn(),
      importConfigSource: jest.fn(),
      listDeviceProperties: jest.fn(),
      updateDeviceProperty: jest.fn(),
      listAuditLogs: jest.fn(),
      getAuditLog: jest.fn(),
      listAccessGroups: jest.fn(),
      getAccessGroup: jest.fn(),
      createAccessGroup: jest.fn(),
      updateAccessGroup: jest.fn(),
      deleteAccessGroup: jest.fn(),
      listDeviceDataSources: jest.fn(),
      getDeviceDataSource: jest.fn(),
      updateDeviceDataSource: jest.fn(),
      listEventSources: jest.fn(),
      getEventSource: jest.fn(),
      createEventSource: jest.fn(),
      updateEventSource: jest.fn(),
      deleteEventSource: jest.fn(),
      importEventSource: jest.fn(),
      listEscalationChains: jest.fn(),
      getEscalationChain: jest.fn(),
      createEscalationChain: jest.fn(),
      updateEscalationChain: jest.fn(),
      deleteEscalationChain: jest.fn(),
      listRecipients: jest.fn(),
      getRecipient: jest.fn(),
      createRecipient: jest.fn(),
      updateRecipient: jest.fn(),
      deleteRecipient: jest.fn(),
      listRecipientGroups: jest.fn(),
      getRecipientGroup: jest.fn(),
      createRecipientGroup: jest.fn(),
      updateRecipientGroup: jest.fn(),
      deleteRecipientGroup: jest.fn(),
      listAlertRules: jest.fn(),
      getAlertRule: jest.fn(),
      createAlertRule: jest.fn(),
      updateAlertRule: jest.fn(),
      deleteAlertRule: jest.fn(),
      listOpsNotes: jest.fn(),
      getOpsNote: jest.fn(),
      createOpsNote: jest.fn(),
      updateOpsNote: jest.fn(),
      deleteOpsNote: jest.fn(),
      listServices: jest.fn(),
      getService: jest.fn(),
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
      listServiceGroups: jest.fn(),
      getServiceGroup: jest.fn(),
      createServiceGroup: jest.fn(),
      updateServiceGroup: jest.fn(),
      deleteServiceGroup: jest.fn(),
      listReportGroups: jest.fn(),
      getReportGroup: jest.fn(),
      createReportGroup: jest.fn(),
      updateReportGroup: jest.fn(),
      deleteReportGroup: jest.fn(),
      listCollectorGroups: jest.fn(),
      getCollectorGroup: jest.fn(),
      createCollectorGroup: jest.fn(),
      updateCollectorGroup: jest.fn(),
      deleteCollectorGroup: jest.fn(),
      listCollectorAgentLogLevels: jest.fn(),
      getCollectorAgentLogLevel: jest.fn(),
      updateCollectorAgentLogLevel: jest.fn(),
      getCollectorEvents: jest.fn(),
      getCollectorStatusCheck: jest.fn(),
      listJobMonitors: jest.fn(),
      getJobMonitor: jest.fn(),
      createJobMonitor: jest.fn(),
      updateJobMonitor: jest.fn(),
      deleteJobMonitor: jest.fn(),
      importJobMonitor: jest.fn(),
      listDiagnosticSources: jest.fn(),
      getDiagnosticSource: jest.fn(),
      createDiagnosticSource: jest.fn(),
      updateDiagnosticSource: jest.fn(),
      deleteDiagnosticSource: jest.fn(),
      importDiagnosticSource: jest.fn(),
      executeDiagnosticSource: jest.fn(),
      listAppliesToFunctions: jest.fn(),
      getAppliesToFunction: jest.fn(),
      createAppliesToFunction: jest.fn(),
      updateAppliesToFunction: jest.fn(),
      deleteAppliesToFunction: jest.fn(),
      importAppliesToFunction: jest.fn(),
      listOIDs: jest.fn(),
      getOID: jest.fn(),
      createOID: jest.fn(),
      updateOID: jest.fn(),
      deleteOID: jest.fn(),
      importOID: jest.fn(),
      listRemediationSources: jest.fn(),
      getRemediationSource: jest.fn(),
      createRemediationSource: jest.fn(),
      updateRemediationSource: jest.fn(),
      deleteRemediationSource: jest.fn(),
      executeRemediation: jest.fn(),
      listTopologySources: jest.fn(),
      getTopologySource: jest.fn(),
      createTopologySource: jest.fn(),
      updateTopologySource: jest.fn(),
      deleteTopologySource: jest.fn(),
      importTopologySource: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      createApiToken: jest.fn(),
      updateApiToken: jest.fn(),
      deleteApiToken: jest.fn(),
      fetchDeviceInstancesData: jest.fn(),
      getInstanceGraphDataById: jest.fn(),
      listLogAlertGroups: jest.fn(),
      getLogAlertGroup: jest.fn(),
      createLogAlertGroup: jest.fn(),
      updateLogAlertGroup: jest.fn(),
      deleteLogAlertGroup: jest.fn(),
      listLogAlerts: jest.fn(),
      getLogAlert: jest.fn(),
      createLogAlert: jest.fn(),
      updateLogAlert: jest.fn(),
      deleteLogAlert: jest.fn(),
      setLogAlertStatus: jest.fn(),
      listLogQueryGroups: jest.fn(),
      getLogQueryGroup: jest.fn(),
      createLogQueryGroup: jest.fn(),
      updateLogQueryGroup: jest.fn(),
      deleteLogQueryGroup: jest.fn(),
      listLogQueryGroupQueries: jest.fn(),
      listLogQueryGroupsByType: jest.fn(),
      moveLogQueries: jest.fn(),
      listLogPartitions: jest.fn(),
      getLogPartition: jest.fn(),
      createLogPartition: jest.fn(),
      updateLogPartition: jest.fn(),
      deleteLogPartition: jest.fn(),
      getLogPartitionRetentions: jest.fn(),
      logPartitionAction: jest.fn(),
      listTrackedQueryGroups: jest.fn(),
      getTrackedQueryGroup: jest.fn(),
      createTrackedQueryGroup: jest.fn(),
      updateTrackedQueryGroup: jest.fn(),
      deleteTrackedQueryGroup: jest.fn(),
      getAwsAccountId: jest.fn(),
      getAwsExternalId: jest.fn(),
      testAwsAccount: jest.fn(),
      verifyAwsBillingPermissions: jest.fn(),
      discoverAzureSubscriptions: jest.fn(),
      testAzureAccount: jest.fn(),
      verifyAzureStoragePermissions: jest.fn(),
      testGcpAccount: jest.fn(),
      testSaaSAccount: jest.fn(),
      getConfigSourceUpdateReasons: jest.fn(),
      getWebsiteSDTHistory: jest.fn(),
      getWebsiteGraphByName: jest.fn(),
      getDiagnosticRemediationSources: jest.fn(),
      getDiagnosticRemediationResults: jest.fn(),
      getMetricsSummary: jest.fn(),
      getMetricsUsage: jest.fn(),
      updateDefaultDashboard: jest.fn(),
      escalateAlert: jest.fn(),
      mapUnmapModuleToAccessGroup: jest.fn(),
      getIntegrationAuditLogs: jest.fn(),
      getExternalApiStats: jest.fn(),
      getLogicModuleMetadata: jest.fn(),
      listUnmonitoredDevices: jest.fn(),
      getContractInfo: jest.fn(),
      addDNSMapping: jest.fn(),
      listDeviceGroupProperties: jest.fn(),
      updateDeviceGroupProperty: jest.fn(),
      createDeviceGroupProperty: jest.fn(),
      deleteDeviceGroupProperty: jest.fn(),
      listDeviceGroupClusterAlertConfs: jest.fn(),
      getDeviceGroupClusterAlertConf: jest.fn(),
      createDeviceGroupClusterAlertConf: jest.fn(),
      updateDeviceGroupClusterAlertConf: jest.fn(),
      deleteDeviceGroupClusterAlertConf: jest.fn(),
      listDeviceGroupDatasources: jest.fn(),
      getDeviceGroupDatasource: jest.fn(),
      updateDeviceGroupDatasource: jest.fn(),
      getDeviceGroupDatasourceAlertSetting: jest.fn(),
      updateDeviceGroupDatasourceAlertSetting: jest.fn(),
      listDeviceGroupAlerts: jest.fn(),
      listDeviceGroupSDTs: jest.fn(),
      getDeviceGroupSDTHistory: jest.fn(),
      listNetscans: jest.fn(),
      getNetscan: jest.fn(),
      createNetscan: jest.fn(),
      updateNetscan: jest.fn(),
      deleteNetscan: jest.fn(),
      listIntegrations: jest.fn(),
      getIntegration: jest.fn(),
      createIntegration: jest.fn(),
      updateIntegration: jest.fn(),
      deleteIntegration: jest.fn(),
      listWebsiteCheckpoints: jest.fn(),
      getWebsiteCheckpointData: jest.fn(),
      getWebsiteGraphData: jest.fn(),
      getTopology: jest.fn(),
      listCollectorVersions: jest.fn(),
      listCostOptimizationRecommendations: jest.fn(),
      getCostOptimizationRecommendation: jest.fn(),
      listCostOptimizationRecommendationCategories: jest.fn(),
      listWidgets: jest.fn(),
      listDashboardWidgets: jest.fn(),
      getWidget: jest.fn(),
      getWidgetData: jest.fn(),
      createWidget: jest.fn(),
      updateWidget: jest.fn(),
      deleteWidget: jest.fn(),
    } as unknown as jest.Mocked<LogicMonitorClient>;

    handlers = new LogicMonitorHandlers(mockClient);
  });

  describe('Device Management', () => {
    describe('list_resources', () => {
      it('should list devices with default curated fields', async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              displayName: 'test-device',
              name: 'test',
              hostStatus: 'normal',
              alertStatus: 'none',
              extraField: 'should-be-filtered',
            },
          ],
          total: 1,
        };

        mockClient.listResources.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_resources', {
          size: 10,
          offset: 0,
        });

        expect(mockClient.listResources).toHaveBeenCalledWith({
          size: 10,
          offset: 0,
          filter: undefined,
          fields: undefined,
          autoPaginate: undefined,
        });

        expect(result.items[0]).toHaveProperty('id');
        expect(result.items[0]).toHaveProperty('displayName');
        expect(result.items[0]).toHaveProperty('hostStatus');
        expect(result.items[0]).not.toHaveProperty('extraField');
      });

      it('should list devices with custom fields when specified', async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              customField: 'custom-value',
            },
          ],
          total: 1,
        };

        mockClient.listResources.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_resources', {
          fields: 'id,description',
        });

        expect(result).toEqual(mockResponse);
      });

      it('should list devices with filter', async () => {
        const mockResponse = { items: [], total: 0 };
        mockClient.listResources.mockResolvedValue(mockResponse);

        await handlers.handleToolCall('list_resources', {
          filter: 'displayName~*server*',
        });

        expect(mockClient.listResources).toHaveBeenCalledWith({
          size: undefined,
          offset: undefined,
          filter: 'displayName~*server*',
          fields: undefined,
          autoPaginate: undefined,
        });
      });
    });

    describe('get_resource', () => {
      it('should get device by ID', async () => {
        const mockDevice = {
          id: 123,
          displayName: 'test-device',
          name: 'test',
        };

        mockClient.getDevice.mockResolvedValue(mockDevice);

        const result = await handlers.handleToolCall('get_resource', {
          deviceId: 123,
        });

        expect(result).toEqual(mockDevice);
        expect(mockClient.getDevice).toHaveBeenCalledWith(123, {
          fields: undefined,
        });
      });

      it('should get device with custom fields', async () => {
        const mockDevice = { id: 123, customField: 'value' };
        mockClient.getDevice.mockResolvedValue(mockDevice);

        await handlers.handleToolCall('get_resource', {
          deviceId: 123,
          fields: 'id,description',
        });

        expect(mockClient.getDevice).toHaveBeenCalledWith(123, {
          fields: 'id,description',
        });
      });
    });

    describe('create_resource', () => {
      it('should create a single device', async () => {
        const mockDevice = { id: 1, displayName: 'new-device' };
        mockClient.createDevice.mockResolvedValue(mockDevice);

        const result = await handlers.handleToolCall('create_resource', {
          displayName: 'new-device',
          name: 'new-device',
          preferredCollectorId: 1,
        });

        expect(result).toEqual(mockDevice);
        expect(mockClient.createDevice).toHaveBeenCalledWith({
          displayName: 'new-device',
          name: 'new-device',
          preferredCollectorId: 1,
        });
      });

      it('should create device with optional properties', async () => {
        const mockDevice = { id: 1, displayName: 'new-device' };
        mockClient.createDevice.mockResolvedValue(mockDevice);

        await handlers.handleToolCall('create_resource', {
          displayName: 'new-device',
          name: 'new-device',
          preferredCollectorId: 1,
          hostGroupIds: '1,2',
          description: 'Test device',
          disableAlerting: true,
          customProperties: [{ name: 'env', value: 'prod' }],
        });

        expect(mockClient.createDevice).toHaveBeenCalledWith({
          displayName: 'new-device',
          name: 'new-device',
          preferredCollectorId: 1,
          hostGroupIds: '1,2',
          description: 'Test device',
          disableAlerting: true,
          customProperties: [{ name: 'env', value: 'prod' }],
        });
      });
    });

    describe('update_resource', () => {
      it('should update device with replace opType', async () => {
        const mockDevice = { id: 1, displayName: 'updated-device' };
        mockClient.updateDevice.mockResolvedValue(mockDevice);

        const result = await handlers.handleToolCall('update_resource', {
          deviceId: 1,
          displayName: 'updated-device',
        });

        expect(result).toEqual(mockDevice);
        expect(mockClient.updateDevice).toHaveBeenCalledWith(
          1,
          { displayName: 'updated-device' },
          { opType: 'replace' },
        );
      });

      it('should update device with custom opType', async () => {
        const mockDevice = { id: 1, displayName: 'updated-device' };
        mockClient.updateDevice.mockResolvedValue(mockDevice);

        await handlers.handleToolCall('update_resource', {
          deviceId: 1,
          displayName: 'updated-device',
          opType: 'add',
        });

        expect(mockClient.updateDevice).toHaveBeenCalledWith(
          1,
          { displayName: 'updated-device' },
          { opType: 'add' },
        );
      });
    });

    describe('delete_resource', () => {
      it('should delete device', async () => {
        mockClient.deleteDevice.mockResolvedValue({});

        const result = await handlers.handleToolCall('delete_resource', {
          deviceId: 1,
        });

        expect(result).toEqual({});
        expect(mockClient.deleteDevice).toHaveBeenCalledWith(1, {
          deleteFromSystem: undefined,
        });
      });

      it('should delete device from system', async () => {
        mockClient.deleteDevice.mockResolvedValue({});

        await handlers.handleToolCall('delete_resource', {
          deviceId: 1,
          deleteFromSystem: true,
        });

        expect(mockClient.deleteDevice).toHaveBeenCalledWith(1, {
          deleteFromSystem: true,
        });
      });
    });
  });

  describe('Device Groups', () => {
    describe('list_resource_groups', () => {
      it('should list device groups with curated fields', async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              name: 'test-group',
              fullPath: '/test-group',
              extraField: 'filtered',
            },
          ],
          total: 1,
        };

        mockClient.listDeviceGroups.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_resource_groups', {});

        expect(result.items[0]).toHaveProperty('id');
        expect(result.items[0]).toHaveProperty('name');
        expect(result.items[0]).not.toHaveProperty('extraField');
      });
    });

    describe('get_resource_group', () => {
      it('should get device group by ID', async () => {
        const mockGroup = { id: 1, name: 'test-group' };
        mockClient.getDeviceGroup.mockResolvedValue(mockGroup);

        const result = await handlers.handleToolCall('get_resource_group', {
          groupId: 1,
        });

        expect(result).toEqual(mockGroup);
      });
    });

    describe('create_resource_group', () => {
      it('should create device group', async () => {
        const mockGroup = { id: 1, name: 'new-group' };
        mockClient.createDeviceGroup.mockResolvedValue(mockGroup);

        const result = await handlers.handleToolCall('create_resource_group', {
          name: 'new-group',
        });

        expect(result).toEqual(mockGroup);
        expect(mockClient.createDeviceGroup).toHaveBeenCalledWith({
          name: 'new-group',
        });
      });

      it('should create device group with optional properties', async () => {
        const mockGroup = { id: 1, name: 'new-group' };
        mockClient.createDeviceGroup.mockResolvedValue(mockGroup);

        await handlers.handleToolCall('create_resource_group', {
          name: 'new-group',
          parentId: 2,
          description: 'Test group',
          disableAlerting: true,
          customProperties: [{ name: 'env', value: 'prod' }],
        });

        expect(mockClient.createDeviceGroup).toHaveBeenCalledWith({
          name: 'new-group',
          parentId: 2,
          description: 'Test group',
          disableAlerting: true,
          customProperties: [{ name: 'env', value: 'prod' }],
        });
      });
    });

    describe('update_resource_group', () => {
      it('should update device group', async () => {
        const mockGroup = { id: 1, name: 'updated-group' };
        mockClient.updateDeviceGroup.mockResolvedValue(mockGroup);

        const result = await handlers.handleToolCall('update_resource_group', {
          groupId: 1,
          name: 'updated-group',
        });

        expect(result).toEqual(mockGroup);
        expect(mockClient.updateDeviceGroup).toHaveBeenCalledWith(
          1,
          { name: 'updated-group' },
          { opType: 'replace' },
        );
      });
    });

    describe('delete_resource_group', () => {
      it('should delete device group', async () => {
        mockClient.deleteDeviceGroup.mockResolvedValue({});

        const result = await handlers.handleToolCall('delete_resource_group', {
          groupId: 1,
        });

        expect(result).toEqual({});
        expect(mockClient.deleteDeviceGroup).toHaveBeenCalledWith(1, {
          deleteChildren: undefined,
        });
      });

      it('should delete device group with children', async () => {
        mockClient.deleteDeviceGroup.mockResolvedValue({});

        await handlers.handleToolCall('delete_resource_group', {
          groupId: 1,
          deleteChildren: true,
        });

        expect(mockClient.deleteDeviceGroup).toHaveBeenCalledWith(1, {
          deleteChildren: true,
        });
      });
    });
  });

  describe('Alerts', () => {
    describe('list_alerts', () => {
      it('should list alerts with curated fields', async () => {
        const mockResponse = {
          items: [
            {
              id: 'alert1',
              internalId: 'int1',
              type: 'datapoint',
              severity: 'error',
              extraField: 'filtered',
            },
          ],
          total: 1,
        };

        mockClient.listAlerts.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_alerts', {});

        expect(result.items[0]).toHaveProperty('id');
        expect(result.items[0]).toHaveProperty('severity');
        expect(result.items[0]).not.toHaveProperty('extraField');
      });

      it('should list alerts with needMessage parameter', async () => {
        const mockResponse = { items: [], total: 0 };
        mockClient.listAlerts.mockResolvedValue(mockResponse);

        await handlers.handleToolCall('list_alerts', {
          needMessage: true,
        });

        expect(mockClient.listAlerts).toHaveBeenCalledWith({
          size: undefined,
          offset: undefined,
          filter: undefined,
          fields: undefined,
          needMessage: true,
          autoPaginate: undefined,
        });
      });

      it('should inject cleared:true into the filter when cleared is true', async () => {
        mockClient.listAlerts.mockResolvedValue({ items: [], total: 0 });

        await handlers.handleToolCall('list_alerts', { cleared: true });

        expect(mockClient.listAlerts).toHaveBeenCalledWith(
          expect.objectContaining({ filter: 'cleared:true' }),
        );
      });

      it('should inject cleared:false into the filter when cleared is false', async () => {
        mockClient.listAlerts.mockResolvedValue({ items: [], total: 0 });

        await handlers.handleToolCall('list_alerts', { cleared: false });

        expect(mockClient.listAlerts).toHaveBeenCalledWith(
          expect.objectContaining({ filter: 'cleared:false' }),
        );
      });

      it('should combine cleared with an existing filter using AND', async () => {
        mockClient.listAlerts.mockResolvedValue({ items: [], total: 0 });

        await handlers.handleToolCall('list_alerts', {
          filter: 'severity:critical',
          cleared: true,
        });

        expect(mockClient.listAlerts).toHaveBeenCalledWith(
          expect.objectContaining({ filter: 'severity:critical,cleared:true' }),
        );
      });

      it('should not add a cleared filter when cleared is omitted', async () => {
        mockClient.listAlerts.mockResolvedValue({ items: [], total: 0 });

        await handlers.handleToolCall('list_alerts', {});

        expect(mockClient.listAlerts).toHaveBeenCalledWith(
          expect.objectContaining({ filter: undefined }),
        );
      });
    });

    describe('get_alert', () => {
      it('should get alert by ID', async () => {
        const mockAlert = { id: 'alert1', severity: 'error' };
        mockClient.getAlert.mockResolvedValue(mockAlert);

        const result = await handlers.handleToolCall('get_alert', {
          alertId: 'alert1',
        });

        expect(result).toEqual(mockAlert);
      });
    });

    describe('acknowledge_alert', () => {
      it('should acknowledge alert', async () => {
        mockClient.acknowledgeAlert.mockResolvedValue({});

        const result = await handlers.handleToolCall('acknowledge_alert', {
          alertId: 'alert1',
          comment: 'Acknowledged',
        });

        expect(result).toEqual({});
        expect(mockClient.acknowledgeAlert).toHaveBeenCalledWith('alert1', 'Acknowledged');
      });
    });

    describe('add_alert_note', () => {
      it('should add note to alert', async () => {
        mockClient.addAlertNote.mockResolvedValue({});

        const result = await handlers.handleToolCall('add_alert_note', {
          alertId: 'alert1',
          note: 'Test note',
        });

        expect(result).toEqual({});
        expect(mockClient.addAlertNote).toHaveBeenCalledWith('alert1', 'Test note');
      });
    });
  });

  describe('Collectors', () => {
    describe('list_collectors', () => {
      it('should list collectors with curated fields', async () => {
        const mockResponse = {
          items: [
            {
              id: 1,
              description: 'test-collector',
              hostname: 'collector.example.com',
              status: 'active',
              extraField: 'filtered',
            },
          ],
          total: 1,
        };

        mockClient.listCollectors.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_collectors', {});

        expect(result.items[0]).toHaveProperty('id');
        expect(result.items[0]).toHaveProperty('hostname');
        expect(result.items[0]).not.toHaveProperty('extraField');
      });
    });

    describe('get_collector', () => {
      it('should get collector by ID', async () => {
        const mockCollector = { id: 1, description: 'test-collector' };
        mockClient.getCollector.mockResolvedValue(mockCollector);

        const result = await handlers.handleToolCall('get_collector', {
          collectorId: 1,
        });

        expect(result).toEqual(mockCollector);
      });
    });
  });

  describe('DataSources', () => {
    describe('list_datasources', () => {
      it('should list datasources', async () => {
        const mockResponse = {
          items: [{ id: 1, name: 'test-datasource' }],
          total: 1,
        };

        mockClient.listDataSources.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_datasources', {});

        expect(result.items[0]).toHaveProperty('id');
        expect(result.items[0]).toHaveProperty('name');
      });
    });

    describe('get_datasource', () => {
      it('should get datasource by ID', async () => {
        const mockDataSource = { id: 1, name: 'test-datasource' };
        mockClient.getDataSource.mockResolvedValue(mockDataSource);

        const result = await handlers.handleToolCall('get_datasource', {
          dataSourceId: 1,
        });

        expect(result).toEqual(mockDataSource);
      });
    });

    describe('list_resource_instances', () => {
      it('should list device datasource instances', async () => {
        const mockInstances = { items: [], total: 0 };
        mockClient.listDeviceDataSourceInstances.mockResolvedValue(mockInstances);

        const result = await handlers.handleToolCall('list_resource_instances', {
          deviceId: 1,
          deviceDataSourceId: 2,
        });

        expect(result).toEqual(mockInstances);
        expect(mockClient.listDeviceDataSourceInstances).toHaveBeenCalledWith(1, 2, {
          size: undefined,
          offset: undefined,
          filter: undefined,
          fields: undefined,
        });
      });
    });

    describe('get_resource_instance_data', () => {
      it('should get device instance data', async () => {
        const mockData = { data: [], timestamps: [] };
        mockClient.getDeviceDataSourceInstanceData.mockResolvedValue(mockData);

        const result = await handlers.handleToolCall('get_resource_instance_data', {
          deviceId: 1,
          deviceDataSourceId: 2,
          instanceId: 3,
        });

        expect(result).toEqual(mockData);
        expect(mockClient.getDeviceDataSourceInstanceData).toHaveBeenCalledWith(1, 2, 3, {
          datapoints: undefined,
          start: undefined,
          end: undefined,
          format: undefined,
        });
      });

      it('should get device instance data with parameters', async () => {
        const mockData = { data: [], timestamps: [] };
        mockClient.getDeviceDataSourceInstanceData.mockResolvedValue(mockData);

        await handlers.handleToolCall('get_resource_instance_data', {
          deviceId: 1,
          deviceDataSourceId: 2,
          instanceId: 3,
          datapoints: 'metric1,metric2',
          start: 1234567890,
          end: 1234567900,
          format: 'json',
        });

        expect(mockClient.getDeviceDataSourceInstanceData).toHaveBeenCalledWith(1, 2, 3, {
          datapoints: 'metric1,metric2',
          start: 1234567890,
          end: 1234567900,
          format: 'json',
        });
      });
    });
  });

  describe('Dashboards', () => {
    describe('list_dashboards', () => {
      it('should list dashboards', async () => {
        const mockResponse = {
          items: [{ id: 1, name: 'test-dashboard' }],
          total: 1,
        };

        mockClient.listDashboards.mockResolvedValue(mockResponse);

        const result = await handlers.handleToolCall('list_dashboards', {});

        expect(result.items).toHaveLength(1);
      });
    });

    describe('get_dashboard', () => {
      it('should get dashboard by ID', async () => {
        const mockDashboard = { id: 1, name: 'test-dashboard' };
        mockClient.getDashboard.mockResolvedValue(mockDashboard);

        const result = await handlers.handleToolCall('get_dashboard', {
          dashboardId: 1,
        });

        expect(result).toEqual(mockDashboard);
      });
    });

    describe('create_dashboard', () => {
      it('should create dashboard', async () => {
        const mockDashboard = { id: 1, name: 'new-dashboard' };
        mockClient.createDashboard.mockResolvedValue(mockDashboard);

        const result = await handlers.handleToolCall('create_dashboard', {
          name: 'new-dashboard',
        });

        expect(result).toEqual(mockDashboard);
        expect(mockClient.createDashboard).toHaveBeenCalledWith({
          name: 'new-dashboard',
        });
      });

      it('should create dashboard with optional properties', async () => {
        const mockDashboard = { id: 1, name: 'new-dashboard' };
        mockClient.createDashboard.mockResolvedValue(mockDashboard);

        await handlers.handleToolCall('create_dashboard', {
          name: 'new-dashboard',
          description: 'Test dashboard',
          groupId: 2,
          widgetsConfig: [],
        });

        expect(mockClient.createDashboard).toHaveBeenCalledWith({
          name: 'new-dashboard',
          description: 'Test dashboard',
          groupId: 2,
          widgetsConfig: [],
        });
      });
    });

    describe('update_dashboard', () => {
      it('should update dashboard', async () => {
        const mockDashboard = { id: 1, name: 'updated-dashboard' };
        mockClient.updateDashboard.mockResolvedValue(mockDashboard);

        const result = await handlers.handleToolCall('update_dashboard', {
          dashboardId: 1,
          name: 'updated-dashboard',
        });

        expect(result).toEqual(mockDashboard);
        expect(mockClient.updateDashboard).toHaveBeenCalledWith(1, {
          name: 'updated-dashboard',
        });
      });
    });

    describe('delete_dashboard', () => {
      it('should delete dashboard', async () => {
        mockClient.deleteDashboard.mockResolvedValue({});

        const result = await handlers.handleToolCall('delete_dashboard', {
          dashboardId: 1,
        });

        expect(result).toEqual({});
      });
    });

    describe('Deeplinks', () => {
      it('should generate dashboard deeplink', async () => {
        const mockDeeplink = {
          url: 'https://example.com/dashboard/1',
          dashboard: { id: 1, name: 'test' },
          groupPath: [],
        };
        mockClient.generateDashboardLink.mockResolvedValue(mockDeeplink);

        const result = await handlers.handleToolCall('generate_dashboard_link', {
          dashboardId: 1,
        });

        expect(result).toEqual(mockDeeplink);
      });

      it('should generate resource deeplink', async () => {
        const mockDeeplink = {
          url: 'https://example.com/device/1',
          device: { id: 1, displayName: 'test' },
          groupPath: [],
        };
        mockClient.generateResourceLink.mockResolvedValue(mockDeeplink);

        const result = await handlers.handleToolCall('generate_resource_link', {
          deviceId: 1,
        });

        expect(result).toEqual(mockDeeplink);
      });

      it('should generate alert deeplink', async () => {
        const mockDeeplink = {
          url: 'https://example.com/alert/1',
          alert: { id: 'alert1', severity: 'error' },
        };
        mockClient.generateAlertLink.mockResolvedValue(mockDeeplink);

        const result = await handlers.handleToolCall('generate_alert_link', {
          alertId: 'alert1',
        });

        expect(result).toEqual(mockDeeplink);
      });

      it('should generate website deeplink', async () => {
        const mockDeeplink = {
          url: 'https://example.com/website/1',
          website: { id: 1, name: 'test' },
          groupPath: [],
        };
        mockClient.generateWebsiteLink.mockResolvedValue(mockDeeplink);

        const result = await handlers.handleToolCall('generate_website_link', {
          websiteId: 1,
        });

        expect(result).toEqual(mockDeeplink);
      });
    });
  });

  describe('Dashboard Groups', () => {
    it('should list dashboard groups', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-group' }], total: 1 };
      mockClient.listDashboardGroups.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_dashboard_groups', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get dashboard group', async () => {
      const mockGroup = { id: 1, name: 'test-group' };
      mockClient.getDashboardGroup.mockResolvedValue(mockGroup);

      const result = await handlers.handleToolCall('get_dashboard_group', {
        groupId: 1,
      });

      expect(result).toEqual(mockGroup);
    });
  });

  describe('Reports', () => {
    it('should list reports', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-report' }], total: 1 };
      mockClient.listReports.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_reports', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get report', async () => {
      const mockReport = { id: 1, name: 'test-report' };
      mockClient.getReport.mockResolvedValue(mockReport);

      const result = await handlers.handleToolCall('get_report', {
        reportId: 1,
      });

      expect(result).toEqual(mockReport);
    });
  });

  describe('Websites', () => {
    it('should list websites', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-website' }], total: 1 };
      mockClient.listWebsites.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_websites', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get website', async () => {
      const mockWebsite = { id: 1, name: 'test-website' };
      mockClient.getWebsite.mockResolvedValue(mockWebsite);

      const result = await handlers.handleToolCall('get_website', {
        websiteId: 1,
      });

      expect(result).toEqual(mockWebsite);
    });

    it('should create website', async () => {
      const mockWebsite = { id: 1, name: 'new-website' };
      mockClient.createWebsite.mockResolvedValue(mockWebsite);

      const result = await handlers.handleToolCall('create_website', {
        name: 'new-website',
        domain: 'example.com',
        type: 'webcheck',
      });

      expect(result).toEqual(mockWebsite);
      expect(mockClient.createWebsite).toHaveBeenCalledWith({
        name: 'new-website',
        domain: 'example.com',
        type: 'webcheck',
      });
    });

    it('should update website', async () => {
      const mockWebsite = { id: 1, name: 'updated-website' };
      mockClient.updateWebsite.mockResolvedValue(mockWebsite);

      const result = await handlers.handleToolCall('update_website', {
        websiteId: 1,
        name: 'updated-website',
      });

      expect(result).toEqual(mockWebsite);
    });

    it('should delete website', async () => {
      mockClient.deleteWebsite.mockResolvedValue({});

      const result = await handlers.handleToolCall('delete_website', {
        websiteId: 1,
      });

      expect(result).toEqual({});
    });
  });

  describe('Website Groups', () => {
    it('should list website groups', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-group' }], total: 1 };
      mockClient.listWebsiteGroups.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_website_groups', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get website group', async () => {
      const mockGroup = { id: 1, name: 'test-group' };
      mockClient.getWebsiteGroup.mockResolvedValue(mockGroup);

      const result = await handlers.handleToolCall('get_website_group', {
        groupId: 1,
      });

      expect(result).toEqual(mockGroup);
    });
  });

  describe('Users and Roles', () => {
    it('should list users', async () => {
      const mockResponse = { items: [{ id: 1, username: 'test-user' }], total: 1 };
      mockClient.listUsers.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_users', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get user', async () => {
      const mockUser = { id: 1, username: 'test-user' };
      mockClient.getUser.mockResolvedValue(mockUser);

      const result = await handlers.handleToolCall('get_user', {
        userId: 1,
      });

      expect(result).toEqual(mockUser);
    });

    it('should list roles', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-role' }], total: 1 };
      mockClient.listRoles.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_roles', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get role', async () => {
      const mockRole = { id: 1, name: 'test-role' };
      mockClient.getRole.mockResolvedValue(mockRole);

      const result = await handlers.handleToolCall('get_role', {
        roleId: 1,
      });

      expect(result).toEqual(mockRole);
    });
  });

  describe('API Tokens', () => {
    it('should list api tokens', async () => {
      const mockResponse = { items: [{ adminId: 1, accessId: 'abc123' }], total: 1 };
      mockClient.listApiTokens.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_api_tokens', {
        userId: 1,
      });

      expect(result.items).toHaveLength(1);
    });
  });

  describe('SDTs', () => {
    it('should list SDTs', async () => {
      const mockResponse = { items: [{ id: 1, type: 'device' }], total: 1 };
      mockClient.listSDTs.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_sdts', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get SDT', async () => {
      const mockSDT = { id: 1, type: 'device' };
      mockClient.getSDT.mockResolvedValue(mockSDT);

      const result = await handlers.handleToolCall('get_sdt', {
        sdtId: 1,
      });

      expect(result).toEqual(mockSDT);
    });

    it('should create device SDT', async () => {
      const mockSDT = { id: 1, deviceId: 123 };
      mockClient.createDeviceSDT.mockResolvedValue(mockSDT);

      const result = await handlers.handleToolCall('create_resource_sdt', {
        deviceId: 123,
        type: 1,
        startDateTime: 1234567890,
        endDateTime: 1234567900,
      });

      expect(result).toEqual(mockSDT);
      expect(mockClient.createDeviceSDT).toHaveBeenCalledWith({
        sdtType: 1,
        deviceId: 123,
        type: 1,
        startDateTime: 1234567890,
        endDateTime: 1234567900,
      });
    });

    it('should create device SDT with comment', async () => {
      const mockSDT = { id: 1, deviceId: 123 };
      mockClient.createDeviceSDT.mockResolvedValue(mockSDT);

      await handlers.handleToolCall('create_resource_sdt', {
        deviceId: 123,
        type: 1,
        startDateTime: 1234567890,
        endDateTime: 1234567900,
        comment: 'Maintenance window',
      });

      expect(mockClient.createDeviceSDT).toHaveBeenCalledWith({
        sdtType: 1,
        deviceId: 123,
        type: 1,
        startDateTime: 1234567890,
        endDateTime: 1234567900,
        comment: 'Maintenance window',
      });
    });

    it('should delete SDT', async () => {
      mockClient.deleteSDT.mockResolvedValue({});

      const result = await handlers.handleToolCall('delete_sdt', {
        sdtId: 1,
      });

      expect(result).toEqual({});
    });
  });

  describe('ConfigSources', () => {
    it('should list configsources', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-config' }], total: 1 };
      mockClient.listConfigSources.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_configsources', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get configsource', async () => {
      const mockConfigSource = { id: 1, name: 'test-config' };
      mockClient.getConfigSource.mockResolvedValue(mockConfigSource);

      const result = await handlers.handleToolCall('get_configsource', {
        configSourceId: 1,
      });

      expect(result).toEqual(mockConfigSource);
    });
  });

  describe('Device Properties', () => {
    it('should list device properties', async () => {
      const mockResponse = { items: [{ name: 'prop1', value: 'val1' }], total: 1 };
      mockClient.listDeviceProperties.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_resource_properties', {
        deviceId: 1,
      });

      expect(result.items).toHaveLength(1);
    });

    it('should update device property', async () => {
      mockClient.updateDeviceProperty.mockResolvedValue({});

      const result = await handlers.handleToolCall('update_resource_property', {
        deviceId: 1,
        propertyName: 'test.prop',
        value: 'new-value',
      });

      expect(result).toEqual({});
      expect(mockClient.updateDeviceProperty).toHaveBeenCalledWith(1, 'test.prop', 'new-value');
    });
  });

  describe('Query Parameter in List Tools', () => {
    it('should list devices with query parameter', async () => {
      const mockResponse = { items: [], total: 0 };
      mockClient.listResources.mockResolvedValue(mockResponse);

      await handlers.handleToolCall('list_resources', {
        query: 'server',
      });

      expect(mockClient.listResources).toHaveBeenCalled();
    });

    it('should list alerts with query parameter', async () => {
      const mockResponse = { items: [], total: 0 };
      mockClient.listAlerts.mockResolvedValue(mockResponse);

      await handlers.handleToolCall('list_alerts', {
        query: 'critical',
      });

      expect(mockClient.listAlerts).toHaveBeenCalled();
    });

    it('should list audit logs with query parameter', async () => {
      const mockResponse = { items: [], total: 0 };
      mockClient.listAuditLogs.mockResolvedValue(mockResponse);

      await handlers.handleToolCall('list_audit_logs', {
        query: 'user',
      });

      expect(mockClient.listAuditLogs).toHaveBeenCalled();
    });
  });

  describe('Audit Logs', () => {
    it('should list audit logs', async () => {
      const mockResponse = { items: [{ id: 1, description: 'test log' }], total: 1 };
      mockClient.listAuditLogs.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_audit_logs', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get audit log', async () => {
      const mockLog = { id: 1, description: 'test log' };
      mockClient.getAuditLog.mockResolvedValue(mockLog);

      const result = await handlers.handleToolCall('get_audit_log', {
        auditLogId: 1,
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('Access Groups', () => {
    it('should list access groups', async () => {
      const mockResponse = { items: [{ id: 1, name: 'test-group' }], total: 1 };
      mockClient.listAccessGroups.mockResolvedValue(mockResponse);

      const result = await handlers.handleToolCall('list_access_groups', {});

      expect(result.items).toHaveLength(1);
    });

    it('should get access group', async () => {
      const mockGroup = { id: 1, name: 'test-group' };
      mockClient.getAccessGroup.mockResolvedValue(mockGroup);

      const result = await handlers.handleToolCall('get_access_group', {
        accessGroupId: 1,
      });

      expect(result).toEqual(mockGroup);
    });

    it('should create access group', async () => {
      const mockGroup = { id: 1, name: 'new-group' };
      mockClient.createAccessGroup.mockResolvedValue(mockGroup);

      const result = await handlers.handleToolCall('create_access_group', {
        name: 'new-group',
        description: 'Test group',
      });

      expect(result).toEqual(mockGroup);
    });

    it('should update access group', async () => {
      const mockGroup = { id: 1, name: 'updated-group' };
      mockClient.updateAccessGroup.mockResolvedValue(mockGroup);

      const result = await handlers.handleToolCall('update_access_group', {
        accessGroupId: 1,
        name: 'updated-group',
      });

      expect(result).toEqual(mockGroup);
    });

    it('should delete access group', async () => {
      mockClient.deleteAccessGroup.mockResolvedValue({});

      const result = await handlers.handleToolCall('delete_access_group', {
        accessGroupId: 1,
      });

      expect(result).toEqual({});
    });
  });

  describe('Cost Optimization Recommendations', () => {
    describe('list_cost_optimization_recommendations', () => {
      it('should list recommendations passing pagination, filter and fields', async () => {
        const mockResponse = {
          total: 1,
          items: [
            {
              id: '123-456-EBS_UNATTACHED',
              recommendationId: 123,
              recommendationCategory: 'EBS Unattached',
              recommendationStatus: 'active',
              annualSavings: 240.5,
              cloudProvider: 'AWS',
            },
          ],
        };

        mockClient.listCostOptimizationRecommendations.mockResolvedValue(mockResponse as never);

        const result = await handlers.handleToolCall('list_cost_optimization_recommendations', {
          size: 25,
          offset: 0,
          filter: 'recommendationCategory:"EBS Unattached"',
          fields: 'id,annualSavings',
        });

        expect(mockClient.listCostOptimizationRecommendations).toHaveBeenCalledWith({
          size: 25,
          offset: 0,
          filter: 'recommendationCategory:"EBS Unattached"',
          fields: 'id,annualSavings',
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('get_cost_optimization_recommendation', () => {
      it('should get a recommendation by composite id', async () => {
        const mockRecommendation = {
          id: '123-456-EBS_UNATTACHED',
          recommendationId: 123,
          annualSavings: 240.5,
        };

        mockClient.getCostOptimizationRecommendation.mockResolvedValue(mockRecommendation as never);

        const result = await handlers.handleToolCall('get_cost_optimization_recommendation', {
          id: '123-456-EBS_UNATTACHED',
        });

        expect(result).toEqual(mockRecommendation);
        expect(mockClient.getCostOptimizationRecommendation).toHaveBeenCalledWith(
          '123-456-EBS_UNATTACHED',
          { fields: undefined },
        );
      });
    });

    describe('list_cost_optimization_recommendation_categories', () => {
      it('should list recommendation categories', async () => {
        const mockResponse = {
          total: 1,
          items: [{ name: 'EBS Unattached', description: 'Unattached EBS volumes' }],
        };

        mockClient.listCostOptimizationRecommendationCategories.mockResolvedValue(mockResponse as never);

        const result = await handlers.handleToolCall('list_cost_optimization_recommendation_categories', {
          size: 50,
          offset: 0,
        });

        expect(mockClient.listCostOptimizationRecommendationCategories).toHaveBeenCalledWith({
          size: 50,
          offset: 0,
          filter: undefined,
          fields: undefined,
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Device Instances, Alert Settings, Config, NetFlow & SDT History', () => {
    it('create_resource_instance passes config to client', async () => {
      mockClient.createDeviceDataSourceInstance.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_resource_instance', {
        deviceId: 10,
        deviceDataSourceId: 20,
        config: { wildValue: 'eth0', displayName: 'eth0' },
      });
      expect(mockClient.createDeviceDataSourceInstance).toHaveBeenCalledWith(10, 20, {
        wildValue: 'eth0',
        displayName: 'eth0',
      });
    });

    it('update_resource_instance forwards opType and config', async () => {
      mockClient.updateDeviceDataSourceInstance.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_resource_instance', {
        deviceId: 10,
        deviceDataSourceId: 20,
        instanceId: 30,
        opType: 'replace',
        config: { description: 'x' },
      });
      expect(mockClient.updateDeviceDataSourceInstance).toHaveBeenCalledWith(10, 20, 30, { description: 'x' }, { opType: 'replace' });
    });

    it('delete_resource_instance calls client', async () => {
      mockClient.deleteDeviceDataSourceInstance.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_resource_instance', { deviceId: 10, deviceDataSourceId: 20, instanceId: 30 });
      expect(mockClient.deleteDeviceDataSourceInstance).toHaveBeenCalledWith(10, 20, 30);
    });

    it('get_instance_graph_data forwards graph + time range', async () => {
      mockClient.getDeviceDataSourceInstanceGraphData.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_instance_graph_data', {
        deviceId: 1, deviceDataSourceId: 2, instanceId: 3, graphId: 4, start: 100, end: 200, format: 'json',
      });
      expect(mockClient.getDeviceDataSourceInstanceGraphData).toHaveBeenCalledWith(1, 2, 3, 4, { start: 100, end: 200, format: 'json' });
    });

    it('update_instance_group_alert_threshold forwards datapoint + config', async () => {
      mockClient.updateInstanceGroupAlertThreshold.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_instance_group_alert_threshold', {
        deviceId: 1, deviceDataSourceId: 2, instanceGroupId: 3, datapointId: 4, config: { alertExpr: '> 90 95 99' },
      });
      expect(mockClient.updateInstanceGroupAlertThreshold).toHaveBeenCalledWith(1, 2, 3, 4, { alertExpr: '> 90 95 99' });
    });

    it('update_instance_alert_setting forwards config', async () => {
      mockClient.updateDeviceInstanceAlertSetting.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_instance_alert_setting', {
        deviceId: 1, deviceDataSourceId: 2, instanceId: 3, alertSettingId: 4, config: { disableAlerting: true },
      });
      expect(mockClient.updateDeviceInstanceAlertSetting).toHaveBeenCalledWith(1, 2, 3, 4, { disableAlerting: true });
    });

    it('get_resource_instance_config forwards configId + params', async () => {
      mockClient.getDeviceInstanceConfig.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_resource_instance_config', {
        deviceId: 1, deviceDataSourceId: 2, instanceId: 3, configId: 'abc', format: 'raw',
      });
      expect(mockClient.getDeviceInstanceConfig).toHaveBeenCalledWith(1, 2, 3, 'abc', { format: 'raw', startEpoch: undefined, fields: undefined });
    });

    it('collect_resource_instance_config triggers collection', async () => {
      mockClient.collectDeviceInstanceConfig.mockResolvedValue({} as never);
      await handlers.handleToolCall('collect_resource_instance_config', { deviceId: 1, deviceDataSourceId: 2, instanceId: 3 });
      expect(mockClient.collectDeviceInstanceConfig).toHaveBeenCalledWith(1, 2, 3);
    });

    it('list_resource_netflow_flows forwards netflow params', async () => {
      mockClient.listNetflowFlows.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('list_resource_netflow_flows', { deviceId: 7, start: 1, end: 2, netflowFilter: 'x' });
      expect(mockClient.listNetflowFlows).toHaveBeenCalledWith(7, expect.objectContaining({ start: 1, end: 2, netflowFilter: 'x' }));
    });

    it('get_resource_sdt_history calls client', async () => {
      mockClient.getDeviceSDTHistory.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('get_resource_sdt_history', { deviceId: 7 });
      expect(mockClient.getDeviceSDTHistory).toHaveBeenCalledWith(7, expect.any(Object));
    });

    it('create_resource_property and delete_resource_property call client', async () => {
      mockClient.createDeviceProperty.mockResolvedValue({} as never);
      mockClient.deleteDeviceProperty.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_resource_property', { deviceId: 7, name: 'k', value: 'v' });
      await handlers.handleToolCall('delete_resource_property', { deviceId: 7, propertyName: 'k' });
      expect(mockClient.createDeviceProperty).toHaveBeenCalledWith(7, 'k', 'v');
      expect(mockClient.deleteDeviceProperty).toHaveBeenCalledWith(7, 'k');
    });

    it('schedule_resource_auto_discovery and delta tools call client', async () => {
      mockClient.scheduleDeviceAutoDiscovery.mockResolvedValue({} as never);
      mockClient.getDevicesDeltaId.mockResolvedValue({} as never);
      mockClient.getDevicesDelta.mockResolvedValue({} as never);
      await handlers.handleToolCall('schedule_resource_auto_discovery', { deviceId: 7 });
      await handlers.handleToolCall('get_resources_delta_id', {});
      await handlers.handleToolCall('get_resources_delta', { deltaId: 'd1' });
      expect(mockClient.scheduleDeviceAutoDiscovery).toHaveBeenCalledWith(7);
      expect(mockClient.getDevicesDeltaId).toHaveBeenCalledWith({ deltaId: undefined });
      expect(mockClient.getDevicesDelta).toHaveBeenCalledWith('d1');
    });
  });

  describe('Collector Groups & Agent Log Levels', () => {
    it('create_collector_group merges config', async () => {
      mockClient.createCollectorGroup.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_collector_group', { name: 'CG', config: { description: 'd' } });
      expect(mockClient.createCollectorGroup).toHaveBeenCalledWith({ name: 'CG', description: 'd' });
    });

    it('update_collector_group forwards query flags + excludes them from body', async () => {
      mockClient.updateCollectorGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_collector_group', { groupId: 2, name: 'X', opType: 'replace' });
      expect(mockClient.updateCollectorGroup).toHaveBeenCalledWith(2, { name: 'X' }, expect.objectContaining({ opType: 'replace' }));
    });

    it('delete_collector_group calls client', async () => {
      mockClient.deleteCollectorGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_collector_group', { groupId: 2 });
      expect(mockClient.deleteCollectorGroup).toHaveBeenCalledWith(2);
    });

    it('update_collector_agent_log_level forwards config', async () => {
      mockClient.updateCollectorAgentLogLevel.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_collector_agent_log_level', { collectorId: 5, component: 'collector', config: { level: 'debug' } });
      expect(mockClient.updateCollectorAgentLogLevel).toHaveBeenCalledWith(5, 'collector', { level: 'debug' });
    });

    it('get_collector_events / status_check call client', async () => {
      mockClient.getCollectorEvents.mockResolvedValue({} as never);
      mockClient.getCollectorStatusCheck.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_collector_events', { collectorId: 5 });
      await handlers.handleToolCall('get_collector_status_check', { collectorId: 5 });
      expect(mockClient.getCollectorEvents).toHaveBeenCalledWith(5);
      expect(mockClient.getCollectorStatusCheck).toHaveBeenCalledWith(5);
    });
  });

  describe('Job Monitors (BatchJobs)', () => {
    it('create_job_monitor merges config', async () => {
      mockClient.createJobMonitor.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_job_monitor', { config: { name: 'J' } });
      expect(mockClient.createJobMonitor).toHaveBeenCalledWith({ name: 'J' });
    });

    it('update_job_monitor forwards reason', async () => {
      mockClient.updateJobMonitor.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_job_monitor', { jobMonitorId: 3, reason: 'r', config: { name: 'J2' } });
      expect(mockClient.updateJobMonitor).toHaveBeenCalledWith(3, { name: 'J2' }, { reason: 'r' });
    });

    it('import_job_monitor forwards content + format', async () => {
      mockClient.importJobMonitor.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_job_monitor', { content: '{}', format: 'json' });
      expect(mockClient.importJobMonitor).toHaveBeenCalledWith('{}', 'json', expect.any(Object));
    });
  });

  describe('DiagnosticSources', () => {
    it('create_diagnosticsource merges config', async () => {
      mockClient.createDiagnosticSource.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_diagnosticsource', { config: { name: 'D' } });
      expect(mockClient.createDiagnosticSource).toHaveBeenCalledWith({ name: 'D' });
    });

    it('execute_diagnosticsource forwards config', async () => {
      mockClient.executeDiagnosticSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('execute_diagnosticsource', { config: { deviceId: 1 } });
      expect(mockClient.executeDiagnosticSource).toHaveBeenCalledWith({ deviceId: 1 });
    });
  });

  describe('AppliesTo Functions', () => {
    it('create_applies_to_function merges config', async () => {
      mockClient.createAppliesToFunction.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_applies_to_function', { config: { name: 'F', code: 'x' } });
      expect(mockClient.createAppliesToFunction).toHaveBeenCalledWith({ name: 'F', code: 'x' });
    });

    it('update_applies_to_function forwards reason + ignoreReference', async () => {
      mockClient.updateAppliesToFunction.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_applies_to_function', { functionId: 2, reason: 'r', ignoreReference: true, config: { code: 'y' } });
      expect(mockClient.updateAppliesToFunction).toHaveBeenCalledWith(2, { code: 'y' }, { reason: 'r', ignoreReference: true });
    });

    it('delete_applies_to_function forwards ignoreReference', async () => {
      mockClient.deleteAppliesToFunction.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_applies_to_function', { functionId: 2, ignoreReference: true });
      expect(mockClient.deleteAppliesToFunction).toHaveBeenCalledWith(2, { ignoreReference: true });
    });
  });

  describe('SNMP OIDs', () => {
    it('create_oid merges config', async () => {
      mockClient.createOID.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_oid', { config: { name: 'O' } });
      expect(mockClient.createOID).toHaveBeenCalledWith({ name: 'O' });
    });

    it('update_oid excludes oidId from body', async () => {
      mockClient.updateOID.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_oid', { oidId: 7, config: { name: 'O2' } });
      expect(mockClient.updateOID).toHaveBeenCalledWith(7, { name: 'O2' });
    });

    it('import_oid forwards content', async () => {
      mockClient.importOID.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_oid', { content: '{}' });
      expect(mockClient.importOID).toHaveBeenCalledWith('{}', expect.any(Object));
    });
  });

  describe('RemediationSources', () => {
    it('create_remediationsource merges config', async () => {
      mockClient.createRemediationSource.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_remediationsource', { config: { name: 'R' } });
      expect(mockClient.createRemediationSource).toHaveBeenCalledWith({ name: 'R' });
    });

    it('execute_remediation forwards config', async () => {
      mockClient.executeRemediation.mockResolvedValue({} as never);
      await handlers.handleToolCall('execute_remediation', { config: { alertId: 'x' } });
      expect(mockClient.executeRemediation).toHaveBeenCalledWith({ alertId: 'x' });
    });
  });

  describe('TopologySources', () => {
    it('create_topologysource merges config', async () => {
      mockClient.createTopologySource.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_topologysource', { config: { name: 'T' } });
      expect(mockClient.createTopologySource).toHaveBeenCalledWith({ name: 'T' });
    });

    it('update_topologysource forwards reason', async () => {
      mockClient.updateTopologySource.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_topologysource', { topologySourceId: 4, reason: 'r', config: { name: 'T2' } });
      expect(mockClient.updateTopologySource).toHaveBeenCalledWith(4, { name: 'T2' }, { reason: 'r' });
    });

    it('import_topologysource forwards content', async () => {
      mockClient.importTopologySource.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_topologysource', { content: '{}' });
      expect(mockClient.importTopologySource).toHaveBeenCalledWith('{}', expect.any(Object));
    });
  });

  describe('Users & API Tokens (write)', () => {
    it('create_user merges config', async () => {
      mockClient.createUser.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_user', { config: { username: 'u', roles: ['administrator'] } });
      expect(mockClient.createUser).toHaveBeenCalledWith({ username: 'u', roles: ['administrator'] });
    });

    it('update_user forwards query flags', async () => {
      mockClient.updateUser.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_user', { userId: 9, changePassword: true, config: { password: 'p' } });
      expect(mockClient.updateUser).toHaveBeenCalledWith(9, { password: 'p' }, expect.objectContaining({ changePassword: true }));
    });

    it('delete_user calls client', async () => {
      mockClient.deleteUser.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_user', { userId: 9 });
      expect(mockClient.deleteUser).toHaveBeenCalledWith(9);
    });

    it('create_api_token forwards userId + type + config', async () => {
      mockClient.createApiToken.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_api_token', { userId: 9, type: 'foo', config: { note: 'n' } });
      expect(mockClient.createApiToken).toHaveBeenCalledWith(9, { note: 'n' }, { type: 'foo' });
    });

    it('update_api_token forwards ids + config', async () => {
      mockClient.updateApiToken.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_api_token', { userId: 9, apiTokenId: 3, config: { note: 'n2' } });
      expect(mockClient.updateApiToken).toHaveBeenCalledWith(9, 3, { note: 'n2' });
    });

    it('delete_api_token calls client', async () => {
      mockClient.deleteApiToken.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_api_token', { userId: 9, apiTokenId: 3 });
      expect(mockClient.deleteApiToken).toHaveBeenCalledWith(9, 3);
    });
  });

  describe('Bulk instance data & instance graph by id', () => {
    it('fetch_instances_data forwards config + time controls', async () => {
      mockClient.fetchDeviceInstancesData.mockResolvedValue({} as never);
      await handlers.handleToolCall('fetch_instances_data', { config: { instances: [] }, period: 1, aggregate: 'average' });
      expect(mockClient.fetchDeviceInstancesData).toHaveBeenCalledWith({ instances: [] }, expect.objectContaining({ period: 1, aggregate: 'average' }));
    });

    it('get_instance_graph_data_by_id forwards ids + range', async () => {
      mockClient.getInstanceGraphDataById.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_instance_graph_data_by_id', { instanceId: 10, graphId: 20, start: 1, end: 2 });
      expect(mockClient.getInstanceGraphDataById).toHaveBeenCalledWith(10, 20, expect.objectContaining({ start: 1, end: 2 }));
    });
  });

  describe('Log Pipelines / Log Alerts (LOW priority)', () => {
    it('list_log_alert_groups forwards pagination', async () => {
      mockClient.listLogAlertGroups.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_log_alert_groups', { size: 10, offset: 0 });
      expect(mockClient.listLogAlertGroups).toHaveBeenCalledWith(expect.objectContaining({ size: 10, offset: 0 }));
    });

    it('get_log_alert_group passes id', async () => {
      mockClient.getLogAlertGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_log_alert_group', { logAlertGroupId: 5 });
      expect(mockClient.getLogAlertGroup).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it('create_log_alert_group merges config into body', async () => {
      mockClient.createLogAlertGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_log_alert_group', { config: { name: 'P1' } });
      expect(mockClient.createLogAlertGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'P1' }));
    });

    it('update_log_alert_group merges config into body', async () => {
      mockClient.updateLogAlertGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_log_alert_group', { logAlertGroupId: 5, config: { name: 'P2' } });
      expect(mockClient.updateLogAlertGroup).toHaveBeenCalledWith(5, expect.objectContaining({ name: 'P2' }));
    });

    it('delete_log_alert_group passes id', async () => {
      mockClient.deleteLogAlertGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_log_alert_group', { logAlertGroupId: 5 });
      expect(mockClient.deleteLogAlertGroup).toHaveBeenCalledWith(5);
    });

    it('create_log_alert merges config into body', async () => {
      mockClient.createLogAlert.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_log_alert', { config: { name: 'A1' } });
      expect(mockClient.createLogAlert).toHaveBeenCalledWith(expect.objectContaining({ name: 'A1' }));
    });

    it('set_log_alert_status passes action + body', async () => {
      mockClient.setLogAlertStatus.mockResolvedValue({} as never);
      await handlers.handleToolCall('set_log_alert_status', { logAlertId: 3, action: 'enable', config: { x: 1 } });
      expect(mockClient.setLogAlertStatus).toHaveBeenCalledWith(3, 'enable', expect.objectContaining({ x: 1 }));
    });
  });

  describe('Log Query Groups (LOW priority)', () => {
    it('list_log_query_groups forwards pagination', async () => {
      mockClient.listLogQueryGroups.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_log_query_groups', { size: 5 });
      expect(mockClient.listLogQueryGroups).toHaveBeenCalledWith(expect.objectContaining({ size: 5 }));
    });

    it('list_log_query_groups_by_type passes group type', async () => {
      mockClient.listLogQueryGroupsByType.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_log_query_groups_by_type', { groupType: 'static', allGroups: true });
      expect(mockClient.listLogQueryGroupsByType).toHaveBeenCalledWith('static', expect.objectContaining({ allGroups: true }));
    });

    it('move_log_queries passes group id + body', async () => {
      mockClient.moveLogQueries.mockResolvedValue({} as never);
      await handlers.handleToolCall('move_log_queries', { logQueryGroupId: 7, config: { ids: [1, 2] } });
      expect(mockClient.moveLogQueries).toHaveBeenCalledWith(7, expect.objectContaining({ ids: [1, 2] }));
    });
  });

  describe('Log Partitions (LOW priority)', () => {
    it('create_log_partition merges config into body', async () => {
      mockClient.createLogPartition.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_log_partition', { config: { name: 'part1' } });
      expect(mockClient.createLogPartition).toHaveBeenCalledWith(expect.objectContaining({ name: 'part1' }));
    });

    it('get_log_partition_retentions called', async () => {
      mockClient.getLogPartitionRetentions.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_log_partition_retentions', {});
      expect(mockClient.getLogPartitionRetentions).toHaveBeenCalled();
    });

    it('log_partition_action passes action + body', async () => {
      mockClient.logPartitionAction.mockResolvedValue({} as never);
      await handlers.handleToolCall('log_partition_action', { logPartitionId: 2, action: 'pause', config: { y: 1 } });
      expect(mockClient.logPartitionAction).toHaveBeenCalledWith(2, 'pause', expect.objectContaining({ y: 1 }));
    });
  });

  describe('Tracked Query Groups (LOW priority)', () => {
    it('create_tracked_query_group merges config into body', async () => {
      mockClient.createTrackedQueryGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_tracked_query_group', { config: { name: 'tq' } });
      expect(mockClient.createTrackedQueryGroup).toHaveBeenCalledWith(expect.objectContaining({ name: 'tq' }));
    });

    it('delete_tracked_query_group passes id', async () => {
      mockClient.deleteTrackedQueryGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_tracked_query_group', { trackedQueryGroupId: 9 });
      expect(mockClient.deleteTrackedQueryGroup).toHaveBeenCalledWith(9);
    });
  });

  describe('Cloud Onboarding (LOW priority)', () => {
    it('get_aws_account_id called', async () => {
      mockClient.getAwsAccountId.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_aws_account_id', {});
      expect(mockClient.getAwsAccountId).toHaveBeenCalled();
    });

    it('test_aws_account forwards config', async () => {
      mockClient.testAwsAccount.mockResolvedValue({} as never);
      await handlers.handleToolCall('test_aws_account', { config: { externalId: 'x' } });
      expect(mockClient.testAwsAccount).toHaveBeenCalledWith(expect.objectContaining({ externalId: 'x' }));
    });

    it('discover_azure_subscriptions forwards config', async () => {
      mockClient.discoverAzureSubscriptions.mockResolvedValue({} as never);
      await handlers.handleToolCall('discover_azure_subscriptions', { config: { tenantId: 't' } });
      expect(mockClient.discoverAzureSubscriptions).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't' }));
    });

    it('test_gcp_account forwards config', async () => {
      mockClient.testGcpAccount.mockResolvedValue({} as never);
      await handlers.handleToolCall('test_gcp_account', { config: { projectId: 'p' } });
      expect(mockClient.testGcpAccount).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p' }));
    });

    it('test_saas_account forwards config', async () => {
      mockClient.testSaaSAccount.mockResolvedValue({} as never);
      await handlers.handleToolCall('test_saas_account', { config: { accountName: 'acme' } });
      expect(mockClient.testSaaSAccount).toHaveBeenCalledWith(expect.objectContaining({ accountName: 'acme' }));
    });
  });

  describe('Misc LOW priority singletons', () => {
    it('get_configsource_update_reasons passes id', async () => {
      mockClient.getConfigSourceUpdateReasons.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_configsource_update_reasons', { configSourceId: 11 });
      expect(mockClient.getConfigSourceUpdateReasons).toHaveBeenCalledWith(11, expect.any(Object));
    });

    it('get_website_graph_by_name passes id + name', async () => {
      mockClient.getWebsiteGraphByName.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_website_graph_by_name', { websiteId: 4, graphName: 'response' });
      expect(mockClient.getWebsiteGraphByName).toHaveBeenCalledWith(4, 'response', expect.any(Object));
    });

    it('update_default_dashboard merges config', async () => {
      mockClient.updateDefaultDashboard.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_default_dashboard', { userDataId: 'd1', config: { value: '5' } });
      expect(mockClient.updateDefaultDashboard).toHaveBeenCalledWith('d1', expect.objectContaining({ value: '5' }));
    });

    it('escalate_alert passes alert id', async () => {
      mockClient.escalateAlert.mockResolvedValue({} as never);
      await handlers.handleToolCall('escalate_alert', { alertId: 'DS123' });
      expect(mockClient.escalateAlert).toHaveBeenCalledWith('DS123');
    });

    it('map_unmap_module_to_access_group forwards config', async () => {
      mockClient.mapUnmapModuleToAccessGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('map_unmap_module_to_access_group', { config: { moduleIds: [1] } });
      expect(mockClient.mapUnmapModuleToAccessGroup).toHaveBeenCalledWith(expect.objectContaining({ moduleIds: [1] }));
    });

    it('add_dns_mapping forwards config', async () => {
      mockClient.addDNSMapping.mockResolvedValue({} as never);
      await handlers.handleToolCall('add_dns_mapping', { config: { hostname: 'h' } });
      expect(mockClient.addDNSMapping).toHaveBeenCalledWith(expect.objectContaining({ hostname: 'h' }));
    });

    it('list_unmonitored_devices forwards pagination', async () => {
      mockClient.listUnmonitoredDevices.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_unmonitored_devices', { size: 50 });
      expect(mockClient.listUnmonitoredDevices).toHaveBeenCalledWith(expect.objectContaining({ size: 50 }));
    });

    it('get_contract_info called', async () => {
      mockClient.getContractInfo.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_contract_info', {});
      expect(mockClient.getContractInfo).toHaveBeenCalled();
    });

    it('get_integration_audit_logs called', async () => {
      mockClient.getIntegrationAuditLogs.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_integration_audit_logs', { format: 'csv' });
      expect(mockClient.getIntegrationAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ format: 'csv' }));
    });

    it('get_metrics_summary and get_metrics_usage called', async () => {
      mockClient.getMetricsSummary.mockResolvedValue({} as never);
      mockClient.getMetricsUsage.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_metrics_summary', {});
      await handlers.handleToolCall('get_metrics_usage', {});
      expect(mockClient.getMetricsSummary).toHaveBeenCalled();
      expect(mockClient.getMetricsUsage).toHaveBeenCalled();
    });
  });

  describe('Device Groups — datasource alert settings, cluster, properties', () => {
    it('create_resource_group_property passes name + value', async () => {
      mockClient.createDeviceGroupProperty.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_resource_group_property', { groupId: 1, name: 'env', value: 'prod' });
      expect(mockClient.createDeviceGroupProperty).toHaveBeenCalledWith(1, 'env', 'prod');
    });

    it('delete_resource_group_property passes id + name', async () => {
      mockClient.deleteDeviceGroupProperty.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_resource_group_property', { groupId: 1, propertyName: 'env' });
      expect(mockClient.deleteDeviceGroupProperty).toHaveBeenCalledWith(1, 'env');
    });

    it('list_resource_group_cluster_alert_confs forwards pagination', async () => {
      mockClient.listDeviceGroupClusterAlertConfs.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_group_cluster_alert_confs', { groupId: 5, size: 10 });
      expect(mockClient.listDeviceGroupClusterAlertConfs).toHaveBeenCalledWith(5, expect.objectContaining({ size: 10 }));
    });

    it('get_resource_group_cluster_alert_conf passes ids', async () => {
      mockClient.getDeviceGroupClusterAlertConf.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_resource_group_cluster_alert_conf', { groupId: 5, id: 7 });
      expect(mockClient.getDeviceGroupClusterAlertConf).toHaveBeenCalledWith(5, 7);
    });

    it('create_resource_group_cluster_alert_conf merges config', async () => {
      mockClient.createDeviceGroupClusterAlertConf.mockResolvedValue({} as never);
      await handlers.handleToolCall('create_resource_group_cluster_alert_conf', { groupId: 5, config: { name: 'c1' } });
      expect(mockClient.createDeviceGroupClusterAlertConf).toHaveBeenCalledWith(5, expect.objectContaining({ name: 'c1' }));
    });

    it('update_resource_group_cluster_alert_conf merges config', async () => {
      mockClient.updateDeviceGroupClusterAlertConf.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_resource_group_cluster_alert_conf', { groupId: 5, id: 7, config: { name: 'c2' } });
      expect(mockClient.updateDeviceGroupClusterAlertConf).toHaveBeenCalledWith(5, 7, expect.objectContaining({ name: 'c2' }));
    });

    it('delete_resource_group_cluster_alert_conf passes ids', async () => {
      mockClient.deleteDeviceGroupClusterAlertConf.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_resource_group_cluster_alert_conf', { groupId: 5, id: 7 });
      expect(mockClient.deleteDeviceGroupClusterAlertConf).toHaveBeenCalledWith(5, 7);
    });

    it('list_resource_group_datasources forwards includeDisabled flag', async () => {
      mockClient.listDeviceGroupDatasources.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_group_datasources', { groupId: 5, includeDisabledDataSourceWithoutInstance: true });
      expect(mockClient.listDeviceGroupDatasources).toHaveBeenCalledWith(5, expect.objectContaining({ includeDisabledDataSourceWithoutInstance: true }));
    });

    it('get_resource_group_datasource passes ids', async () => {
      mockClient.getDeviceGroupDatasource.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_resource_group_datasource', { groupId: 5, dataSourceId: 8 });
      expect(mockClient.getDeviceGroupDatasource).toHaveBeenCalledWith(5, 8, expect.any(Object));
    });

    it('update_resource_group_datasource merges config', async () => {
      mockClient.updateDeviceGroupDatasource.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_resource_group_datasource', { groupId: 5, dataSourceId: 8, config: { disableAlerting: true } });
      expect(mockClient.updateDeviceGroupDatasource).toHaveBeenCalledWith(5, 8, expect.objectContaining({ disableAlerting: true }));
    });

    it('get_resource_group_datasource_alert_setting passes ids', async () => {
      mockClient.getDeviceGroupDatasourceAlertSetting.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_resource_group_datasource_alert_setting', { groupId: 5, dataSourceId: 9 });
      expect(mockClient.getDeviceGroupDatasourceAlertSetting).toHaveBeenCalledWith(5, 9, expect.any(Object));
    });

    it('update_resource_group_datasource_alert_setting merges config', async () => {
      mockClient.updateDeviceGroupDatasourceAlertSetting.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_resource_group_datasource_alert_setting', { groupId: 5, dataSourceId: 9, config: { disableAlerting: false } });
      expect(mockClient.updateDeviceGroupDatasourceAlertSetting).toHaveBeenCalledWith(5, 9, expect.objectContaining({ disableAlerting: false }));
    });

    it('list_resource_group_alerts forwards needMessage', async () => {
      mockClient.listDeviceGroupAlerts.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_group_alerts', { groupId: 5, needMessage: true });
      expect(mockClient.listDeviceGroupAlerts).toHaveBeenCalledWith(5, expect.objectContaining({ needMessage: true }));
    });

    it('list_resource_group_alerts injects cleared into the filter', async () => {
      mockClient.listDeviceGroupAlerts.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_group_alerts', { groupId: 5, cleared: true });
      expect(mockClient.listDeviceGroupAlerts).toHaveBeenCalledWith(5, expect.objectContaining({ filter: 'cleared:true' }));
    });

    it('list_resource_alerts injects cleared into the filter', async () => {
      mockClient.listDeviceAlerts.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_alerts', { deviceId: 7, filter: 'severity:error', cleared: true });
      expect(mockClient.listDeviceAlerts).toHaveBeenCalledWith(7, expect.objectContaining({ filter: 'severity:error,cleared:true' }));
    });

    it('list_resource_group_sdts forwards pagination', async () => {
      mockClient.listDeviceGroupSDTs.mockResolvedValue({} as never);
      await handlers.handleToolCall('list_resource_group_sdts', { groupId: 5, size: 20 });
      expect(mockClient.listDeviceGroupSDTs).toHaveBeenCalledWith(5, expect.objectContaining({ size: 20 }));
    });

    it('get_resource_group_sdt_history forwards pagination', async () => {
      mockClient.getDeviceGroupSDTHistory.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_resource_group_sdt_history', { groupId: 5, size: 20 });
      expect(mockClient.getDeviceGroupSDTHistory).toHaveBeenCalledWith(5, expect.objectContaining({ size: 20 }));
    });
  });

  describe('Website Groups (write)', () => {
    it('create_website_group merges config into body', async () => {
      mockClient.createWebsiteGroup.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_website_group', {
        name: 'Prod Sites',
        parentId: 1,
        config: { disableAlerting: false, properties: [{ name: 'env', value: 'prod' }] },
      });
      expect(mockClient.createWebsiteGroup).toHaveBeenCalledWith({
        name: 'Prod Sites',
        parentId: 1,
        disableAlerting: false,
        properties: [{ name: 'env', value: 'prod' }],
      });
    });

    it('update_website_group excludes groupId/opType from body and forwards opType', async () => {
      mockClient.updateWebsiteGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_website_group', { groupId: 4, name: 'Renamed', opType: 'replace' });
      expect(mockClient.updateWebsiteGroup).toHaveBeenCalledWith(4, { name: 'Renamed' }, { opType: 'replace' });
    });

    it('delete_website_group forwards deleteChildren', async () => {
      mockClient.deleteWebsiteGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_website_group', { groupId: 4, deleteChildren: 1 });
      expect(mockClient.deleteWebsiteGroup).toHaveBeenCalledWith(4, { deleteChildren: 1 });
    });

    it('list_website_group_websites forwards pagination', async () => {
      mockClient.listWebsiteGroupWebsites.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('list_website_group_websites', { groupId: 4, size: 50 });
      expect(mockClient.listWebsiteGroupWebsites).toHaveBeenCalledWith(4, expect.objectContaining({ size: 50 }));
    });

    it('list_website_group_sdts calls client', async () => {
      mockClient.listWebsiteGroupSDTs.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('list_website_group_sdts', { groupId: 4 });
      expect(mockClient.listWebsiteGroupSDTs).toHaveBeenCalledWith(4, expect.any(Object));
    });

    it('get_website_group_sdt_history calls client', async () => {
      mockClient.getWebsiteGroupSDTHistory.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('get_website_group_sdt_history', { groupId: 4 });
      expect(mockClient.getWebsiteGroupSDTHistory).toHaveBeenCalledWith(4, expect.any(Object));
    });
  });

  describe('Roles (write)', () => {
    it('create_role merges name + config (privileges)', async () => {
      mockClient.createRole.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_role', {
        name: 'Read Only',
        config: { privileges: [{ objectType: 'dashboard_group', objectId: '*', operation: 'read' }] },
      });
      expect(mockClient.createRole).toHaveBeenCalledWith({
        name: 'Read Only',
        privileges: [{ objectType: 'dashboard_group', objectId: '*', operation: 'read' }],
      });
    });

    it('update_role excludes roleId from body', async () => {
      mockClient.updateRole.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_role', { roleId: 3, name: 'Renamed' });
      expect(mockClient.updateRole).toHaveBeenCalledWith(3, { name: 'Renamed' });
    });

    it('delete_role calls client', async () => {
      mockClient.deleteRole.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_role', { roleId: 3 });
      expect(mockClient.deleteRole).toHaveBeenCalledWith(3);
    });
  });

  describe('Report Execution', () => {
    it('generate_report forwards reportId + body', async () => {
      mockClient.generateReport.mockResolvedValue({ taskId: 't1' } as never);
      await handlers.handleToolCall('generate_report', { reportId: 9, receiveEmails: 'a@b.com', withAdminId: 0 });
      expect(mockClient.generateReport).toHaveBeenCalledWith(9, { withAdminId: 0, receiveEmails: 'a@b.com' });
    });

    it('get_report_task_result forwards reportId + taskId', async () => {
      mockClient.getReportTaskResult.mockResolvedValue({ status: 'done' } as never);
      await handlers.handleToolCall('get_report_task_result', { reportId: 9, taskId: 't1' });
      expect(mockClient.getReportTaskResult).toHaveBeenCalledWith(9, 't1');
    });
  });

  describe('Collector Debug Commands', () => {
    it('execute_debug_command forwards collectorId + cmdline', async () => {
      mockClient.executeDebugCommand.mockResolvedValue({ sessionId: 'abc' } as never);
      await handlers.handleToolCall('execute_debug_command', { collectorId: 5, cmdline: '!tlist' });
      expect(mockClient.executeDebugCommand).toHaveBeenCalledWith(5, '!tlist');
    });

    it('get_debug_command_result forwards sessionId + collectorId', async () => {
      mockClient.getDebugCommandResult.mockResolvedValue({ output: 'ok' } as never);
      await handlers.handleToolCall('get_debug_command_result', { sessionId: 'abc', collectorId: 5 });
      expect(mockClient.getDebugCommandResult).toHaveBeenCalledWith('abc', 5);
    });
  });

  describe('Dashboard Groups (write)', () => {
    it('create_dashboard_group merges config into body', async () => {
      mockClient.createDashboardGroup.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_dashboard_group', {
        name: 'Cloud',
        parentId: 1,
        config: { description: 'cloud dashboards' },
      });
      expect(mockClient.createDashboardGroup).toHaveBeenCalledWith({
        name: 'Cloud',
        parentId: 1,
        description: 'cloud dashboards',
      });
    });

    it('update_dashboard_group excludes groupId from body', async () => {
      mockClient.updateDashboardGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_dashboard_group', { groupId: 7, name: 'Renamed' });
      expect(mockClient.updateDashboardGroup).toHaveBeenCalledWith(7, { name: 'Renamed' });
    });

    it('delete_dashboard_group forwards allowNonEmptyGroup', async () => {
      mockClient.deleteDashboardGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_dashboard_group', { groupId: 7, allowNonEmptyGroup: true });
      expect(mockClient.deleteDashboardGroup).toHaveBeenCalledWith(7, { allowNonEmptyGroup: true });
    });

    it('clone_dashboard_group forwards config + recursive', async () => {
      mockClient.cloneDashboardGroup.mockResolvedValue({} as never);
      await handlers.handleToolCall('clone_dashboard_group', { groupId: 7, config: { name: 'Copy', parentId: 1 }, recursive: true });
      expect(mockClient.cloneDashboardGroup).toHaveBeenCalledWith(7, { name: 'Copy', parentId: 1 }, { recursive: true });
    });
  });

  describe('LogSources', () => {
    it('create_logsource forwards config', async () => {
      mockClient.createLogSource.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_logsource', {
        config: { name: 'MyLS', collectionMethod: 'logfile', appliesToScript: 'true()' },
      });
      expect(mockClient.createLogSource).toHaveBeenCalledWith({
        name: 'MyLS', collectionMethod: 'logfile', appliesToScript: 'true()',
      });
    });

    it('update_logsource forwards config + reason', async () => {
      mockClient.updateLogSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_logsource', {
        logSourceId: 5,
        config: { description: 'x' },
        reason: 'tuning',
      });
      expect(mockClient.updateLogSource).toHaveBeenCalledWith(5, { description: 'x' }, { reason: 'tuning' });
    });

    it('delete_logsource calls client', async () => {
      mockClient.deleteLogSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_logsource', { logSourceId: 5 });
      expect(mockClient.deleteLogSource).toHaveBeenCalledWith(5);
    });

    it('import_logsource forwards content + params', async () => {
      mockClient.importLogSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_logsource', { content: '{"name":"x"}', handleConflict: 'all' });
      expect(mockClient.importLogSource).toHaveBeenCalledWith('{"name":"x"}', {
        handleConflict: 'all',
        fieldsToPreserve: undefined,
      });
    });
  });

  describe('Property Rules (PropertySources)', () => {
    it('create_property_rule forwards config', async () => {
      mockClient.createPropertyRule.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_property_rule', {
        config: { name: 'MyPS', appliesTo: 'true()', scriptType: 'embed', groovyScript: 'println 1' },
      });
      expect(mockClient.createPropertyRule).toHaveBeenCalledWith({
        name: 'MyPS', appliesTo: 'true()', scriptType: 'embed', groovyScript: 'println 1',
      });
    });

    it('update_property_rule forwards config + reason', async () => {
      mockClient.updatePropertyRule.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_property_rule', {
        propertyRuleId: 5,
        config: { groovyScript: 'println 2' },
        reason: 'tuning',
      });
      expect(mockClient.updatePropertyRule).toHaveBeenCalledWith(5, { groovyScript: 'println 2' }, { reason: 'tuning' });
    });

    it('delete_property_rule calls client', async () => {
      mockClient.deletePropertyRule.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_property_rule', { propertyRuleId: 5 });
      expect(mockClient.deletePropertyRule).toHaveBeenCalledWith(5);
    });

    it('import_property_rule forwards content + params', async () => {
      mockClient.importPropertyRule.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_property_rule', { content: '{"name":"x"}', handleConflict: 'all' });
      expect(mockClient.importPropertyRule).toHaveBeenCalledWith('{"name":"x"}', {
        handleConflict: 'all',
        fieldsToPreserve: undefined,
      });
    });
  });

  describe('DataSource Management', () => {
    it('create_datasource forwards config and createGraph', async () => {
      mockClient.createDataSource.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_datasource', {
        config: { name: 'MyDS', collector: 'script', appliesTo: 'true()' },
        createGraph: true,
      });
      expect(mockClient.createDataSource).toHaveBeenCalledWith(
        { name: 'MyDS', collector: 'script', appliesTo: 'true()' },
        { createGraph: true },
      );
    });

    it('update_datasource forwards config + reason', async () => {
      mockClient.updateDataSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_datasource', {
        dataSourceId: 5,
        config: { description: 'x' },
        reason: 'tuning',
      });
      expect(mockClient.updateDataSource).toHaveBeenCalledWith(5, { description: 'x' }, {
        reason: 'tuning',
        forceUniqueIdentifier: undefined,
      });
    });

    it('delete_datasource calls client', async () => {
      mockClient.deleteDataSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_datasource', { dataSourceId: 5 });
      expect(mockClient.deleteDataSource).toHaveBeenCalledWith(5);
    });

    it('import_datasource forwards content/format/params', async () => {
      mockClient.importDataSource.mockResolvedValue({} as never);
      await handlers.handleToolCall('import_datasource', {
        content: '{"name":"x"}',
        format: 'json',
        handleConflict: 'all',
      });
      expect(mockClient.importDataSource).toHaveBeenCalledWith('{"name":"x"}', 'json', {
        handleConflict: 'all',
        fieldsToPreserve: undefined,
      });
    });

    it('get_datasource_overview_graph calls client', async () => {
      mockClient.getDataSourceOverviewGraph.mockResolvedValue({} as never);
      await handlers.handleToolCall('get_datasource_overview_graph', { dataSourceId: 5, overviewGraphId: 9 });
      expect(mockClient.getDataSourceOverviewGraph).toHaveBeenCalledWith(5, 9);
    });

    it('list_datasource_devices calls client', async () => {
      mockClient.listDataSourceDevices.mockResolvedValue({ items: [] } as never);
      await handlers.handleToolCall('list_datasource_devices', { dataSourceId: 5 });
      expect(mockClient.listDataSourceDevices).toHaveBeenCalledWith(5, expect.any(Object));
    });
  });

  describe('Alert Automation - Action Chains & Rules', () => {
    it('create_action_chain merges config into the body', async () => {
      mockClient.createActionChain.mockResolvedValue({ id: 1 } as never);
      await handlers.handleToolCall('create_action_chain', {
        name: 'Escalation A',
        stages: [['ops@example.com']],
        config: { description: 'primary' },
      });
      expect(mockClient.createActionChain).toHaveBeenCalledWith({
        name: 'Escalation A',
        stages: [['ops@example.com']],
        description: 'primary',
      });
    });

    it('update_action_chain excludes id from body and merges config', async () => {
      mockClient.updateActionChain.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_action_chain', {
        actionChainId: 9,
        name: 'Renamed',
        config: { description: 'x' },
      });
      expect(mockClient.updateActionChain).toHaveBeenCalledWith(9, { name: 'Renamed', description: 'x' });
    });

    it('delete_action_chain calls client', async () => {
      mockClient.deleteActionChain.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_action_chain', { actionChainId: 9 });
      expect(mockClient.deleteActionChain).toHaveBeenCalledWith(9);
    });

    it('create_action_rule merges config and forwards required fields', async () => {
      mockClient.createActionRule.mockResolvedValue({ id: 2 } as never);
      await handlers.handleToolCall('create_action_rule', {
        name: 'Rule A',
        actionChainId: 9,
        deviceGroups: ['*'],
        levelStr: 'Warn,Error,Critical',
        config: { datasource: 'CPU' },
      });
      expect(mockClient.createActionRule).toHaveBeenCalledWith({
        name: 'Rule A',
        actionChainId: 9,
        deviceGroups: ['*'],
        levelStr: 'Warn,Error,Critical',
        datasource: 'CPU',
      });
    });

    it('update_action_rule excludes id from body', async () => {
      mockClient.updateActionRule.mockResolvedValue({} as never);
      await handlers.handleToolCall('update_action_rule', { actionRuleId: 5, enabled: false });
      expect(mockClient.updateActionRule).toHaveBeenCalledWith(5, { enabled: false });
    });

    it('set_action_rule_status forwards enabled flag', async () => {
      mockClient.setActionRuleStatus.mockResolvedValue({} as never);
      await handlers.handleToolCall('set_action_rule_status', { actionRuleId: 5, enabled: true });
      expect(mockClient.setActionRuleStatus).toHaveBeenCalledWith(5, true);
    });

    it('delete_action_rule calls client', async () => {
      mockClient.deleteActionRule.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_action_rule', { actionRuleId: 5 });
      expect(mockClient.deleteActionRule).toHaveBeenCalledWith(5);
    });
  });

  describe('Report Management', () => {
    it('create_report should merge config into the body', async () => {
      mockClient.createReport.mockResolvedValue({ id: 5 } as never);

      await handlers.handleToolCall('create_report', {
        name: 'Weekly Alerts',
        type: 'Alert',
        format: 'PDF',
        config: { groupId: 2 },
      });

      expect(mockClient.createReport).toHaveBeenCalledWith({
        name: 'Weekly Alerts',
        type: 'Alert',
        format: 'PDF',
        groupId: 2,
      });
    });

    it('update_report should exclude reportId from body and merge config', async () => {
      mockClient.updateReport.mockResolvedValue({} as never);

      await handlers.handleToolCall('update_report', {
        reportId: 5,
        description: 'updated',
        config: { schedule: '0 8 * * 1' },
      });

      expect(mockClient.updateReport).toHaveBeenCalledWith(5, {
        description: 'updated',
        schedule: '0 8 * * 1',
      });
    });

    it('delete_report should delete by id', async () => {
      mockClient.deleteReport.mockResolvedValue({} as never);
      await handlers.handleToolCall('delete_report', { reportId: 5 });
      expect(mockClient.deleteReport).toHaveBeenCalledWith(5);
    });
  });

  describe('Monitoring Resources Management', () => {
    describe('SDT', () => {
      it('create_sdt should merge config into the body', async () => {
        const created = { id: 'DGG_1' };
        mockClient.createSDT.mockResolvedValue(created as never);

        const result = await handlers.handleToolCall('create_sdt', {
          type: 'DeviceGroupSDT',
          sdtType: 1,
          startDateTime: 100,
          endDateTime: 200,
          config: { deviceGroupId: 42 },
        });

        expect(mockClient.createSDT).toHaveBeenCalledWith({
          type: 'DeviceGroupSDT',
          sdtType: 1,
          startDateTime: 100,
          endDateTime: 200,
          deviceGroupId: 42,
        });
        expect(result).toEqual(created);
      });

      it('update_sdt should exclude sdtId from body and merge config', async () => {
        mockClient.updateSDT.mockResolvedValue({} as never);

        await handlers.handleToolCall('update_sdt', {
          sdtId: 'DV_5',
          comment: 'extended',
          config: { endDateTime: 999 },
        });

        expect(mockClient.updateSDT).toHaveBeenCalledWith('DV_5', {
          comment: 'extended',
          endDateTime: 999,
        });
      });
    });

    describe('ConfigSource', () => {
      it('create_configsource should merge config', async () => {
        mockClient.createConfigSource.mockResolvedValue({ id: 3 } as never);

        await handlers.handleToolCall('create_configsource', {
          name: 'CiscoIOS_Config',
          config: { appliesTo: 'isCisco()' },
        });

        expect(mockClient.createConfigSource).toHaveBeenCalledWith({
          name: 'CiscoIOS_Config',
          appliesTo: 'isCisco()',
        });
      });

      it('update_configsource should pass reason as query and exclude it from body', async () => {
        mockClient.updateConfigSource.mockResolvedValue({} as never);

        await handlers.handleToolCall('update_configsource', {
          configSourceId: 3,
          description: 'updated',
          reason: 'tuning collection',
        });

        expect(mockClient.updateConfigSource).toHaveBeenCalledWith(
          3,
          { description: 'updated' },
          { reason: 'tuning collection' },
        );
      });

      it('delete_configsource should delete by id', async () => {
        mockClient.deleteConfigSource.mockResolvedValue({} as never);
        await handlers.handleToolCall('delete_configsource', { configSourceId: 3 });
        expect(mockClient.deleteConfigSource).toHaveBeenCalledWith(3);
      });

      it('import_configsource should pass content, format and options', async () => {
        mockClient.importConfigSource.mockResolvedValue({} as never);

        await handlers.handleToolCall('import_configsource', {
          content: '{"name":"x"}',
          format: 'json',
          handleConflict: 'FORCE_OVERWRITE',
          fieldsToPreserve: 'APPLIES_TO',
        });

        expect(mockClient.importConfigSource).toHaveBeenCalledWith('{"name":"x"}', 'json', {
          handleConflict: 'FORCE_OVERWRITE',
          fieldsToPreserve: 'APPLIES_TO',
        });
      });
    });

    describe('EventSource', () => {
      it('create_eventsource should merge config', async () => {
        mockClient.createEventSource.mockResolvedValue({ id: 9 } as never);

        await handlers.handleToolCall('create_eventsource', {
          name: 'SNMPTrap_Custom',
          config: { collector: 'snmptrap' },
        });

        expect(mockClient.createEventSource).toHaveBeenCalledWith({
          name: 'SNMPTrap_Custom',
          collector: 'snmptrap',
        });
      });

      it('update_eventsource should exclude id from body', async () => {
        mockClient.updateEventSource.mockResolvedValue({} as never);

        await handlers.handleToolCall('update_eventsource', {
          eventSourceId: 9,
          description: 'updated',
        });

        expect(mockClient.updateEventSource).toHaveBeenCalledWith(9, { description: 'updated' });
      });

      it('delete_eventsource should delete by id', async () => {
        mockClient.deleteEventSource.mockResolvedValue({} as never);
        await handlers.handleToolCall('delete_eventsource', { eventSourceId: 9 });
        expect(mockClient.deleteEventSource).toHaveBeenCalledWith(9);
      });

      it('import_eventsource should pass content, format and options', async () => {
        mockClient.importEventSource.mockResolvedValue({} as never);

        await handlers.handleToolCall('import_eventsource', {
          content: '<eventsource/>',
          format: 'xml',
        });

        expect(mockClient.importEventSource).toHaveBeenCalledWith('<eventsource/>', 'xml', {
          handleConflict: undefined,
          fieldsToPreserve: undefined,
        });
      });
    });
  });

  describe('Website Data', () => {
    describe('get_website_checkpoint_data', () => {
      it('should fetch raw checkpoint data with time range and datapoints', async () => {
        const mockData = { dataPoints: ['responseTime'], values: {} };
        mockClient.getWebsiteCheckpointData.mockResolvedValue(mockData as never);

        const result = await handlers.handleToolCall('get_website_checkpoint_data', {
          websiteId: 12,
          checkpointId: 3,
          start: 1640000000,
          end: 1640003600,
          datapoints: 'responseTime,status',
        });

        expect(mockClient.getWebsiteCheckpointData).toHaveBeenCalledWith(12, 3, {
          period: undefined,
          start: 1640000000,
          end: 1640003600,
          datapoints: 'responseTime,status',
          aggregate: undefined,
          format: undefined,
        });
        expect(result).toEqual(mockData);
      });
    });

    describe('get_website_graph_data', () => {
      it('should fetch graph data by website, checkpoint and graph name', async () => {
        const mockGraph = { lines: [{ data: [1, 2, 3] }] };
        mockClient.getWebsiteGraphData.mockResolvedValue(mockGraph as never);

        const result = await handlers.handleToolCall('get_website_graph_data', {
          websiteId: 12,
          checkpointId: 3,
          graphName: 'responseTime',
          start: 1640000000,
          end: 1640003600,
        });

        expect(mockClient.getWebsiteGraphData).toHaveBeenCalledWith(12, 3, 'responseTime', {
          start: 1640000000,
          end: 1640003600,
          format: undefined,
        });
        expect(result).toEqual(mockGraph);
      });
    });
  });

  describe('Collector Management', () => {
    describe('create_collector', () => {
      it('should merge config into the collector body', async () => {
        const created = { id: 7, description: 'DC1 Collector' };
        mockClient.createCollector.mockResolvedValue(created as never);

        const result = await handlers.handleToolCall('create_collector', {
          description: 'DC1 Collector',
          collectorGroupId: 2,
          config: { resendIval: 30 },
        });

        expect(mockClient.createCollector).toHaveBeenCalledWith({
          description: 'DC1 Collector',
          collectorGroupId: 2,
          resendIval: 30,
        });
        expect(result).toEqual(created);
      });
    });

    describe('update_collector', () => {
      it('should split query options from the body and merge config', async () => {
        const updated = { id: 7, description: 'Renamed' };
        mockClient.updateCollector.mockResolvedValue(updated as never);

        const result = await handlers.handleToolCall('update_collector', {
          collectorId: 7,
          description: 'Renamed',
          opType: 'refresh',
          autoBalanceMonitoredDevices: true,
          config: { resendIval: 15 },
        });

        expect(mockClient.updateCollector).toHaveBeenCalledWith(
          7,
          { description: 'Renamed', resendIval: 15 },
          {
            autoBalanceMonitoredDevices: true,
            forceUpdateFailedOverDevices: undefined,
            opType: 'refresh',
          },
        );
        expect(result).toEqual(updated);
      });
    });

    describe('delete_collector', () => {
      it('should delete a collector by id', async () => {
        mockClient.deleteCollector.mockResolvedValue({} as never);

        await handlers.handleToolCall('delete_collector', { collectorId: 7 });

        expect(mockClient.deleteCollector).toHaveBeenCalledWith(7);
      });
    });

    describe('get_collector_installer', () => {
      it('should return the installer download URL info', async () => {
        const info = {
          url: 'https://acme.logicmonitor.com/santaba/rest/setting/collector/collectors/7/installers/linux64',
          collectorId: 7,
          osAndArch: 'linux64',
          downloadInstructions: 'curl ...',
          note: 'requires bearer token',
        };
        mockClient.getCollectorInstallerUrl.mockReturnValue(info as never);

        const result = await handlers.handleToolCall('get_collector_installer', {
          collectorId: 7,
          osAndArch: 'linux64',
          collectorSize: 'medium',
        });

        expect(mockClient.getCollectorInstallerUrl).toHaveBeenCalledWith(7, 'linux64', {
          collectorVersion: undefined,
          collectorSize: 'medium',
          useEA: undefined,
          monitorOthers: undefined,
          token: undefined,
        });
        expect(result).toEqual(info);
      });
    });

    describe('acknowledge_collector_down_alert', () => {
      it('should acknowledge a collector down alert with a comment', async () => {
        mockClient.acknowledgeCollectorDownAlert.mockResolvedValue({} as never);

        await handlers.handleToolCall('acknowledge_collector_down_alert', {
          collectorId: 7,
          comment: 'Investigating',
        });

        expect(mockClient.acknowledgeCollectorDownAlert).toHaveBeenCalledWith(7, 'Investigating');
      });
    });
  });

  describe('Dashboard Widgets', () => {
    describe('list_widgets', () => {
      it('should list widgets passing pagination, filter and fields', async () => {
        const mockResponse = {
          total: 1,
          items: [{ id: 10, name: 'CPU Graph', type: 'cgraph', dashboardId: 5 }],
        };
        mockClient.listWidgets.mockResolvedValue(mockResponse as never);

        const result = await handlers.handleToolCall('list_widgets', {
          size: 25,
          offset: 0,
          filter: 'type:"cgraph"',
          fields: 'id,name,type',
        });

        expect(mockClient.listWidgets).toHaveBeenCalledWith({
          size: 25,
          offset: 0,
          filter: 'type:"cgraph"',
          fields: 'id,name,type',
          autoPaginate: undefined,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('list_dashboard_widgets', () => {
      it('should list widgets for a given dashboard', async () => {
        const mockResponse = { total: 1, items: [{ id: 11, dashboardId: 5 }] };
        mockClient.listDashboardWidgets.mockResolvedValue(mockResponse as never);

        const result = await handlers.handleToolCall('list_dashboard_widgets', {
          dashboardId: 5,
          size: 50,
        });

        expect(mockClient.listDashboardWidgets).toHaveBeenCalledWith(5, {
          size: 50,
          offset: undefined,
          filter: undefined,
          fields: undefined,
          autoPaginate: undefined,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('get_widget', () => {
      it('should get a widget by id', async () => {
        const mockWidget = { id: 10, name: 'CPU Graph', type: 'cgraph' };
        mockClient.getWidget.mockResolvedValue(mockWidget as never);

        const result = await handlers.handleToolCall('get_widget', { widgetId: 10 });

        expect(result).toEqual(mockWidget);
        expect(mockClient.getWidget).toHaveBeenCalledWith(10, { fields: undefined });
      });
    });

    describe('get_widget_data', () => {
      it('should get widget data with a time range', async () => {
        const mockData = { type: 'cgraph', title: 'CPU' };
        mockClient.getWidgetData.mockResolvedValue(mockData as never);

        const result = await handlers.handleToolCall('get_widget_data', {
          widgetId: 10,
          start: 1640000000,
          end: 1640003600,
          format: 'json',
        });

        expect(result).toEqual(mockData);
        expect(mockClient.getWidgetData).toHaveBeenCalledWith(10, {
          start: 1640000000,
          end: 1640003600,
          format: 'json',
        });
      });
    });

    describe('create_widget', () => {
      it('should merge config into the widget body', async () => {
        const created = { id: 99, name: 'New Gauge', type: 'gauge', dashboardId: 5 };
        mockClient.createWidget.mockResolvedValue(created as never);

        const result = await handlers.handleToolCall('create_widget', {
          dashboardId: 5,
          name: 'New Gauge',
          type: 'gauge',
          config: { graphInfo: { dataPoint: 'CPUBusyPercent' } },
        });

        expect(mockClient.createWidget).toHaveBeenCalledWith({
          dashboardId: 5,
          name: 'New Gauge',
          type: 'gauge',
          graphInfo: { dataPoint: 'CPUBusyPercent' },
        });
        expect(result).toEqual(created);
      });
    });

    describe('update_widget', () => {
      it('should update a widget, merging config and excluding widgetId from body', async () => {
        const updated = { id: 10, name: 'Renamed' };
        mockClient.updateWidget.mockResolvedValue(updated as never);

        const result = await handlers.handleToolCall('update_widget', {
          widgetId: 10,
          name: 'Renamed',
          config: { interval: 5 },
        });

        expect(mockClient.updateWidget).toHaveBeenCalledWith(10, {
          name: 'Renamed',
          interval: 5,
        });
        expect(result).toEqual(updated);
      });
    });

    describe('delete_widget', () => {
      it('should delete a widget by id', async () => {
        mockClient.deleteWidget.mockResolvedValue({} as never);

        await handlers.handleToolCall('delete_widget', { widgetId: 10 });

        expect(mockClient.deleteWidget).toHaveBeenCalledWith(10);
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(
        handlers.handleToolCall('unknown_tool', {}),
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle LogicMonitorApiError', async () => {
      const apiError = new LogicMonitorApiError(
        'API Error',
        {
          status: 404,
          errorCode: 1404,
          errorMessage: 'Resource not found',
          errorDetail: 'Resource with ID 123 not found',
          path: '/api/v1/device/123',
          duration: 100,
        },
      );

      mockClient.getDevice.mockRejectedValue(apiError);

      await expect(
        handlers.handleToolCall('get_resource', { deviceId: 123 }),
      ).rejects.toThrow();
    });

    it('should handle generic errors', async () => {
      const error = new Error('Generic error');
      mockClient.getDevice.mockRejectedValue(error);

      await expect(
        handlers.handleToolCall('get_resource', { deviceId: 123 }),
      ).rejects.toThrow('Generic error');
    });

    it('should handle non-Error objects', async () => {
      mockClient.getDevice.mockRejectedValue('string error');

      // Non-Error rejections are re-thrown as-is
      await expect(
        handlers.handleToolCall('get_resource', { deviceId: 123 }),
      ).rejects.toBe('string error');
    });
  });

  describe('formatResponse', () => {
    it('should format response as JSON', () => {
      const data = { id: 1, name: 'test' };
      const formatted = handlers.formatResponse(data);

      expect(formatted).toContain('"id": 1');
      expect(formatted).toContain('"name": "test"');
    });

    it('should format arrays', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const formatted = handlers.formatResponse(data);

      expect(formatted).toContain('[');
      expect(formatted).toContain(']');
    });

    it('should format nested objects', () => {
      const data = { user: { id: 1, profile: { name: 'test' } } };
      const formatted = handlers.formatResponse(data);

      expect(formatted).toContain('"user"');
      expect(formatted).toContain('"profile"');
    });
  });

  describe('Additional Tools', () => {
    it('should handle list_resource_datasources', async () => {
      const mockResponse = { items: [], total: 0 };
      mockClient.listDeviceDataSources.mockResolvedValue(mockResponse);

      await handlers.handleToolCall('list_resource_datasources', {
        deviceId: 1,
      });

      expect(mockClient.listDeviceDataSources).toHaveBeenCalledWith(1, {
        size: undefined,
        offset: undefined,
        filter: undefined,
        fields: undefined,
        autoPaginate: undefined,
      });
    });

    it('should handle get_resource_datasource', async () => {
      const mockDS = { id: 1, dataSourceId: 2 };
      mockClient.getDeviceDataSource.mockResolvedValue(mockDS);

      const result = await handlers.handleToolCall('get_resource_datasource', {
        deviceId: 1,
        deviceDataSourceId: 2,
      });

      expect(result).toEqual(mockDS);
    });

    it('should handle update_resource_datasource', async () => {
      mockClient.updateDeviceDataSource.mockResolvedValue({});

      await handlers.handleToolCall('update_resource_datasource', {
        deviceId: 1,
        deviceDataSourceId: 2,
        disableAlerting: true,
        stopMonitoring: false,
      });

      expect(mockClient.updateDeviceDataSource).toHaveBeenCalledWith(1, 2, {
        disableAlerting: true,
        stopMonitoring: false,
      });
    });

    it('should handle escalation chains', async () => {
      const mockChain = { id: 1, name: 'test-chain' };
      mockClient.listEscalationChains.mockResolvedValue({ items: [mockChain], total: 1 });
      mockClient.getEscalationChain.mockResolvedValue(mockChain);
      mockClient.createEscalationChain.mockResolvedValue(mockChain);
      mockClient.updateEscalationChain.mockResolvedValue(mockChain);
      mockClient.deleteEscalationChain.mockResolvedValue({});

      await handlers.handleToolCall('list_escalation_chains', {});
      await handlers.handleToolCall('get_escalation_chain', { chainId: 1 });
      await handlers.handleToolCall('create_escalation_chain', {
        name: 'new-chain',
        description: 'Test',
      });
      await handlers.handleToolCall('update_escalation_chain', {
        chainId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_escalation_chain', { chainId: 1 });

      expect(mockClient.listEscalationChains).toHaveBeenCalled();
      expect(mockClient.getEscalationChain).toHaveBeenCalled();
      expect(mockClient.createEscalationChain).toHaveBeenCalled();
      expect(mockClient.updateEscalationChain).toHaveBeenCalled();
      expect(mockClient.deleteEscalationChain).toHaveBeenCalled();
    });

    it('should handle recipients and recipient groups', async () => {
      const mockRecipient = { id: 1, type: 'email', addr: 'test@example.com' };
      const mockGroup = { id: 1, name: 'test-group' };

      mockClient.createRecipient.mockResolvedValue(mockRecipient);
      mockClient.updateRecipient.mockResolvedValue(mockRecipient);
      mockClient.deleteRecipient.mockResolvedValue({});
      mockClient.createRecipientGroup.mockResolvedValue(mockGroup);
      mockClient.updateRecipientGroup.mockResolvedValue(mockGroup);
      mockClient.deleteRecipientGroup.mockResolvedValue({});

      await handlers.handleToolCall('create_recipient', {
        type: 'email',
        addr: 'test@example.com',
      });
      await handlers.handleToolCall('update_recipient', {
        recipientId: 1,
        addr: 'new@example.com',
      });
      await handlers.handleToolCall('delete_recipient', { recipientId: 1 });
      await handlers.handleToolCall('create_recipient_group', { name: 'test-group' });
      await handlers.handleToolCall('update_recipient_group', {
        groupId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_recipient_group', { groupId: 1 });

      expect(mockClient.createRecipient).toHaveBeenCalled();
      expect(mockClient.updateRecipient).toHaveBeenCalled();
      expect(mockClient.deleteRecipient).toHaveBeenCalled();
      expect(mockClient.createRecipientGroup).toHaveBeenCalled();
      expect(mockClient.updateRecipientGroup).toHaveBeenCalled();
      expect(mockClient.deleteRecipientGroup).toHaveBeenCalled();
    });

    it('should handle alert rules', async () => {
      const mockRule = { id: 1, name: 'test-rule' };
      mockClient.createAlertRule.mockResolvedValue(mockRule);
      mockClient.updateAlertRule.mockResolvedValue(mockRule);
      mockClient.deleteAlertRule.mockResolvedValue({});

      await handlers.handleToolCall('create_alert_rule', {
        name: 'test-rule',
        escalationChainId: 1,
      });
      await handlers.handleToolCall('update_alert_rule', {
        ruleId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_alert_rule', { ruleId: 1 });

      expect(mockClient.createAlertRule).toHaveBeenCalled();
      expect(mockClient.updateAlertRule).toHaveBeenCalled();
      expect(mockClient.deleteAlertRule).toHaveBeenCalled();
    });

    it('should handle opsnotes', async () => {
      const mockNote = { id: 1, note: 'test note' };
      mockClient.createOpsNote.mockResolvedValue(mockNote);
      mockClient.updateOpsNote.mockResolvedValue(mockNote);
      mockClient.deleteOpsNote.mockResolvedValue({});

      await handlers.handleToolCall('create_opsnote', {
        note: 'test note',
        scopes: [],
      });
      await handlers.handleToolCall('update_opsnote', {
        opsNoteId: 1,
        note: 'updated',
      });
      await handlers.handleToolCall('delete_opsnote', { opsNoteId: 1 });

      expect(mockClient.createOpsNote).toHaveBeenCalled();
      expect(mockClient.updateOpsNote).toHaveBeenCalled();
      expect(mockClient.deleteOpsNote).toHaveBeenCalled();
    });

    it('should handle services and service groups', async () => {
      const mockService = { id: 1, name: 'test-service' };
      const mockGroup = { id: 1, name: 'test-group' };

      mockClient.createService.mockResolvedValue(mockService);
      mockClient.updateService.mockResolvedValue(mockService);
      mockClient.deleteService.mockResolvedValue({});
      mockClient.createServiceGroup.mockResolvedValue(mockGroup);
      mockClient.updateServiceGroup.mockResolvedValue(mockGroup);
      mockClient.deleteServiceGroup.mockResolvedValue({});

      await handlers.handleToolCall('create_service', { name: 'test-service' });
      await handlers.handleToolCall('update_service', {
        serviceId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_service', { serviceId: 1 });
      await handlers.handleToolCall('create_service_group', { name: 'test-group' });
      await handlers.handleToolCall('update_service_group', {
        groupId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_service_group', { groupId: 1 });

      expect(mockClient.createService).toHaveBeenCalled();
      expect(mockClient.updateService).toHaveBeenCalled();
      expect(mockClient.deleteService).toHaveBeenCalled();
      expect(mockClient.createServiceGroup).toHaveBeenCalled();
      expect(mockClient.updateServiceGroup).toHaveBeenCalled();
      expect(mockClient.deleteServiceGroup).toHaveBeenCalled();
    });

    it('should handle netscans and integrations', async () => {
      const mockNetscan = { id: 1, name: 'test-netscan' };
      const mockIntegration = { id: 1, name: 'test-integration' };

      mockClient.createNetscan.mockResolvedValue(mockNetscan);
      mockClient.updateNetscan.mockResolvedValue(mockNetscan);
      mockClient.deleteNetscan.mockResolvedValue({});
      mockClient.createIntegration.mockResolvedValue(mockIntegration);
      mockClient.updateIntegration.mockResolvedValue(mockIntegration);
      mockClient.deleteIntegration.mockResolvedValue({});

      await handlers.handleToolCall('create_netscan', {
        name: 'test-netscan',
        collectorId: 1,
      });
      await handlers.handleToolCall('update_netscan', {
        netscanId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_netscan', { netscanId: 1 });
      await handlers.handleToolCall('create_integration', {
        name: 'test-integration',
        type: 'webhook',
      });
      await handlers.handleToolCall('update_integration', {
        integrationId: 1,
        name: 'updated',
      });
      await handlers.handleToolCall('delete_integration', { integrationId: 1 });

      expect(mockClient.createNetscan).toHaveBeenCalled();
      expect(mockClient.updateNetscan).toHaveBeenCalled();
      expect(mockClient.deleteNetscan).toHaveBeenCalled();
      expect(mockClient.createIntegration).toHaveBeenCalled();
      expect(mockClient.updateIntegration).toHaveBeenCalled();
      expect(mockClient.deleteIntegration).toHaveBeenCalled();
    });

    it('should handle topology and collector versions', async () => {
      const mockTopology = { nodes: [], links: [] };
      const mockVersions = { items: [{ version: '1.0.0' }], total: 1 };

      mockClient.getTopology.mockResolvedValue(mockTopology);
      mockClient.listCollectorVersions.mockResolvedValue(mockVersions);

      await handlers.handleToolCall('get_topology', {});
      await handlers.handleToolCall('list_collector_versions', {});

      expect(mockClient.getTopology).toHaveBeenCalled();
      expect(mockClient.listCollectorVersions).toHaveBeenCalled();
    });
  });
});

