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
      listWebsites: jest.fn(),
      getWebsite: jest.fn(),
      createWebsite: jest.fn(),
      updateWebsite: jest.fn(),
      deleteWebsite: jest.fn(),
      listWebsiteGroups: jest.fn(),
      getWebsiteGroup: jest.fn(),
      listUsers: jest.fn(),
      getUser: jest.fn(),
      listRoles: jest.fn(),
      getRole: jest.fn(),
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
      listDeviceGroupProperties: jest.fn(),
      updateDeviceGroupProperty: jest.fn(),
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
          fields: 'id,customField',
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
          fields: 'id,customField',
        });

        expect(mockClient.getDevice).toHaveBeenCalledWith(123, {
          fields: 'id,customField',
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

